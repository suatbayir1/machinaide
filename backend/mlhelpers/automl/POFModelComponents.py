import time
import json
import math
import requests
import numpy as np
import keras_tuner as kt
from tensorflow.keras import backend as k
from tensorflow.keras.models import Sequential
from tensorflow.keras.callbacks import Callback
from tensorflow.keras.layers import Dense
from tensorflow.keras.layers import LSTM
from tensorflow.keras.layers import Activation
from tensorflow.keras.layers import Masking
from tensorflow.keras.optimizers import RMSprop
from ml_config import (
    AUTOML_POST_TRIAL_URL
)

AUTOML_BATCH_SIZES = [25, 50, 100, 200]
AUTOML_EPOCHS = [25, 50, 100, 200]
POF_MAX_TRIALS = 10
POF_MAX_EPOCHS = 5
POF_EXECUTIONS_PER_TRIAL = 1

class POFModelBuilder(kt.HyperModel):
    def __init__(self, max_time, sensor_count, activate, units):
        self.max_time = max_time
        self.sensor_count = sensor_count
        self.activate = activate
        self.units = units
    
    def weibull_loglik_discrete(self, y_true, ab_pred, name=None):
        """
            Discrete log-likelihood for Weibull hazard function on censored survival data
            y_true is a (samples, 2) tensor containing time-to-event (y), and an event indicator (u)
            ab_pred is a (samples, 2) tensor containing predicted Weibull alpha (a) and beta (b) parameters
            For math, see https://ragulpr.github.io/assets/draft_master_thesis_martinsson_egil_wtte_rnn_2016.pdf (Page 35)
        """
        y_ = y_true[:, 0]
        u_ = y_true[:, 1]
        a_ = ab_pred[:, 0]
        b_ = ab_pred[:, 1]

        hazard0 = k.pow((y_ + 1e-35) / a_, b_)
        hazard1 = k.pow((y_ + 1) / a_, b_)

        return -1 * k.mean(u_ * k.log(k.exp(hazard1 - hazard0) - 1.0) - hazard1)
    
    def activate(self, ab):
        """
            Custom Keras activation function, outputs alpha neuron using exponentiation and beta using softplus
        """
        a = k.exp(ab[:, 0])
        b = k.softplus(ab[:, 1])

        a = k.reshape(a, (k.shape(a)[0], 1))
        b = k.reshape(b, (k.shape(b)[0], 1))

        return k.concatenate((a, b), axis=1)
    
    def build(self, hp):

        # Start building our model
        model = Sequential()

        # Mask parts of the lookback period that are all zeros (i.e., unobserved) so they don't skew the model
        model.add(Masking(mask_value=0., input_shape=(self.max_time, self.sensor_count)))

        # LSTM is just a common type of RNN. You could also try anything else (e.g., GRU).
        #model.add(LSTM(100, input_dim=2))
        # LSTM is just a common type of RNN. You could also try anything else (e.g., GRU).
        hp_units1 = hp.Choice('units1', self.units)
        model.add(LSTM(units=hp_units1, input_dim=self.sensor_count))

        # We need 2 neurons to output Alpha and Beta parameters for our Weibull distribution
        model.add(Dense(2))

        # Apply the custom activation function mentioned above
        model.add(Activation(self.activate))

        # Use the discrete log-likelihood for Weibull survival data as our loss function
        model.compile(loss=self.weibull_loglik_discrete, optimizer=RMSprop(learning_rate=0.01)) # , metrics=self.optimizers

        return model

# to keep track of experiments, store them on a global object
pof_experiments = {}

def start_pof_automl_experiment(model_name):
    global pof_experiments
    pof_experiments[model_name] = {"one_trial": {"intermediates": []}, "t_time": time.time(), "trial_no": 0}

def change_nan_pof(trial):
    temp_ints = trial["intermediates"].copy()
    changed_ints = []
    for int in temp_ints:
        for key in int["logs"]:
            if(np.isnan(int["logs"][key])):
                int["logs"][key] = None
        changed_ints.append(int)
    trial["intermediates"] = changed_ints
    return trial

def numpy_converter(o):
    if isinstance(o, np.float32):
        return float(o)

class POFReportIntermediates(Callback):
    def __init__(self, experiment_name):
        super(POFReportIntermediates, self).__init__()
        self.experiment_name = experiment_name
    """
    Callback class for reporting intermediate accuracy metrics.

    This callback sends accuracy to NNI framework every 100 steps,
    so you can view the learning curve on web UI.

    If an assessor is configured in experiment's YAML file,
    it will use these metrics for early stopping.
    """
    def on_epoch_end(self, batch, logs={}):
        global pof_experiments
        one_trial = pof_experiments[self.experiment_name]["one_trial"]
        res = {"logs":logs, "timestamp": time.time()}
        one_trial["intermediates"].append(res)

class POFMetric:
    def __init__(self, train_result):
        self.train_result = train_result
    
    def probability_distance(self):
        day = 60
        temporal_distance = 0
        for line in self.train_result:
            alpha = line[2]
            beta = line[3]
            prob = 1 - math.exp(-(day/alpha)**beta)
            # if(line[0]>=50):
            if(line[5] == 0):
                temporal_distance = temporal_distance + prob
            elif(line[5] == 1):
                temporal_distance = temporal_distance + (1 - prob)
        return temporal_distance

class POFHyperband(kt.Hyperband):
    def __init__(self, train_x, train_y, windowed_y, *args, **kw):
        super().__init__(*args, **kw)
        self.train_x = train_x
        self.train_y = train_y
        self.windowed_y = windowed_y

    def run_trial(self, trial, *args, **kwargs):
        # You can add additional HyperParameters for preprocessing and custom training loops
        # via overriding `run_trial`
        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', AUTOML_BATCH_SIZES)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', AUTOML_EPOCHS)
        return super(POFHyperband, self).run_trial(trial, *args, **kwargs)
    
    def on_trial_begin(self, trial):
        if self.logger:
            self.logger.register_trial(trial.trial_id, trial.get_state())
        self._display.on_trial_begin(self.oracle.get_trial(trial.trial_id))

        global pof_experiments
        trial_no = pof_experiments[self.project_name]["trial_no"]
        
        trial_no_temp = trial_no + 1
        t_time_temp = time.time()
        pof_experiments[self.project_name]["t_time"] = t_time_temp
        pof_experiments[self.project_name]["trial_no"] = trial_no_temp

        one_trial_temp = {}
        one_trial_temp["trialNo"] = trial_no_temp
        one_trial_temp["trialID"] = trial.trial_id
        one_trial_temp["hypers"] = trial.hyperparameters.values
        one_trial_temp["intermediates"] = []
        pof_experiments[self.project_name]["one_trial"] = one_trial_temp

    def on_trial_end(self, trial):
        if self.logger:
            self.logger.report_trial_state(trial.trial_id, trial.get_state())

        self.oracle.end_trial(trial.trial_id, "COMPLETED")
        self.oracle.update_space(trial.hyperparameters)
        # Display needs the updated trial scored by the Oracle.
        self._display.on_trial_end(self.oracle.get_trial(trial.trial_id))
        self.save()

        global pof_experiments
        one_trial = pof_experiments[self.project_name]["one_trial"]
        t_time = pof_experiments[self.project_name]["t_time"]
        
        duration = time.time()-t_time
        one_trial["duration"] = duration
        one_trial["timestamp"] = time.time()
        one_trial["status"] = trial.status
        exp = self.project_name
        
        ############ probability distance
        model = self.load_model(trial)
        train_predict = model.predict(self.train_x)
        train_predict = np.resize(train_predict, (self.train_x.shape[0], 2))
        train_result = np.concatenate((self.train_y, train_predict, self.windowed_y), axis=1)

        metric_builder = POFMetric(train_result=train_result)
        probability_distance = metric_builder.probability_distance()

        print(probability_distance)
        one_trial["probability_distance"] = probability_distance

        requests.post(url=AUTOML_POST_TRIAL_URL, json={'experiment_name': exp, 'trial': json.dumps(change_nan_pof(one_trial), default=numpy_converter)}) 


class POFRandomSearch(kt.RandomSearch):
    def __init__(self, train_x, train_y, windowed_y, *args, **kw):
        super().__init__(*args, **kw)
        self.train_x = train_x
        self.train_y = train_y
        self.windowed_y = windowed_y

    def run_trial(self, trial, *args, **kwargs):
        # You can add additional HyperParameters for preprocessing and custom training loops
        # via overriding `run_trial`
        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', AUTOML_BATCH_SIZES)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', AUTOML_EPOCHS)
        return super(POFRandomSearch, self).run_trial(trial, *args, **kwargs)
        
    def on_trial_begin(self, trial):
        if self.logger:
            self.logger.register_trial(trial.trial_id, trial.get_state())
        self._display.on_trial_begin(self.oracle.get_trial(trial.trial_id))
        
        global pof_experiments
        trial_no = pof_experiments[self.project_name]["trial_no"]
        
        trial_no_temp = trial_no + 1
        t_time_temp = time.time()
        pof_experiments[self.project_name]["t_time"] = t_time_temp
        pof_experiments[self.project_name]["trial_no"] = trial_no_temp

        one_trial_temp = {}
        one_trial_temp["trialNo"] = trial_no_temp
        one_trial_temp["trialID"] = trial.trial_id
        one_trial_temp["hypers"] = trial.hyperparameters.values
        one_trial_temp["intermediates"] = []
        pof_experiments[self.project_name]["one_trial"] = one_trial_temp

    def on_trial_end(self, trial):
        if self.logger:
            self.logger.report_trial_state(trial.trial_id, trial.get_state())

        self.oracle.end_trial(trial.trial_id, "COMPLETED")
        self.oracle.update_space(trial.hyperparameters)
        # Display needs the updated trial scored by the Oracle.
        self._display.on_trial_end(self.oracle.get_trial(trial.trial_id))
        self.save()

        global pof_experiments
        one_trial = pof_experiments[self.project_name]["one_trial"]
        t_time = pof_experiments[self.project_name]["t_time"]
        
        duration = time.time()-t_time
        one_trial["duration"] = duration
        one_trial["timestamp"] = time.time()
        one_trial["status"] = trial.status
        exp = self.project_name

        ############ probability distance
        model = self.load_model(trial)
        train_predict = model.predict(self.train_x)
        train_predict = np.resize(train_predict, (self.train_x.shape[0], 2))
        train_result = np.concatenate((self.train_y, train_predict, self.windowed_y), axis=1)

        metric_builder = POFMetric(train_result=train_result)
        probability_distance = metric_builder.probability_distance()
        
        print(probability_distance)
        one_trial["probability_distance"] = probability_distance

        requests.post(url=AUTOML_POST_TRIAL_URL,json={'experiment_name': exp, 'trial': json.dumps(change_nan_pof(one_trial), default=numpy_converter)}) 

class POFBayesianOptimization(kt.BayesianOptimization):
    def __init__(self, train_x, train_y, windowed_y, *args, **kw):
        super().__init__(*args, **kw)
        self.train_x = train_x
        self.train_y = train_y
        self.windowed_y = windowed_y

    def run_trial(self, trial, *args, **kwargs):
        # You can add additional HyperParameters for preprocessing and custom training loops
        # via overriding `run_trial`
        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', AUTOML_BATCH_SIZES)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', AUTOML_EPOCHS)
        return super(POFBayesianOptimization, self).run_trial(trial, *args, **kwargs)
    
    def on_trial_begin(self, trial):
        if self.logger:
            self.logger.register_trial(trial.trial_id, trial.get_state())
        self._display.on_trial_begin(self.oracle.get_trial(trial.trial_id))
        
        global pof_experiments
        trial_no = pof_experiments[self.project_name]["trial_no"]
        
        trial_no_temp = trial_no + 1
        t_time_temp = time.time()
        pof_experiments[self.project_name]["t_time"] = t_time_temp
        pof_experiments[self.project_name]["trial_no"] = trial_no_temp

        one_trial_temp = {}
        one_trial_temp["trialNo"] = trial_no_temp
        one_trial_temp["trialID"] = trial.trial_id
        one_trial_temp["hypers"] = trial.hyperparameters.values
        one_trial_temp["intermediates"] = []
        pof_experiments[self.project_name]["one_trial"] = one_trial_temp

    def on_trial_end(self, trial):
        if self.logger:
            self.logger.report_trial_state(trial.trial_id, trial.get_state())

        self.oracle.end_trial(trial.trial_id, "COMPLETED")
        self.oracle.update_space(trial.hyperparameters)
        # Display needs the updated trial scored by the Oracle.
        self._display.on_trial_end(self.oracle.get_trial(trial.trial_id))
        self.save()

        global pof_experiments
        one_trial = pof_experiments[self.project_name]["one_trial"]
        t_time = pof_experiments[self.project_name]["t_time"]
        
        duration = time.time()-t_time
        one_trial["duration"] = duration
        one_trial["timestamp"] = time.time()
        one_trial["status"] = trial.status
        exp = self.project_name

        ############ probability distance
        model = self.load_model(trial)
        train_predict = model.predict(self.train_x)
        train_predict = np.resize(train_predict, (self.train_x.shape[0], 2))
        train_result = np.concatenate((self.train_y, train_predict, self.windowed_y), axis=1)

        metric_builder = POFMetric(train_result=train_result)
        probability_distance = metric_builder.probability_distance()
        
        print(probability_distance)
        one_trial["probability_distance"] = probability_distance

        requests.post(url=AUTOML_POST_TRIAL_URL, json={'experiment_name': exp, 'trial': json.dumps(change_nan_pof(one_trial), default=numpy_converter)}) 
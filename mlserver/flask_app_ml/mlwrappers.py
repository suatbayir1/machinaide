from mlweibull import MLWeibull
import time
import datetime
from numpy import Inf
from dateutil import relativedelta
import requests
import os
import uuid
import json
import tensorflow as tf
import keras_tuner as kt
import numpy as np
from kafka import KafkaConsumer
import statistics
import math
import tensorflow.keras.backend as k
from sklearn.preprocessing import normalize
from mlauto import RULBayesianOptimization, RULHyperband, RULModelBuilder, RULRandomSearch, RULReportIntermediates, AUTOML_OPTIMIZERS, start_rul_automl_experiment, numpy_converter
from tensorflow.keras.layers import Dense, Dropout, LSTM, Activation, Masking
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import RMSprop
from tensorflow.keras.callbacks import History
from tensorflow.keras.callbacks import Callback
from dateutil import parser, relativedelta


# import featuretools as ft

# from kerasmanager import KerasHyperManager

# tf.compat.v1.disable_v2_behavior()


from mlconstants import (
    AD_HPS_DIR,
    AD_SENSOR_DIR,
    AUTOML_BATCH_SIZES,
    AUTOML_EPOCHS,
    CELL_URL,
#    METAURL,
#    BASICURL,
    AUTOML_VECTOR_LENGTH,
    POST_TRAINING_INSERT_URL,
    MODELDIR,
    ML_INFLUX_VERSION
)
from mlutils import (
    POFQueryHelper,
    QueryHelper,
    MongoHelper,
    Influx2QueryHelper,
    MLPreprocessor,
    list_to_dataframe,
    merge_machine_data, 
    to_sequences, 
    root_mean_squared_error, 
    inverse_transform_output, 
    transform_value
)
# from mlarima import MLARIMA
# from mlkmeans import MLKMEANS
# from mliforest import MLIFOREST
# from mlmahalanobis import MLMAHALANOBIS
from mllstm import MLLSTM, LSTMRunner
from mlauto import MyBayesianOptimization, MyHyperband, MyModelBuilder, MyRandomSearch, ReportIntermediates, AUTOML_OPTIMIZERS
# from tensorflow.keras.models import load_model
from multiprocessing import Process
from pebble import concurrent
from cnn import CNN


# hyper_manager = KerasHyperManager()
# hyper_manager.start()

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

class MLSession(Process):
    def __init__(self, session_id, creator, db_settings, start_time, end_time, type, measurement_sensor_dict, kill_sig_queue):
        super().__init__()
        self.session_id = session_id
        self.creator = creator
        self.db_settings = db_settings
        if str(ML_INFLUX_VERSION) == "2":
            self.start_time = '%d' % time.mktime(datetime.datetime.strptime(start_time, "%Y-%m-%dT%H:%M:%S.%fZ").timetuple())
            self.end_time = '%d' % time.mktime(datetime.datetime.strptime(end_time, "%Y-%m-%dT%H:%M:%S.%fZ").timetuple())
        else:
            self.start_time = '%d' % (time.mktime(datetime.datetime.strptime(start_time, "%Y-%m-%dT%H:%M:%S.%fZ").timetuple()) * 1000000000)
            self.end_time = '%d' % (time.mktime(datetime.datetime.strptime(end_time, "%Y-%m-%dT%H:%M:%S.%fZ").timetuple()) * 1000000000)
        self.type = type
        self.measurement_sensor_dict = measurement_sensor_dict
        self.kill_sig_queue = kill_sig_queue

        self.influx_helper = None
        self.preprocess_helper = None
        self.mongo_helper = None
        self._train_futures = {}
        self.model_IDs = []
        self.input_columns = []
        self.output_columns = []


    @property
    def influx_client(self):            
        if self.influx_helper == None:
            if str(ML_INFLUX_VERSION) == "2":
                self.influx_helper = Influx2QueryHelper(self.db_settings)
            else:
                self.influx_helper = QueryHelper(self.db_settings)
        return self.influx_helper


    @property
    def preprocessor(self):
        if self.preprocess_helper == None:

            self.preprocess_helper = MLPreprocessor(self.raw_data)
        return self.preprocess_helper


    @property
    def mongo_client(self):
        if self.mongo_helper == None:
            self.mongo_helper = MongoHelper()
        return self.mongo_helper


    @concurrent.thread
    def _listen_for_kill_signal(self):
        while True:
            mid = self.kill_sig_queue.get()
            if mid:
                try:
                    self._train_futures[mid].cancel()
                except Exception as e:
                    print(e)


    def _query(self):
        m2s = {}
        for key in self.measurement_sensor_dict["Input"]:
            m2s[key] = self.measurement_sensor_dict["Input"][key]
        for key in self.measurement_sensor_dict["Output"]:
            if key in list(m2s.keys()):
                for value in self.measurement_sensor_dict["Output"][key]:
                    if value not in m2s[key]:
                        m2s[key].append(value)
            else:
                m2s[key] = self.measurement_sensor_dict["Output"][key]

        raw_data, sensor_names = self.influx_client.query(m2s, self.start_time, self.end_time)
        self.sensor_names = sensor_names
        self.raw_data = raw_data
        for key in self.measurement_sensor_dict["Input"].keys():
            for col in self.measurement_sensor_dict["Input"][key]: 
                self.input_columns.append(col)
        self.input_columns.sort()
        for key in self.measurement_sensor_dict["Output"].keys():
            for col in self.measurement_sensor_dict["Output"][key]: 
                self.output_columns.append(col)
        self.output_columns.sort()


    def _post_info(self, alg, model_id, params, creator, job):
        pkg = {
                "Algorithm": alg,
                "sessionID": str(self.session_id),
                "modelID": str(model_id),
                "Status": "training",
                "Parameters": params,
                "MetaInfo": {
                    "Creator": creator,
                    "Created": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "Job": job,
                    "Hardware": self.sensor_names
                }
        }
        self.mongo_client.post_cell_data(pkg)
        # requests.post(url=CELL_URL, json=pkg)

        # meta = {
        #     "modelID": model_id,
        #     "creator": creator,
        #     "createdDate": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
        #     "relatedHardware": ["act_force_diff_cyl_1"],
        #     "totalfb": 0
        # }
        # requests.post(url=METAURL, json=meta)


ad_experiments = {}

class ADBayesian(kt.BayesianOptimization):
    def run_trial(self, trial, *args, **kwargs):
        # You can add additional HyperParameters for preprocessing and custom training loops
        # via overriding `run_trial`
        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', AUTOML_BATCH_SIZES)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', AUTOML_EPOCHS)
        super(ADBayesian, self).run_trial(trial, *args, **kwargs)
        
    def on_trial_begin(self, trial):
        if self.logger:
            self.logger.register_trial(trial.trial_id, trial.get_state())
        self._display.on_trial_begin(self.oracle.get_trial(trial.trial_id))
        
        global ad_experiments
        trial_no = ad_experiments[self.project_name]["trial_no"]
        
        trial_no_temp = trial_no + 1
        t_time_temp = time.time()
        ad_experiments[self.project_name]["t_time"] = t_time_temp
        ad_experiments[self.project_name]["trial_no"] = trial_no_temp

        one_trial_temp = {}
        one_trial_temp["trialNo"] = trial_no_temp
        one_trial_temp["trialID"] = trial.trial_id
        one_trial_temp["hypers"] = trial.hyperparameters.values
        one_trial_temp["intermediates"] = []
        ad_experiments[self.project_name]["one_trial"] = one_trial_temp

    def on_trial_end(self, trial):
        if self.logger:
            self.logger.report_trial_state(trial.trial_id, trial.get_state())

        self.oracle.end_trial(trial.trial_id, "COMPLETED")
        self.oracle.update_space(trial.hyperparameters)
        # Display needs the updated trial scored by the Oracle.
        self._display.on_trial_end(self.oracle.get_trial(trial.trial_id))
        self.save()

        global ad_experiments
        one_trial = ad_experiments[self.project_name]["one_trial"]
        t_time = ad_experiments[self.project_name]["t_time"]
        
        duration = time.time()-t_time
        one_trial["duration"] = duration
        one_trial["timestamp"] = time.time()
        one_trial["status"] = trial.status
        exp = self.project_name

        # print(one_trial)
        # requests.post(url=AUTOML_POST_TRIAL_URL, json={'experiment_name': exp, 'trial': change_nan_pof(one_trial)})

pof_experiments = {}
pof_batch_sizes = [25, 50, 100, 200]
pof_n_epochs = [10, 15, 20, 25]

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
        global pof_batch_sizes
        global pof_n_epochs

        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', pof_batch_sizes)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', pof_n_epochs)
        super(POFHyperband, self).run_trial(trial, *args, **kwargs)
    
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
        global pof_batch_sizes
        global pof_n_epochs

        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', pof_batch_sizes)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', pof_n_epochs)
        super(POFRandomSearch, self).run_trial(trial, *args, **kwargs)
        
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
        global pof_batch_sizes
        global pof_n_epochs

        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', pof_batch_sizes)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', pof_n_epochs)
        super(POFBayesianOptimization, self).run_trial(trial, *args, **kwargs)
    
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

class POFModelBuilder(kt.HyperModel):
    def __init__(self, max_time, sensor_count, optimizer, activate, units):
        self.max_time = max_time
        self.sensor_count = sensor_count
        self.optimizers = optimizer
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


class LoggingCallback(Callback):
    """Callback that logs message at end of epoch.
    """

    def __init__(self, file_path, epoch_size):
        Callback.__init__(self)
        self.file_path = file_path
        self.epoch_size = epoch_size

    def on_epoch_end(self, epoch, logs={}):
      with open(self.file_path, 'a') as f: 
        msg = "Epoch %i/%i\n%s" % (epoch, self.epoch_size, ", ".join("%s: %f" % (k, v) for k, v in logs.items()))
        f.write(msg)
        f.write("\n")


class POFAutoMLSession:
    def __init__(self, settings):
        self.settings = settings
        self.part_name = settings["partName"]
        self.type = settings["type"]
        self.groupwith = settings["groupwith"]
        self.username = settings["username"]
        self.model_name = settings["modelName"]
        self.database = settings["database"]
        self.measurement = settings["measurement"]
        self.field = settings["field"]
        self.start_time = settings["startTime"]
        self.update_time = settings["startTime"]
        self.session_ID = str(datetime.datetime.now().timestamp())[:-7]
        self.model_ID = uuid.uuid4().hex
        self.db_settings = {"host": "localhost", "port": 8086, "db": self.database, "rp": "autogen"}
        self.dir_name = MODELDIR + self.model_name + "-" + self.username + "-" + self.session_ID + "/"

        tuner_type = settings["tuner_type"]
        if tuner_type == "Hyperband":
            tuner = 'hyperband'
            print("hyperband", tuner)
        elif tuner_type == "Random Search":
            tuner = 'random'
            print("random", tuner)
        elif tuner_type == "Bayesian Optimization":
            tuner = 'bayesian'
            print("bayesian", tuner)
        else:
            tuner = 'hyperband'
            print("hyperband", tuner)
        self.tuner_type = tuner
        self.nfeatures = settings["nfeatures"]
        self.nepochs = settings["nepochs"]
        self.timeout = settings["timeout"]
        self.experiment_name = settings["modelName"]
        self.optimizer = settings["optimizer"]
        self.end_time = ""
        self.optimizer_settings = {}
        self.optimizer_name = ""

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
    
    # def generate_features(self, dframe, index, new_id, n_index):
    #     dframe["index"] = dframe.index
    #     es = ft.EntitySet(id = 'index')

    #     # adding a dataframe 
    #     es.entity_from_dataframe(entity_id = 'pof', dataframe = dframe, index = index)

    #     es.normalize_entity(base_entity_id='pof', new_entity_id=new_id, index = n_index)

    #     feature_matrix, feature_names = ft.dfs(entityset=es, 
    #         target_entity = 'pof', max_depth = 2, verbose = 1)

    #     print(feature_matrix.head())

    #     print(feature_matrix.columns)
    #     return feature_matrix, feature_names
    
    """ def feature_selector(self, train_df, target, n_features):
        rul2 = pd.DataFrame( train_df[target], columns=[target])
        train_df.drop([target], axis=1, inplace=True)
        X_train = train_df
        y_train = rul2
        print("x train shape", X_train.shape)
        print("y train shape", y_train.shape)

        # initlize a selector
        fgs = FeatureGradientSelector(n_features=n_features)
        # fit data
        fgs.fit(X_train.values, y_train.values)
        # get improtant features
        # will return the index with important feature here.
        print(fgs.get_selected_features())

        features = []
        for index in fgs.get_selected_features():
            features.append(train_df.columns[index])

        print(features, len(features))
        return features """

    def build_data(self, time, x, max_time, sensor_count, cols):
        # first write the model data to the mongodb
        pkg = {
            "Algorithm": "Weibull",
            "modelName": self.model_name,
            "username": self.username,
            "hardware": self.part_name,
            "modelID": self.model_ID,
            "sessionID": self.session_ID,
            "Directory": self.dir_name,
            "Settings": self.settings,
            "updateTime": self.update_time,
            "trainingDone": False,
            "Optional": {
                "asset": self.part_name,
                "groupwith": self.groupwith,
                "cols": cols
            }
        }
        # TODO:
        requests.post(url=BASICURL, json=pkg)
        # y[0] will be days remaining, y[1] will be event indicator, always 1 for this data
        out_y = np.empty((0, 2), dtype=np.float32)
        out_y_windowed = np.empty((0, 2), dtype=np.float32)
        # A full history of sensor readings to date for each x
        out_x = np.empty((0, max_time, sensor_count), dtype=np.float32)

        failure_indices = [0]
        for i in range(time.shape[0]-1):
            if(time[i] > time[i+1]):
                failure_indices.append(i+1)
        failure_indices.append(time.shape[0])

        # if ever need to use test data we will set different start for it
        # start = 0

        this_x = np.empty((0, max_time, sensor_count), dtype=np.float32)

        for i in range(len(failure_indices)-1):
            max_engine_time = time[failure_indices[i+1]-1] + 1

            for j in range(failure_indices[i], failure_indices[i+1]):
                sub = j-failure_indices[i]
                out_y = np.append(out_y, np.array((max_engine_time - sub , 1), ndmin=2), axis=0)

                # label last 30 days
                if((max_engine_time - j)<30):
                    out_y_windowed = np.append(out_y_windowed, np.array((max_engine_time - sub, 1), ndmin=2), axis=0)
                else:
                    out_y_windowed = np.append(out_y_windowed, np.array((max_engine_time - sub, 0), ndmin=2), axis=0)

                # treat every failure data separately
                engine_x = x[failure_indices[i]: failure_indices[i+1]]

                xtemp = np.zeros((1, max_time, sensor_count))
                xtemp[:, max_time-min(sub, max_time-1)-1:max_time, :] = engine_x[max(0, sub-max_time+1):sub+1, :]
                this_x = np.concatenate((this_x, xtemp))

        out_x = np.concatenate((out_x, this_x))
        return out_x, out_y, out_y_windowed

    def start_training(self, df, cols):

        global pof_experiments
        pof_experiments[self.model_name] = {"one_trial": {"intermediates": []}, "t_time": time.time(), "trial_no": 0}

        _, sensor_count = df.shape
        sensor_count = sensor_count - 1 # remove time column

        num_data = df.to_numpy()
        # normalize sensor data
        num_data[:, 1:] = normalize(num_data[:, 1:], axis=0)

        # Configurable observation look-back period for each engine/seconds
        max_time = 100

        train_x, train_y, windowed_y = self.build_data(num_data[:, 0], num_data[:, 1:], max_time, sensor_count, cols)

        admin_settings =  {"tunerType": self.tuner_type, "nfeatures": len(cols), "nepochs": self.nepochs, "optimizer": self.optimizer_name}
        exp_settings = {"experiment_name": self.model_name, 'experimentStatus': "RUNNING", "experiment_job": "pof", "owner": self.username, "timeout": self.timeout, 
            "settings": admin_settings, "uploadTime": self.start_time, "features": cols,  "trials": []}
        requests.post(url=AUTOML_POST_EXPERIMENT_URL , json=exp_settings)

        # Store some history
        history = History()

        model_builder = POFModelBuilder(max_time, sensor_count, self.optimizer_settings["compile"], self.activate, [20, 30, 40, 50, 60])

        if self.tuner_type == "hyperband":
            tuner =  POFHyperband(
                        train_x=train_x,
                        train_y=train_y,
                        windowed_y=windowed_y,
                        hypermodel=model_builder, 
                        objective="val_loss", 
                        max_epochs=5, 
                        factor=3,
                        directory='experiments',
                        project_name=self.model_name,
                        overwrite=True)
            print("hyperband", tuner)

        elif self.tuner_type == "random":
            tuner = POFRandomSearch(
                        train_x=train_x,
                        train_y=train_y,
                        windowed_y=windowed_y,
                        hypermodel=model_builder,
                        objective="val_loss",
                        seed=1,
                        max_trials=10,
                        executions_per_trial=2,
                        directory='experiments',
                        project_name=self.model_name,
                        overwrite=True)
            print("random", tuner)

        elif self.tuner_type == "bayesian":
            tuner = POFBayesianOptimization(
                        train_x=train_x,
                        train_y=train_y,
                        windowed_y=windowed_y,
                        hypermodel=model_builder,
                        objective="val_loss",
                        max_trials=10,
                        executions_per_trial=1,
                        directory='experiments',
                        project_name=self.model_name,
                        overwrite=True)
            print("bayesian", tuner)

        int_callback = POFReportIntermediates(self.model_name)

        tuner.search(train_x, train_y,  epochs=self.nepochs, batch_size=2000, validation_split=0.2, callbacks=[history, int_callback]) # , ReportIntermediates(tuner)
        
        requests.put(url=AUTOML_CHANGE_STATUS_URL , json={'experiment_name': self.model_name})

        best_hps=tuner.get_best_hyperparameters(num_trials=1)[0]
        # Build the model with the optimal hyperparameters and train it on the data for 50 epochs
        model = tuner.hypermodel.build(best_hps)
        history = model.fit(train_x, train_y, epochs=best_hps.get('epochs'), batch_size=1000, validation_split=0.2, verbose=1)

        val_loss_per_epoch = history.history['val_loss']
        best_epoch = val_loss_per_epoch.index(min(val_loss_per_epoch)) + 1
        print('Best epoch: ',best_epoch, best_hps.values)
        hypermodel = tuner.hypermodel.build(best_hps)

        log_file = "progress-logs/" + self.model_name + "-" + self.username + ".txt"

        # Retrain the model
        hypermodel.fit(train_x, train_y, epochs=best_epoch, batch_size=1000, validation_split=0.2, verbose=1,
                callbacks = [LoggingCallback(log_file, self.nepochs)])


        eval_result = hypermodel.evaluate(train_x, train_y)
        print(hypermodel.metrics_names, "--", eval_result)
        
        hypermodel.save(MODELDIR + self.model_ID + "/model.h5", save_format='h5') 
 
        pkg =  {"experiment_name": self.model_name, "metric_name": hypermodel.metrics_names, "metric_value": eval_result, "end_time": time.time()  }  # "job": {"job": "", "jobOn": "", "pfDays": ""}

        requests.put(url=AUTOML_UPDATE_EXPERIMENT_URL, json=json.dumps(pkg, default=numpy_converter))

        input_cols = list(df.columns.values)
        output_cols = ["alpha", "beta"]
        updated_pkg = {            
            "InputColumns": input_cols,
            "OutputColumns": output_cols,
        }
        requests.put(url=PUTBASICURL + self.model_ID, json=updated_pkg)
        
        if os.path.exists(log_file):
            time.sleep(5)
            os.remove(log_file)

    def get_fields_test(self):
        fields_query = 'SHOW FIELD KEYS ON "telegraf"'
        fields_results = self.queryHelper.queryDB(fields_query)
        for point in fields_results.get_points():
            print(point)
            print(len(list(fields_results.get_points())))
            break
        num = 0
        for point in fields_results.get_points():
            if(point["fieldType"] == "integer" or point["fieldType"] == "float"):
                num += 1
        print(num)

        fields_query = 'SHOW FIELD KEYS ON "telegraf" from "cpu"'
        fields_results = self.queryHelper.queryDB(fields_query)
        for point in fields_results.get_points():
            print(point)
            print(len(list(fields_results.get_points())))
            break

    
    def run(self):
        # prepare data
        res = requests.get(url=GETFAILURESURL + self.part_name).json()
        failures = []
        for failure in res:
            failure["failureStartTime"] = parser.parse(failure["failureStartTime"][0:16])
            failures.append(failure)

        failures.sort(key=lambda r: r["failureStartTime"]) 

        pd_data = []
        for fail in failures:
            ten_days = fail["failureStartTime"] - relativedelta.relativedelta(days=10)
            before_ten_days = []
            for failure in failures:
                if(failure["failureStartTime"]>ten_days and failure["failureStartTime"]<fail["failureStartTime"]):
                    before_ten_days.append(failure)
            if(len(before_ten_days)):
                ten_days = before_ten_days[-1]["failureStartTime"]

            # USE TEN DAYS
            duration_start_date = ten_days
            duration_end_date = fail["failureStartTime"]
            if(self.type == "machine"):
                # query number = component number
                measurements = []
                measurements_query = 'SHOW MEASUREMENTS ON "{}"'.format(self.database)
                measurements_results = self.queryHelper.queryDB(measurements_query)

                for point in measurements_results.get_points():
                    measurements.append(point["name"])

                all_data = []
                for name in measurements:
                    fields = []
                    fields_query = 'SHOW FIELD KEYS ON "{}" FROM "{}"'.format(self.database, name)
                    fields_results = self.queryHelper.queryDB(fields_query)
                    for point in fields_results.get_points():
                        if(point["fieldType"] == "integer" or point["fieldType"] == "float"):
                            fields.append(point["fieldKey"])
                    # print(fields)

                    for field in fields:
                        sensor_info = requests.get(url=GETSENSORFROMMAPPING + field).json()
                        if(sensor_info):
                            influx, dval = return_default_value(sensor_info["defval"])
                        else:
                            influx, dval = (True, 0)

                        
                        if(influx):
                            data_points = []                         
                            query = 'SELECT {}("{}") AS "{}_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h) fill({})'.format(self.groupwith, 
                                field, self.groupwith, field, self.database, name, duration_start_date, duration_end_date, dval)
                            
                            results = self.queryHelper.queryDB(query)

                            for point in results.get_points():
                                data_point = {}
                                for i,key in enumerate(point.keys()):
                                    if(key=="time"):
                                        data_point["time"] = point["time"]
                                    else:
                                        key_pd = name + "." + key
                                        data_point[key_pd] = point[key]
                                data_points.append(data_point)
                        
                        else:
                            data_points = []
                            query = 'SELECT {}("{}") AS "{}_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h)'.format(self.groupwith, 
                                field, self.groupwith, field, self.database, name, duration_start_date, duration_end_date)

                            results = self.queryHelper.queryDB(query)

                            field_name = name
                            for point in results.get_points():
                                data_point = {}
                                for i,key in enumerate(point.keys()):
                                    if(key=="time"):
                                        data_point["time"] = point["time"]
                                    else:
                                        key_pd = name + "." + key
                                        field_name = key_pd
                                        data_point[key_pd] = point[key]
                                data_points.append(data_point)
                            
                            # print(field_name)
                            df = pd.DataFrame(data_points)
                            filler = FillNanValues()
                            data_points = filler.get_df_with_values(df, field_name, dval).to_dict("records")

                        all_data.append(data_points)
                if(len(all_data)):
                    one_merged = pd.DataFrame(all_data[0])
                    for i in range(1,len(all_data)):
                        one_merged = pd.merge(one_merged, pd.DataFrame(all_data[i]), on="time")
                cycle = 0
                for i in range(len(one_merged["time"])):
                    one_merged["time"][i] = cycle
                    cycle += 1
                
                pd_data = pd_data + one_merged.to_dict("records")
                
            elif(self.type == "component"):
                fields = []
                fields_query = 'SHOW FIELD KEYS ON "{}" FROM "{}"'.format(self.database, self.measurement)
                fields_results = self.queryHelper.queryDB(fields_query)

                for point in fields_results.get_points():
                    fields.append(point["fieldKey"])
                # print(fields)

                all_data = []
                for field in fields:
                    sensor_info = requests.get(url=GETSENSORFROMMAPPING + field).json()
                    if(sensor_info):
                        influx, dval = return_default_value(sensor_info["defval"])
                    else:
                        influx, dval = (True, 0)

                    
                    if(influx):
                        data_points = []                         
                        query = 'SELECT {}("{}") AS "{}_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h) fill({})'.format(self.groupwith, 
                            field, self.groupwith, field, self.database, self.measurement, duration_start_date, duration_end_date, dval)
                        
                        results = self.queryHelper.queryDB(query)

                        for point in results.get_points():
                            data_points.append(point)
                    
                    else:
                        data_points = []
                        query = 'SELECT {}("{}") AS "{}_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h)'.format(self.groupwith, 
                            field, self.groupwith, field, self.database, self.measurement, duration_start_date, duration_end_date)

                        results = self.queryHelper.queryDB(query)

                        field_name = self.groupwith + "_" + field
                        for point in results.get_points():
                            data_points.append(point)
                        
                        # print(field_name)
                        df = pd.DataFrame(data_points)
                        filler = FillNanValues()
                        data_points = filler.get_df_with_values(df, field_name, dval).to_dict("records")

                    all_data.append(data_points)
                if(len(all_data)):
                    one_merged = pd.DataFrame(all_data[0])
                    for i in range(1,len(all_data)):
                        one_merged = pd.merge(one_merged, pd.DataFrame(all_data[i]), on="time")
                cycle = 0
                for i in range(len(one_merged["time"])):
                    one_merged["time"][i] = cycle
                    cycle += 1
                
                pd_data = pd_data + one_merged.to_dict("records")

            elif(self.type == "sensor"):
                sensor_info = requests.get(url=GETSENSORFROMMAPPING + self.field).json()
                if(sensor_info):
                    influx, dval = return_default_value(sensor_info["defval"])
                else:
                    influx, dval = (True, 0)

                
                if(influx):
                    data_points = []                         
                    query = 'SELECT {}("{}") AS "{}_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h) fill({})'.format(self.groupwith, 
                        self.field, self.groupwith, self.field, self.database, self.measurement, duration_start_date, duration_end_date, dval)
                    
                    results = self.queryHelper.queryDB(query)

                    cycle = 0
                    for point in results.get_points():
                        data_point = {}
                        for i,key in enumerate(point.keys()):
                            if(key=="time"):
                                data_point["time"] = cycle
                                cycle += 1
                            else:
                                data_point[key] = point[key]
                        data_points.append(data_point)
                
                else:
                    data_points = []
                    query = 'SELECT {}("{}") AS "{}_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h)'.format(self.groupwith, 
                        self.field, self.groupwith, self.field, self.database, self.measurement, duration_start_date, duration_end_date)

                    results = self.queryHelper.queryDB(query)

                    field_name = self.groupwith + "_" + self.field
                    cycle = 0
                    for point in results.get_points():
                        data_point = {}
                        for i,key in enumerate(point.keys()):
                            if(key=="time"):
                                data_point["time"] = cycle
                                cycle += 1
                            else:
                                data_point[key] = point[key]
                        data_points.append(data_point)
                    
                    # print(field_name)
                    df = pd.DataFrame(data_points)
                    filler = FillNanValues()
                    data_points = filler.get_df_with_values(df, field_name, dval).to_dict("records")

                pd_data = pd_data + data_points
            else:
                # query = 'SELECT {}("{}") FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h)'.format(self.groupwith, self.field, self.database, self.measurement, duration_start_date, duration_end_date)
                no_query = "Please select type as 'machine','component' or 'sensor'"
                print(no_query)

        print(self.type, query)
        df = pd.DataFrame(pd_data)
        if df.empty:
            print('DataFrame is empty!')
        else:
            df = df.fillna(0)
            print("nan", df.isnull().sum(), df.shape)
            print("inf", np.isinf(df).values.sum())
            # print(df)
            original_cols = list(df.columns.values)
            
            train_matrix_copy = df.copy()
            nfeatures = get_feature_number(len(original_cols), self.nfeatures)

            sequence_cols = original_cols
            # TODO: feature generation has problems with kafka alert class ? 
            # sequence_cols = self.feature_selector(train_matrix_copy, "time", nfeatures)

            if(self.optimizer in optimizers): # check if db has valid optimizer name
                self.optimizer_settings = optimizers[self.optimizer]
                self.optimizer_name = self.optimizer
            else:
                self.optimizer_settings = optimizers["default"]
                self.optimizer_name = "val_accuracy"
            
            self.start_training(df[sequence_cols], sequence_cols)

            """ with open('/root/BackUp_Pianism/pianism/custom-ml/server/pof_output_sensor.txt', 'w') as writefile:
                writefile.write(df.to_string()) """

    @property
    def influx_client(self):
        if self.influx_helper == None:
            if str(ML_INFLUX_VERSION) == "2":
                self.influx_helper = Influx2QueryHelper(self.db_settings)
            else:
                self.influx_helper = QueryHelper(self.db_settings)
        return self.influx_helper


class ADAutoMLSession:
    def __init__(self, settings):
        super().__init__()
        self.timeout = settings['timeout']
        self.nfeatures = settings['nfeatures']
        self.nepochs = int(settings['nepochs'])
        self.creator = settings['username']
        self.experiment_name = settings['modelName']
        self.model_name = settings["modelName"]
        self.db_settings = settings['dbSettings']
        if str(ML_INFLUX_VERSION) == "2":
            self.start_time = '%d' % time.mktime(datetime.datetime.strptime(settings['startTime'], "%Y-%m-%dT%H:%M:%S.%fZ").timetuple())
            self.end_time = '%d' % time.mktime(datetime.datetime.strptime(settings['endTime'], "%Y-%m-%dT%H:%M:%S.%fZ").timetuple())
        else:
            self.start_time = '%d' % (time.mktime(datetime.datetime.strptime(settings['startTime'], "%Y-%m-%dT%H:%M:%S.%fZ").timetuple()) * 1000000000)
            self.end_time = '%d' % (time.mktime(datetime.datetime.strptime(settings['endTime'], "%Y-%m-%dT%H:%M:%S.%fZ").timetuple()) * 1000000000)
        self.measurement_sensor_dict = settings['sensors']
        # self.part_name = settings["partName"]
        # self.type = settings["type"]
        # self.database = settings["database"]
        # self.measurement = settings["measurement"]

        tuner_type = settings["tuner_type"]
        if tuner_type == "Hyperband":
            tuner = 'hyperband'
        elif tuner_type == "Random Search":
            tuner = 'random'
        elif tuner_type == "Bayesian Optimization":
            tuner = 'bayesian'
        else:
            tuner = 'hyperband'
        self.tuner_type = tuner
        # self.optimizer = settings["optimizer"]

        """ if(settings["optimizer"] in optimizers2): # check if db has valid optimizer name
            self.optimizer_settings = optimizers2[settings["optimizer"]]
            self.optimizer_name = settings["optimizer"]
        else:
            self.optimizer_settings = optimizers2["default"]
            self.optimizer_name = "val_accuracy" """

        # if(settings["optimizer"] in AUTOML_OPTIMIZERS): # check if db has valid optimizer name
        #     self.optimizer_settings = AUTOML_OPTIMIZERS[settings["optimizer"]]
        #     self.optimizer_name = settings["optimizer"]
        # else:
        self.optimizer_settings = AUTOML_OPTIMIZERS["default"]
        self.optimizer_name = "val_loss"

        self.influx_helper = None
        # self.queryHelper = POFQueryHelper({"host": self.db_settings['host'], "port": self.db_settings['port'], "database": self.db_settings['db']})
        self.preprocess_helper = None
        self.model_id = settings['modelID']
        self.session_id = settings['sessionID']
        self.input_columns = []
        self.output_columns = []
        self.sequence_length = 25


    def _builder(self, hp):
        
        lstm_first_layer = hp.Int("num_lstm_first_layer_nodes", min_value=32, max_value=64, step=32)
        dense_node_counts = hp.Int("num_dense_layer", min_value=16, max_value=64, step=16)
        activation = hp.Choice("activation",  values=['tanh', 'relu'])

        model_input = tf.keras.layers.Input(shape=(self.sequence_length, len(self.input_columns)), name="encoder_input")
        model = tf.keras.layers.LSTM(lstm_first_layer, return_sequences=True, activation=activation)(model_input)
        model = tf.keras.layers.LSTM(lstm_first_layer, return_sequences=True, activation=activation)(model)
        model = tf.keras.layers.LSTM(lstm_first_layer, activation=activation)(model)
        model = tf.keras.layers.Dense(dense_node_counts, activation=activation)(model)
        model_output = tf.keras.layers.Dense(len(self.output_columns))(model)
        final_model = tf.keras.Model(model_input, model_output, name="lstm_anomaly_detector")

        optimizer = tf.keras.optimizers.Adam(hp.Choice("learning_rate", values=[1e-2, 1e-3, 1e-4]))
        final_model.compile(loss=root_mean_squared_error(sequence_length=self.sequence_length), optimizer=optimizer)

        return final_model



    def _query(self):
        m2s = {}
        for key in self.measurement_sensor_dict["Input"]:
            m2s[key] = self.measurement_sensor_dict["Input"][key]
        for key in self.measurement_sensor_dict["Output"]:
            if key in list(m2s.keys()):
                for value in self.measurement_sensor_dict["Output"][key]:
                    if value not in m2s[key]:
                        m2s[key].append(value)
            else:
                m2s[key] = self.measurement_sensor_dict["Output"][key]

        raw_data, sensor_names = self.influx_client.query(m2s, self.start_time, self.end_time)
        self.sensor_names = sensor_names
        self.raw_data = raw_data
        for key in self.measurement_sensor_dict["Input"].keys():
            for col in self.measurement_sensor_dict["Input"][key]: 
                self.input_columns.append(col)
        self.input_columns.sort()
        for key in self.measurement_sensor_dict["Output"].keys():
            for col in self.measurement_sensor_dict["Output"][key]: 
                self.output_columns.append(col)
        self.output_columns.sort()

    @property
    def influx_client(self):
        if self.influx_helper == None:
            if str(ML_INFLUX_VERSION) == "2":
                self.influx_helper = Influx2QueryHelper(self.db_settings)
            else:
                self.influx_helper = QueryHelper(self.db_settings)
        return self.influx_helper



    @property
    def preprocessor(self):
        if self.preprocess_helper == None:
            self.preprocess_helper = MLPreprocessor(self.raw_data)
        return self.preprocess_helper

        
    def run(self):
        global ad_experiments
        ad_experiments[self.model_name] = {"one_trial": {"intermediates": []}, "t_time": time.time(), "trial_no": 0}
        self._query()
        df = self.preprocessor.preproc("df", self.sensor_names)

        train_size = int(len(df) * 0.8)
        # test_size = len(self.dataset) - train_size
        train, test = df.iloc[0:train_size], df.iloc[train_size:len(df)]
        input_means = [df[col].mean() for col in self.input_columns]
        input_stds = [df[col].std() for col in self.input_columns]
        output_means = [df[col].mean() for col in self.output_columns]
        output_stds = [df[col].std() for col in self.output_columns]

        print(train.head())

        X_train, y_train = to_sequences(train,
         self.input_columns,
         self.output_columns,
         len(self.input_columns), 
         len(self.output_columns), 
         self.sequence_length,
         1,
         input_means, 
         input_stds, 
         output_means, 
         output_stds
        )
    #     train_windows, df, training_data, training_target, means, stds, cols = prepare_training_data("./train/", self.sequence_length, self.input_dim)
    #     windows, test_data, test_target = prepare_testing_data("./test/", self.sequence_length, cols, means, stds)
        tuner = ADBayesian(self._builder, objective="val_loss", max_trials=1, directory="experiments", project_name=self.experiment_name)
        callback = tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=3)
    #     tuner.search_space_summary()
        tuner.search(np.asarray(X_train).astype('float32'), np.asarray(y_train).astype('float32'), epochs=5,validation_split=0.05, callbacks=[callback])
        best_hp=tuner.get_best_hyperparameters()[0]
        print(best_hp)
        model = tuner.hypermodel.build(best_hp)
        dir_name = AD_HPS_DIR + self.session_id

        if not os.path.isdir(dir_name):
            os.makedirs(dir_name)
        
        if not os.path.isdir(AD_SENSOR_DIR + self.session_id):
            os.makedirs(AD_SENSOR_DIR + self.session_id)

        with open(AD_SENSOR_DIR + self.session_id + "/" + self.model_name + "_stats.json", "w") as f:
            stats = {
                "means": input_means,
                "stds": input_stds,
                "sequenceLength": self.sequence_length
            }
            json.dump(stats, f)
        model.save(dir_name + self.model_name + '.h5')


class POFSession(MLSession):
    def __init__(self, settings, algs, params, kill_sig_queue):
        MLSession.__init__(self, settings['sessionID'], settings['creator'], settings['dbSettings'],
                            settings['startTime'], settings['endTime'], settings['type'], settings['sensors'], kill_sig_queue)
        self.algs = algs
        self.params = params


    def _query_weibull(self, failures):
        pd_data = list()
        for fail in failures:
            ten_days = fail["failureStartTime"] - relativedelta.relativedelta(days=10)
            before_ten_days = []
            
            for failure in failures:
                if failure["failureStartTime"]>ten_days and failure["failureStartTime"]<fail["failureStartTime"]:
                    before_ten_days.append(failure)
            if len(before_ten_days):
                ten_days = before_ten_days[-1]["failureStartTime"]
                duration_start_date = ten_days
                duration_end_date = fail["failureStartTime"]
                if self.type == "machine":
                    measurements = self.influx_client.get_measurements_on_db()
                    all_data = list()
                    for measurement in measurements:
                        data_points = list()
                        # fields = self.influx_client.get_fields_on_measurement(measurement)
                        raw_data = self.influx_client.query_measurement_values(measurement, duration_start_date, duration_end_date)
                        for entry in raw_data:
                            data_point = {
                                "time": entry['time'],
                            }
                            for field in entry['values'].keys():
                                key = measurement + "." + field
                                data_point[key] = entry['values'][field]
                            data_points.append(data_point)
                        all_data.append(data_points)
                    pd_data = pd_data + merge_machine_data(all_data)
                elif self.type == "component":
                    measurement = list(self.measurement_sensor_dict["Input"].keys())[0]
                    raw_data = self.influx_client.query_measurement_values(measurement, duration_start_date, duration_end_date)
                    cycle = 0
                    for entry in raw_data:
                        data_point = {
                            "time": cycle,
                        }
                        cycle += 1
                        for field in entry['values'].keys():
                            data_point[field] = entry['values'][field]
                        pd_data.append(data_point)
                elif self.type == "sensor":
                    raw_data = self.influx_client.query_weibull(
                        self.measurement_sensor_dict["Input"],
                        duration_start_date,
                        duration_end_date,
                        self.params['Weibull'][0]
                    )
                        
                    cycle = 0
                    for entry in raw_data:
                        data_point = {
                            "time": cycle,
                        }
                        cycle += 1
                        for field in entry['values'].keys():
                            data_point[field] = entry['values'][field]
                        pd_data.append(data_point)
                    
        df = list_to_dataframe(pd_data)

        for key in self.measurement_sensor_dict["Input"].keys():
            for col in self.measurement_sensor_dict["Input"][key]: 
                self.input_columns.append(col)
        self.input_columns.sort()

        for key in self.measurement_sensor_dict["Output"].keys():
            for col in self.measurement_sensor_dict["Output"][key]: 
                self.output_columns.append(col)
        self.output_columns.sort()

        return df


    def start_session(self):
        if "Weibull" in self.algs:
            failures = self.mongo_helper.get_failures()
            weibull_dataframe = self._query_weibull(failures)

        for i, alg in enumerate(self.algs):
            mid = uuid.uuid4()
            self.model_IDs.append(mid.hex)
            if alg == "Weibull":
                weibull_model = MLWeibull(weibull_dataframe, 
                    self.input_columns, 
                    self.output_columns,
                    self.db_settings,
                    self.session_id,
                    self.model_IDs[i],
                    self.params["Weibull"][0]
                )
                self._train_futures[self.model_IDs[i]] = weibull_model.run()
            self._post_info(alg, self.model_IDs[i], self.params[alg], self.creator)


    def run(self):
        self._listen_for_kill_signal()
        self.start_session()


class ADSession(MLSession):
    def __init__(self, settings, algs, params, kill_sig_queue):
        MLSession.__init__(self, settings['sessionID'], settings['creator'], settings['dbSettings'], 
                            settings['startTime'], settings['endTime'], "AD", settings['sensors'], kill_sig_queue)
        self.algs = algs
        self.params = params


    def start_session(self):
        self._query()
        dataframe = self.preprocessor.preproc("df", self.sensor_names)
        for i, alg in enumerate(self.algs):
            mid = uuid.uuid4()
            self.model_IDs.append(mid.hex)
            if alg == "LSTM":
                lstm_model = MLLSTM(dataframe, self.input_columns, self.output_columns, self.session_id, 
                                    self.model_IDs[i], self.params[alg], self.db_settings)
                self._train_futures[self.model_IDs[i]] = lstm_model.run()
            self._post_info(alg, self.model_IDs[i], self.params[alg], self.creator, "Anomaly Detection")


    def run(self):
        self._listen_for_kill_signal()
        self.start_session()
        

class AutoMLSession:
    def __init__(self, settings):
        super().__init__()
        self.tuner_type = settings['tunerType']
        self.timeout = settings['timeout']
        self.nfeatures = int(settings['nfeatures'])
        self.nepochs = int(settings['nepochs'])
        self.creator = settings['username']
        self.experiment_name = settings['experimentName']
        self.db_settings = settings['dbSettings']
        self.start_time = '%d' % (time.mktime(datetime.datetime.strptime(settings['startTime'], "%Y-%m-%dT%H:%M").timetuple()) * 1000000000)
        self.end_time = '%d' % (time.mktime(datetime.datetime.strptime(settings['endTime'], "%Y-%m-%dT%H:%M").timetuple()) * 1000000000)
        self.measurement_sensor_dict = settings['sensors']

        self.influx_helper = None
        self.preprocess_helper = None
        self.model_ID = uuid.uuid4().hex
        self.session_ID = settings['sessionID']
        self.input_columns = []
        self.output_columns = []

    def _query(self):
        m2s = {}
        for key in self.measurement_sensor_dict["Input"]:
            m2s[key] = self.measurement_sensor_dict["Input"][key]
        for key in self.measurement_sensor_dict["Output"]:
            if key in list(m2s.keys()):
                for value in self.measurement_sensor_dict["Output"][key]:
                    if value not in m2s[key]:
                        m2s[key].append(value)
            else:
                m2s[key] = self.measurement_sensor_dict["Output"][key]

        raw_data, sensor_names = self.influx_client.query(m2s, self.start_time, self.end_time)
        self.sensor_names = sensor_names
        self.raw_data = raw_data
        for key in self.measurement_sensor_dict["Input"].keys():
            for col in self.measurement_sensor_dict["Input"][key]: 
                self.input_columns.append(col)
        self.input_columns.sort()
        for key in self.measurement_sensor_dict["Output"].keys():
            for col in self.measurement_sensor_dict["Output"][key]: 
                self.output_columns.append(col)
        self.output_columns.sort()


    @property
    def influx_client(self):
        if self.influx_helper == None:
            
            self.influx_helper = QueryHelper(self.db_settings)
        return self.influx_helper


    @property
    def preprocessor(self):
        if self.preprocess_helper == None:
            self.preprocess_helper = MLPreprocessor(self.raw_data)
        return self.preprocess_helper


    # @concurrent.thread
    # def _listen_for_kill_signal(self):
    #     while True:
    #         mid = self.kill_sig_queue.get()
    #         if mid:
    #             try:
    #                 self._train_futures[mid].cancel()
    #             except Exception as e:
    #                 print(e)


    # def _post_info(self, task):
    #     hardware = self.db_settings["db"] + "/" + list(self.measurement_sensor_dict.keys())[0]
    #     pkg = {
    #         "algorithm": task,
    #         "modelID": self.model_ID,
    #         "hardware": hardware,
    #         "status": "train",
    #         "modelName": self.modelName
    #     }

    #     requests.post(url=BASICURL, json=pkg)

    #     meta = {
    #         "modelID": self.model_ID,
    #         "creator": self.creator,
    #         "createdDate": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
    #         "relatedHardware": ["act_force_diff_cyl_1"],
    #         "totalfb": 0
    #     }
    #     requests.post(url=METAURL, json=meta)

    def get_error_distribution_stats(self, model, X_train, y_train, out_means, out_stds):
        i = 0
        relative_error_dict = {}
        error_mean_dict = {}
        error_std_dict = {}
        for col in self.output_columns:
            relative_error_dict[col] = list()

        for i, sample in enumerate(X_train):
            predictions = model.predict(sample.reshape(1, self.vector_length, self.input_dim))
            inverse_transform_output(predictions, out_means, out_stds)

            for j, pred in enumerate(predictions):
                relative_error = (y_train[i][j] / pred) - 1
                relative_error_dict[self.output_columns[j]].append(relative_error.item(0))


        for col in self.output_columns:
            error_mean = statistics.mean(relative_error_dict[col])
            error_std = statistics.stdev(relative_error_dict[col])
            error_mean_dict[col] = error_mean
            error_std_dict[col] = error_std

        return error_mean_dict, error_std_dict


    def start_training(self, dataframe):
        settings = {
            "tunerType": self.tuner_type,
            "nfeatures": self.nfeatures,
            "nepochs": self.nepochs, 
            "optimizer": "val_loss"
        }
        experiment = {
            "experiment_name": self.experiment_name, 
            "owner": self.creator, 
            "timeout": self.timeout, 
            "settings": settings,
            "features": self.input_columns, 
        }
        requests.post(url='http://localhost:6767/postExperiment', json=experiment)
        try:
            input_means = [dataframe[col].mean() for col in self.input_columns]
            input_stds = [dataframe[col].std() for col in self.input_columns]
            output_means = [dataframe[col].mean() for col in self.output_columns]
            output_stds = [dataframe[col].std() for col in self.output_columns]
        except Exception as e:
            print(e)
        try:
            X_train, y_train = to_sequences(dataframe,
            self.input_columns,
            self.output_columns,
            self.nfeatures, 
            len(self.output_columns), 
            AUTOML_VECTOR_LENGTH,
            1,
            input_means, 
            input_stds, 
            output_means, 
            output_stds
            )
        except Exception as e:
            print(e)
        optimizer = AUTOML_OPTIMIZERS["default"]
        model_builder = MyModelBuilder(AUTOML_VECTOR_LENGTH, X_train, y_train, optimizer["compile"])
        if self.tuner_type == "hyperband":
            tuner =  MyHyperband(model_builder,
                        objective=optimizer["objective"], # val_accuracy
                        max_epochs=5, #3
                        factor=3,
                        directory='experiments',
                        project_name=self.experiment_name)
        elif self.tuner_type == "random":
            tuner = MyRandomSearch(model_builder,
                        objective=optimizer["objective"],
                        seed=1,
                        max_trials=10,
                        executions_per_trial=2,
                        directory='experiments',
                        project_name=self.experiment_name)
        elif self.tuner_type == "bayesian":
            tuner = MyBayesianOptimization(model_builder,
                            objective=optimizer["objective"],
                            max_trials=10,
                            executions_per_trial=1,
                            directory='experiments',
                            project_name=self.experiment_name,
                            overwrite=True)
        stop_early = tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=5)
        # #int_callback = ReportIntermediates()
        tuner.search(X_train, y_train, epochs=1,validation_split=0.05, callbacks=[stop_early], verbose=0) # , ReportIntermediates(tuner)
        print("tunerend")
        best_hps=tuner.get_best_hyperparameters(num_trials=1)[0]
        model = tuner.hypermodel.build(best_hps)
        # hyper_model = hyper_manager.KerasModelBuilder()
        # try:
        #     hyper_model.initialize(X_train, y_train, self.tuner_type, self.experiment_name)
        # except Exception as e:
        #     print(e, "init_hyper")
        # model = hyper_model.search_hyper()
        model.fit(X_train, y_train, shuffle=False, verbose=1)
        error_mean_dict, error_std_dict = self.get_error_distribution_stats(model, X_train, y_train, output_means, output_stds)
        if not os.path.isdir(MODELDIR):
            os.mkdir(MODELDIR)

        t_dir = MODELDIR + self.model_id + "/"
        os.mkdir(t_dir)
        # file_name = t_dir + self.model_id + ".trained"

        model.save(t_dir + "model.h5")
        obj = {
            "Algorithm": "LSTM",
            "modelID": self.model_ID,
            "sessionID": "auto" + self.session_ID,
            "Directory": t_dir,
            "Settings": self.db_settings,
            "InputColumns": self.input_columns,
            "OutputColumns": self.output_columns,
            "Optional": {
                "VectorLength": AUTOML_VECTOR_LENGTH,
                "ErrorMeans": json.dumps(error_mean_dict),
                "ErrorStds": json.dumps(error_std_dict),
                "InputMeans": input_means,
                "InputStds": input_stds,
                "OutputMeans": output_means,
                "OutputStds": output_stds
            }
        }

        requests.post(url=POST_TRAINING_INSERT_URL, json=obj)
        # with open(file_name, 'ab') as train_file:
        #     pickle.dump(obj, train_file)


    def start_session(self):
        # self._post_info("RUL Estimation")
        self._query()
        df = self.preprocessor.preproc("df", self.sensor_names)
        print(df.head())
        self.start_training(df)

    # @concurrent.process
    def run(self):
        # self._listen_for_kill_signal()
        self.start_session()


class ModelRunner:
    def __init__(self, settings):
        self.path = settings['Directory']
        if settings['Algorithm'] == "LSTM":
            self.model = LSTMRunner(settings)


    @concurrent.process
    def run(self):
        self.model.run()


class AlertModule:
    def __init__(self, settings):
        self.worker_count = settings['Workers']
        self.kafka_topic = settings['Topic']
        self.kafka_servers = settings['KafkaServers']
        self.kafka_version = (10, 0)

        self.kafka_consumer = KafkaConsumer(
            self.kafka_topic,
            bootstrap_servers=self.kafka_servers,
            auto_offset_reset='latest',
            enable_auto_commit=True,
            group_id='alerts',
            api_version=self.kafka_version,
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )

    @concurrent.process
    def run(self):
        print(self.kafka_consumer.topics())
        for message in self.kafka_consumer:
            try:
                print(message)
            except Exception as e:
                print(e)


    
        

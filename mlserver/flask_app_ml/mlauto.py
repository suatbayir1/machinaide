from tensorflow.python.keras.layers.recurrent import LSTM
import numpy as np
#from keras_hyper import find_hypers
# Setting seed for reproducability
from tensorflow.keras import Model, Input
import argparse
import tensorflow as tf
from tensorflow import keras
import kerastuner as kt
import time
import requests
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, LSTM, Activation
from tensorflow.keras.callbacks import Callback
from mlconstants import AUTOML_BATCH_SIZES, AUTOML_EPOCHS, AUTOML_LSTM_UNITS, AUTOML_DROPOUT



trial_results = []
one_trial = {}
t_time = time.time()
trial_no = 0

AUTOML_OPTIMIZERS = {
    # "default": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall()], "objective": "val_accuracy"},
    "default": {"compile": [tf.keras.metrics.MeanSquaredError()], "objective": "val_loss"},
    "auc": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(), tf.keras.metrics.AUC(name="auc")], "objective": kt.Objective("auc", direction="max")},
    "tp": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(), tf.keras.metrics.TruePositives(name='tp')], "objective": kt.Objective("tp", direction="max")},
    "fp": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(), tf.keras.metrics.FalsePositives(name='fp')], "objective": kt.Objective("fp", direction="min")},
    "fn": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(), tf.keras.metrics.FalseNegatives(name='fn')], "objective": kt.Objective("fn", direction="min")},
    "tn": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(), tf.keras.metrics.TrueNegatives(name='tn')], "objective": kt.Objective("tn", direction="max")},
    "precision": {"compile": ["accuracy", tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall()], "objective": kt.Objective("precision", direction="max")},
    "recall": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(name='recall')], "objective": kt.Objective("recall", direction="max")},
    "val_loss": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall()], "objective": "val_loss"},
    "val_accuracy": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall()], "objective": "val_accuracy"},
    "accuracy": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall()], "objective": "accuracy"},
    "loss": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall()], "objective": "loss"},
    "mse": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(), "mse"], "objective": "mse"},    
}

trial_results = []
one_trial = {}
t_time = time.time()
trial_no = 0

class MyModelBuilder(kt.HyperModel):
    def __init__(self, sequence_length, seq_array, label_array, optimizers):
        self.sequence_length = sequence_length
        self.seq_array = seq_array
        self.label_array =label_array
        self.optimizers = optimizers
    
    def build(self, hp):
        nb_features = self.seq_array.shape[2]
        nb_out = self.label_array.shape[1]

        model = Sequential()

        hp_units1 = hp.Choice('units1', AUTOML_LSTM_UNITS)
        model.add(LSTM(
                input_shape=(self.sequence_length, nb_features),
                units=hp_units1,
                return_sequences=True))
        
        hp_dropout = hp.Choice('dropout', AUTOML_DROPOUT)
        model.add(Dropout(hp_dropout))

        hp_units2 = hp.Choice('units2', AUTOML_LSTM_UNITS)
        model.add(LSTM(
                    units=hp_units2,
                    return_sequences=False))
        model.add(Dropout(hp_dropout))

        model.add(Dense(units=nb_out, activation='sigmoid'))
        model.compile(loss='mean_squared_error', optimizer='adam', metrics=[tf.keras.metrics.MeanSquaredError()])

        return model

    # def build(self, hp):
    #     nb_features = self.seq_array.shape[2]
    #     nb_out = self.label_array.shape[1]
    #     hp_units1 = hp.Choice('units1', AUTOML_LSTM_UNITS)
    #     hp_dropout = hp.Choice('dropout', AUTOML_DROPOUT)
    #     hp_units2 = hp.Choice('units2', AUTOML_LSTM_UNITS)

    #     model_input = Input(shape=(self.sequence_length, nb_features), name="encoder_input")
    #     network = model_input
    #     network = LSTM(units=hp_units1, name="auto_lstm_layer_1", return_sequences=True, activation='tanh')(network)
    #     network = Dropout(hp_dropout)(network)
    #     network = LSTM(units=hp_units2, name="ad_lstm_layer_2", return_sequences=False, activation='tanh')(network)
    #     network = Dropout(hp_dropout)(network)
    #     network_output = Dense(units=nb_out, activation='tanh')(network)
    #     model = tf.keras.Model(model_input, network_output)
    #     # model.add_loss(root_mean_squared_error(model_input, model_output, sequence_length))
    #     #graph_model(self.seq_array)
    #     model.compile(loss='binary_crossentropy', optimizer='adam', metrics=self.optimizers)

    #     return model


class MyRandomSearch(kt.RandomSearch):
    def run_trial(self, trial, *args, **kwargs):
        # You can add additional HyperParameters for preprocessing and custom training loops
        # via overriding `run_trial`
        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', AUTOML_BATCH_SIZES)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', AUTOML_EPOCHS)
        super(MyRandomSearch, self).run_trial(trial, *args, **kwargs)
        
    def on_trial_begin(self, trial):
        if self.logger:
            self.logger.register_trial(trial.trial_id, trial.get_state())
        self._display.on_trial_begin(self.oracle.get_trial(trial.trial_id))
        global one_trial
        global t_time
        global trial_no
        trial_no = trial_no + 1
        t_time = time.time()
        one_trial = {}
        one_trial["trialNo"] = trial_no
        one_trial["trialID"] = trial.trial_id
        one_trial["hypers"] = trial.hyperparameters.values
        one_trial["intermediates"] = []
        #one_trial.append({"trialNo": trial_no, "trialID": trial.trial_id, "hypers": trial.hyperparameters.values})
        # print(trial)

    def on_trial_end(self, trial):
        if self.logger:
            self.logger.report_trial_state(trial.trial_id, trial.get_state())

        self.oracle.end_trial(trial.trial_id, "COMPLETED")
        self.oracle.update_space(trial.hyperparameters)
        # Display needs the updated trial scored by the Oracle.
        self._display.on_trial_end(self.oracle.get_trial(trial.trial_id))
        self.save()

        global one_trial
        global t_time
        
        duration = time.time()-t_time
        # res = {"duration": duration, "timestamp": time.time()}
        one_trial["duration"] = duration
        one_trial["timestamp"] = time.time()
        one_trial["status"] = trial.status
        # one_trial.append(res)
        trial_results.append(one_trial)
        exp = self.project_name
        # mycol.update_one({"experimentName": exp}, {'$push': {'trials': one_trial}})


class MyHyperband(kt.Hyperband):
    def run_trial(self, trial, *args, **kwargs):
        # You can add additional HyperParameters for preprocessing and custom training loops
        # via overriding `run_trial`
        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', AUTOML_BATCH_SIZES)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', AUTOML_EPOCHS)
        super(MyHyperband, self).run_trial(trial, *args, **kwargs)
        
    def on_trial_begin(self, trial):
        if self.logger:
            self.logger.register_trial(trial.trial_id, trial.get_state())
            self._display.on_trial_begin(self.oracle.get_trial(trial.trial_id))
            global one_trial
            global t_time
            global trial_no
            trial_no = trial_no + 1
            t_time = time.time()
            one_trial = {}
            one_trial["trialNo"] = trial_no
            one_trial["trialID"] = trial.trial_id
            one_trial["hypers"] = trial.hyperparameters.values
            one_trial["intermediates"] = []
            # one_trial.append({"trialNo": trial_no, "trialID": trial.trial_id, "hypers": trial.hyperparameters.values})
            # print(trial)

    def on_trial_end(self, trial):
        if self.logger:
            self.logger.report_trial_state(trial.trial_id, trial.get_state())

            self.oracle.end_trial(trial.trial_id, "COMPLETED")
            self.oracle.update_space(trial.hyperparameters)
            # Display needs the updated trial scored by the Oracle.
            self._display.on_trial_end(self.oracle.get_trial(trial.trial_id))
            self.save()

            global one_trial
            global t_time
            
            duration = time.time()-t_time
            # res = {"duration": duration, "timestamp": time.time()}
            one_trial["duration"] = duration
            one_trial["timestamp"] = time.time()
            one_trial["status"] = trial.status
            # one_trial.append(res)
            trial_results.append(one_trial)
            exp = self.project_name
            pkg = {
                "experiment_name": exp,
                "trial": one_trial
            }
            requests.post(url='http://localhost:6767/postExperiment', json=pkg)
            # mycol.update_one({"experimentName": exp}, {'$push': {'trials': one_trial}})


class MyBayesianOptimization(kt.BayesianOptimization):
    def run_trial(self, trial, *args, **kwargs):
        # You can add additional HyperParameters for preprocessing and custom training loops
        # via overriding `run_trial`
        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', AUTOML_BATCH_SIZES)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', AUTOML_EPOCHS)
        super(MyBayesianOptimization, self).run_trial(trial, *args, **kwargs)
    
    def on_trial_begin(self, trial):
        if self.logger:
            self.logger.register_trial(trial.trial_id, trial.get_state())
        self._display.on_trial_begin(self.oracle.get_trial(trial.trial_id))
        global one_trial
        global t_time
        global trial_no
        trial_no = trial_no + 1
        t_time = time.time()
        one_trial = {}
        one_trial["trialNo"] = trial_no
        one_trial["trialID"] = trial.trial_id
        one_trial["hypers"] = trial.hyperparameters.values
        one_trial["intermediates"] = []
        # one_trial.append({"trialNo": trial_no, "trialID": trial.trial_id, "hypers": trial.hyperparameters.values})
        # print(trial)

    def on_trial_end(self, trial):
        if self.logger:
            self.logger.report_trial_state(trial.trial_id, trial.get_state())

        self.oracle.end_trial(trial.trial_id, "COMPLETED")
        self.oracle.update_space(trial.hyperparameters)
        # Display needs the updated trial scored by the Oracle.
        self._display.on_trial_end(self.oracle.get_trial(trial.trial_id))
        self.save()

        global one_trial
        global t_time
        
        duration = time.time()-t_time
        # res = {"duration": duration, "timestamp": time.time()}
        one_trial["duration"] = duration
        one_trial["timestamp"] = time.time()
        one_trial["status"] = trial.status
        # one_trial.append(res)
        trial_results.append(one_trial)
        exp = self.project_name
        #mycol.update_one({"experimentName": exp}, {'$push': {'trials': one_trial}})


class ReportIntermediates(Callback):
    def __init__(self):
        super(ReportIntermediates, self).__init__()
        # self.tuner = tuner
    """
    Callback class for reporting intermediate accuracy metrics.

    This callback sends accuracy to NNI framework every 100 steps,
    so you can view the learning curve on web UI.

    If an assessor is configured in experiment's YAML file,
    it will use these metrics for early stopping.
    """
    def on_epoch_end(self, batch, logs={}):
        global one_trial
        res = {"logs":logs, "timestamp": time.time()}
        #one_trial.append(res)
        one_trial["intermediates"].append(res)

    """ def on_train_end(self, logs=None):
        # keys = list(logs.keys())
        res = {"loss": logs["loss"], "accuracy": logs["accuracy"], "val_loss": logs["val_loss"], "val_accuracy": logs["val_accuracy"]}
        trial_results.append(res)
        # x = mycol.insert_one(res)
        print("train end", res) """


from tensorflow.python.keras.layers.recurrent import LSTM
import numpy as np
#from keras_hyper import find_hypers
# Setting seed for reproducability
from tensorflow.keras import Model, Input
import argparse
import tensorflow as tf
from tensorflow import keras
import keras_tuner as kt
import time
import requests
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, LSTM, Activation
from tensorflow.keras.callbacks import Callback
from tensorflow.keras.optimizers import Adam
from mlconstants import AUTOML_BATCH_SIZES, AUTOML_EPOCHS, AUTOML_LSTM_UNITS, AUTOML_DROPOUT
import simplejson as json

from mlconstants import (
    AUTOML_POST_TRIAL_URL,
)

AUTOML_OPTIMIZERS = {
    # "default": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall()], "objective": "val_accuracy"},
    "default": {"compile": ["acc", "MeanSquaredError"], "objective": "val_loss"},
    "auc": {"compile": ["acc", "Precision", "Recall", "AUC"], "objective": kt.Objective("auc", direction="max")},
    "tp": {"compile": ["acc", "Precision", "Recall", "TruePositives"], "objective": kt.Objective("true_positives", direction="max")},
    "fp": {"compile": ["acc", "Precision", "Recall", "FalsePositives"], "objective": kt.Objective("false_positives", direction="min")},
    "fn": {"compile": ["acc", "Precision", "Recall", "FalseNegatives"], "objective": kt.Objective("false_negatives", direction="min")},
    "tn": {"compile": ["acc", "Precision", "Recall", "TrueNegatives"], "objective": kt.Objective("true_negatives", direction="max")},
    "precision": {"compile": ["acc", "Precision", "Recall"], "objective": kt.Objective("precision", direction="max")},
    "recall": {"compile": ["acc", "Precision", "Recall"], "objective": kt.Objective("recall", direction="max")},
    "val_loss": {"compile": ["acc", "Precision", "Recall"], "objective": "val_loss"},
    "val_accuracy": {"compile": ["acc", "Precision", "Recall"], "objective": "val_acc"},
    "accuracy": {"compile": ["acc", "Precision", "Recall"], "objective": "acc"},
    # "accuracy": {"compile": [keras.metrics.BinaryAccuracy(name="acc")], "objective": "acc"},
    "loss": {"compile": ["acc", "Precision", "Recall"], "objective": "loss"},
    "mse": {"compile": ["acc", "Precision", "Recall", "mse"], "objective": "mse"},    
}


rul_experiments = {}

class RULMetric:
    def __init__(self, train_df, seq_len):
        self.train_df = train_df
        self.seq_len = seq_len

    def gen_labels(self, all_df, seq_length, label):
        data_array = all_df[label].values
        num_elements = data_array.shape[0]
        return data_array[seq_length:num_elements, :]

    def rul_forgiving_confusion_matrix(self, target, candidate):
        exact_match = 0
        detected_failure = 0
        missed_failure = 0
        false_failure = 0
        for i in range(len(target)):
            if(target[i][1] == 1):
              # if candidate gives the same report for failure at target
                if(candidate[i][1] == 1):
                    exact_match += 1
                else:
                    range_low = target[i][0] - 2
                    range_up = target[i][0] + 2
                    flag = False
                    for j in range(len(candidate)):
                        if(candidate[j][0]>=range_low and candidate[j][0]<=range_up):
                            if(candidate[j][1] == 1):
                                print(candidate[j], "----", target[i])
                                detected_failure += 1
                                flag = True
                                break
                            continue
                    if(not flag):
                        missed_failure += 1
            elif(target[i][1] == 0):
                if(candidate[i][1] == 1):
                    # print(candidate[i], "----", target[i])
                    false_failure += 1
        return (exact_match, detected_failure, missed_failure, false_failure)

    def closest_points(self, target, candidate):
        closest = {}
        for i in range(len(target)):
            if(target[i][1] == 1):
              # if candidate gives the same report for failure at target
              if(candidate[i][1] == 1):
                closest[target[i][0]] = target[i]
              else:
                for j in range(len(candidate)):
                    if(i+j < len(candidate)):
                        if(candidate[i+j][1] == 1):
                            closest[target[i][0]] = candidate[i+j]
                            break
                    elif(i-j > 0):
                        if(candidate[i-j][1] == 1):
                            closest[target[i][0]] = candidate[i-j]
                            break
        return closest
    
    def rul_temporal_distance(self, target, candidate):        
        ttc = 0
        ttc_points = self.closest_points(target, candidate)
        for key in ttc_points.keys():
            ttc += abs((key - ttc_points[key][0]))
        print(ttc)        

        ctt = 0
        ctt_points = self.closest_points(candidate, target)
        # print(ctt_points)
        for key in ctt_points.keys():
            ctt += abs((key - ctt_points[key][0]))
        print(ctt)
        self.temporal_distances = (ttc, ctt)  
        return (ttc, ctt) 
    
    def temporal_distance(self, y_pred):
        print(y_pred)
        cycle_label_gen = [self.gen_labels(self.train_df[self.train_df['id']==id], self.seq_len, ['time', "label1"]) 
             for id in self.train_df['id'].unique()]
        cycle_label_array = np.concatenate(cycle_label_gen)
        cycle_label_array = cycle_label_array.tolist()

        prediction_cycle = []
        for i in range(len(cycle_label_array)):
            prediction_cycle.append([cycle_label_array[i][0], y_pred[i][0]]) 
        
        distance = self.rul_temporal_distance(cycle_label_array, prediction_cycle)
        fcm = self.rul_forgiving_confusion_matrix(cycle_label_array, prediction_cycle)
        
        return  (distance, fcm)

class RULModelBuilder(kt.HyperModel):
    def __init__(self, sequence_length, seq_array, label_array, optimizers):
        self.sequence_length = sequence_length
        self.seq_array = seq_array
        self.label_array =label_array
        self.optimizers = optimizers
    
    def build(self, hp):
        nb_features = self.seq_array.shape[2]
        nb_out = self.label_array.shape[1]

        model = Sequential()

        hp_units1 = hp.Choice('units1', AUTOML_LSTM_UNITS)
        model.add(LSTM(
                input_shape=(self.sequence_length, nb_features),
                units=hp_units1,
                return_sequences=True))
        
        hp_dropout = hp.Choice('dropout', AUTOML_DROPOUT)
        model.add(Dropout(hp_dropout))

        hp_units2 = hp.Choice('units2', AUTOML_LSTM_UNITS)
        model.add(LSTM(
                    units=hp_units2,
                    return_sequences=False))
        model.add(Dropout(hp_dropout))

        model.add(Dense(units=nb_out, activation='sigmoid'))
        model.compile(loss='binary_crossentropy', optimizer=keras.optimizers.Adam(), metrics=self.optimizers)

        return model

def start_rul_automl_experiment(model_name):
    global rul_experiments
    rul_experiments[model_name] = {"one_trial": {"intermediates": []}, "t_time": time.time(), "trial_no": 0}

def change_nan(trial):
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



class RULRandomSearch(kt.RandomSearch):
    def __init__(self, seq_array, train_df, seq_len, *args, **kw):
        super().__init__(*args, **kw)
        self.seq_array = seq_array
        self.train_df = train_df
        self.seq_len = seq_len

    def run_trial(self, trial, *args, **kwargs):
        # You can add additional HyperParameters for preprocessing and custom training loops
        # via overriding `run_trial`
        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', AUTOML_BATCH_SIZES)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', AUTOML_EPOCHS)
        super(RULRandomSearch, self).run_trial(trial, *args, **kwargs)
        
    def on_trial_begin(self, trial):
        if self.logger:
            self.logger.register_trial(trial.trial_id, trial.get_state())
        self._display.on_trial_begin(self.oracle.get_trial(trial.trial_id))
        
        global rul_experiments
        trial_no = rul_experiments[self.project_name]["trial_no"]
        
        trial_no_temp = trial_no + 1
        t_time_temp = time.time()
        rul_experiments[self.project_name]["t_time"] = t_time_temp
        rul_experiments[self.project_name]["trial_no"] = trial_no_temp

        one_trial_temp = {}
        one_trial_temp["trialNo"] = trial_no_temp
        one_trial_temp["trialID"] = trial.trial_id
        one_trial_temp["hypers"] = trial.hyperparameters.values
        one_trial_temp["intermediates"] = []
        rul_experiments[self.project_name]["one_trial"] = one_trial_temp

    def on_trial_end(self, trial):
        if self.logger:
            self.logger.report_trial_state(trial.trial_id, trial.get_state())

        self.oracle.end_trial(trial.trial_id, "COMPLETED")
        self.oracle.update_space(trial.hyperparameters)
        # Display needs the updated trial scored by the Oracle.
        self._display.on_trial_end(self.oracle.get_trial(trial.trial_id))
        self.save()

        global rul_experiments
        one_trial = rul_experiments[self.project_name]["one_trial"]
        t_time = rul_experiments[self.project_name]["t_time"]
        
        duration = time.time()-t_time
        one_trial["duration"] = duration
        one_trial["timestamp"] = time.time()
        one_trial["status"] = trial.status
        exp = self.project_name

        model = self.load_model(trial)
        y_pred = model.predict(self.seq_array,verbose=1, batch_size=200)
        y_pred = (y_pred > 0.5).astype("int32")
        metric_builder = RULMetric(train_df=self.train_df, seq_len=self.seq_len)
        distance, fcm = metric_builder.temporal_distance(y_pred)
        # ttc, ctt = self.temporal_distance(y_pred)
        ttc, ctt = distance
        exact_match, detected_failure, missed_failure, false_failure = fcm
        print(distance, fcm)
        one_trial["ttc"] = ttc
        one_trial["ctt"] = ctt
        one_trial["exact_match"] = exact_match
        one_trial["detected_failure"] = detected_failure
        one_trial["missed_failure"] = missed_failure
        one_trial["false_failure"] = false_failure
        print(one_trial)

        requests.post(url=AUTOML_POST_TRIAL_URL, json={'experiment_name': exp, 'trial': json.dumps(change_nan(one_trial), default=numpy_converter)}) 


class RULHyperband(kt.Hyperband):
    def __init__(self, seq_array, train_df, seq_len, *args, **kw):
        super().__init__(*args, **kw)
        self.seq_array = seq_array
        self.train_df = train_df
        self.seq_len = seq_len

    def run_trial(self, trial, *args, **kwargs):
        # You can add additional HyperParameters for preprocessing and custom training loops
        # via overriding `run_trial`
        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', AUTOML_BATCH_SIZES)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', AUTOML_EPOCHS)
        super(RULHyperband, self).run_trial(trial, *args, **kwargs)
        
    def on_trial_begin(self, trial):
        if self.logger:
            self.logger.register_trial(trial.trial_id, trial.get_state())
        self._display.on_trial_begin(self.oracle.get_trial(trial.trial_id))
        
        global rul_experiments
        trial_no = rul_experiments[self.project_name]["trial_no"]
        
        trial_no_temp = trial_no + 1
        t_time_temp = time.time()
        rul_experiments[self.project_name]["t_time"] = t_time_temp
        rul_experiments[self.project_name]["trial_no"] = trial_no_temp

        one_trial_temp = {}
        one_trial_temp["trialNo"] = trial_no_temp
        one_trial_temp["trialID"] = trial.trial_id
        one_trial_temp["hypers"] = trial.hyperparameters.values
        one_trial_temp["intermediates"] = []
        rul_experiments[self.project_name]["one_trial"] = one_trial_temp

    def on_trial_end(self, trial):
        if self.logger:
            self.logger.report_trial_state(trial.trial_id, trial.get_state())

        self.oracle.end_trial(trial.trial_id, "COMPLETED")
        self.oracle.update_space(trial.hyperparameters)
        # Display needs the updated trial scored by the Oracle.
        self._display.on_trial_end(self.oracle.get_trial(trial.trial_id))
        self.save()

        global rul_experiments
        one_trial = rul_experiments[self.project_name]["one_trial"]
        t_time = rul_experiments[self.project_name]["t_time"]
        
        duration = time.time()-t_time
        one_trial["duration"] = duration
        one_trial["timestamp"] = time.time()
        one_trial["status"] = trial.status
        exp = self.project_name

        model = self.load_model(trial)
        y_pred = model.predict(self.seq_array,verbose=1, batch_size=200)
        y_pred = (y_pred > 0.5).astype("int32")
        metric_builder = RULMetric(train_df=self.train_df, seq_len=self.seq_len)
        distance, fcm = metric_builder.temporal_distance(y_pred)
        # ttc, ctt = self.temporal_distance(y_pred)
        ttc, ctt = distance
        exact_match, detected_failure, missed_failure, false_failure = fcm
        print(distance, fcm)
        one_trial["ttc"] = ttc
        one_trial["ctt"] = ctt
        one_trial["exact_match"] = exact_match
        one_trial["detected_failure"] = detected_failure
        one_trial["missed_failure"] = missed_failure
        one_trial["false_failure"] = false_failure
        print(one_trial)

        # TODO:
        requests.post(url=AUTOML_POST_TRIAL_URL, json={'experiment_name': exp, 'trial': json.dumps(change_nan(one_trial), default=numpy_converter)})


class RULBayesianOptimization(kt.BayesianOptimization):
    def __init__(self, seq_array, train_df, seq_len, *args, **kw):
        super().__init__(*args, **kw)
        self.seq_array = seq_array
        self.train_df = train_df
        self.seq_len = seq_len
        
    def run_trial(self, trial, *args, **kwargs):
        # You can add additional HyperParameters for preprocessing and custom training loops
        # via overriding `run_trial`
        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', AUTOML_BATCH_SIZES)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', AUTOML_EPOCHS)
        super(RULBayesianOptimization, self).run_trial(trial, *args, **kwargs)
    
    def on_trial_begin(self, trial):
        if self.logger:
            self.logger.register_trial(trial.trial_id, trial.get_state())
        self._display.on_trial_begin(self.oracle.get_trial(trial.trial_id))
        
        global rul_experiments
        trial_no = rul_experiments[self.project_name]["trial_no"]
        
        trial_no_temp = trial_no + 1
        t_time_temp = time.time()
        rul_experiments[self.project_name]["t_time"] = t_time_temp
        rul_experiments[self.project_name]["trial_no"] = trial_no_temp

        one_trial_temp = {}
        one_trial_temp["trialNo"] = trial_no_temp
        one_trial_temp["trialID"] = trial.trial_id
        one_trial_temp["hypers"] = trial.hyperparameters.values
        one_trial_temp["intermediates"] = []
        rul_experiments[self.project_name]["one_trial"] = one_trial_temp

    def on_trial_end(self, trial):
        if self.logger:
            self.logger.report_trial_state(trial.trial_id, trial.get_state())

        self.oracle.end_trial(trial.trial_id, "COMPLETED")
        self.oracle.update_space(trial.hyperparameters)
        # Display needs the updated trial scored by the Oracle.
        self._display.on_trial_end(self.oracle.get_trial(trial.trial_id))
        self.save()

        global rul_experiments
        one_trial = rul_experiments[self.project_name]["one_trial"]
        t_time = rul_experiments[self.project_name]["t_time"]
        
        duration = time.time()-t_time
        one_trial["duration"] = duration
        one_trial["timestamp"] = time.time()
        one_trial["status"] = trial.status
        exp = self.project_name

        model = self.load_model(trial)
        y_pred = model.predict(self.seq_array,verbose=1, batch_size=200)
        y_pred = (y_pred > 0.5).astype("int32")
        metric_builder = RULMetric(train_df=self.train_df, seq_len=self.seq_len)
        distance, fcm = metric_builder.temporal_distance(y_pred)
        # ttc, ctt = self.temporal_distance(y_pred)
        ttc, ctt = distance
        exact_match, detected_failure, missed_failure, false_failure = fcm
        print(distance, fcm)
        one_trial["ttc"] = ttc
        one_trial["ctt"] = ctt
        one_trial["exact_match"] = exact_match
        one_trial["detected_failure"] = detected_failure
        one_trial["missed_failure"] = missed_failure
        one_trial["false_failure"] = false_failure
        print(one_trial)

        requests.post(url=AUTOML_POST_TRIAL_URL, json={'experiment_name': exp, 'trial': json.dumps(change_nan(one_trial), default=numpy_converter)})


class RULReportIntermediates(Callback):
    def __init__(self, experiment_name):
        super(RULReportIntermediates, self).__init__()
        self.experiment_name = experiment_name
    """
    Callback class for reporting intermediate accuracy metrics.

    This callback sends accuracy to NNI framework every 100 steps,
    so you can view the learning curve on web UI.

    If an assessor is configured in experiment's YAML file,
    it will use these metrics for early stopping.
    """
    def on_epoch_end(self, batch, logs={}):
        global rul_experiments
        one_trial = rul_experiments[self.experiment_name]["one_trial"]
        res = {"logs":logs, "timestamp": time.time()}
        one_trial["intermediates"].append(res)
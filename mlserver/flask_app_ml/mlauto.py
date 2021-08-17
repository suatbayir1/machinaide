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
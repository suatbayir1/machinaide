import subprocess
import time
import datetime
import requests
import os
import uuid
import json
import tensorflow as tf
from kafka import KafkaConsumer
import statistics
from dateutil import parser, relativedelta
import pandas as pd
from sklearn.metrics import confusion_matrix, recall_score, precision_score
# from kerasmanager import KerasHyperManager
from tensorflow.keras import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.layers import Dense, Conv2D, Dropout, Lambda, LSTM, Input, RepeatVector, TimeDistributed
from tensorflow.keras import backend as K
from tensorflow.keras.callbacks import EarlyStopping
import math
import subprocess
import queue
import threading

# from mlutils import Influx2QueryHelper
tf.compat.v1.enable_eager_execution()
# tf.compat.v1.disable_v2_behavior()
import sys
sys.path.append('../../')

from config import (
    ADHPSDIR,
    ADSENSORDIR,
    CELLURL,
    INFLUXDB_CLIENT,
    METAURL,
    BASICURL,
    PUTBASICURL,
    MLSESSIONDIR,
    MODELDIR,
    MLSESSIONDIR,
    POSTTRAININGINSERTURL,
    VAEHPSDIR,
    VAESENSORDIR,
    GETFAILURESURL,
    GETSENSORFROMMAPPING,
    AUTOML_BATCH_SIZES,
    AUTOML_EPOCHS,
    AUTOML_POST_TRIAL_URL,
    AUTOML_CHANGE_STATUS_URL,
    AUTOML_POST_EXPERIMENT_URL,
    AUTOML_UPDATE_EXPERIMENT_URL,
    RUL_SEQUENCE_LENGTH,
    TICK_SETTINGS,
    host_ip,
    pof_batch_sizes,
    pof_n_epochs,
    influx_port,
    max_epochs,
    max_trials,
    executions_per_trial,
)
from mlhelpers.mlutils import QueryHelper, POFQueryHelper, MLPreprocessor, Influx2QueryHelper
# from mlarima import MLARIMA
# from mlkmeans import MLKMEANS
# from mliforest import MLIFOREST
# from mlmahalanobis import MLMAHALANOBIS
from mlhelpers.mllstm import MLLSTM, LSTMRunner
from mlhelpers.mlhdbscan import MLHDBSCAN
from mlhelpers.mlauto import RULBayesianOptimization, RULHyperband, RULModelBuilder, RULRandomSearch, RULReportIntermediates, AUTOML_OPTIMIZERS, start_rul_automl_experiment, numpy_converter
# from tensorflow.keras.models import load_model
from multiprocessing import Process
from pebble import concurrent
from mlhelpers.cnn import CNN
from mlhelpers.mlutils import to_sequences, root_mean_squared_error, inverse_transform_output, transform_value

import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.layers import LSTM
from tensorflow.keras.layers import Activation
from tensorflow.keras.layers import Masking, Dropout
from tensorflow.keras.optimizers import RMSprop
from tensorflow.keras import backend as k
from sklearn.preprocessing import normalize
from tensorflow.keras.callbacks import History
from tensorflow.keras.callbacks import Callback
from mlhelpers.helper import get_feature_number, optimizers, optimizers2

# import featuretools as ft
# from nni.algorithms.feature_engineering.gradient_selector import FeatureGradientSelector
import keras_tuner as kt
np.random.seed(1234)  
PYTHONHASHSEED = 0
from sklearn import preprocessing
from tensorflow import keras


# hyper_manager = KerasHyperManager()
# hyper_manager.start()

def sample_point_from_normal_distribution(args):
    mu, log_variance = args
    epsilon = K.random_normal(shape=K.shape(mu), mean=0.,
                                stddev=1.)
    sampled_point = mu + K.exp(log_variance / 2) * epsilon
    return sampled_point

def sample_z(args, ano=False):
    mu, log_sigma = args
    eps = K.random_normal(shape=(len(mu),), mean=0., stddev=1.)
    if not ano:
        return (mu + K.exp(log_sigma / 2) * eps)
    else:
        return (mu + K.exp(log_sigma / 2) * eps + 4*log_sigma)


def vae_loss(original, out, z_log_sigma, z_mean, sequence_length, alpha):

    reconstruction = K.mean(K.square(original - out)) * sequence_length
    kl = -0.5 * K.mean(1 + z_log_sigma - K.square(z_mean) - K.exp(z_log_sigma))

    return alpha*reconstruction + kl

# def encoder_loss(encoder, decoder):

def root_mean_squared_error(sequence_length):
    def loss(original, output):
        reconstruction = K.sqrt(K.mean(K.square(original - output))) * sequence_length
        return reconstruction

    return loss


class MLSession(Process):
    def __init__(self, settings, algs, params, kill_sig_queue):
        super().__init__()
        self.algs = algs
        self.params = params
        # self.types = settings['types']
        self.session_id = settings['sessionID']
        self.creator = settings['creator']
        self.db_settings = settings['dbSettings']
        # self.start_time = '%d' % (time.mktime(datetime.datetime.strptime(settings['startTime'], "%Y-%m-%dT%H:%M:%S.%fZ").timetuple()))
        # self.end_time = '%d' % (time.mktime(datetime.datetime.strptime(settings['endTime'], "%Y-%m-%dT%H:%M:%S.%fZ").timetuple()))
        self.start_time = settings['startTime']
        self.end_time = settings['endTime']
        self.measurement_sensor_dict = settings['sensors']
        self.kill_sig_queue = kill_sig_queue

        self.influx_helper = None
        self.preprocess_helper = None
        self._train_futures = {}
        self.model_IDs = []
        # self.input_columns = []
        # self.output_columns = []


    def _query(self):
        # m2s = {}
        # for key in self.measurement_sensor_dict["Input"]:
        #     m2s[key] = self.measurement_sensor_dict["Input"][key]
        # for key in self.measurement_sensor_dict["Output"]:
        #     if key in list(m2s.keys()):
        #         for value in self.measurement_sensor_dict["Output"][key]:
        #             if value not in m2s[key]:
        #                 m2s[key].append(value)
        #     else:
        #         m2s[key] = self.measurement_sensor_dict["Output"][key]

        raw_data, sensor_names = self.influx_client.query(self.measurement_sensor_dict, self.start_time, self.end_time)
        self.sensor_names = sensor_names
        self.raw_data = raw_data
        # for key in self.measurement_sensor_dict["Input"].keys():
        #     for col in self.measurement_sensor_dict["Input"][key]: 
        #         self.input_columns.append(col)
        # self.input_columns.sort()
        # for key in self.measurement_sensor_dict["Output"].keys():
        #     for col in self.measurement_sensor_dict["Output"][key]: 
        #         self.output_columns.append(col)
        # self.output_columns.sort()



    @property
    def influx_client(self):
        if self.influx_helper == None:
            self.influx_helper = Influx2QueryHelper(self.db_settings)
        return self.influx_helper


    @property
    def preprocessor(self):
        if self.preprocess_helper == None:
            self.preprocess_helper = MLPreprocessor(self.raw_data)
        return self.preprocess_helper


    @concurrent.thread
    def _listen_for_kill_signal(self):
        while True:
            mid = self.kill_sig_queue.get()
            if mid:
                try:
                    self._train_futures[mid].cancel()
                except Exception as e:
                    print(e)


    def _post_info(self, alg, model_id, params, creator):
        pkg = {
                "Algorithm": alg,
                "sessionID": self.session_id,
                "modelID": model_id,
                "Status": "train",
                "Parameters": params,
                "username": self.creator,
            }
        print(CELLURL)
        requests.post(url=CELLURL, json=pkg)
        print(CELLURL)

        meta = {
            "modelID": model_id,
            "creator": creator,
            "createdDate": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            # "relatedHardware": ["act_force_diff_cyl_1"],
            "totalfb": 0
        }
        # requests.post(url=METAURL, json=meta)


    def start_training(self, dataframe):
        # print(self.params)
        # for i, alg in enumerate(self.algs):
        #     if alg == "LSTM":
        #         lstm_model = MLLSTM(dataframe, dataframe.columns, self.session_id, self.model_IDs[i], self.params[alg], self.db_settings)
        #         self._train_futures[self.model_IDs[i]] = lstm_model.run()
        #     self._post_info(alg, self.model_IDs[i], self.params[alg], self.creator)

        # for future in self._train_futures.values():
        #     try:
        #         print(future.result())
        #     except Exception as e:
        #         print(future.cancelled())
        #         print(e)
        for i, alg in enumerate(self.algs):
            # if alg == "SemiSupervisedVAE" and self.semi_available is False:
            #     continue
            pkg = {
                "columns": list(dataframe.columns),
                "params": self.params[alg],
                "dbsettings": self.db_settings
            }
            t_dir = MLSESSIONDIR + str(self.session_id) + "/" + str(self.model_IDs[i])
            os.makedirs(t_dir)
            with open(t_dir + "/sessioninfo.json", 'w') as fp:
                json.dump(pkg, fp)
            cmd = " python3 ./mlhelpers/mlsession.py -t train -s " + str(self.session_id) + \
                " -m " + self.model_IDs[i] + " -a " + alg
            process = subprocess.Popen(cmd.split(), close_fds=True)
        #     if alg == "LSTM":
        #         lstm_model = MLLSTM(dataframe, self.input_columns, self.output_columns, self.session_id, self.model_IDs[i], self.params[alg], self.db_settings)
        #         self._train_futures[self.model_IDs[i]] = lstm_model.run()
            self._post_info(alg, self.model_IDs[i], self.params[alg], self.creator)



    def start_session(self):
        for i, alg in enumerate(self.algs):
            mid = uuid.uuid4()
            self.model_IDs.append(mid.hex)
        print("hello")
        self._query()
        df = self.preprocessor.preproc("df", self.sensor_names)
        print(len(df.values), "vals")
        if not os.path.isdir(MLSESSIONDIR):
            os.makedirs(MLSESSIONDIR)
        os.makedirs(MLSESSIONDIR + str(self.session_id))
        print(MLSESSIONDIR)
        df.to_csv(MLSESSIONDIR + str(self.session_id) + "/data.csv")
        self.start_training(df)
        

    def run(self):
        print("@@@@@")
        self._listen_for_kill_signal()
        self.start_session()

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



pof_experiments = {}


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


vae_experiments = {}


class VAEBayesian(kt.BayesianOptimization):
    def run_trial(self, trial, *args, **kwargs):
        # You can add additional HyperParameters for preprocessing and custom training loops
        # via overriding `run_trial`
        kwargs['batch_size'] = trial.hyperparameters.Choice('batch_size', AUTOML_BATCH_SIZES)
        kwargs['epochs'] = trial.hyperparameters.Choice('epochs', AUTOML_EPOCHS)
        super(VAEBayesian, self).run_trial(trial, *args, **kwargs)
        
    def on_trial_begin(self, trial):
        if self.logger:
            self.logger.register_trial(trial.trial_id, trial.get_state())
        self._display.on_trial_begin(self.oracle.get_trial(trial.trial_id))
        
        global vae_experiments
        trial_no = vae_experiments[self.project_name]["trial_no"]
        
        trial_no_temp = trial_no + 1
        t_time_temp = time.time()
        vae_experiments[self.project_name]["t_time"] = t_time_temp
        vae_experiments[self.project_name]["trial_no"] = trial_no_temp

        one_trial_temp = {}
        one_trial_temp["trialNo"] = trial_no_temp
        one_trial_temp["trialID"] = trial.trial_id
        one_trial_temp["hypers"] = trial.hyperparameters.values
        one_trial_temp["intermediates"] = []
        vae_experiments[self.project_name]["one_trial"] = one_trial_temp

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
        # requests.post(url=AUTOML_POST_TRIAL_URL, json={'experiment_name': exp, 'trial': change_nan(one_trial)})


class VAEAutoMLSession:
    def __init__(self, settings):
        self.db_settings = settings['dbSettings']
        self.sequence_length = settings['sequenceLength']
        self.alpha = settings['alpha']
        self.experiment_name = settings['ex_name']
        self.model_name = settings['modelName']
        
    def _builder(self, hp):
        latent_space_dim = hp.Int("latent_space_dim", min_value=16, max_value=32, step=4)
        lstm_layer_count = hp.Int("num_lstm_layers", 1, 3)
        lstm_node_counts = list()
        for i in range(lstm_layer_count):
            lstm_node_counts.append(hp.Int("num_lstm_nodes_{}".format(i), min_value=32, max_value=256, step=32))
            lstm_first_layer = hp.Int("num_lstm_first_layer_nodes", min_value=32, max_value=256, step=32)
            lstm_final_layer = hp.Int("num_lstm_final_layer_nodes", min_value=16, max_value=64, step=16)
            dense_node_counts = hp.Int("num_dense_layer", min_value=16, max_value=64, step=16)
            activation = hp.Choice("activation",  values=['tanh', 'relu'])

        model_input = Input(shape=(self.sequence_length, self.input_dim), name="encoder_input")
        enc = LSTM(lstm_first_layer, return_sequences=True, activation=activation)(model_input)
        for i in range(lstm_layer_count):
            postfix = i + 1
            enc = LSTM(units=lstm_node_counts[i], name="encoder_lstm_{}".format(postfix), activation=activation, return_sequences=True)(enc)
        enc = LSTM(lstm_final_layer, activation=activation, return_sequences=False)(enc)
        enc = Dense(dense_node_counts, activation=activation)(enc)
        mu = Dense(latent_space_dim, name="mu")(enc)
        log_var = Dense(latent_space_dim, name="log_variance")(enc)
        encoder_first = Model(model_input, [mu, log_var], name="encoder_first")
        enc_output = Lambda(sample_point_from_normal_distribution,
                        name="encoder_output")([mu, log_var])
        encoder = Model(model_input, enc_output, name="encoder")

        dec_input = Input(shape=(latent_space_dim,))
        dec = RepeatVector(self.sequence_length)(dec_input)
        dec = Dense(dense_node_counts, activation=activation)(dec)
        dec = LSTM(lstm_final_layer, activation=activation, return_sequences=True)(dec)
        for i in range(lstm_layer_count):
            postfix = i + 1
            dec = LSTM(units=lstm_node_counts[(lstm_layer_count - 1) - i], name="decoder_lstm_{}".format(postfix), activation=activation, return_sequences=True)(dec)
        dec = LSTM(lstm_first_layer, return_sequences=True, activation=activation)(dec)
        dec_output = TimeDistributed(Dense(units=self.input_dim))(dec)
        decoder = Model(dec_input, dec_output, name="decoder")

        model_output = decoder(encoder(model_input))
        vae = Model(model_input, model_output, name="autoencoder")
        vae.add_loss(vae_loss(model_input, model_output, log_var, mu, sequence_length=self.sequence_length, alpha=self.alpha))

        optimizer = Adam(hp.Choice("learning_rate", values=[1e-2, 1e-3, 1e-4]))
        vae.compile(loss=None, optimizer=optimizer)

        return vae

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

    def start(self):
        global vae_experiments
        vae_experiments[self.model_name] = {"one_trial": {"intermediates": []}, "t_time": time.time(), "trial_no": 0}

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
         self.input_dim, 
         self.output_dim, 
         self.vector_length,
         1,
         input_means, 
         input_stds, 
         output_means, 
         output_stds
        )
        #     train_windows, df, training_data, training_target, means, stds, cols = prepare_training_data("./train/", self.sequence_length, self.input_dim)
        #     windows, test_data, test_target = prepare_testing_data("./test/", self.sequence_length, cols, means, stds)
        tuner = VAEBayesian(self._builder, objective="val_loss", max_trials=100, directory="mlhelpers/experiments", project_name=self.experiment_name)
        callback = EarlyStopping(monitor='val_loss', patience=3)
        #     tuner.search_space_summary()
        tuner.search(np.asarray(X_train).astype('float32'), epochs=5,validation_split=0.05, callbacks=[callback])
        best_hp=tuner.get_best_hyperparameters()[0]
        model = tuner.hypermodel.build(best_hp)
        dir_name = VAEHPSDIR
        for sensor in self.sensor_names:
            dir_name = dir_name + sensor

        if not os.path.isdir(dir_name):
            os.mkdir(dir_name)
        
        with open(VAESENSORDIR + self.model_name + "_stats.json") as f:
            stats = {
                "means": input_means,
                "stds": input_stds,
                "sequenceLength": self.sequence_length
            }
            json.dump(stats, f)
        model.save(dir_name + self.model_name + '.h5')

    #     return best_hps
class FillNanValues:
    def __init__(self):
        pass

    def get_df_with_values(self, df, col_name, operation):
        if(operation == "avg"):
            return self.avg_last_five(df, col_name)
        elif(operation == "min"):
            return self.min_last_five(df, col_name)
        elif(operation == "max"):
            return self.max_last_five(df, col_name)
        elif(operation == "davg" or operation == "dmin" or operation == "dmax"):
            return self.last_five_diff(df, col_name, operation)
        else:
            return df.interpolate()

    def avg_last_five(self, df, col_name):
        # if first row is nan, change it to 0
        if(np.isnan(df[col_name][0])):
            df.loc[0, col_name] = 0

        new_col = df[col_name].fillna(df[col_name].rolling(5, min_periods=0).mean().shift())
        df[col_name] = new_col
        # just in case if any nan left
        df = df.fillna(0)
        return df
    
    def max_last_five(self, df, col_name):
        # if first row is nan, change it to 0
        if(np.isnan(df[col_name][0])):
            df.loc[0, col_name] = 0

        new_col = df[col_name].fillna(df[col_name].rolling(5, min_periods=0).max().shift())
        df[col_name] = new_col
        # just in case if any nan left
        df = df.fillna(0)
        return df

    def min_last_five(self, df, col_name):
        # if first row is nan, change it to 0
        if(np.isnan(df[col_name][0])):
            df.loc[0, col_name] = 0

        new_col = df[col_name].fillna(df[col_name].rolling(5, min_periods=0).min().shift())
        df[col_name] = new_col
        # just in case if any nan left
        df = df.fillna(0)
        return df
    
    def last_five_diff(self, df, col_name, operation):
        # check first row
        if(np.isnan(df[col_name][0])):
            print("diff_avg")
            df.loc[0, col_name] = 0
        # print(df[col_name].isna().tolist())
        rows_with_nan = [index for index, val in enumerate(df[col_name].isna().tolist()) if val]
        # print(rows_with_nan)
        for index in rows_with_nan:
            prevs = df.loc[index-5:index-1, col_name].tolist()
            # print(prevs)
            if(len(prevs)):
                diffs = []
                for i in range(0, len(prevs)-1):
                    diffs.append(abs(prevs[i+1] - prevs[i]))
                # print(diffs)
                if(operation == "davg"):
                    if(len(diffs)):
                        diff = sum(diffs)/(len(diffs))
                    else:
                        diff = -2
                    df.loc[index, col_name] = diff
                elif(operation == "dmin"):
                    if(len(diffs)):
                        min_val = min(diffs)
                    else:
                        min_val = -3
                    df.loc[index, col_name] = min_val
                elif(operation == "dmax"):
                    if(len(diffs)):
                        max_val = max(diffs)
                    else:
                        max_val = -4
                    df.loc[index, col_name] = max_val
            else:
                df.loc[index, col_name] = -1
            # print(operation)
        return df

class TESTimport:
    def __init__(self):
        pass
    def import_test(self):  
        print("pof test", BASICURL)

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
        self.queryHelper = POFQueryHelper({"host": host_ip, "port": influx_port, "database": self.database})
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
    
    def generate_features(self, dframe, index, new_id, n_index):
        dframe["index"] = dframe.index
        es = ft.EntitySet(id = 'index')

        # adding a dataframe 
        es.entity_from_dataframe(entity_id = 'pof', dataframe = dframe, index = index)

        es.normalize_entity(base_entity_id='pof', new_entity_id=new_id, index = n_index)

        feature_matrix, feature_names = ft.dfs(entityset=es, 
            target_entity = 'pof', max_depth = 2, verbose = 1)

        print(feature_matrix.head())

        print(feature_matrix.columns)
        return feature_matrix, feature_names
    
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
                        max_epochs=max_epochs, 
                        factor=3,
                        directory='mlhelpers/experiments',
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
                        max_trials=max_trials,
                        executions_per_trial=executions_per_trial,
                        directory='mlhelpers/experiments',
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
                        max_trials=max_trials,
                        executions_per_trial=executions_per_trial,
                        directory='mlhelpers/experiments',
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

        log_file = "mlhelpers/progress-logs/" + self.model_name + "-" + self.username + ".txt"

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
                            if("defval" in sensor_info):
                                influx, dval = return_default_value(sensor_info["defval"])
                            else:
                               influx, dval = (True, 0) 
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
                        if("defval" in sensor_info):
                            influx, dval = return_default_value(sensor_info["defval"])
                        else:
                            influx, dval = (True, 0) 
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
                    if("defval" in sensor_info):
                        influx, dval = return_default_value(sensor_info["defval"])
                    else:
                        influx, dval = (True, 0) 
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


def return_default_value(val):
    if(val == TICK_SETTINGS["LAST"]):
        return (True, "previous")
    elif(val == TICK_SETTINGS["AVG"]):
        return (False, "avg")
    elif(val == TICK_SETTINGS["MAX"]):
        return (False, "max")
    elif(val == TICK_SETTINGS["MIN"]):
        return (False, "min")
    elif(val == TICK_SETTINGS["DAVG"]):
        return (False, "difference_avg")
    elif(val == TICK_SETTINGS["DMAX"]):
        return (False, "difference_max")
    elif(val == TICK_SETTINGS["DMIN"]):
        return (False, "difference_min")
    elif(val == "undefined"):
        return (True, 0)
    else:
        try:
            n = float(val)
        except ValueError:
            print("value is not numeric")
            n = 0
        return (True, n)

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
        requests.post(url=AUTOML_POST_TRIAL_URL, json={'experiment_name': exp, 'trial': change_nan_pof(one_trial)})


            
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
        try:
            self.start_time = '%d' % (time.mktime(datetime.datetime.strptime(settings['startTime'], "%Y-%m-%dT%H:%M").timetuple()) * 1000000000)
            self.end_time = '%d' % (time.mktime(datetime.datetime.strptime(settings['endTime'], "%Y-%m-%dT%H:%M").timetuple()) * 1000000000)
        except:
            start = datetime.date.today() - datetime.timedelta(days=7)
            self.start_time = '%d' % (time.mktime(datetime.datetime.strptime(start.strftime('%Y-%m-%d-%H:%M:%S'), '%Y-%m-%d-%H:%M:%S').timetuple()) * 1000000000)
            self.end_time = '%d' % (time.mktime(datetime.datetime.strptime(datetime.datetime.today().strftime('%Y-%m-%d-%H:%M:%S'), '%Y-%m-%d-%H:%M:%S').timetuple()) * 1000000000)
        try:
            self.measurement_sensor_dict = settings['sensors']
        except:
            self.measurement_sensor_dict = {
                "Input": {
                    "Bendingsword": ["Act_force_cyl.act_force_diff_cyl_1"]
                },
                "Output": {
                    "Bendingsword": ["Act_force_cyl.act_force_diff_cyl_1"]
                }
            }
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
        self.model_ID = uuid.uuid4().hex
        self.session_ID = settings['sessionID']
        self.input_columns = []
        self.output_columns = []
        self.sequence_length = 25


    def _builder(self, hp):
        
        lstm_first_layer = hp.Int("num_lstm_first_layer_nodes", min_value=32, max_value=64, step=32)
        dense_node_counts = hp.Int("num_dense_layer", min_value=16, max_value=64, step=16)
        activation = hp.Choice("activation",  values=['tanh', 'relu'])

        model_input = Input(shape=(self.sequence_length, len(self.input_columns)), name="encoder_input")
        model = LSTM(lstm_first_layer, return_sequences=True, activation=activation)(model_input)
        model = LSTM(lstm_first_layer, return_sequences=True, activation=activation)(model)
        model = LSTM(lstm_first_layer, activation=activation)(model)
        model = Dense(dense_node_counts, activation=activation)(model)
        model_output = Dense(len(self.output_columns))(model)
        final_model = Model(model_input, model_output, name="lstm_anomaly_detector")

        optimizer = Adam(hp.Choice("learning_rate", values=[1e-2, 1e-3, 1e-4]))
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
            self.influx_helper = QueryHelper(self.db_settings)
        return self.influx_helper


    @property
    def preprocessor(self):
        if self.preprocess_helper == None:
            self.preprocess_helper = MLPreprocessor(self.raw_data)
        return self.preprocess_helper


    def post_info(self):
        pkg = {
            "Algorithm": "Undecided",
            "modelName": self.model_name,
            "modelID": self.model_ID,
            "settings": {
                "host": self.db_settings['host'],
                "port": self.db_settings['port'],
                "rp": self.db_settings['rp'],
                "db": self.db_settings['db']
            },
            "username": self.creator,
            "sessionID": "auto" + str(self.session_ID)
        }

        requests.post(url=BASICURL, json=pkg)


        
    def run(self):
        self.post_info()
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
        tuner = ADBayesian(self._builder, objective="val_loss", max_trials=100, directory="experiments", project_name=self.experiment_name)
        callback = EarlyStopping(monitor='val_loss', patience=3)
    #     tuner.search_space_summary()
        tuner.search(np.asarray(X_train).astype('float32'), np.asarray(y_train).astype('float32'), epochs=5,validation_split=0.05, callbacks=[callback])
        best_hp=tuner.get_best_hyperparameters()[0]
        model = tuner.hypermodel.build(best_hp)

        log_file = "mlhelpers/progress-logs/" + self.model_name + "-" + self.creator + ".txt"

        model.fit(np.asarray(X_train).astype('float32'), np.asarray(y_train).astype('float32'), epochs=best_hp.get('epochs'), batch_size=best_hp.get('batch_size'), validation_split=0.2, verbose=1,
                callbacks = [LoggingCallback(log_file, self.nepochs)])

        dir_name = ADHPSDIR + self.session_id

        if not os.path.isdir(dir_name):
            os.mkdir(dir_name)
        
        if not os.path.isdir(ADSENSORDIR + self.session_id):
            os.mkdir(ADSENSORDIR + self.session_id)

        with open(ADSENSORDIR + self.session_id + "/" + self.model_name + "_stats.json") as f:
            stats = {
                "means": input_means,
                "stds": input_stds,
                "sequenceLength": self.sequence_length
            }
            json.dump(stats, f)
        model.save(dir_name + self.model_name + '.h5')

        obj = {
            "Directory": ADSENSORDIR + self.session_id + "/",
            "Optional": {
                "VectorLength": self.sequence_length,
                "InputMeans": input_means,
                "InputStds": input_stds,
                "OutputMeans": output_means,
                "OutputStds": output_stds
            },
            "InputColumns": self.input_columns,
            "OutputColumns": self.output_columns
        }

        requests.put(url=PUTBASICURL + self.model_ID, json=obj)



class ADClustererSession:
    def __init__(self, settings):
        self.db_settings = {
            # 'host':INFLUXDB_CLIENT['URL'].split(":")[0] + ":" + INFLUXDB_CLIENT['URL'].split(":")[1],
            # 'port':INFLUXDB_CLIENT['URL'].split(":")[2],
            # 'host': "https://vmi1011403.contaboserver.net",
            'host': "https://vmi474601.contaboserver.net",
            'port': 8080,
            # 'db': settings['fields'][0]['database'],
            'db': "ErmetalClone2",
            'rp': "autogen"
        }
        self.model_name = settings['modelName']
        self.session_id = str(settings['sessionID'])
        self.end_date = settings['sessionID']

        self.sample_size = 30
        self.prev_hours = 1

        self.m2s = {}

        for field in settings['fields']:
            if field['measurement'] not in self.m2s.keys():
                self.m2s[field['measurement']] = list()
            self.m2s[field['measurement']].append(field['dataSource'])

    def run(self):
        model = MLHDBSCAN(self.db_settings, self.prev_hours, self.end_date, self.sample_size,
                            self.model_name, self.session_id, self.m2s)
        print("wrappers done")
        model.run()


class RULAutoMLSession:
    def __init__(self, settings):
        super().__init__()
        self.timeout = settings['timeout']
        self.nfeatures = settings['nfeatures']
        self.nepochs = int(settings['nepochs'])
        self.creator = settings['username']
        self.experiment_name = settings['modelName']
        self.model_name = settings["modelName"]
        self.db_settings = settings['dbSettings']
        self.start_time = settings['startTime']
        self.end_time = ""
        # self.measurement_sensor_dict = settings['sensors']
        self.part_name = settings["partName"]
        self.type = settings["type"]
        self.database = settings["database"]
        self.measurement = settings["measurement"]
        self.field = settings["field"]

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
        self.optimizer = settings["optimizer"]

        """ if(settings["optimizer"] in optimizers2): # check if db has valid optimizer name
            self.optimizer_settings = optimizers2[settings["optimizer"]]
            self.optimizer_name = settings["optimizer"]
        else:
            self.optimizer_settings = optimizers2["default"]
            self.optimizer_name = "val_accuracy" """

        if(settings["optimizer"] in AUTOML_OPTIMIZERS): # check if db has valid optimizer name
            self.optimizer_settings = AUTOML_OPTIMIZERS[settings["optimizer"]]
            self.optimizer_name = settings["optimizer"]
        else:
            self.optimizer_settings = AUTOML_OPTIMIZERS["default"]
            self.optimizer_name = "val_accuracy"

        self.influx_helper = None
        self.queryHelper = POFQueryHelper({"host": host_ip, "port": influx_port, "database": self.database})
        self.preprocess_helper = None
        self.model_ID = uuid.uuid4().hex
        self.session_ID = settings['sessionID']
        self.input_columns = []
        self.output_columns = []
        # self.sequence_length = 50

    def test(self):
        print(tf.__version__)
        print(self.optimizer_settings)

    def influx_client(self):
        if self.influx_helper == None:
            self.influx_helper = QueryHelper(self.db_settings)
        return self.influx_helper


    def preprocessor(self):
        if self.preprocess_helper == None:
            self.preprocess_helper = MLPreprocessor(self.raw_data)
        return self.preprocess_helper

    # function to reshape features into (samples, time steps, features) 
    def gen_sequence(self, all_df, seq_length, seq_cols):
        """ Only sequences that meet the window-length are considered, no padding is used. This means for testing
        we need to drop those which are below the window-length. An alternative would be to pad sequences so that
        we can use shorter ones """
        data_array = all_df[seq_cols].values
        num_elements = data_array.shape[0]
        for start, stop in zip(range(0, num_elements-seq_length), range(seq_length, num_elements)):
            yield data_array[start:stop, :]


    # function to generate labels
    def gen_labels(self, all_df, seq_length, label):
        data_array = all_df[label].values
        num_elements = data_array.shape[0]
        return data_array[seq_length:num_elements, :]



    def get_error_distribution_stats(self, model, X_train, y_train, out_means, out_stds, input_dims):
        i = 0
        relative_error_dict = {}
        error_mean_dict = {}
        error_std_dict = {}
        for col in self.output_columns:
            relative_error_dict[col] = list()

        for i, sample in enumerate(X_train):
            predictions = model.predict(sample.reshape(1, RUL_SEQUENCE_LENGTH, input_dims))
            inverse_transform_output(predictions, out_means, out_stds)

            for j, pred in enumerate(predictions):
                relative_error = (y_train[i][j] / pred) - 1
                relative_error_dict[self.output_columns[j]].append(relative_error.item(0))


        for col in self.output_columns:
            try:
                error_mean = statistics.mean(relative_error_dict[col])
                error_std = statistics.stdev(relative_error_dict[col])
            except:
                error_mean = None
                error_std = None
            error_mean_dict[col] = error_mean
            error_std_dict[col] = error_std

        return error_mean_dict, error_std_dict


    def build_test_model(self, seq_array, label_array, seq_len, features):
        settings = {
            "tunerType": self.tuner_type,
            "nfeatures": self.nfeatures,
            "nepochs": self.nepochs, 
            "optimizer": self.optimizer_name
        }
        experiment = {
            "experiment_name": self.experiment_name, 
            'experimentStatus': "RUNNING", 
            "experiment_job": "rul",
            "owner": self.creator, 
            "timeout": self.timeout, 
            "settings": settings,
            "features": features, 
            "uploadTime": self.start_time,
            "trials": [],
        }
        print(experiment)
        # requests.post(url=AUTOML_POST_EXPERIMENT_URL , json=experiment)
        nb_features = seq_array.shape[2]
        nb_out = label_array.shape[1]

        model = Sequential()

        model.add(LSTM(
                input_shape=(seq_len, nb_features),
                units=100,
                return_sequences=True))
        model.add(Dropout(0.2))

        model.add(LSTM(
                units=50,
                return_sequences=False))
        model.add(Dropout(0.2))

        model.add(Dense(units=nb_out, activation='sigmoid'))
        model.compile(loss='binary_crossentropy', optimizer=tf.keras.optimizers.Adam(), metrics=self.optimizer_settings["compile"])

        print(model.summary())
        print("---------")

        stop_early = tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=5)
        

        model.fit(seq_array, label_array, epochs=10, validation_split=0.2, verbose=2, callbacks=[stop_early])
        print(model.summary())

        eval_result = model.evaluate(seq_array, label_array)
        print(model.metrics_names, "--", eval_result)
        """ if(np.isnan(eval_result).any()):
            eval_result = None """

        y_pred = model.predict(seq_array,verbose=1, batch_size=100)
        y_pred = (y_pred > 0.5).astype("int32")
        y_true = label_array
        print(y_pred)

        precision = precision_score(y_true, y_pred)
        recall = recall_score(y_true, y_pred)
        print(precision, recall)

    def start_tuning(self, seq_array, label_array, seq_len, features, train_df):
        start_rul_automl_experiment(self.experiment_name)
        settings = {
            "tunerType": self.tuner_type,
            "nfeatures": self.nfeatures,
            "nepochs": self.nepochs, 
            "optimizer": self.optimizer_name
        }
        experiment = {
            "experiment_name": self.experiment_name, 
            'experimentStatus': "RUNNING", 
            "experiment_job": "rul",
            "owner": self.creator, 
            "timeout": self.timeout, 
            "settings": settings,
            "features": features, 
            "uploadTime": self.start_time,
            "trials": [],
        }
        print(experiment)
        # TODO:
        requests.post(url=AUTOML_POST_EXPERIMENT_URL , json=experiment)
        
        model_builder = RULModelBuilder(sequence_length=seq_len, seq_array=seq_array, label_array=label_array, optimizers=self.optimizer_settings["compile"])
        
        if self.tuner_type == "hyperband":
            tuner =  RULHyperband(
                        seq_array=seq_array,
                        train_df=train_df,
                        seq_len=seq_len,
                        hypermodel=model_builder,  
                        objective=self.optimizer_settings["objective"],
                        max_epochs=max_epochs, 
                        factor=3,
                        directory='mlhelpers/experiments',
                        project_name=self.experiment_name,
                        overwrite=True)
            print("hyperband", tuner)
        elif self.tuner_type == "random":
            tuner = RULRandomSearch(
                        seq_array=seq_array,
                        train_df=train_df,
                        seq_len=seq_len,
                        hypermodel=model_builder,
                        objective=self.optimizer_settings["objective"],
                        seed=1,
                        max_trials=max_trials,
                        executions_per_trial=executions_per_trial,
                        directory='mlhelpers/experiments',
                        project_name=self.experiment_name,
                        overwrite=True)
            print("random", tuner)
        elif self.tuner_type == "bayesian":
            tuner = RULBayesianOptimization(
                            seq_array=seq_array,
                            train_df=train_df,
                            seq_len=seq_len,
                            hypermodel=model_builder,
                            objective=self.optimizer_settings["objective"],
                            max_trials=max_trials,
                            executions_per_trial=executions_per_trial,
                            directory='mlhelpers/experiments',
                            project_name=self.experiment_name,
                            overwrite=True)
            print("bayesian", tuner)
        
        stop_early = tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=5)

        int_callback = RULReportIntermediates(self.experiment_name) 

        tuner.search(seq_array, label_array, epochs=self.nepochs, validation_split=0.2, callbacks=[stop_early, int_callback])

        requests.put(url=AUTOML_CHANGE_STATUS_URL , json={'experiment_name': self.model_name})

        best_hps=tuner.get_best_hyperparameters(num_trials=1)[0]
        model = tuner.hypermodel.build(best_hps)

        

        model = tuner.hypermodel.build(best_hps)
        history = model.fit(seq_array, label_array, epochs=best_hps.get('epochs'), batch_size=50, validation_split=0.2, verbose=1)

        val_acc_per_epoch = history.history['val_acc']
        best_epoch = val_acc_per_epoch.index(max(val_acc_per_epoch)) + 1
        print('Best epoch: ',best_epoch)
        hypermodel = tuner.hypermodel.build(best_hps)

        # Retrain the model
        log_file = "mlhelpers/progress-logs/" + self.model_name + "-" + self.creator + ".txt"

        hypermodel.fit(seq_array, label_array, epochs=best_epoch, batch_size=50, validation_split=0.2, verbose=1,
                callbacks = [LoggingCallback(log_file, self.nepochs)])
        
        # test on train data
        eval_result = hypermodel.evaluate(seq_array, label_array)
        print(hypermodel.metrics_names, "--", eval_result)
        """ if(np.isnan(eval_result).any()):
            eval_result = None """

        y_pred = hypermodel.predict(seq_array,verbose=1, batch_size=100)
        y_pred = (y_pred > 0.5).astype("int32")
        y_true = label_array

        precision = precision_score(y_true, y_pred)
        recall = recall_score(y_true, y_pred)

        if not os.path.isdir(MODELDIR):
            os.mkdir(MODELDIR)

        t_dir = MODELDIR + self.model_ID + "/"
        print(precision, recall)
        os.mkdir(t_dir)

        hypermodel.save(MODELDIR + self.model_ID + "/model.h5", save_format='h5') 

        pkg =  {"experiment_name": self.model_name, "metric_name": hypermodel.metrics_names, "metric_value": eval_result, "end_time": time.time(),
            "accuracy": eval_result[1], "precision": precision, "recall": recall}  # "job": {"job": "", "jobOn": "", "pfDays": ""}

        requests.put(url=AUTOML_UPDATE_EXPERIMENT_URL, json=json.dumps(pkg, default=numpy_converter))

        obj = {
            "Directory": t_dir,
            "Optional": {
                "VectorLength": seq_len,
            }
        }

        requests.put(url=PUTBASICURL + self.model_ID, json=obj)

        if os.path.exists(log_file):
            time.sleep(5)
            os.remove(log_file)
    
    def prepare_data(self):
        obj = {
            "Algorithm": "LSTM",
            "modelID": self.model_ID,
            "sessionID": "auto" + str(self.session_ID),
            "Settings": self.db_settings,
            "username": self.creator,
            "modelName": self.model_name,
            "hardware": self.part_name
        }
        print(obj)
        requests.post(url=BASICURL, json=obj)

        res = requests.get(url=GETFAILURESURL + self.part_name).json()
        failures = []
        for failure in res:
            failure["failureStartTime"] = parser.parse(failure["failureStartTime"][0:16])
            failures.append(failure)

        failures.sort(key=lambda r: r["failureStartTime"]) 
        print("test", self.db_settings)
        pd_data = []
        for fail in failures:
            one_fail_data = []
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
                # machine = db so get component = measurement names
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
                            if("defval" in sensor_info):
                                influx, dval = return_default_value(sensor_info["defval"])
                            else:
                               influx, dval = (True, 0) 
                        else:
                            influx, dval = (True, 0)

                        
                        if(influx):
                            data_points = []                         
                            query = 'SELECT mean("{}") AS "mean_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h) fill({})'.format( 
                                field, field, self.database, name, duration_start_date, duration_end_date, dval)
                            
                            results = self.queryHelper.queryDB(query)

                            for point in results.get_points():
                                data_point = {}
                                for i,key in enumerate(point.keys()):
                                    if(key=="time"):
                                        data_point["time"] = point["time"]
                                    else:
                                        # component name + mean_sensor name
                                        key_pd = name + "." + key
                                        data_point[key_pd] = point[key]
                                data_points.append(data_point)
                        
                        else:
                            data_points = []
                            query = 'SELECT mean("{}") AS "mean_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h)'.format( 
                                field, field, self.database, name, duration_start_date, duration_end_date)

                            results = self.queryHelper.queryDB(query)

                            field_name = name
                            for point in results.get_points():
                                data_point = {}
                                for i,key in enumerate(point.keys()):
                                    if(key=="time"):
                                        data_point["time"] = point["time"]
                                    else:
                                        # component name + mean_sensor name
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
                cycle = 1
                for i in range(len(one_merged["time"])):
                    one_merged["time"][i] = cycle
                    cycle += 1

                one_fail_data = one_fail_data + one_merged.to_dict("records")
            
            elif(self.type == "component"):
                # get component = measurement's all sensors = fields
                fields = []
                fields_query = 'SHOW FIELD KEYS ON "{}" FROM "{}"'.format(self.database, self.measurement)
                fields_results = self.queryHelper.queryDB(fields_query)

                for point in fields_results.get_points():
                    fields.append(point["fieldKey"])
                
                all_data = []
                for field in fields:
                    sensor_info = requests.get(url=GETSENSORFROMMAPPING + field).json()
                    if(sensor_info):
                        if("defval" in sensor_info):
                            influx, dval = return_default_value(sensor_info["defval"])
                        else:
                            influx, dval = (True, 0) 
                    else:
                        influx, dval = (True, 0)

                    
                    if(influx):
                        data_points = []                         
                        query = 'SELECT mean("{}") AS "mean_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h) fill({})'.format( 
                            field, field, self.database, self.measurement, duration_start_date, duration_end_date, dval)
                        
                        results = self.queryHelper.queryDB(query)

                        for point in results.get_points():
                            data_points.append(point)
                    
                    else:
                        data_points = []
                        query = 'SELECT mean("{}") AS "mean_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h)'.format( 
                            field, field, self.database, self.measurement, duration_start_date, duration_end_date)

                        results = self.queryHelper.queryDB(query)

                        field_name = "mean" + "_" + field
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
                cycle = 1
                for i in range(len(one_merged["time"])):
                    one_merged["time"][i] = cycle
                    cycle += 1

                one_fail_data = one_fail_data + one_merged.to_dict("records")
            
            elif(self.type == "sensor"):
                sensor_info = requests.get(url=GETSENSORFROMMAPPING + self.field).json()
                if(sensor_info):
                    if("defval" in sensor_info):
                        influx, dval = return_default_value(sensor_info["defval"])
                    else:
                        influx, dval = (True, 0) 
                else:
                    influx, dval = (True, 0)
                
                if(influx):
                    data_points = []                         
                    # query = 'SELECT mean("{}") AS "mean_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h) fill({})'.format( 
                    #     self.field, self.field, self.database, self.measurement, duration_start_date, duration_end_date, dval)
                    duration_start_date = '%d' % time.mktime(datetime.datetime.strptime(duration_start_date.strftime("%Y-%m-%d %H:%M:%S"), "%Y-%m-%d %H:%M:%S").timetuple())
                    duration_end_date = '%d' % time.mktime(datetime.datetime.strptime(duration_end_date.strftime("%Y-%m-%d %H:%M:%S"), "%Y-%m-%d %H:%M:%S").timetuple())
                    query = 'from(bucket: "{}")\
                        |> range(start: {}, stop: {})\
                        |> filter(fn: (r) => r._measurement == "{}")\
                        |> filter(fn: (r) => r._field == "{}")\
                        |> aggregateWindow(every: 1h, fn: {})'.format(
                            self.database,
                            duration_start_date,
                            duration_end_date,
                            self.measurement,
                            self.field,
                            "max"
                            # self.groupwith
                    )
                    
                    results = self.queryHelper.queryDB(query)

                    cycle = 1
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
                    query = 'SELECT mean("{}") AS "mean_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h)'.format(
                        self.field, self.field, self.database, self.measurement, duration_start_date, duration_end_date)

                    results = self.queryHelper.queryDB(query)

                    field_name = "mean_" + self.field
                    cycle = 1
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

                one_fail_data = one_fail_data + data_points

            else:
                # query = 'SELECT {}("{}") FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(1h)'.format(self.groupwith, self.field, self.database, self.measurement, duration_start_date, duration_end_date)
                no_query = "Please select type as 'machine','component' or 'sensor'"
                print(no_query)

            pd_data.append(one_fail_data)
        

        print(self.type)
        frames = []
        fid = 1
        seq_len = RUL_SEQUENCE_LENGTH
        for d in pd_data:
            pidf = pd.DataFrame(d)

            max_time = pidf['time'].max()

            pidf['RUL'] = max_time - pidf['time']

            w1 = 30

            pidf['label1'] = np.where(pidf['RUL'] <= w1, 1, 0 )

            # MinMax normalization
            pidf['time_norm'] = pidf['time']
            pidf["id"] = fid
            fid += 1
            cols_normalize = pidf.columns.difference(['id', 'time','RUL','label1'])
            min_max_scaler = preprocessing.MinMaxScaler()
            norm_pidf = pd.DataFrame(min_max_scaler.fit_transform(pidf[cols_normalize]), 
                                        columns=cols_normalize)
            join_df = pidf[pidf.columns.difference(cols_normalize)].join(norm_pidf)
            pidf = join_df.reindex(columns = pidf.columns)

            seq_len = min(seq_len, pidf.shape[0])
            frames.append(pidf)
            # print(pidf)

        result = pd.concat(frames).reset_index() 
        result.drop('index', axis=1, inplace=True)
        # print(result.tail(195))
        print(result.shape)

        """ with open('/root/BackUp_Pianism/pianism/custom-ml/server/rul_output_machine.txt', 'w') as writefile:
                writefile.write(result.to_string()) """

        # pick the feature columns 
        sensor_cols = result.columns.values.tolist()
        sensor_cols.remove("time")
        sensor_cols.remove("RUL")
        sensor_cols.remove("label1")
        sensor_cols.remove("id")
        print(sensor_cols)

        seq_len = seq_len - 1

        seq_gen = (list(self.gen_sequence(result[result['id']==fid], seq_len, sensor_cols)) 
           for fid in result['id'].unique())

        # generate sequences and convert to numpy array
        seq_array = np.concatenate(list(seq_gen)).astype(np.float32)

        # print(seq_array)

        # generate labels
        label_gen = [self.gen_labels(result[result['id']==id], seq_len, ['label1']) 
             for id in result['id'].unique()]
        label_array = np.concatenate(label_gen).astype(np.float32)
        # print(label_array[210:260])
        print(label_array.shape)

        self.start_tuning(seq_array=seq_array, label_array=label_array, seq_len=seq_len, features=sensor_cols, train_df=result)
        
    def run(self):
        print(self.part_name, self.type)
        self.prepare_data()
        


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


class KafkaHelper:
    def __init__(self, kafka_version, kafka_servers, window_size, data_queue, delay=0):
        self.kafka_version = kafka_version
        self.kafka_servers = kafka_servers
        self.data = {}
        self.message_queue = queue.Queue()
        self.window_size = window_size
        self.data_queue = data_queue
        self.delay = delay

        self.kafka_consumer = None
        self.topics = None
        self.measurement_sensor_dict = None
        self.sensors = None
        # self.consumers = []


    def set_topics(self, measurement_sensor_dict):
        self.measurement_sensor_dict = measurement_sensor_dict
        self.topics = list(measurement_sensor_dict.keys())
        self.sensors = [item for sublist in list(self.measurement_sensor_dict.values()) for item in sublist]


    def round_unix_date(self, dt_series, ms=1000, up=False):
        return dt_series // ms * ms + ms * up


    def arrange_data(self):
        while True:
            message = self.message_queue.get()
            sensor_values = message.value.split(" ")[1].split(',')
            timestamp = self.round_unix_date(message.timestamp)
            try:
                for val in sensor_values:
                    if val.split("=")[0] in self.sensors:
                        self.data[timestamp][self.sensors.index(val.split("=")[0])] = float(val.split("=")[1])
            except:
                self.data[timestamp] = [None] * len(self.sensors)

                for val in sensor_values:
                    if val.split("=")[0] in self.sensors:
                        self.data[timestamp][self.sensors.index(val.split("=")[0])] = float(val.split("=")[1])

            if len(self.data.keys()) == self.window_size + self.delay:
                dict1 = OrderedDict(sorted(self.data.items()))
                self.data_queue.put(list(dict1.values())[:self.window_size])
                del dict1[list(dict1.keys())[0]]
                self.data = dict1

        # print(self.data)
        # if sum(x is not None for x in self.data[timestamp]) == 0:
        #     print(self.data)


    def consume(self):
        t = threading.Thread(target=self.arrange_data)
        t.start()
        while True:
            # poll messages each certain ms
            raw_messages = self.consumer.poll(
                timeout_ms=1000
            )
            # for each messages batch
            for _, messages in raw_messages.items():
                self.message_queue.put(messages[0])
        t.join()

    @property
    def consumer(self):
        if self.kafka_consumer is None:
            self.kafka_consumer = KafkaConsumer(
                bootstrap_servers=self.kafka_servers,
                auto_offset_reset='latest',
                enable_auto_commit=True,
                api_version=self.kafka_version,
                value_deserializer=lambda x: x.decode('utf-8')
            )
            self.kafka_consumer.subscribe(self.topics)

        return self.kafka_consumer
        
    
        

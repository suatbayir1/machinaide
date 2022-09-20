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
tf.compat.v1.enable_eager_execution()
# tf.compat.v1.disable_v2_behavior()


from config import (
    ADHPSDIR,
    ADSENSORDIR,
    CELLURL,
    METAURL,
    BASICURL,
    PUTBASICURL,
    MODELDIR,
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
from mlhelpers.mlutils import QueryHelper, POFQueryHelper, MLPreprocessor
# from mlarima import MLARIMA
# from mlkmeans import MLKMEANS
# from mliforest import MLIFOREST
# from mlmahalanobis import MLMAHALANOBIS
from mlhelpers.mllstm import MLLSTM, LSTMRunner
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

import featuretools as ft
# from nni.algorithms.feature_engineering.gradient_selector import FeatureGradientSelector
import keras_tuner as kt
np.random.seed(1234)  
PYTHONHASHSEED = 0
from sklearn import preprocessing
from tensorflow import keras


# hyper_manager = KerasHyperManager()
# hyper_manager.start()


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
        self.types = settings['types']
        self.session_id = settings['sessionID']
        self.creator = settings['creator']
        self.db_settings = settings['dbSettings']
        self.start_time = '%d' % (time.mktime(datetime.datetime.strptime(settings['startTime'], "%Y-%m-%dT%H:%M").timetuple()))
        self.end_time = '%d' % (time.mktime(datetime.datetime.strptime(settings['endTime'], "%Y-%m-%dT%H:%M").timetuple()))
        self.measurement_sensor_dict = settings['sensors']
        self.kill_sig_queue = kill_sig_queue

        self.influx_helper = None
        self.preprocess_helper = None
        self._train_futures = {}
        self.model_IDs = []
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
        requests.post(url=CELLURL, json=pkg)

        meta = {
            "modelID": model_id,
            "creator": creator,
            "createdDate": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "relatedHardware": ["act_force_diff_cyl_1"],
            "totalfb": 0
        }
        requests.post(url=METAURL, json=meta)


    def start_training(self, dataframe):
        print(self.params)
        for i, alg in enumerate(self.algs):
            if alg == "LSTM":
                lstm_model = MLLSTM(dataframe, self.input_columns, self.output_columns, self.session_id, self.model_IDs[i], self.params[alg], self.db_settings)
                self._train_futures[self.model_IDs[i]] = lstm_model.run()
            self._post_info(alg, self.model_IDs[i], self.params[alg], self.creator)

        for future in self._train_futures.values():
            try:
                print(future.result())
            except Exception as e:
                print(future.cancelled())
                print(e)


    def start_session(self):
        for i, alg in enumerate(self.algs):
            mid = uuid.uuid4()
            self.model_IDs.append(mid.hex)

        self._query()
        df = self.preprocessor.preproc("df", self.sensor_names)
        self.start_training(df)
        

    def run(self):
        self._listen_for_kill_signal()
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


    
        

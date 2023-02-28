# from pebble import concurrent
import tensorflow as tf
from tensorflow.keras.models import load_model, Sequential
from tensorflow.keras.layers import Conv2D, Dropout, Flatten, Dense
from tensorflow.keras.callbacks import EarlyStopping, LearningRateScheduler
import numpy as np
import requests
from pebble import concurrent
from mlhelpers.mlutils import QueryHelper, MLPreprocessor
import time
from config import UPDATEBASICROW



def lr_scheduler(epoch, lr):
    if epoch < 200:
        return lr
    else:
        return 0.0001

def make_model(window_length, neurons):
    optimizer = tf.keras.optimizers.Adam(0.001)
    model = Sequential()
    model.add(Conv2D(10, (10, 1), padding='same', activation='tanh', input_shape=(window_length,neurons,1)))
    model.add(Conv2D(10, (10, 1), padding='same', activation='tanh'))
    model.add(Conv2D(10, (10, 1), padding='same', activation='tanh'))
    model.add(Conv2D(10, (10, 1), padding='same', activation='tanh'))
    model.add(Conv2D(1, (3, 1), padding='same', activation='tanh'))
    model.add(Dropout(0.5))
    model.add(Flatten())
    model.add(Dense(100, activation='tanh'))
    model.add(Dense(1))
    model.compile(optimizer=optimizer, loss='mse', metrics=[tf.keras.metrics.RootMeanSquaredError()])
    
    return model


class CNN:
    def __init__(self, settings):
        #load model
        self.window_size = settings['window_size']
        self.feature_count = settings['feature_count']
        self.modelID = settings['modelID']
        self.m2s = settings['measurementToSensors']
        self.db_settings = settings['dbSettings']
        if settings['path'] is not None:
            self.model = load_model(settings['path'])
        else:
            self.model = make_model(self.window_size, self.feature_count)
        
    def _update_cell(self, update_pkg):
        requests.post(url=UPDATEBASICROW, json=update_pkg)
        print("updated")

    def _create_sequences_and_targets(self, trajectory, sequence_length):
        sequences = list()
        targets = list()
        for i in range(len(trajectory)):
            sequence = trajectory[trajectory.columns[1:]][i: sequence_length + i]
            if len(sequence) != sequence_length:
                break
            t_cycle = max(trajectory["cycle"][i: sequence_length + i])
            cycle = len(trajectory) - t_cycle
            sequences.append(sequence)
            targets.append(cycle)

        return np.array(sequences), np.array(targets)

    def _prepare_detection_data(self):
        raw_data, field_names = self.influx_client.query_now(self.m2s, "now() - 30s")
        X = []
        try:
            for point in raw_data:
                x = []
                for field in field_names:
                    x.append(point['values'][field])
                X.append(x)
              
            self.apply_default_values(X, len(field_names))
        except:
            print("except")
            
        return np.array(X)


    @concurrent.process
    def train(self, data, path):
        X_train, y_train = self._create_sequences_and_targets(data, self.window_size)
        y_train = y_train.reshape(y_train.shape[0], 1)
        X_train = X_train.reshape(X_train.shape[0], X_train.shape[1], X_train.shape[2], 1)
        es = EarlyStopping(monitor='loss', patience=10, verbose=0)
        lr = LearningRateScheduler(lr_scheduler, verbose=0)

        self.model.fit(X_train, y_train, epochs=250, batch_size=512, callbacks=[es, lr],verbose=0)
        self.model.save(path)
        self._update_cell({"status": "idle", "modelID": self.modelID, "measurementToSensors": self.m2s, "dbSettings": self.db_settings, "path": path, "window_size": self.window_size, "feature_count": self.feature_count})

    
    @concurrent.process
    def run(self):
        self.influx_client = QueryHelper(self.db_settings)
        cycle = 0
        while cycle < 86400:                
            X = self._prepare_detection_data()
            print(len(X))
            while len(X) < 30:
                time.sleep(60)
                X = self._prepare_detection_data()
            print(len(X))
            time.sleep(60)

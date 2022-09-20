import json
import os
import pickle
import requests
import numpy as np
import time
import pandas as pd
import math
from config import MODELDIR, POSTTRAININGINSERTURL, UPDATECELLURL
from mlhelpers.mlutils import to_sequences
from tensorflow.keras.layers import LSTM, Dense, Input, RepeatVector, TimeDistributed, Lambda, Dropout, Activation

from sklearn.decomposition import PCA
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score
from sklearn.model_selection import StratifiedShuffleSplit

# from keras.layers import (Input, Dense, Lambda, Flatten, Reshape, BatchNormalization, Activation, 
#                           Dropout, Conv2D, Conv2DTranspose, MaxPooling2D)
from tensorflow.keras.layers import concatenate
# from keras.regularizers import l2
# from keras.initializers import RandomUniform
from tensorflow.keras.optimizers import RMSprop, Adam, SGD
from tensorflow.keras.models import Model
from tensorflow.keras import metrics
from tensorflow.keras.utils import to_categorical
from tensorflow.keras import backend as K


class SemiSupervisedVAE:
    def __init__(self, semisupervised_data, dataset, input_columns, output_columns, session_id, model_id, parameters, settings):
        super().__init__()
        self.dataset = dataset
        self.semisupervised_data = semisupervised_data
        self.input_columns = input_columns
        self.output_columns = output_columns
        self.settings = settings
        self.session_id = session_id
        self.model_id = model_id

        self.vector_length = int(parameters['Input Vector Size']['Value'])
        self.epochs = int(parameters['Epochs']['Value'])
        self.s_min = int(parameters['Scaling-Min']['Value'])
        self.s_max = int(parameters['Scaling-Max']['Value'])
        self.latent_dim = int(parameters['Latent Vector Size']['Value'])
        self.input_dim = len(input_columns)
        self.output_dim = len(output_columns)

        self.z_mean = None
        self.z_log_var = None
        self._y_output = None


    def _post_info(self):
        obj = {
            "modelID": self.model_id,
            "sessionID": self.session_id,
            "Status": "idle",
            "Running": "no",
            "Explanation": "https://bjlkeng.github.io/posts/semi-supervised-learning-with-variational-autoencoders/"
        }

        requests.post(url=UPDATECELLURL, json=obj)

    
    def sampling(self, args):
        z_mean, z_log_var = args
        
        epsilon = K.random_normal(shape=K.shape(z_mean),
                                mean=0., stddev=1.)
        
        return z_mean + K.exp(z_log_var) * epsilon


    
    def kl_loss(self, x, x_decoded_mean):
        kl_loss = - 0.5 * K.sum(1. + self.z_log_var - K.square(self.z_mean) - K.exp(self.z_log_var), axis=-1)
    
        return K.mean(kl_loss)

    def logxy_loss(self, x, x_decoded_mean):
        x = K.flatten(x)
        x_decoded_mean = K.flatten(x_decoded_mean)
        xent_loss = self.vector_length * len(self.input_columns) * metrics.binary_crossentropy(x, x_decoded_mean)
    
        # p(y) for observed data is equally distributed
        logy = np.log(1. / 2)
        
        return xent_loss - logy

    def labeled_vae_loss(self, x, x_decoded_mean):
        return self.logxy_loss(x, x_decoded_mean) + self.kl_loss(x, x_decoded_mean)

    def cls_loss(self, y, y_pred, N=1000):
        alpha = 0.1 * N
        return alpha * metrics.categorical_crossentropy(y, y_pred)

    def unlabeled_vae_loss(self, x, x_decoded_mean):
        entropy = metrics.categorical_crossentropy(self._y_output, self._y_output)
        # This is probably not correct, see discussion here: https://github.com/bjlkeng/sandbox/issues/3
        labeled_loss = self.logxy_loss(x, x_decoded_mean) + self.kl_loss(x, x_decoded_mean)
        
        return K.mean(K.sum(self._y_output * labeled_loss, axis=-1)) + entropy

    
    def create_enc_lstm_layers(self, stage, **kwargs):
        conv_name = '_'.join(['enc_lstm', str(stage)])
        layers = [
            LSTM(name=conv_name, **kwargs),
            Activation('tanh'),
        ]
        return layers

    
    def create_dec_lstm_layers(stage, **kwargs):
        conv_name = '_'.join(['dec_lstm', str(stage)])
        layers = [
            LSTM(name=conv_name, **kwargs),
            Activation('tanh'),
        ]
        return layers


    def create_dense_layers(self, stage, width):
        dense_name = '_'.join(['enc_lstm', str(stage)])
        layers = [
            Dense(width, name=dense_name),
            Activation('tanh'),
            Dropout(0.2),
        ]
        return layers


    def inst_layers(self, layers, in_layer):
        x = in_layer
        for layer in layers:
            if isinstance(layer, list):
                x = self.inst_layers(layer, x)
            else:
                x = layer(x)
            
        return x

    
    def create_model(self):
        enc_layers = [
            self.create_enc_lstm_layers(stage=1, units=128, return_sequences=True),
            self.create_enc_lstm_layers(stage=2, units=64, return_sequences=True),
            self.create_enc_lstm_layers(stage=3, units=32, return_sequences=True),
            self.create_enc_lstm_layers(stage=3, units=16, return_sequences=False),
            self.create_dense_layers(stage=4, width=128),
        ]
        # Labeled encoder
        x_in = Input(shape=(self.vector_length, self.input_dim))
        y_in = Input(shape=(1))
        _enc_dense = self.inst_layers(enc_layers, x_in)

        _z_mean_1 = Dense(self.latent_dim)(_enc_dense)
        _z_log_var_1 = Dense(self.latent_dim)(_enc_dense)

        z_mean = _z_mean_1
        z_log_var = _z_log_var_1

        self.z_mean = z_mean
        self.z_log_var = z_log_var

        z = Lambda(self.sampling, output_shape=(self.latent_dim,))([z_mean, z_log_var])

        classifier_layers = [
            LSTM(32, return_sequences=True),
            Activation('tanh'),
            LSTM(32, return_sequences=True),
            Activation('tanh'),
            Dropout(0.25),
            Activation('tanh'),
            LSTM(32),
            Activation('tanh'),
            Dropout(0.25),
            Dense(64),
            Activation('tanh'),
            Dropout(0.5),
            Dense(2),
            Activation('softmax'),
        ]

        _cls_output = self.inst_layers(classifier_layers, x_in)
        _y_output = _cls_output

        self._y_output = _y_output

        decoder_layers = [
            self.create_dense_layers(stage=10, width=128),
            RepeatVector(self.vector_length),
            self.create_dec_lstm_layers(stage=1, units=16, return_sequences=True),
            self.create_dec_lstm_layers(stage=1, units=32, return_sequences=True),
            self.create_dec_lstm_layers(stage=1, units=64, return_sequences=True),
            self.create_dec_lstm_layers(stage=1, units=128, return_sequences=True),
            TimeDistributed(Dense(units=self.input_dim))
        ]

        # Labeled decoder
        _merged = concatenate([y_in, z])
        _dec_out = self.inst_layers(decoder_layers, _merged)
        _x_output = _dec_out

        # Unlabeled decoder
        u_merged = concatenate([_y_output, z])
        u_dec_out = self.inst_layers(decoder_layers, u_merged)
        u_x_output = u_dec_out

        label_vae = Model(inputs=[x_in, y_in], outputs=[_x_output, _y_output])
        optimizer = Adam(lr=0.001)
        label_vae.compile(optimizer=optimizer, loss=[self.labeled_vae_loss, self.cls_loss])

        unlabeled_vae = Model(inputs=x_in, outputs=u_x_output)
        unlabeled_vae.compile(optimizer=optimizer, loss=self.unlabeled_vae_loss)

        return label_vae, unlabeled_vae

    
    def fit_model(self, labeled_vae, unlabeled_vae, X_unlabeled, X_labeled, y_labeled):
        history = []
        batch_size = 32
        for epoch in self.epochs:
            unlabeled_index = np.arange(len(X_unlabeled))
            
            # Repeat the labeled data to match length of unlabeled data
            labeled_index = []
            for i in range(len(X_unlabeled) // len(X_labeled)):
                l = np.arange(len(X_labeled))
                labeled_index.append(l)
            labeled_index = np.concatenate(labeled_index)
            
            batches = len(X_unlabeled) // batch_size
            for i in range(batches):
                # Labeled
                index_range =  labeled_index[i * batch_size:(i+1) * batch_size]
                loss = labeled_vae.train_on_batch([X_labeled[index_range], y_labeled[index_range]], 
                                                [X_labeled[index_range], y_labeled[index_range]])
                
                # Unlabeled
                index_range =  unlabeled_index[i * batch_size:(i+1) * batch_size]
                loss += [unlabeled_vae.train_on_batch(X_unlabeled[index_range],  X_unlabeled[index_range])]
                history.append(loss)
                        
        return history
    
    def train(self):
        train_size = int(len(self.dataset) * 0.8)
        # test_size = len(self.dataset) - train_size
        train, test = self.dataset.iloc[0:train_size], self.dataset.iloc[train_size:len(self.dataset)]
        input_means = [self.dataset[col].mean() for col in self.input_columns]
        input_stds = [self.dataset[col].std() for col in self.input_columns]
        output_means = [self.dataset[col].mean() for col in self.output_columns]
        output_stds = [self.dataset[col].std() for col in self.output_columns]

        print(train.head())

        X_unlabeled, y_train = to_sequences(train,
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

        X_labeled = self.semisupervised_data["x_label"]
        y_labeled = self.semisupervised_data["y_label"]

        label_vae, unlabeled_vae = self.create_model()

        y = to_categorical(y_labeled)

        history = self.fit_model(label_vae, unlabeled_vae, X_unlabeled, X_labeled, y)

        print(history)



        
        # model = self._train(X_train, y_train)
        # error_mean_dict, error_std_dict = self.get_error_distribution_stats(model, X_train, y_train, output_means, output_stds)

        # if not os.path.isdir(MODELDIR):
        #     os.mkdir(MODELDIR)

        # t_dir = MODELDIR + self.model_id + "/"
        # os.mkdir(t_dir)
        # file_name = t_dir + self.model_id + ".trained"

        # model.save(t_dir + "model.h5")
        # obj = {
        #     "Algorithm": "SemiSupervisedVAE",
        #     "modelID": self.model_id,
        #     "sessionID": str(self.session_id),
        #     "Directory": t_dir,
        #     "Settings": self.settings,
        #     "InputColumns": self.input_columns,
        #     "OutputColumns": self.output_columns,
        #     "Optional": {
        #         "VectorLength": self.vector_length,
        #         "ErrorMeans": json.dumps(error_mean_dict),
        #         "ErrorStds": json.dumps(error_std_dict),
        #         "InputMeans": input_means,
        #         "InputStds": input_stds,
        #         "OutputMeans": output_means,
        #         "OutputStds": output_stds
        #     }
        # }

        # requests.post(url=POSTTRAININGINSERTURL, json=obj)
        # with open(file_name, 'ab') as train_file:
        #     pickle.dump(obj, train_file)

        # self._post_info()


    
    def run(self):
        self.train()

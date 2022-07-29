from tensorflow.keras.layers import LSTM, Dense, Input
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.python.framework.ops import prepend_name_scope
from tensorflow.tools.docs.doc_controls import T
from mlhelpers.mlutils import to_sequences, root_mean_squared_error, inverse_transform_output, transform_value
import requests
import pickle
import os
import json
import numpy as np
import statistics
import pickle
from pebble import concurrent
from config import MODELDIR, UPDATECELLURL, POSTTRAININGINSERTURL, TESTINFERENCEURL, POSTREALANOMALYURL
from tensorflow.keras.optimizers import Adam
from tensorflow.keras import Model
import tensorflow as tf
from kafka import KafkaConsumer, KafkaProducer
from mlhelpers.kerasmanager import KerasManager
from datetime import datetime
from config import bootstrap_server

producer = KafkaProducer(bootstrap_servers=[bootstrap_server],
                         value_serializer=lambda v:json.dumps(v).encode('utf-8'), api_version=(10, 0))


manager = KerasManager()
manager.start()


class MLLSTM:
    def __init__(self, dataset, columns, session_id, model_id, parameters, settings):
        super().__init__()
        self.dataset = dataset
        self.columns = columns
        self.settings = settings
        self.session_id = session_id
        self.model_id = model_id

        self.vector_length = int(parameters['Input Vector Size']['Value'])
        self.epochs = int(parameters['Epochs']['Value'])
        self.s_min = int(parameters['Scaling-Min']['Value'])
        self.s_max = int(parameters['Scaling-Max']['Value'])
        self.input_dim = len(columns)
        self.output_dim = len(columns)

    def _post_info(self):
        obj = {
            "modelID": self.model_id,
            "sessionID": self.session_id,
            "Status": "idle",
            "Running": "no",
            "Explanation": "https://en.wikipedia.org/wiki/Long_short-term_memory"
        }

        requests.post(url=UPDATECELLURL, json=obj)
        print(UPDATECELLURL, "update")


    def get_error_distribution_stats(self, model, X_train, y_train, out_means, out_stds):
        i = 0
        relative_error_dict = {}
        error_mean_dict = {}
        error_std_dict = {}
        for col in self.columns:
            relative_error_dict[col] = list()

        for i, sample in enumerate(X_train):
            predictions = model.predict(sample.reshape(1, self.vector_length, self.input_dim))
            inverse_transform_output(predictions, out_means, out_stds)

            for j, pred in enumerate(predictions):
                relative_error = (y_train[i][j] / pred) - 1
                relative_error_dict[self.columns[j]].append(relative_error.item(0))


        for col in self.columns:
            error_mean = statistics.mean(relative_error_dict[col])
            error_std = statistics.stdev(relative_error_dict[col])
            error_mean_dict[col] = error_mean
            error_std_dict[col] = error_std

        return error_mean_dict, error_std_dict


    def _train(self, X_train, y_train):
        optimizer = Adam(learning_rate=0.001)
        model_input = Input(shape=(self.vector_length, self.input_dim), name="encoder_input")
        network = LSTM(32, name="ad_lstm_layer_1", return_sequences=True, activation='tanh')(model_input)
        network = LSTM(32, name="ad_lstm_layer_2", return_sequences=True, activation='tanh')(network)
        network = LSTM(64, name="ad_lstm_layer_k", return_sequences=True, activation='tanh')(network)
        network = LSTM(64, name="ad_lstm_layer_3", activation='tanh')(network)
        network = Dense(16, name="ad_dense_layer", activation='tanh')(network)
        model_output = Dense(self.output_dim, name="ad_output_layer", activation='tanh')(network)
        model = Model(inputs=model_input, outputs=model_output, name="anomaly_detector")
        # model.add_loss(root_mean_squared_error(model_input, model_output, sequence_length))
        model.compile(loss=root_mean_squared_error(sequence_length=self.vector_length), optimizer=optimizer)

        model.fit(X_train, y_train, epochs=self.epochs, batch_size=None, shuffle=False, verbose=1)
        return model


    def train(self):
        # train_size = int(len(self.dataset) * 0.8)
        # # test_size = len(self.dataset) - train_size
        # train, test = self.dataset.iloc[0:train_size], self.dataset.iloc[train_size:len(self.dataset)]
        # input_means = [self.dataset[col].mean() for col in self.input_columns]
        # input_stds = [self.dataset[col].std() for col in self.input_columns]
        # output_means = [self.dataset[col].mean() for col in self.output_columns]
        # output_stds = [self.dataset[col].std() for col in self.output_columns]
        # print(self.dataset.head())
        if "time" in self.dataset.columns:
            self.dataset.set_index("time", inplace=True)
        means = [self.dataset[col].mean() for col in self.dataset.columns]
        stds = [self.dataset[col].std() for col in self.dataset.columns]
        print(self.dataset.describe())

        X_train, y_train = to_sequences(self.dataset,
         self.columns,
         self.input_dim, 
         self.output_dim, 
         self.vector_length,
         1,
         means,
         stds
        )

        model = self._train(X_train, y_train)
        error_mean_dict, error_std_dict = self.get_error_distribution_stats(model, X_train, y_train, means, stds)

        if not os.path.isdir(MODELDIR):
            os.mkdir(MODELDIR)

        t_dir = MODELDIR + self.model_id + "/"
        os.mkdir(t_dir)
        file_name = t_dir + self.model_id + ".trained"

        model.save(t_dir + "model.h5")
        obj = {
            "Algorithm": "LSTM",
            "modelID": self.model_id,
            "sessionID": self.session_id,
            "Directory": t_dir,
            "Settings": self.settings,
            "Columns": self.columns,
            "Optional": {
                "VectorLength": self.vector_length,
                "ErrorMeans": json.dumps(error_mean_dict),
                "ErrorStds": json.dumps(error_std_dict),
                "Means": means,
                "Stds": stds,
            }
        }

        requests.post(url=POSTTRAININGINSERTURL, json=obj)
        with open(file_name, 'ab') as train_file:
            pickle.dump(obj, train_file)

        self._post_info()

    # @concurrent.process
    def run(self):
        self.train()


class LSTMRunner:
    def __init__(self, settings):
        self.algorithm = settings["Algorithm"]
        self.model_id = settings["modelID"]
        self.session_id = settings["sessionID"]
        self.directory = settings["Directory"]
        self.input_columns = settings["InputColumns"]
        self.output_columns = settings["OutputColumns"]
        self.db_settings = settings["Settings"]
        self.vector_length = settings["Optional"]["VectorLength"]
        self.error_means = json.loads(settings["Optional"]["ErrorMeans"])
        self.error_stds = json.loads(settings["Optional"]["ErrorStds"])
        self.input_means = settings["Optional"]["InputMeans"]
        self.input_stds = settings["Optional"]["InputStds"]
        self.output_means = settings["Optional"]["OutputMeans"]
        self.output_stds = settings["Optional"]["OutputStds"]

        # self.KAFKA_VERSION = (10, 0)

        self.consumer = KafkaConsumer(
            self.db_settings["db"],
            bootstrap_servers=[bootstrap_server],
            auto_offset_reset='latest',
            enable_auto_commit=True,
            group_id=self.model_id,
            # api_version=self.KAFKA_VERSION,
            value_deserializer=lambda x: x.decode('utf-8')
        )

    def prepare_vis_data(self, window, anomaly_date, ano_id):
        vis_data = {
            "data": [],
            "anomalyDate": anomaly_date,
            "anoID": ano_id
        }
        data_list = list()
        for i, col in enumerate(self.input_columns):
            col_list = []
            for j, val in enumerate(window):
                inner_obj = {
                    "x": j,
                    "y": val[i]
                }
                col_list.append(inner_obj)
            obj = {
                "id": col,
                "data": col_list
            }
            data_list.append(obj)

        vis_data["data"] = data_list
        return vis_data

    def post_anomaly(self, obs, pred, machine):
        anomaly_date = datetime.now().timestamp()
        # ano_id = uuid4().hex
        # vis_data = self.prepare_vis_data(window, anomaly_date, ano_id)
        # requests.post(url=POSTANOMALYVISURL, json=vis_data)

        # obs_dict = {}
        # pred_dict = {}
        # diff_dict = {}
        # nonpoint_cols = list()
        # for i, col in enumerate(self.input_columns):
        #     nonpoint_list = col.split(".")
        #     temp_str = ""
        #     for colval in nonpoint_list:
        #         temp_str += colval + "_"
        #     nonpoint_cols.append(temp_str)

        #     obs_dict[temp_str] = str(obs)
        #     pred_dict[temp_str] = str(pred)
        #     diff_dict[temp_str] = {
        #         "Absolute": abs(pred - obs),
        #         "Percentage": ((pred - obs) * 100) / obs
        #     }
            
        anomaly = {
            "anomaly": {
                "timestamp": anomaly_date,
                "code": "LSTM anomaly",
                "type": "model",
                "feedback": "tp"
            }
        }

        requests.put(url=POSTREALANOMALYURL + self.db_settings["db"] + "/" + self.model_id, json=anomaly)

        return


    def check_anomaly(self, pred, output, value_list):
        for i, key in enumerate(self.error_means.keys()):
            mu = float(self.error_means[key])
            sig = float(self.error_stds[key])
            # requests.post(url=TESTINFERENCEURL, json={"state": "obs_pred"})
            obs = output[i]
            # requests.post(url=TESTINFERENCEURL, json={"state": "obs_out"})
            prediction = pred[i][0]
            # requests.post(url=TESTINFERENCEURL, json={"state": "obs_pred_out"})
            if (obs / prediction) > mu + (3*sig) or (obs / prediction) < mu - (3*sig):
                # requests.post(url=TESTINFERENCEURL, json={"state": "check_ano", "val": obs / prediction, "threshold1": mu + (3*sig), "threshold2": mu - (3*sig)})
                self.post_anomaly(obs, prediction, value_list)


    
    def run(self):
        value_list = list()
        value_list_send = list()
        model = manager.KerasModel()
        # print("model")
        try:
            model.initialize(path=self.directory + "model.h5")
            # requests.post(url=TESTINFERENCEURL, json={"state": "init"})
        except Exception as e:
            print(e, "init")
            exit()
        if self.algorithm == "LSTMOnline":
            label_list = list()
        for message in self.consumer:
            m_list = message.value.split(",")
            inner_list = list()
            inner_list_send = list()
            for m in m_list:
                for i, col in enumerate(self.input_columns):
                    if col in m:
                        if " " in m:
                            try:
                                value = float(m.split(" ")[1].split("=")[1])
                            except:
                                value = float(m.split(" ")[0].split("=")[1])
                            # requests.post(url=TESTINFERENCEURL, json={"state": m.split(" ")[1].split("=")})
                        else:
                            value = float(m.split("=")[1])
                            # requests.post(url=TESTINFERENCEURL, json={"state": m.split("=")})
                        inner_list.append(transform_value(value, self.input_means[i], self.input_stds[i]))
                        inner_list_send.append(value)
            if len(inner_list) == 1:
                value_list.append(np.asarray(inner_list).astype('float32'))
                value_list_send.append(inner_list_send)
            if len(value_list) < self.vector_length:
                # requests.post(url=TESTINFERENCEURL, json={"state": "len" + str(len(value_list))})
                continue
            # requests.post(url=TESTINFERENCEURL, json={"state": value_list_send})
            output_list = list()
            for m in m_list:
                for j, col in enumerate(self.output_columns):
                    if col in m:
                        if " " in m:
                            try:
                                value = float(m.split(" ")[1].split("=")[1])
                            except:
                                value = float(m.split(" ")[0].split("=")[1])
                        else:
                            value = float(m.split("=")[1])
                        output_list.append(value)
                        if self.algorithm == "LSTMOnline":
                            label_list.append(value)
            # if self.algorithm == "LSTMOnline":
            #     if len(label_list) == 100:
            #         pkg = {
            #             "modelID": self.model_id,
            #             "list": label_list
            #         }

            #         requests.post(url=POSTLABELINGURL, json=pkg)
            #         label_list = list()
            try:
                value_list_np = np.asarray(value_list, dtype=object)
                value_list_np = value_list_np.reshape(1, self.vector_length, len(self.input_columns))
                pred = model.predict_once(np.asarray(value_list_np).astype('float32'))
                # requests.post(url=TESTINFERENCEURL, json={"pred0": list(pred[0])})
                # requests.post(url=TESTINFERENCEURL, json={"pred": pred[0][0]})
                inverse_transform_output(pred, self.output_means, self.output_stds)
                # requests.post(url=TESTINFERENCEURL, json={"inverse_Transform":pred[0][0]})
                self.check_anomaly(pred, np.asarray(output_list), value_list_send)
                
                # requests.post(url=TESTINFERENCEURL, json=kafka_pkg)
                # post_training_info = post_training_info.json()
                # producer.send('cimtasjco3alerts', value=kafka_pkg)
                value_list.pop(0)
                value_list_send.pop(0)
                
            except Exception as e:
                # requests.post(url=TESTINFERENCEURL, json={"state": "err"})
                # requests.post(url=TESTINFERENCEURL, json={"state": str(e)})
                print(str(e))
                exit()




# class LSTMRunner:
#     def __init__(self, settings):
#         self.model_id = settings["modelID"]
#         self.session_id = settings["sessionID"]
#         self.directory = settings["Directory"]
#         self.input_columns = settings["InputColumns"]
#         self.output_columns = settings["OutputColumns"]
#         self.vector_length = settings["Optional"]["VectorLength"]
#         self.error_means = settings["Optional"]["ErrorMeans"]
#         self.error_stds = settings["Optional"]["ErrorStds"]
#         self.input_means = settings["Optional"]["InputMeans"]
#         self.input_stds = settings["Optional"]["InputStds"]
#         self.output_means = settings["Optional"]["OutputMeans"]
#         self.output_stds = settings["Optional"]["OutputStds"]

#         self.KAFKA_VERSION = (10, 0)

#         self.consumer = KafkaConsumer(
#             'cimtas_jco3',
#             bootstrap_servers=['127.0.0.1:9094'],
#             auto_offset_reset='latest',
#             enable_auto_commit=True,
#             group_id=self.model_id,
#             api_version=self.KAFKA_VERSION,
#             value_deserializer=lambda x: x.decode('utf-8')
#         )
        
    
#     def run(self):
#         value_list = list()
#         model = manager.KerasModel()
#         print("model")
#         try:
#             model.initialize(path=self.directory + "model.h5")
#         except Exception as e:
#             print(e, "init")
#         for message in self.consumer: 
#             m_list = message.value.split(",")
#             inner_list = list()
#             for m in m_list:
#                 for i, col in enumerate(self.input_columns):
#                     if col in m:
#                         if " " in m:
#                             value = float(m.split(" ")[1].split("=")[1])
#                         else:
#                             value = float(m.split("-")[1])
#                         inner_list.append(transform_value(value, self.input_means[i], self.input_stds[i]))
#             value_list.append(inner_list)
#             if len(value_list) < self.vector_length:
#                 continue
#             output_list = list()
#             for m in m_list:
#                 for j, col in enumerate(self.output_columns):
#                     if col in m:
#                         if " " in m:
#                             value = float(m.split(" ")[1].split("=")[1])
#                         else:
#                             value = float(m.split("=")[1])
#                         output_list.append(value)
#             try:
#                 value_list_np = np.asarray(value_list).reshape(1, self.vector_length, len(self.input_columns))
#                 pred = model.predict_once(value_list_np)
#                 inverse_transform_output(pred, self.output_means, self.output_stds)
#                 kafka_pkg = {
#                     "Prediction": pred.tolist(),
#                     "Observation": output_list,
#                     "ErrorMeans": self.error_means,
#                     "ErrorStds": self.error_stds
#                 }
#                 producer.send('cimtasjco3alerts', value=kafka_pkg)
#                 value_list.pop(0)
#             except Exception as e:
#                 print(e)
#                 exit()
            
        
        

# obj = {
#             "Algorithm": "LSTM",
#             "ID": self.model_id,
#             "sessionID": self.session_id,
#             "Directory": t_dir,
#             "Settings": self.settings,
#             "InputColumns": self.input_columns,
#             "OutputColumns": self.output_columns,
#             "Optional": {
#                 "ErrorMeans": error_mean_dict,
#                 "ErrorStds": error_std_dict,
#                 "InputMeans": input_means,
#                 "InputStds": input_stds,
#                 "OutputMeans": output_means,
#                 "OutputStds": output_stds
#             }
#         }


# class MLLSTM:
#     def __init__(self, X, sensors, sensor_name, session_id, model_id, parameters, settings):
#         self.dataset = X
#         self.sensors = sensors
#         self.settings = settings
#         self.sensor_name = sensor_name
#         self.session_id = session_id
#         self.model_id = model_id
#         self.parameters = parameters


#     def _post_info(self, threshold):
#         obj = {
#             "modelID": self.model_id,
#             "Sensor(s)": self.sensor_name,
#             "sessionID": self.session_id,
#             "Threshold": threshold,
#             "Status": "idle",
#             "Explanation": "https://en.wikipedia.org/wiki/Long_short-term_memory"
#         }

#         requests.post(url=updatecellurl, json=obj)


#     def _train(self, X_train, X_test, y_train, y_test, epochs):
#         model = Sequential()
#         model.add(LSTM(64, dropout=0.0, recurrent_dropout=0.0,input_shape=(None, 1)))
#         model.add(Dense(32))
#         model.add(Dense(1))
#         model.compile(loss='mae', optimizer='adam')
#         monitor = EarlyStopping(monitor='val_loss', min_delta=1e-3, patience=5, 
#                                 verbose=0, mode='auto', restore_best_weights=True)
#         history = model.fit(X_train,y_train,validation_data=(X_test,y_test),
#                 callbacks=[monitor],verbose=0,epochs=epochs)

#         x_train_pred = model.predict(X_train)
#         train_mae_loss = np.mean(np.abs(x_train_pred - y_train), axis=1)
#         train_mae_loss.sort()
#         threshold = train_mae_loss[-1]

#         return model, threshold


#     def train(self):
#         epochs = int(self.parameters["Epochs"]["Value"])
#         vector_length = int(self.parameters["Input Vector Size"]["Value"])
#         s_max = int(self.parameters["Scaling-Max"]["Value"])
#         s_min = int(self.parameters["Scaling-Min"]["Value"])

#         train_size = int(len(self.dataset) * 0.8)
#         test_size = len(self.dataset) - train_size
#         train, test = self.dataset.iloc[0:train_size], self.dataset.iloc[train_size:len(self.dataset)]

#         col_train = train[self.sensor_name].values.reshape(-1, 1)
#         col_test = test[self.sensor_name].values.reshape(-1, 1)

#         scaler, scaled_train, scaled_test = min_max_scale(col_train, col_test, s_min, s_max)
#         X_train,y_train = to_sequences(vector_length,scaled_train.tolist())
#         X_test,y_test = to_sequences(vector_length,scaled_test.tolist())


#         model, threshold = self._train(X_train, X_test, y_train, y_test, epochs)
#         t_dir = "Trained/" + self.model_id + "/"
#         os.mkdir(t_dir)
#         file_name = t_dir + self.model_id + ".trained"

#         model.save(t_dir + "model")
#         obj = {
#             "ID": self.model_id,
#             "Scaler": scaler,
#             "Threshold": threshold,
#             "Settings": self.settings,
#             "Sensors": self.sensors
#         }

#         with open(file_name, 'ab') as train_file:
#             pickle.dump(obj, train_file)

#         print(self.model_id)

#         # self._post_info(threshold)

#     @concurrent.process
#     def run(self):
#         self.train()
#         return "DONE"
         
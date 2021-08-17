import time
import datetime
import requests
import os
import uuid
import json
import tensorflow as tf
from kafka import KafkaConsumer
import statistics
# from kerasmanager import KerasHyperManager

tf.compat.v1.disable_v2_behavior()


from mlconstants import (
    CELL_URL,
#    METAURL,
#    BASICURL,
    AUTOML_VECTOR_LENGTH,
    POST_TRAINING_INSERT_URL,
    MODELDIR,
)
from mlutils import QueryHelper, MLPreprocessor
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
from mlutils import to_sequences, root_mean_squared_error, inverse_transform_output, transform_value


# hyper_manager = KerasHyperManager()
# hyper_manager.start()

class MLSession(Process):
    def __init__(self, session_id, creator, db_settings, start_time, end_time, measurement_sensor_dict, kill_sig_queue):
        super().__init__()
        self.session_id = session_id
        self.creator = creator
        self.db_settings = db_settings
        self.start_time = '%d' % (time.mktime(datetime.datetime.strptime(start_time, "%Y-%m-%dT%H:%M").timetuple()) * 1000000000)
        self.end_time = '%d' % (time.mktime(datetime.datetime.strptime(end_time, "%Y-%m-%dT%H:%M").timetuple()) * 1000000000)
        self.measurement_sensor_dict = measurement_sensor_dict
        self.kill_sig_queue = kill_sig_queue

        self.influx_helper = None
        self.preprocess_helper = None
        self._train_futures = {}
        self.model_IDs = []
        self.input_columns = []
        self.output_columns = []


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


    def _post_info(self, alg, model_id, params, creator):
        pkg = {
                "Algorithm": alg,
                "sessionID": self.session_id,
                "modelID": model_id,
                "Status": "train",
                "Parameters": params,
        }
        requests.post(url=CELL_URL, json=pkg)

        # meta = {
        #     "modelID": model_id,
        #     "creator": creator,
        #     "createdDate": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
        #     "relatedHardware": ["act_force_diff_cyl_1"],
        #     "totalfb": 0
        # }
        # requests.post(url=METAURL, json=meta)



class ADSession(MLSession):
    def __init__(self, settings, algs, params, kill_sig_queue):
        MLSession.__init__(self, settings['sessionID'], settings['creator'], settings['dbSettings'], 
                            settings['startTime'], settings['endTime'], settings['sensors'], kill_sig_queue)
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
            self._post_info(alg, self.model_IDs[i], self.params[alg], self.creator)


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


    
        

from backend.mlhelpers.mlwrappers import KafkaHelper
from mlhelpers.mlutils import Influx2QueryHelper, MLPreprocessor
from datetime import datetime, timedelta
from config import models_path, POSTREALANOMALYURL
import json
import time
import numpy as np
import hdbscan
import pickle
import queue
import uuid
import threading
import requests


class MLHDBSCAN:
    def __init__(self, db_settings, prev_hours, end_date, sample_size, model_name, session_id, m2s):
        self.db_settings = db_settings
        self.m2s = m2s
        self.prev_hours = prev_hours
        self.end_date = end_date
        self.model_name = model_name
        self.session_id = session_id
        self.model_id = uuid.uuid4().hex
        self.window_size = sample_size

        self.influx_helper = None

    
    def cluster(self, df):
        seq_arr = list()
        window_size = self.sample_size
        for i in range(len(df) - window_size - 1):
            seq_arr.append(df.values[i:i+window_size])
        seq_arr = np.asarray(seq_arr)
        seq_arr = seq_arr.reshape(seq_arr.shape[0], seq_arr.shape[1] * seq_arr.shape[2])

        clusterer = hdbscan.HDBSCAN(min_cluster_size=30, prediction_data=True).fit(seq_arr)

        with open(models_path + str(self.session_id) + "/" + self.model_name + ".maidemdl", 'wb') as f:
            pickle.dump(clusterer, f)
        pkg = {
            "db_settings": self.db_settings,
            "m2s": self.m2s,
            "window_size": self.sample_size,
            "model_name": self.model_name,
            "session_id": self.session_id,
            "model_id": self.model_id
        }
        with open(models_path + str(self.session_id) + "/" + self.model_name + "_info.json", 'w') as f:
            json.dump(pkg, f)

        print(self.session_id, "saved with model name", self.model_name)


    
    def query(self):
        end_date = datetime.strptime(time.strftime('%Y-%m-%dT%H:%M:%SZ', time.localtime(int(str(self.end_date)[:-3]))), "%Y-%m-%dT%H:%M:%SZ")
        start_date = end_date - timedelta(hours=self.prev_hours)

        start_date = start_date.strftime('%Y-%m-%dT%H:%M:%SZ')
        end_date = end_date.strftime('%Y-%m-%dT%H:%M:%SZ')

        raw_data, sensor_names = self.influxdb.query(self.m2s, start_date, end_date)
        preprocessor = MLPreprocessor(raw_data)
        df = preprocessor.preproc("df", sensor_names)

        return df

    @property
    def influxdb(self):
        if self.influx_helper == None:
            self.influx_helper = Influx2QueryHelper(self.db_settings)

        return self.influx_helper

    
    def run(self):
        df = self.query()
        self.cluster(df)


class HDBSCANRunner:
    def __init__(self, db_settings, m2s, window_size, model_name, session_id, model_id):
        self.db_settings = db_settings
        self.m2s = m2s
        self.window_size = window_size
        self.model_name = model_name
        self.session_id = session_id
        self.model_id = model_id

        self.clusterer = None
        self.kafka_helper = None


        self.kafka_queue = queue.Queue()

    def consume(self):
        self.consumer.consume()

    @property
    def consumer(self):
        if self.kafka_helper == None:
            self.kafka_helper = KafkaHelper((10,0), ["vmi474601.contaboserver.net:9092"], self.window_size, self.kafka_queue, 0)
            self.kafka_helper.set_topics(self.m2s)

        return self.kafka_helper

    def extract_model(self):
        with open(models_path + str(self.session_id) + "/" + self.model_name + ".maidemdl", 'rb') as f:
            self.model = pickle.load(f)

    
    def run(self):
        t = threading.Thread(target=self.consume)
        t.start()
        while True:
            item = self.kafka_queue.get()
            # print(np.asarray(item).reshape(-1, 2))
            labels, membership_strengths = hdbscan.approximate_predict(self.clusterer, np.asarray(item).reshape(-1, len(self.columns)))
            print(labels)
            print(membership_strengths)
            for label in labels:
                if label == -1:
                    for machine in self.m2s.keys():
                        pkg = {
                            "anomaly": {
                                "feedback": "null",
                                "timestamp": int(time.time()) * 1000,
                                "description": "H-DBSCAN",
                                "type": "model",
                                "code": "Sequential"
                            }
                        }
                        requests.put(url=POSTREALANOMALYURL + machine + "/" + self.model_id, json=pkg)
                        print("anomaly sent")
                    break
        


    def start(self):
        self.extract_model()


# class DBSCANRunner:
#     def __init__(self, settings):
#         self.algorithm = settings["Algorithm"]
#         self.model_id = settings["modelID"]
#         self.session_id = settings["sessionID"]
#         self.directory = settings["Directory"]
#         self.db_settings = settings["Settings"]
#         self.columns = settings["Columns"]
#         self.window_size = settings["Optional"]["WindowSize"]
#         self.min_cluster_size = settings["Optional"]["MinClusterSize"]
#         self.m2s = settings["Optional"]["MeasurementSensorDict"]

#         self.kafka_queue = queue.Queue()
#         self.kafka_helper = None
#         self.clusterer = None

#     def consume(self):
#         self.consumer.consume()
    
#     def run(self):
#         with open(self.directory + "model", "rb") as modelfile:
#             self.clusterer = pickle.load(modelfile)
        
#         t = threading.Thread(target=self.consume)
#         t.start()
#         while True:
#             item = self.kafka_queue.get()
#             # print(np.asarray(item).reshape(-1, 2))
#             labels, membership_strengths = hdbscan.approximate_predict(self.clusterer, np.asarray(item).reshape(-1, len(self.columns)))
#             print(labels)
#             print(membership_strengths)
#             for m_str in membership_strengths:
#                 if m_str < 0.95:
#                     for machine in self.m2s.keys():
#                         pkg = {
#                             "anomaly": {
#                                 "feedback": "null",
#                                 "timestamp": int(time.time()) * 1000,
#                                 "description": "H-DBSCAN",
#                                 "type": "model",
#                                 "code": "Sequential"
#                             }
#                         }
#                         requests.put(url=POSTREALANOMALYURL + machine + "/" + self.model_id, json=pkg)
#                         print("anomaly sent")
#                     break
            

#     @property
#     def consumer(self):
#         if self.kafka_helper == None:
#             self.kafka_helper = KafkaHelper((10,0), ["vmi515134.contaboserver.net:9092"], self.window_size, self.kafka_queue, 0)
#             self.kafka_helper.set_topics(self.m2s)

#         return self.kafka_helper
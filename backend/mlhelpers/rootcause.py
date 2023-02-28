from mlhelpers.mlutils import Influx2QueryHelper, MLPreprocessor
from datetime import datetime, timedelta
from config import models_path, POSTREALANOMALYURL, PUTBASICURL
# from adtk.visualization import plot
import json
import time
import numpy as np
import hdbscan
# import matplotlib.pyplot as plt
import pickle
import queue
import pandas as pd
import threading
import requests


class RootCauseChecker:
    def __init__(self, settings):
        print(settings, "sets")
        self.m2s = settings["m2s"]
        self.measurement = list(settings["m2s"].keys())[0]
        self.field = settings["m2s"][self.measurement][0]
        self.prev_hours = int(settings["prev_hours"])
        self.end_date = settings["end_date"]
        self.window_size = int(settings["window_size"])
        self.bucket_minutes = int(settings["bucket_minutes"])
        self.failureName = settings["failureName"]
        self.failureIDD = settings["failureIDD"]
        self.topLevelTreeComponent = settings["topLevelTreeComponent"]
        self.usedModel = settings["usedModel"]

        self.influx_helper = None


    def cluster(self, df):
        seq_arr = list()
        window_size = self.window_size
        for i in range(len(df) - window_size - 1):
            seq_arr.append(df.values[i:i+window_size])
        seq_arr = np.asarray(seq_arr)
        seq_arr = seq_arr.reshape(seq_arr.shape[0], seq_arr.shape[1] * seq_arr.shape[2])

        clusterer = hdbscan.HDBSCAN(min_cluster_size=30, prediction_data=True).fit(seq_arr)

        threshold = pd.Series(clusterer.outlier_scores_, index=df.index[:-(window_size + 1)]).quantile(.95)
        print(threshold, "threshold[0]")
        print(clusterer.outlier_scores_)
        outliers = np.where(clusterer.outlier_scores_ > threshold)
        print(outliers[0])
        outliers = outliers[0]
        i = 0
        outliers_real = list()
        while i < len(seq_arr):
            if i in outliers:
                outliers_real.append(i)
                i = ((i // window_size) + 1) * window_size
            else:
                i += 1
        
        df["time2"] = df.index
        df.index = [i for i in range(df.index.shape[0])]

        outliers_series = pd.Series(df.index.isin(outliers_real), index=df["time2"])

        buckets = list()
        start = outliers_series.index[0]

        minutes = self.prev_hours * 60
        bucket_count = minutes // self.bucket_minutes
        for i in range(bucket_count):
            end = start + timedelta(minutes=self.bucket_minutes)
            buckets.append(outliers_series[start:end])
            start = end
        
        hist_values = list()
        for bucket in buckets:
            cnt = 0
            for val in bucket:
                if val == True:
                    cnt += 1
            hist_values.append(cnt)

        print(hist_values, self.m2s[self.measurement])
        print("DONE", self.m2s[self.measurement])

        analysisInfo = {
            "failureName": self.failureName,
            "failureIDD": self.failureIDD,
            "topLevelTreeComponent" = self.topLevelTreeComponent,
            "usedModel" = self.usedModel
            "usedParameterValues" = [self.prev_hours, self.window_size, self.bucket_minutes]
        }

        requests.post() 
        # plt.figure(figsize=(60, 40))
        # plt.bar(range(len(hist_values)), hist_values)
        # plt.savefig("/home/machinaide/project/machinaide/rootImage/anomalyCountPerBucket_" + self.field + ".png")

        # df.index = df["time2"]

    
    def query(self):
        end_date = datetime.strptime(self.end_date, "%Y-%m-%dT%H:%M:%S.%fZ")
        # end_date = datetime.utcfromtimestamp(int(str(self.end_date)[:-3]))
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
            db_settings = {
                "host": "host",
                "port": 8086,
                "db": "Ermetal",
                "rp": "autogen"
            }
            self.influx_helper = Influx2QueryHelper(db_settings)

        return self.influx_helper

    
    def run(self):
        df = self.query()
        self.cluster(df)
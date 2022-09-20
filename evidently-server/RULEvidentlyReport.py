from evidently_config import INFLUX
from influxdb_client import InfluxDBClient
from Helpers import create_query
from datetime import datetime, timezone, timedelta
import requests
import pandas as pd
import json
import orjson
from evidently_config import (ADD_REPORT_URL)

from evidently.model_profile import Profile
from sklearn import datasets, ensemble, model_selection
from evidently.pipeline.column_mapping import ColumnMapping
from evidently.model_profile.sections import ClassificationPerformanceProfileSection, CatTargetDriftProfileSection

from evidently.dashboard import Dashboard

class RULEvidentlyReport:
    def __init__(self, settings) -> None:
        self.client = InfluxDBClient(url=INFLUX["host"], token=INFLUX["dbtoken"], org=INFLUX["orgID"], verify_ssl = False) 
        self.query_api = self.client.query_api()

        self.model_id = settings["modelID"]
        self.fields = settings["fields"]
        self.daterange = settings["daterange"]
        self.logs_in_range = settings["logsInRange"]
    
    def get_query_results(self, bucket, measurement="", field="", daterange="-30d"):
        query = create_query(bucket, measurement, field, daterange)

        result = self.query_api.query(query)
        results = []
        for table in result:
            for record in table.records:
                data_point = {}
                data_point["time"] = record.get_time()
                data_point[f"{measurement}.{record.get_field()}"] = record.get_value()
                results.append(data_point)
        
        return results

    def get_sensor_data(self):
        all_data = []
        for field in self.fields:
            data = self.get_query_results(field["database"], field["measurement"], field["dataSource"], self.daterange)
            df = pd.DataFrame(data)
            data_points = df.to_dict("records")
            if(len(data_points)):
                all_data.append(data_points)
        
        if(len(all_data)):
            one_merged = pd.DataFrame(all_data[0])
            for i in range(1,len(all_data)):
                if(len(all_data[i])):
                    one_merged = pd.merge(one_merged, pd.DataFrame(all_data[i]), on=["time"])
            return one_merged
            

        """ query = create_query(self.database, self.measurements, self.daterange)
        result = self.query_api.query(query)

        result_dict = {}
        for table in result:
            for record in table.records:
                if(record.get_time() in result_dict):
                    result_dict[record.get_time()][f"{record.get_measurement()}.{record.get_field()}"] = record.get_value()
                else:
                    data_point = {}
                    data_point["time"] = record.get_time()
                    data_point[f"Press031.{record.get_field()}"] = record.get_value()
                    result_dict[record.get_time()] = data_point
        return result_dict """
    
    def create_report(self):
        """ result_dict = self.get_sensor_data()
        new_output = list(result_dict.values())
        df = pd.DataFrame(new_output) """
        df = self.get_sensor_data()
        if(not df.empty):
            df = df.dropna(thresh=2)
            print(df.shape)
            print(df.iloc[0])
            print(df.head())

            log_pivot = 0
            feedback = []
            prediction = []
            for i in range(df.shape[0]):
                flag = False
                for j in range(log_pivot, len(self.logs_in_range)):
                    log = self.logs_in_range[j]
                    feature_date = df.iloc[i]["time"].to_pydatetime()
                    # print(type(df.iloc[i]["time"]),df.iloc[i]["time"], type(feature_date), feature_date)
                    log_date = datetime.strptime(self.logs_in_range[j]["time"], "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=timezone.utc)
                    # print("--", type(self.logs_in_range[j]["time"]), self.logs_in_range[j]["time"], type(log_date), log_date)
                    # print(feature_date > log_date)
                    log_thirty_min = log_date - timedelta(minutes=30)
                    if(feature_date>=log_thirty_min and feature_date<=log_date):
                        flag = True
                        if("feedback" in log):
                            if(log["feedback"] == "Positive"):
                                feedback.append(int(log["prediction"]))
                            elif(log["feedback"] == "Negative"):
                                print("***hello")
                                feedback.append(int(not int(log["prediction"])))
                        else:
                            feedback.append(int(log["prediction"]))

                        prediction.append(int(log["prediction"]))
                        log_pivot = j + 1
                        break
                if(not flag):
                    feedback.append(None)
                    prediction.append(None)

            print("nones", df.dropna().shape)
            df['feedback'] = feedback
            df['prediction'] = prediction

            print("before", df.shape)
            df = df.dropna(subset = ['feedback', 'prediction'])
            print("after", df.shape)
            print(df)
            df.to_csv("./1309-out.csv")

            target = "feedback"
            prediction = "prediction"
            datetime_str = "time"

            numerical_features = list(df.columns.difference(["time", "feedback", "prediction"]))
            categorical_features = []
            features = numerical_features + categorical_features

            ermetal_column_mapping = ColumnMapping()
            ermetal_column_mapping.target = target
            ermetal_column_mapping.prediction = prediction
            ermetal_column_mapping.datetime = datetime_str
            ermetal_column_mapping.numerical_features = numerical_features

            ermetal_classification_performance_profile = Profile(sections=[ClassificationPerformanceProfileSection()])
            ermetal_classification_performance_profile.calculate(df, None, column_mapping=ermetal_column_mapping)

            result = ermetal_classification_performance_profile.json() 
            result_json = json.loads(result)
            print(type(result_json))
            result_json["feedback"] = df["feedback"].to_json(orient='values')
            result_json["prediction"] = df["prediction"].to_json(orient='values')
            result_json["features"] = {}
            
            result_json["modelID"] = self.model_id
            result_json["task"] = "rul"

            for col in numerical_features:
                result_json["features"][col] = df[col].to_json(orient='values')

            print(feedback, "--", prediction)
            print(df.shape, len(feedback), len(prediction), len(self.logs_in_range))

            result_dump = orjson.dumps(result_json).decode("utf-8")
            result_json = orjson.loads(result_dump)

            requests.post(url=ADD_REPORT_URL , json={"modelID": self.model_id, "report": result_json})
                
            return result_json
    
    """ def run(self) -> None:
        t1 = threading.Thread(target=self.create_report)
        t1.start()
        t1.join()
        print("run report process") """



""" logs = [{"time": "2022-09-12T04:46:10.820818Z", "prediction": "1"}, {"time": "2022-09-12T05:16:02.355792Z", "prediction": "0", "feedback": "Negative"},
{"time": "2022-09-12T05:46:06.817684Z", "prediction": "0", "feedback": "Negative"}, {"time": "2022-09-12T06:16:02.145449Z", "prediction": "0"},
{"time": "2022-09-12T06:46:03.644763Z", "prediction": "0"}, {"time": "2022-09-12T07:16:05.477043Z", "prediction": "0", "feedback": "Negative"},
{"time": "2022-09-12T07:46:04.707605Z", "prediction": "0"}, {"time": "2022-09-12T08:16:05.341649Z", "prediction": "0"},
{"time": "2022-09-12T08:46:04.882249Z", "prediction": "0"}, {"time": "2022-09-12T09:16:03.700893Z", "prediction": "0"},
{"time": "2022-09-12T09:46:06.429674Z", "prediction": "1", "feedback": "Negative"}, {"time": "2022-09-12T10:16:05.559688Z", "prediction": "0", "feedback": "Positive"},
{"time": "2022-09-12T10:46:03.882743Z", "prediction": "0"}, {"time": "2022-09-12T11:16:09.031313Z", "prediction": "0"}]
settings = {"database": "Ermetal", "measurements": ["Press031", "Press032"], "daterange": "-3d", "logs_in_range": logs}
report = RULEvidentlyReport(settings)
report.create_report() """
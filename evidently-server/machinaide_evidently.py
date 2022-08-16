import numpy as np
import pandas as pd
from datetime import datetime
from evidently.model_profile import Profile
from sklearn import datasets, ensemble, model_selection
from evidently.pipeline.column_mapping import ColumnMapping
from evidently.model_profile.sections import ClassificationPerformanceProfileSection, CatTargetDriftProfileSection

from evidently.dashboard import Dashboard
from evidently.dashboard.tabs import ClassificationPerformanceTab

from evidently_config import INFLUX
from influxdb_client import InfluxDBClient

client = InfluxDBClient(url=INFLUX["host"], token=INFLUX["dbtoken"], org=INFLUX["orgID"], verify_ssl = False) 
query_api = client.query_api()

query = f'from(bucket: "Ermetal")\
  |> range(start: -10d)\
  |> filter(fn: (r) => r["_measurement"] == "Press031")\
  |> aggregateWindow(every: 30m, fn: mean, createEmpty: true)'

result = query_api.query(org=INFLUX["orgID"], query=query)

result_dict = {}
for table in result:
    for record in table.records:
        if(record.get_time() in result_dict):
            result_dict[record.get_time()][f"Press031.{record.get_field()}"] = record.get_value()
        else:
            data_point = {}
            data_point["time"] = record.get_time()
            data_point[f"Press031.{record.get_field()}"] = record.get_value()
            result_dict[record.get_time()] = data_point

new_output = list(result_dict.values())
df = pd.DataFrame(new_output)

df['feedback'] = np.random.randint(0, 2, df.shape[0])
df['prediction'] = np.random.randint(0, 2, df.shape[0])

print(df.head())
print(df.tail())

target = "feedback"
prediction = "prediction"
datetime = "time"

numerical_features = list(df.columns.difference(["time", "feedback", "prediction"]))
categorical_features = []
features = numerical_features + categorical_features

ermetal_column_mapping = ColumnMapping()
ermetal_column_mapping.target = target
ermetal_column_mapping.prediction = prediction
ermetal_column_mapping.datetime = datetime
ermetal_column_mapping.numerical_features = numerical_features


ermetal_model_performance_dashboard = Dashboard(tabs=[ClassificationPerformanceTab(verbose_level=1)])
ermetal_model_performance_dashboard.calculate(df, None, column_mapping=ermetal_column_mapping)

ermetal_model_performance_dashboard.save('./ermetal_model_performance_2.html')

ermetal_classification_performance_profile = Profile(sections=[ClassificationPerformanceProfileSection(), CatTargetDriftProfileSection()])
ermetal_classification_performance_profile.calculate(df, None, column_mapping=ermetal_column_mapping)

result = ermetal_classification_performance_profile.json() 

with open("ermetal_results_2.json", "w") as outfile:
    outfile.write(result)



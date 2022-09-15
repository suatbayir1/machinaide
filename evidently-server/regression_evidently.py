import json
import numpy as np
import pandas as pd
from datetime import datetime
from evidently.model_profile import Profile
from sklearn import datasets, ensemble, model_selection
from evidently.pipeline.column_mapping import ColumnMapping
from evidently.model_profile.sections import RegressionPerformanceProfileSection, CatTargetDriftProfileSection

from evidently.dashboard import Dashboard
from evidently.dashboard.tabs import RegressionPerformanceTab

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

df['feedback'] = 0
df['prediction'] = np.random.randint(0, 100, df.shape[0])

# df["feedback"].loc
df["feedback"].loc[0:280] = range(280, -1, -1)
df["feedback"].loc[281:381] = range(100, -1, -1)
df["feedback"].loc[382:480] = range(98, -1, -1)

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


ermetal_model_performance_dashboard = Dashboard(tabs=[RegressionPerformanceTab(verbose_level=1)])
ermetal_model_performance_dashboard.calculate(df, None, column_mapping=ermetal_column_mapping)

ermetal_model_performance_dashboard.save('./reg_model_performance_4.html')

ermetal_regression_performance_profile = Profile(sections=[RegressionPerformanceProfileSection()])
ermetal_regression_performance_profile.calculate(df, None, column_mapping=ermetal_column_mapping)

result = ermetal_regression_performance_profile.json() 
result_json = json.loads(result)
print(type(result_json))
result_json["feedback"] = df["feedback"].to_json(orient='values')
result_json["prediction"] = df["prediction"].to_json(orient='values')
result_json["features"] = {}

for col in numerical_features:
    result_json["features"][col] = df[col].to_json(orient='values')

result_str = json.dumps(result_json)

with open("reg_results_4.json", "w") as outfile:
    outfile.write(result_str)



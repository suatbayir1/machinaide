import pandas as pd
from influxdb_client import InfluxDBClient
from evidently_config import INFLUX, MONGO


client = InfluxDBClient(url=INFLUX["host"], token=INFLUX["dbtoken"], org=INFLUX["orgID"], verify_ssl = False) 
query_api = client.query_api()

def query_db(query):
    res = query_api.query(org=INFLUX["orgID"], query=query)
    return res

query = f'from(bucket: "Ermetal")\
  |> range(start: -10d)\
  |> filter(fn: (r) => r["_measurement"] == "Press031")\
  |> aggregateWindow(every: 30m, fn: mean, createEmpty: true)'

result = query_db(query)

""" csv_result = query_api.query_csv(query)
df = pd.DataFrame(csv_result)
print(df.head())
print(df.tail()) """

results = []
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
print(df.head())
print(df.tail())


""" df = pd.DataFrame(results)

print(df.tail())

data_points = []
if(not df.empty):
    df['time'] = df['time'].apply(lambda x: pd.Timestamp(x))
    data_points += df.to_dict("records")
all_data = []
one_log_data = []
if(len(data_points)):
    all_data.append(data_points)

if(len(all_data)):
    print("--", len(all_data))
    one_merged = pd.DataFrame(all_data[0])
    for i in range(1,len(all_data)):
        if(len(all_data[i])):
            one_merged = pd.merge(one_merged, pd.DataFrame(all_data[i]), on=["time"])
    if("time" in one_merged):
        cycle = 0
        for i in range(len(one_merged["time"])):
            one_merged.loc[i, "cycle"] = cycle
            cycle += 1
        one_log_data = one_log_data + one_merged.to_dict("records")
    else:
        one_log_data = []
    
    if(len(one_log_data)):
        df = pd.DataFrame(one_log_data)
        # print("sensor df: ---------------------")
        df["id"] = 1
        # print(df.head())
        # print(df.shape)
        print("nans: ", df.isnull().sum())
        df = df.dropna(axis=0)
        print(df.head())
        print(df.tail()) """
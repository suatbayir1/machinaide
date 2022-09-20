from influxdb_client import InfluxDBClient
import pandas as pd

influx = dict(
    host = 'https://vmi474601.contaboserver.net:8086',
    orgID = 'd572bde16b31757c',
    dbtoken = "FlviKxQ-RHHWxd1FRkHIc5VwNZuFnP6QTmsJcU6GI7nrd4cuqaTx3cCijZchENMH0zSGuKOew_e4LxW6V09Erw=="
)

client = InfluxDBClient(url=influx["host"], token=influx["dbtoken"], org=influx["orgID"], verify_ssl = False)

query_api = client.query_api()

query = ' from(bucket:"Ermetal")\
|> range(start: -10m)\
|> filter(fn: (r) => r["_measurement"] == "Press030")\
|> filter(fn: (r) => r["_field"] == "Ana_hava_debi_act")\
|> aggregateWindow(every: 30s, fn: mean, createEmpty: false)\
|> yield(name: "mean")'

query2 = 'import "influxdata/influxdb/schema"\
schema.measurements(bucket: "Ermetal")'

query3 = 'SHOW MEASUREMENTS ON "Ermetal"'

query4 = 'import "influxdata/influxdb/schema"\n\
schema.measurementFieldKeys(bucket: "Ermetal" ,measurement: "Press030",)'

query5 = 'from(bucket: "Ermetal")\
  |> range(start: -15m)\
  |> filter(fn: (r) => r["_measurement"] == "Press030")\
  |> filter(fn: (r) => r["_field"] == "Ana_hava_debi_act")\
  |> aggregateWindow(every: 10s, fn: mean, createEmpty: false)'

result = query_api.query(org=influx["orgID"], query=query5)

print(result)
results = []
for table in result:
    # print(result)
    for record in table.records:
        data_point = {}
        # record.get_field() kısmı sadece data alırken olsun
        data_point[record.get_field()] = record.get_value()
        data_point["time"] = record.get_time()
        results.append(data_point)

print(results)
print(len(results))

df = pd.DataFrame(results)

print(df.shape)
print(df.head())
print(df)
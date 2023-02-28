def get_measurements_query(bucket):
    query = f'import "influxdata/influxdb/schema"\n\
schema.measurements(bucket: "{bucket}")'
    return query

def get_fields_query(bucket, measurement):
    query = f'import "influxdata/influxdb/schema"\n\
schema.measurementFieldKeys(bucket: "{bucket}" ,measurement: "{measurement}",)'
    return query

def get_sensor_data_query(bucket, measurement, field, start_time, stop_time):
    query = f'from(bucket: "{bucket}")\
  |> range(start: {start_time}, stop: {stop_time})\
  |> filter(fn: (r) => r["_measurement"] == "{measurement}")\
  |> filter(fn: (r) => r["_field"] == "{field}")\
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: true)'
    # print(query)
    return query

def get_sensor_missing_data_query(bucket, measurement, field, start_time, stop_time, is_fill_null):
    fill_null = "false"
    if(is_fill_null):
        fill_null = "true"
    query = f'from(bucket: "{bucket}")\
  |> range(start: {start_time}, stop: {stop_time})\
  |> filter(fn: (r) => r["_measurement"] == "{measurement}")\
  |> filter(fn: (r) => r["_field"] == "{field}")\
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: {fill_null})'
    # print(query)
    return query

# print(get_measurements_query("test-db"))
# print(get_fields_query("test-db", "press0"))
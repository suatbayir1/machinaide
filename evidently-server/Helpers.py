def create_query(bucket, measurement, field, daterange="-30d"):
    query = f'from(bucket: "{bucket}")\
  |> range(start: {daterange})\
  |> filter(fn: (r) => r["_measurement"] == "{measurement}")\
  |> filter(fn: (r) => r["_field"] == "{field}")\
  |> aggregateWindow(every: 30m, fn: mean, createEmpty: true)'

    print(query)
    return query


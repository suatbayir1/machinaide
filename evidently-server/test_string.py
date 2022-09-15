database = "ermetal"
measurement = "press031"
rangeStr = "-30d"

test = f'from(bucket: "{database}")\
  |> range(start: {rangeStr})\
  |> filter(fn: (r) => r["_measurement"] == "{measurement}")\
  |> aggregateWindow(every: 30m, fn: mean, createEmpty: true)'

print(test)
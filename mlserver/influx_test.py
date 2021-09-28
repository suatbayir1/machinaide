from influxdb_client import InfluxDBClient

org = "machinaide"
bucket = "Ermetal"
token = "-Y8yuCS19k6ZD0FLiVvpY-zcEK4VhbBe6HC7WPKR7Z5X2bkm-Ag2iMJUSDSBOugpG6klF2XEddhCMkHRuJPbsQ=="


bucket = "Ermetal"
start = "-30d"
stop = "-29d"

measurements = {
    "Press030": ["AM_rpm_act", "AM_rpm_act_1", "Ana_hava_debi_act"],
    "Press031": ["Ana_hava_sic_act", "Bit_control", "Ana_hava_debi_act_1"]
}

query = 'from(bucket:"{}")\
|> range(start: {}, stop: {})\
|> filter(fn: (r) => r._measurement == {})\
|> filter(fn: (r) => r._field == {})'

msr_string = ""
fld_string = ""
for i, items in enumerate(measurements.items()):
    measurement = items[0]
    sensors = items[1]
    if i != len(measurements) - 1:
        msr_string += "\"{}\" or r._measurement == ".format(measurement)
    else:
        msr_string +=  "\"{}\"".format(measurement)
    for j, sensor in enumerate(sensors):
        if sensor not in fld_string:
            if j == len(sensors) - 1 and i == len(measurements) - 1:
                fld_string += "\"{}\"".format(sensor)
            else:
                fld_string += "\"{}\" or r._field == ".format(sensor)

query = query.format(bucket, start, stop, msr_string, fld_string)


# query = "select \"AM_rpm_act\" from \"Ermetal\".\"autogen\".\"Press030\" where time > 1630404000000000000  AND time <= 1630407600000000000"

#establish a connection
client = InfluxDBClient(url="http://localhost:8080", token=token, org=org)

#instantiate the WriteAPI and QueryAPI
write_api = client.write_api()
query_api = client.query_api()

#create and write the point
# p = Point("h2o_level").tag("location", "coyote_creek").field("water_level", 1)
# write_api.write(bucket=bucket,org=org,record=p)
#return the table and print the result
result = client.query_api().query(org=org, query=query)

final_results = list()
seen_times = list()
for table in result:
    for i, record in enumerate(table.records):
        print(record.get_time())
        exit()
        # if record.get_time() not in seen_times:
        #     pkg = {
        #         'time': record.get_time(),
        #         'values': {},
        #     }
        # else:
        #     pkg = final_results[i]
        # if pkg['time'] != record.get_time():
        #     print("éneo")
        # try:
        #     pkg['values'][record.get_measurement()][record.get_field()] = record.get_value()
        # except:
        #     pkg['values'][record.get_measurement()] = {}
        #     pkg['values'][record.get_measurement()][record.get_field()] = record.get_value()

        # if pkg['time'] not in seen_times:
        #     seen_times.append(pkg['time'])
        #     final_results.append(pkg)

print(len(final_results), len(final_results[0]), len(final_results[1]))

    
                
        # if record.get_time() not in unique.keys():
        #     unique[record.get_time()] = []
        # rc = (record.get_measurement(), record.get_field(), record.get_value())
        # unique[record.get_time()].append(rc)

# for _, val in unique.items():
#     if val != 2:
#         print(val)
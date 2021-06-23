from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
import pandas as pd
import datetime
import random
import time

# You can generate a Token from the "Tokens Tab" in the UI
token = "-Y8yuCS19k6ZD0FLiVvpY-zcEK4VhbBe6HC7WPKR7Z5X2bkm-Ag2iMJUSDSBOugpG6klF2XEddhCMkHRuJPbsQ=="
org = "machinaide"
bucket = "system"

client = InfluxDBClient(url="http://localhost:8080", token=token)

write_api = client.write_api(write_options=SYNCHRONOUS)

tic = time.perf_counter()

count = 0
while True:
    try:
        data = f"Press31_DB1,host=vmi474601 field1={random.randint(1, 100)},field2={random.randint(1, 100)},field3={random.randint(1, 100)},field4={random.randint(1, 100)},field5={random.randint(1, 100)},field6={random.randint(1, 100)},field7={random.randint(1, 100)},field8={random.randint(1, 100)},field9={random.randint(1, 100)},field10={random.randint(1, 100)},field11={random.randint(1, 100)},field12={random.randint(1, 100)},field13={random.randint(1, 100)},field14={random.randint(1, 100)},field15={random.randint(1, 100)},field16={random.randint(1, 100)},field17={random.randint(1, 100)},field18={random.randint(1, 100)},field19={random.randint(1, 100)},field20={random.randint(1, 100)},field21={random.randint(1, 100)},field22={random.randint(1, 100)},field23={random.randint(1, 100)},field24={random.randint(1, 100)},field25={random.randint(1, 100)}"
        write_api.write(bucket, org, data)
        count += 1
        print(f"{data} => {count}")
    except:
        toc = time.perf_counter()
        print(f"A total of {count} records were written in {toc - tic:0.4f} seconds")
        exit()

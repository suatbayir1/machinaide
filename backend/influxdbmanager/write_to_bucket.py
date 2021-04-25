from datetime import datetime
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
import time
import random

token = "-Y8yuCS19k6ZD0FLiVvpY-zcEK4VhbBe6HC7WPKR7Z5X2bkm-Ag2iMJUSDSBOugpG6klF2XEddhCMkHRuJPbsQ=="
org = "machinaide"
bucket = "line-protocol"

client = InfluxDBClient(url="http://localhost:8080", token=token)

write_api = client.write_api(write_options=SYNCHRONOUS)

while True:
    data = f"cpu,host=host1 usage_idle={random.randint(0, 100)},used={random.randint(0,50)}"
    write_api.write(bucket, org, data)
    print(data)
    time.sleep(1)
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
import pandas as pd
import datetime
import random
import time

# You can generate a Token from the "Tokens Tab" in the UI
token = "-Y8yuCS19k6ZD0FLiVvpY-zcEK4VhbBe6HC7WPKR7Z5X2bkm-Ag2iMJUSDSBOugpG6klF2XEddhCMkHRuJPbsQ=="
org = "machinaide"
bucket = "Ermetal"

# http://localhost:8080
client = InfluxDBClient(url="https://vmi474601.contaboserver.net:8080", token=token)

write_api = client.write_api(write_options=SYNCHRONOUS)

press31 = pd.read_csv("Pres31_DB1.csv")

measurement_list = ["Press030", "Press031", "Press032", "Press033", "Press034", "Robot"]


def iterate_rows():
    redundant_keys = ["name", "time"]

    for _, row in press31.iterrows():
        message = ""
        for key, value in row.items():
            if key not in redundant_keys:
                message += f"{key}={value},"
        # print(message[:-1])

        for measurement in measurement_list:
            data = f"{measurement},host=vmi474601 {message[:-1]}"
            print(data)
            write_api.write(bucket, org, data)
        time.sleep(1)
    return True

while True:
    print("start again")
    result = iterate_rows()
    print("finished")
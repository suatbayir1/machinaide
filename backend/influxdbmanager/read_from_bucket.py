from datetime import datetime
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
import time
import random


class InfluxReader():
    def __init__(self):
        self.token = "-Y8yuCS19k6ZD0FLiVvpY-zcEK4VhbBe6HC7WPKR7Z5X2bkm-Ag2iMJUSDSBOugpG6klF2XEddhCMkHRuJPbsQ=="
        self.org = "machinaide"
        self.bucket = "kafka-telegraf"
        self.client = InfluxDBClient(url = "http://localhost:8080", token = self.token)
        self.query_api = self.client.query_api()
        self.write_api = self.client.write_api(write_options = SYNCHRONOUS)
    
    def get_data_from_influxdb(self):
        query = """
            from(bucket: "kafka-telegraf")
            |> range(start: -1m)
            |> filter(fn: (r) => r["_measurement"] == "cpu")
            |> filter(fn: (r) => r["_field"] == "usage_idle" or r["_field"] == "used")
            |> yield(name: "mean")
        """

        return self.client.query_api().query(org = self.org, query = query)
    
    def write_data_to_influxdb(self, values):
        for table in values:
            for record in table.records:
                # print(f"{record.get_measurement()}")
                print(record.host)
    
    def read_and_write_data_to_influxdb(self):
        values = self.get_data_from_influxdb()
        self.write_data_to_influxdb(values)

reader = InfluxReader()


while True:
    reader.read_and_write_data_to_influxdb()
    time.sleep(60)
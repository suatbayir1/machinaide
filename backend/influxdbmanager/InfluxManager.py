from datetime import datetime
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
import time
import random
from pykafka import KafkaClient

class KafkaManager():
    def __init__(self):
        self.client = KafkaClient(hosts = "localhost:9092")
        self.topic = self.client.topics["telegraf"]
        self.producer = self.topic.get_sync_producer()

    def send_message(self, values):
        for table in values:
            for record in table.records:
                timestamp = int(datetime.timestamp(record.get_time()))
                message = f"{record.get_measurement()},host=host1 {record.get_field()}={record.get_value()}".encode(encoding="UTF-8")
                self.producer.produce(message)
                print(message)

class InfluxManager():
    def __init__(self):
        self.token = "-Y8yuCS19k6ZD0FLiVvpY-zcEK4VhbBe6HC7WPKR7Z5X2bkm-Ag2iMJUSDSBOugpG6klF2XEddhCMkHRuJPbsQ=="
        self.org = "machinaide"
        self.bucket = "kafka-telegraf"
        self.client = InfluxDBClient(url = "http://localhost:8080", token = self.token)
        self.query_api = self.client.query_api()
        self.write_api = self.client.write_api(write_options = SYNCHRONOUS)
    
    def get_data_from_influxdb(self):
        query = """
            from(bucket: "system")
            |> range(start: -1m)
            |> filter(fn: (r) => r["_measurement"] == "mem")
            |> filter(fn: (r) => r["_field"] == "available" or r["_field"] == "active" or r["_field"] == "free" or r["_field"] == "available_percent" or r["_field"] == "used" or r["_field"] == "used_percent")
            |> yield(name: "mean")
        """

        return self.client.query_api().query(org = self.org, query = query)
    
influxManager = InfluxManager()
kafkaManager = KafkaManager()

while True:
    values = influxManager.get_data_from_influxdb()
    kafkaManager.send_message(values)
    time.sleep(60)
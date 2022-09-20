from datetime import datetime
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
import time
import random
from pykafka import KafkaClient
import config

class InfluxManager:
    def __init__(self):
        self.token = config.INFLUXDB_CLIENT["TOKEN"]
        self.org = config.INFLUXDB_CLIENT["ORG"]
        self.client = InfluxDBClient(url = config.INFLUXDB_CLIENT["URL"], token = self.token, verify_ssl = False)
        self.query_api = self.client.query_api()
        self.write_api = self.client.write_api(write_options = SYNCHRONOUS)
    
    @staticmethod
    def create_flux_query(params):
        measurements = ''
        for measurement in params["measurements"]:
            measurements = measurements + f'r["_measurement"] == "{measurement}" or '

        fields = ''
        for field in params["fields"]:
            fields = fields + f'r["_field"] == "{field}" or '

        query = f"""
            from(bucket: "{params["bucket"]}")
            |> range(start: {params["startTimestamp"]}, stop: {params["endTimestamp"]})
            |> filter(fn: (r) => {measurements[:-4]})
            |> filter(fn: (r) => {fields[:-4]})
            |> aggregateWindow(every: {params["period"]}, fn: {params["function"]}, createEmpty: false)
            |> yield(name: "mean")
        """

        return query

    def get_data_from_influxdb(self, query):
        print("data from influxdb")
        values = self.client.query_api().query(org = self.org, query = query)

        print("values", values)

        data = []
        for table in values:
            for record in table.records:
                timestamp = int(datetime.timestamp(record.get_time()))
                dt_object = datetime.fromtimestamp(timestamp)
                data.append({
                    "measurement": record.get_measurement(),
                    "field": record.get_field(),
                    "value": record.get_value(),
                    "timestamp": timestamp
                })
        return data
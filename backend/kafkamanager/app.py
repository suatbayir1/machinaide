from pykafka import KafkaClient
# from data import get_sensor_data
import json
import time

client = KafkaClient(hosts = "localhost:9092")
topic = client.topics["sensors_data"]
producer = topic.get_sync_producer()

while True:
    message = {
        "name": "test",
        "value": 1
    }
    # message = get_sensor_data()
    message = json.dumps(message).encode("utf-8")
    producer.produce(message)
    print(message)
    time.sleep(1)
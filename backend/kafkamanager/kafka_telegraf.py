from pykafka import KafkaClient
from data import get_sensor_data
import json
import time
import random

client = KafkaClient(hosts = "localhost:9092")
topic = client.topics["Press31-DB1"]
producer = topic.get_sync_producer()

while True:
    message = f"cpu usage_idle={random.randint(0, 100)},used={random.randint(0,50)}".encode(encoding="UTF-8")
    # message = json.dumps(message).encode("utf-8")
    producer.produce(message)
    print(message)
    time.sleep(1)
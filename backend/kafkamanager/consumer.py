from kafka import KafkaConsumer, TopicPartition
import time

topic = "sensors_data"
late_time = int(time.time()) * 1000
middle_time = late_time - 1000
early_time = late_time - 2000

tp = TopicPartition(topic, 0)

# To consume latest messages and auto-commit offsets
consumer = KafkaConsumer('sensors_data',
                         auto_offset_reset='latest', 
                         enable_auto_commit=False,
                         bootstrap_servers=['localhost:9092'])

offsets = consumer.offsets_for_times({tp: early_time})


for message in consumer:
    print(message)
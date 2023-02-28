import argparse
from pykafka import KafkaClient
from pykafka.common import OffsetType
import json
import time

field_counts = {}

class KafkaConsumer():
    def __init__(self, host, port):
        self.client = KafkaClient(hosts = f"{host}:{port}")

    def getMessage(self, topic):
        print(f"Consumer ===> {topic}")
        for i in self.client.topics[topic].get_simple_consumer(
            auto_offset_reset=OffsetType.LATEST,
            reset_offset_on_start=True
        ):
            latest_message = i.value.decode()

            field = latest_message.split()[1].split('=')[0]
            
            # try:
            #     field_counts[field] += 1
            # except:
            #     field_counts[field] = 1
            # if field_counts[field] == 1200:
            #     return field_counts
            # if "Rob_ctr" in latest_message:
                # print(latest_message)
            if "Pres-U_L3_L1" in latest_message:
                print(latest_message)
            # print(i)

def parse_args():
    parser = argparse.ArgumentParser(description='Parameters that can be sent')
    parser.add_argument('--host', type=str, required=False, default='localhost', help='Hostname of Kafka')
    parser.add_argument('--port', type=int, required=False, default=9092, help='Port of Kafka')
    parser.add_argument('--topic', type=str, required=False, default='Pres31-Energy_DB', help='Topic name to send data')
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    kafkaConsumer = KafkaConsumer(args.host, args.port)
    start = time.perf_counter()
    field_counts = kafkaConsumer.getMessage(args.topic)
    end = time.perf_counter()
    print(f"{end-start:0.4f} seconds")
    # with open("Pres31-AlarmlarDB.json", "w") as f:
    #     json.dump(field_counts, f)

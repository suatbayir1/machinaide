import argparse
from pykafka import KafkaClient
from pykafka.common import OffsetType

class KafkaConsumer():
    def __init__(self, host, port):
        self.client = KafkaClient(hosts = f"{host}:{port}")

    def getMessage(self, topic):
        print(f"Consumer ===> {topic}")
        for i in self.client.topics[topic].get_simple_consumer(
            auto_offset_reset=OffsetType.LATEST,
            reset_offset_on_start=True
        ):
            # print(i.value.decode())
            print(i.value, i.timestamp)
    
def parse_args():
    parser = argparse.ArgumentParser(description='Parameters that can be sent')
    parser.add_argument('--host', type=str, required=False, default='localhost', help='Hostname of Kafka')
    parser.add_argument('--port', type=int, required=False, default=9092, help='Port of Kafka')
    parser.add_argument('--topic', type=str, required=False, default='sensors_data', help='Topic name to send data')
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    kafkaConsumer = KafkaConsumer(args.host, args.port)
    kafkaConsumer.getMessage(args.topic)

import json
import time
import random
import argparse
import sys
sys.path.insert(1, '/home/machinaide/backend')
from application.model.DigitalTwinModel import DigitalTwinModel
from flask import Flask, jsonify, request, Response
from flask_classful import FlaskView, route
from pykafka import KafkaClient

class KafkaProducer():
    def __init__(self, host = 'localhost', port = 9092):
        self.client = KafkaClient(hosts = f"{host}:{port}")
        self.dtModel = DigitalTwinModel()
        self.createTopicsAndProducers()

    def createTopicsAndProducers(self):
        hierarchy = self.dtModel.get_all()
        topicList = []
        self.producers = []

        for factory in hierarchy:
            for machine in factory["machines"]:
                for component in machine["contents"]:
                    if component["@type"] == "Relationship":
                        topicList.append(component["name"])

        for topic in topicList:
            kafkaTopic = self.client.topics[topic]
            self.producers.append({ topic: kafkaTopic.get_sync_producer() })

    def send_message(self, topic, message):
        try:
            for producer in self.producers:
                if topic in producer:
                    currentProducer = producer[topic]

            if not currentProducer:
                return 404

            message = json.dumps(message).encode(encoding="UTF-8")

            currentProducer.produce(message)
            return message
        except:
            return False

    def getMessage(self, topic):
        def events():
            for i in self.client.topics[topic].get_simple_consumer(
                auto_offset_reset=OffsetType.LATEST,
                reset_offset_on_start=True
            ):
                print(f"consumer: {i.value.decode()}")
                yield 'data:{0}\n\n'.format(i.value.decode())
        return Response(events(), mimetype = "text/event-stream")


class KafkaConsumer(FlaskView):
    def __init__(self, host = 'localhost', port = 9092):
        self.client = KafkaClient(hosts = f"{host}:{port}")

    def getMessage(self, topic):
        def events():
            for i in self.client.topics[topic].get_simple_consumer(
                auto_offset_reset=OffsetType.LATEST,
                reset_offset_on_start=True
            ):
                print(f"consumer: {i.value.decode()}")
                yield 'data:{0}\n\n'.format(i.value.decode())
        return Response(events(), mimetype = "text/event-stream")

class ProducerHandler(FlaskView):
    def __init__(self):
        self.kafkaProducer = KafkaProducer()

    def index(self):
        return {"msg": "index"}

    @route("sendMessage/<topic>", methods = ["POST"])
    def sendMessage(self, topic):
        try:
            message = self.kafkaProducer.send_message(topic, request.json)

            if message == 404:
                return {"msg": "Could not be found desired topic name"}
            elif message == False:
                return {"msg": "Unexpected error occurred"}

            return {"msg": message}
        except:
            return {"msg": "error"}


def parse_args():
    parser = argparse.ArgumentParser(description='Parameters that can be sent')
    parser.add_argument('--host', type=str, required=False, default='localhost', help='Hostname of Kafka')
    parser.add_argument('--port', type=int, required=False, default=9092, help='Port of Kafka')
    parser.add_argument('--topic', type=str, required=False, default='Press030', help='Topic name to send data')
    return parser.parse_args()

app = Flask(__name__)
ProducerHandler.register(app, route_base = '/')
KafkaConsumer.register(app, route_base = '/consumer/')

if __name__ == "__main__":
    args = parse_args()
    app.run(debug = True, port = 9999)
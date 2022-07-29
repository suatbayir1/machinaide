from mlhelpers.mlwrappers import KafkaHelper

helper = KafkaHelper((10,0), ["vmi515134.contaboserver.net:9092"])

measurement_sensor_dict = {
    "msr1": ["snsr1", "snsr2"],
    "msr2": ["snsr3"],
    "msr3": ["snsr4", "snsr5"]
}

helper.set_topics(measurement_sensor_dict)
helper.consume()
#!/bin/sh

PROJECT_FOLDER=/home/machinaide


# start API
cd $PROJECT_FOLDER/backend
nohup python3 main.py &

# influx service
cd $PROJECT_FOLDER/influxdb
nohup bin/$(uname -s | tr '[:upper:]' '[:lower:]')/influxd &

# chronograph ui
cd $PROJECT_FOLDER/influxdb/ui
nohup yarn start &

# zookeeper
cd /opt/kafka_2.13-2.8.0
nohup bin/zookeeper-server-start.sh config/zookeeper.properties &

# kafka
cd /opt/kafka_2.13-2.8.0
nohup JMX_PORT=8004 bin/kafka-server-start.sh config/server.properties &
import os

MAX_WORKERS = 4
MAX_TASKS = 10

AUTOML_BATCH_SIZES = [16]
AUTOML_EPOCHS = [1]
AUTOML_LSTM_UNITS = [16]
AUTOML_DROPOUT = [0.1]
AUTOML_VECTOR_LENGTH = 20

MONGO_API_URL = os.getenv('MONGO_API_URL')
MONGO_ALERT_URL = os.getenv('MONGO_ALERT_URL')
MODELDIR = os.getenv('MODELDIR')
AUTO_SETTINGS_DIR = os.getenv('AUTO_SETTINGS_DIR')

ML_KAFKA_WORKER_COUNT = os.getenv('ML_KAFKA_WORKER_COUNT')
ML_KAFKA_TOPIC = os.getenv('ML_KAFKA_TOPIC')
ML_KAFKA_SERVERS = os.getenv('ML_KAFKA_SERVERS')
ML_KAFKA_SERVERS = ML_KAFKA_SERVERS.split(";")

ML_INFLUX_VERSION = os.getenv("ML_INFLUX_VERSION")

POST_TRAINING_INSERT_URL = MONGO_API_URL + "/insertPostTrainingData"
CELL_URL = MONGO_API_URL + "/postModelData"
UPDATE_CELL_URL = MONGO_API_URL + "/updateModelData"
GET_POST_TRAINING_URL = MONGO_API_URL + "/getPostTrainingData/"

GET_FAILURE_URL = MONGO_ALERT_URL + "/returnFailures"




# CELL_URL = "http://192.168.1.105:7392/postModelData"
G_ALGS = {
    "AD": ["LSTM"],
    "RUL": [],
    "FP": ["Weibull"]
}

G_INFO = {
    "Classes": G_ALGS,
    "Parameters": {
        "LSTM": {
            "Epochs": {
                "Type": "Number",
                "Value": 100
            },

            "Input Vector Size": {
                "Type": "Number",
                "Value": 20
            },

            "Output Vector Size": {
                "Type": "Number",
                "Value": 1
            },
            
            "Scaling-Max": {
                "Type": "Number",
                "Value": 1
            },
            
            "Scaling-Min": {
                "Type": "Number",
                "Value": -1
            }
        },

        "Weibull": {
            "Group With": {
                "Type": "Type",
                "Value": "min",
                "Items": ["min", "max"]
            }
        }



        # "ARIMA": {
        #     "Autoregressive Term (p)": {
        #         "Type": "Number",
        #         "Value": 0
        #     },

        #     "Differencing Term (d)": {
        #         "Type": "Number",
        #         "Value": 0
        #     },

        #     "Moving Average Term (q)": {
        #         "Type": "Number",
        #         "Value": 0
        #     },

        #     "max_p": {
        #         "Type": "Number",
        #         "Value": 0,
        #     },

        #     "max_q": {
        #         "Type": "Number",
        #         "Value": 0
        #     },

        #     "Out of Sample Size": {
        #         "Type": "Number",
        #         "Value": 0
        #     }

        # }
    }
}

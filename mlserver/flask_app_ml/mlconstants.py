import os

MAX_WORKERS = 4
MAX_TASKS = 10

# AUTOML_BATCH_SIZES = [32, 64, 128]
# AUTOML_EPOCHS = [100, 200]
# AUTOML_LSTM_UNITS = [50,150,200,250]
# AUTOML_DROPOUT = [0.2, 0.4, 0.6, 0.8]
# RUL_SEQUENCE_LENGTH = 50
# AUTOML_VECTOR_LENGTH = 25

AUTOML_BATCH_SIZES = [32]
AUTOML_EPOCHS = [10]
AUTOML_LSTM_UNITS = [5]
AUTOML_DROPOUT = [0.2]
RUL_SEQUENCE_LENGTH = 50
AUTOML_VECTOR_LENGTH = 25


MONGO_API_URL = os.getenv('MONGO_API_URL')
MONGO_ALERT_URL = os.getenv('MONGO_ALERT_URL')
MODELDIR = os.getenv('MODELDIR')
AUTO_SETTINGS_DIR = os.getenv('AUTO_SETTINGS_DIR')
VAE_SENSOR_DIR = os.getenv('VAE_SENSOR_DIR')
VAE_HPS_DIR = os.getenv('VAE_HPS_DIR')
AD_SENSOR_DIR = os.getenv('AD_SENSOR_DIR')
AD_HPS_DIR = os.getenv('AD_HPS_DIR')

ML_KAFKA_WORKER_COUNT = os.getenv('ML_KAFKA_WORKER_COUNT')
ML_KAFKA_TOPIC = os.getenv('ML_KAFKA_TOPIC')
ML_KAFKA_SERVERS = os.getenv('ML_KAFKA_SERVERS')
ML_KAFKA_SERVERS = ML_KAFKA_SERVERS.split(";")

ML_INFLUX_VERSION = os.getenv("ML_INFLUX_VERSION")

POST_TRAINING_INSERT_URL = MONGO_API_URL + "/insertPostTrainingData"
CELL_URL = MONGO_API_URL + "/postModelData"
UPDATE_CELL_URL = MONGO_API_URL + "/updateModelData"
GET_POST_TRAINING_URL = MONGO_API_URL + "/getPostTrainingData/"
INSERT_BASIC_URL = MONGO_API_URL + "/postBasicModel"

GET_FAILURE_URL = MONGO_ALERT_URL + "/returnFailures"

# VAESENSORDIR = "/root/BackUp_Pianism/pianism/custom-ml/server/VAESettings/sensors/"
# VAEHPSDIR = "/root/BackUp_Pianism/pianism/custom-ml/server/VAESettings/hps/"
# ADSENSORDIR = "/root/BackUp_Pianism/pianism/custom-ml/server/ADSettings/sensors/"
# ADHPSDIR = "/root/BackUp_Pianism/pianism/custom-ml/server/ADSettings/hps/"




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

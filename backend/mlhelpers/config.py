import os

# from mlserver.flask_app_ml.mlconstants import VAE_HPS_DIR

mongo = dict(
    MONGO_URI = "mongodb://machinaide:erste2020@localhost:27017/",
    DATABASE = "machinaide"
)

authentication = dict(
    SECRET_KEY = "machinaidesecretkey",
    USER_NAME = "machinaide",
    USER_PASSWORD = "erste2020",
    EMAIL_SENDER = "email.machinaide@gmail.com"
)

# INFLUXDB_CLIENT = dict(
#     URL = "http://localhost:8080",
#     TOKEN = "-Y8yuCS19k6ZD0FLiVvpY-zcEK4VhbBe6HC7WPKR7Z5X2bkm-Ag2iMJUSDSBOugpG6klF2XEddhCMkHRuJPbsQ==",
#     ORG = "machinaide"
# )

INFLUXDB_CLIENT = dict(
    URL = "https://vmi1011403.contaboserver.net:8080",
    TOKEN = "aBnAbLrfPcX4iywnFDb9dVDnss8REjC9JW5sAViCCij7kQC5NBBuNTCt09AYec1jJpyg232L6eLQe--w9P_pzg==",
    ORG = "Machinaide"
)

url = dict(
    BACKEND = "http://127.0.0.1:9632/api/",
    CHRONOGRAPH = "http://localhost:8080/",
)

G_ALGS = {
    "Predictors": ["LSTM"],
    "Classifiers": []
}


VAE_HPS_DIR = os.getcwd() + "/mlhelpers/VAESettings/hps/"
TASK_DIRECTORY = os.getcwd() + "/mlhelpers/HPCTasks/"
VAE_SENSOR_DIR = os.getcwd() +  "/mlhelpers/VAESettings/sensors/"
AUTO_SETTINGS_DIR = os.getcwd() + "/mlhelpers/AutoSettings/"
GETSENSORFROMMAPPING = url["BACKEND"] + "/getSensorFromMapping"
G_ALGS = {
    "Predictors": ["LSTM"],
    "Classifiers": []
}
host_ip = "localhost"
AUTOML_BATCH_SIZES = [32, 64, 128]
AUTOML_EPOCHS = [100, 200]
AUTOML_LSTM_UNITS = [50,150,200,250]
AUTOML_DROPOUT = [0.2, 0.4, 0.6, 0.8]
RUL_SEQUENCE_LENGTH = 50
pof_batch_sizes = [25, 50, 100, 200]
pof_n_epochs = [10, 15, 20, 25]
max_epochs = 5
max_trials = 10
executions_per_trial = 1

flaskserver = "localhost" # "flaskserver"
flask_port = "9632/api/v1.0/metadata"
health_port = "9632/api/v1.0/health"
influx_port = 8086
bootstrap_server = 'localhost:9094'


METAURL = "http://{}:{}/addModelMeta".format(flaskserver, flask_port)
CELLURL = "http://{}:{}/postModelData".format(flaskserver, flask_port)
BASICURL = "http://{}:{}/postBasicModel".format(flaskserver, flask_port)
PUTBASICURL = "http://{}:{}/updateBasicModel/".format(flaskserver, flask_port)
UPDATECELLURL = "http://{}:{}/updateModelData".format(flaskserver, flask_port)
AUTOML_POST_TRIAL_URL = "http://{}:{}/postTrial".format(flaskserver, flask_port)
AUTOML_POST_EXPERIMENT_URL = "http://{}:{}/postExperiment".format(flaskserver, flask_port)
AUTOML_UPDATE_EXPERIMENT_URL = "http://{}:{}/updateExperiment".format(flaskserver, flask_port)
AUTOML_CHANGE_STATUS_URL = "http://{}:{}/changeStatus".format(flaskserver, flask_port)
UPDATEROWURL ='http://{}:{}/updateBasicRow'.format(flaskserver, flask_port)
POSTTRAININGURL = "http://{}:{}/getPostTrainingData/".format(flaskserver, flask_port)
POSTTRAININGINSERTURL= "http://{}:{}/insertPostTrainingData".format(flaskserver, flask_port)
GETFAILURESURL = "http://{}:{}/returnFailures/".format(flaskserver, flask_port)
GETSENSORFROMMAPPING = "http://{}:{}/getSensorFromMapping/".format(flaskserver, flask_port)
GETBASICMODEL = 'http://{}:{}/getBasicModel/'.format(flaskserver, flask_port)
UPDATEBASICROW = 'http://{}:{}/updateBasicRow'.format(flaskserver, flask_port)
ANOMALYURL = 'http://{}:{}/anomaly'.format(flaskserver, flask_port)
celldataurl = "http://{}:{}/postCellData".format(flaskserver, flask_port)
TESTINFERENCEURL= "http://{}:{}/testInference".format(flaskserver, flask_port)
POSTREALANOMALYURL= "http://{}:{}/addAnomalyToMachine/".format(flaskserver, health_port)


models_path = os.getcwd() + "/mlhelpers/Models/"
experiments_path_2 = os.getcwd() + "/mlhelpers/experiments/"
MODELDIR = os.getcwd() + "/mlhelpers/Models/"
AUTOSETTINGSDIR = os.getcwd() + "/mlhelpers/AutoSettings/"
VAESENSORDIR = os.getcwd() + "/mlhelpers/VAESettings/sensors/"
VAEHPSDIR = os.getcwd() + "/mlhelpers/VAESettings/hps/"
ADSENSORDIR = os.getcwd() + "/mlhelpers/ADSettings/sensors/"
ADHPSDIR = os.getcwd() + "/mlhelpers/ADSettings/hps/"
VAEHPSDIR = os.getcwd() + "/mlhelpers/VAESettings/hps/"
VAESENSORDIR = os.getcwd() +  "/mlhelpers/VAESettings/sensors/"
ADHPSDIR = os.getcwd() + "/mlhelpers/ADSettings/hps/"
ADSENSORDIR = os.getcwd() + "/mlhelpers/ADSettings/sensors/"
REPORTDIR = os.getcwd() + "/alerthelpers/printFiles/"
MLSESSIONDIR = os.getcwd() + "/mlhelpers/SessionSettings/"

TICK_SETTINGS = {
  "LAST": "last value",
  "AVG": "average of last 5 value",
  "MAX": "max of last 5 value",
  "MIN": "min of last 5 value",
  "DAVG": "average of last 5 value's differences",
  "DMAX": "max of last 5 value's differences",
  "DMIN": "min of last 5 value's differences"
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

ALERT_MODULE_SETTINGS = {
    "Workers": 1,
    "Topic": "cimtasjco3alerts",
    "KafkaServers": [bootstrap_server]
}


experiments_path_2 = os.getcwd() + "/mlhelpers/experiments/"


#### NLP
influx = dict(
    host = 'https://vmi474601.contaboserver.net:8086',
    orgID = 'd572bde16b31757c',
    dbtoken = "FlviKxQ-RHHWxd1FRkHIc5VwNZuFnP6QTmsJcU6GI7nrd4cuqaTx3cCijZchENMH0zSGuKOew_e4LxW6V09Erw=="
)

math = dict(
    math_symbols = ['>', '>=', '<', '<=', '=', '=='],
    math_symbol_dict = {'>': ' greater than ', 
        '>=': ' greater than or equal to ', 
        '<': ' less than ', 
        '<=': ' less than or equal to ', 
        '=': ' equal to ', 
        '==': ' equal to '
    },
    comparisons = {'GREATER': '>', 'EQUAL': '==', 'LESS': '<'},
    stats = {'MIN': 'min()', 'MAX': 'max()', 'AVG': 'mean()', 'CUR': 'last()'},
)

patterns = dict(
    great_pattern = [[{'LOWER': 'greater'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}], [{'LOWER': 'larger'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}]],
    less_than_pattern = [[{'LOWER': 'less'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}]],
    equal_to_pattern = [[{'LOWER': 'equal'}, {'LOWER': 'to', 'OP' : '?'}, {'POS' : 'NUM'}]],
    greater_than_pattern = [{'LOWER': 'greater'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}],
    larger_than_pattern = [{'LOWER': 'larger'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}],
    min_pattern = [[{'LOWER': 'min'}], [{'LOWER': 'minimum'}], [{'LOWER': 'smallest'}]],
    max_pattern = [[{'LOWER': 'max'}], [{'LOWER': 'maximum'}], [{'LOWER': 'biggest'}]],
    avg_pattern = [[{'LOWER': 'avg'}], [{'LOWER': 'average'}], [{'LOWER': 'mean'}]],
    current_pattern =[[{'LOWER': 'current'}], [{'LOWER': 'last'}]],
)

parts = dict(
    COMP_NAMES = ["yaglama", "anaMotor", "dengeleme", "compName", "sampleComp1", "sampleComp2", "cpu", "diskio"],
    all_maintenance_types = ["Maintenance 1", "Maintenance 2", "Maintenance 3"],
    all_severity_types = ["acceptable", "major", "critical"],
)

constants = dict(
    threshold = 85
)

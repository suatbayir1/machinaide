flaskserver = "localhost" 
flask_port = 6161

reg_model_server = "localhost" 
reg_model_port = 6262

influx_port = 8086

host_ip = "localhost" # '172.31.44.40'

defaultProductID = -1
evalml_timeout = "3 h"
ON_OFF_DATA_MEASUREMENT_NAME = "main_component"

mongo_host = "localhost"

automl_username = "automlClient"
automl_password = "automlPython2021"
automldb = "automl"

mongo_username = "pythonClient"
mongo_password = "chronoPython2021"
metadatadb = "cimtas_new2"

MODELDIR = "/root/BackUp_Pianism/pianism/backend/mlhelpers/Models/"
# MODELDIR = "/root/BackUp_Pianism/pianism/evalml-server/models-test/"

AUTOML_MONGO_URI = 'mongodb://{}:{}@{}:27017/{}'.format(automl_username, automl_password, mongo_host, automldb)
METADATA_MONGO_URI ='mongodb://{}:{}@{}:27017/{}'.format(mongo_username, mongo_password, mongo_host, metadatadb)

GETMACHINEACTIONS = "http://{}:{}/getMachineProducts/".format(flaskserver, flask_port)
GETMACHINEFROMMAPPING = "http://{}:{}/getMachineFromMapping/".format(flaskserver, flask_port)
GETFAILURESURL = "http://{}:{}/returnFailures/".format(flaskserver, flask_port)
GETNOTUSEDSENSORSURL = "http://{}:{}/getSensorsNotUsedInML".format(flaskserver, flask_port)
GETSENSORFROMMAPPING = "http://{}:{}/getSensorFromMapping/".format(flaskserver, flask_port)
BASICURL = "http://{}:{}/postBasicModel".format(flaskserver, flask_port)
AUTOML_POST_NO_DATA_LOG_URL = "http://{}:{}/postNoDataLog".format(flaskserver, flask_port)
AUTOML_POST_NOT_ENOUGH_DATA_LOG_URL = "http://{}:{}/postNotEnoughsDataLog".format(flaskserver, flask_port)
AUTOML_DELETE_DATA_LOG_URL = "http://{}:{}/deleteDataPrepLog/".format(flaskserver, flask_port)
AUTOML_POST_SUCCESS_DATA_LOG_URL = "http://{}:{}/postSuccessDataLog".format(flaskserver, flask_port)
BASICURL = "http://{}:{}/postBasicModel".format(flaskserver, flask_port)
PUTBASICURL = "http://{}:{}/updateBasicModel/".format(flaskserver, flask_port)

POST_REG_EXP = "http://{}:{}/postRegExperiment".format(reg_model_server, reg_model_port)


TICK_SETTINGS = {
  "LAST": "last value",
  "AVG": "average of last 5 value",
  "MAX": "max of last 5 value",
  "MIN": "min of last 5 value",
  "DAVG": "average of last 5 value's differences",
  "DMAX": "max of last 5 value's differences",
  "DMIN": "min of last 5 value's differences"
}

OPERATIONS = {
    "SUBSTRACTION": "-",
    "ADDITION": "+",
    "MULTIPLICATION": "*",
    "DIVISION": "/"
}

EVALML_OBJECTIVES = {
    "ExpVariance" : ["MSE", "R2", "Root Mean Squared Error"],
    "MAE" : ["MSE", "R2", "Root Mean Squared Error"],
    "MaxError": ["MSE", "R2", "Root Mean Squared Error"],
    "Mean Squared Log Error": ["MSE", "R2", "Root Mean Squared Error"],
    "MedianAE": ["MSE", "R2", "Root Mean Squared Error"],
    "MSE": ["R2", "Root Mean Squared Error"],
    "R2": ["MSE", "Root Mean Squared Error"],
    "Root Mean Squared Error": ["MSE", "R2"],
    "Root Mean Squared Log Error": ["MSE", "R2", "Root Mean Squared Error"],
    "Custom ExpVariance" : ["MSE", "R2", "Root Mean Squared Error", "ExpVariance"],
    "Custom MAE" : ["MSE", "R2", "Root Mean Squared Error", "MAE"],
    "Custom MaxError": ["MSE", "R2", "Root Mean Squared Error", "MaxError"],
    "Custom Mean Squared Log Error": ["MSE", "R2", "Root Mean Squared Error", "Mean Squared Log Error"],
    "Custom MedianAE": ["MSE", "R2", "Root Mean Squared Error", "MedianAE"],
    "Custom MSE": ["R2", "Root Mean Squared Error", "MSE"],
    "Custom R2": ["MSE", "Root Mean Squared Error", "R2"],
    "Custom Root Mean Squared Error": ["MSE", "R2", "Root Mean Squared Error"],
    "Custom Root Mean Squared Log Error": ["MSE", "R2", "Root Mean Squared Error", "Root Mean Squared Log Error"],
    "default":  ["MSE", "R2", "Root Mean Squared Error"],
}

mongo = dict(
    MONGO_URI = "mongodb://machinaide:erste2020@localhost:27017/",
    DATABASE = "machinaide"
)
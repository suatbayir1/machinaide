import os

DEFAULT_PRODUCT_ID = "-1"

AUTOML_SETTINGS_DIR = os.getcwd() + "/experiment_settings/"
MODELS_DIR = os.getcwd() + "/models/"

MONGO = dict(
    MONGO_URI = "mongodb://machinaide:erste2020@localhost:27017/",
    DATABASE = "machinaide"
)

INFLUX = dict(
    host = 'https://vmi474601.contaboserver.net:8086',
    orgID = 'd572bde16b31757c',
    dbtoken = "FlviKxQ-RHHWxd1FRkHIc5VwNZuFnP6QTmsJcU6GI7nrd4cuqaTx3cCijZchENMH0zSGuKOew_e4LxW6V09Erw=="
)

API_URL = "https://vmi474601.contaboserver.net/api/v1.0/"

GET_FAILURES_URL = f"{API_URL}failure/getFailures"
POST_MODEL_URL = f"{API_URL}ml/postMLModel"
AUTOML_POST_REG_EXPERIMENT_URL = f"{API_URL}ml/postRULRegExperiment"

OPERATIONS = {
    "SUBSTRACTION": "-",
    "ADDITION": "+",
    "MULTIPLICATION": "*",
    "DIVISION": "/"
}

TICK_SETTINGS = {  
  "LAST": "last value",
  "AVG": "average of last 5 value",
  "MAX": "max of last 5 value",
  "MIN": "min of last 5 value",
  "DAVG": "average of last 5 value's differences",
  "DMAX": "max of last 5 value's differences",
  "DMIN": "min of last 5 value's differences"
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



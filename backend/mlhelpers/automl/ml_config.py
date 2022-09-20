import os
import keras_tuner as kt

DEFAULT_PRODUCT_ID = "-1"
RUL_SEQUENCE_LENGTH = 50

EXPERIMENT_PATH = os.getcwd() + "/experiments"
MODEL_DIR = os.getcwd() + "/models/"
MAX_EPOCHS = 5
MAX_TRIALS = 10
EXECUTIONS_PER_TRIAL = 1

HOST_IP = "localhost"

INFLUX_PORT = 8086
flaskserver = "localhost" 
flask_port = 6161

influx = dict(
    host = "http://127.0.0.1:8080",#'https://vmi474601.contaboserver.net:8086',
    orgID = "7566715625c95d64",# 'd572bde16b31757c',
    dbtoken = "KpDT_gr1Z5YAXrE3WMWpZyvmBT2RtM8KJEU6GSz_MPGKB9zI7Foul5WUfRBSpTpRnG05QqidGRq_PMRp_StMEg==" # "FlviKxQ-RHHWxd1FRkHIc5VwNZuFnP6QTmsJcU6GI7nrd4cuqaTx3cCijZchENMH0zSGuKOew_e4LxW6V09Erw=="
)

api_url = "http://127.0.0.1:9632/api/v1.0/" # "https://vmi474601.contaboserver.net/api/v1.0/"

# NEW VERSION
POST_MODEL_URL = f"{api_url}ml/postMLModel"
UPDATE_MODEL_URL = f"{api_url}ml/updateMLModel/"
GET_FAILURES_URL = f"{api_url}failure/getFailures"
AUTOML_POST_EXPERIMENT_URL = f"{api_url}ml/postExperiment"
AUTOML_CHANGE_STATUS_URL = f"{api_url}ml/changeStatus"
AUTOML_UPDATE_EXPERIMENT_URL = f"{api_url}ml/updateExperiment"
AUTOML_POST_TRIAL_URL = f"{api_url}ml/postTrial"

AUTOML_SETTINGS_DIR = os.getcwd() + "/experiment_settings/"
AUTOML_EXPERIMENTS_DIR = os.getcwd() + "/experiments/"
MODELS_DIR = os.getcwd() + "/models/"


GETFAILURESURL = "http://{}:{}/returnFailures/".format(flaskserver, flask_port)

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

AUTOML_OPTIMIZERS = {
    # "default": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall()], "objective": "val_accuracy"},
    "default": {"compile": ["acc", "MeanSquaredError"], "objective": "val_loss"},
    "auc": {"compile": ["acc", "Precision", "Recall", "AUC"], "objective": kt.Objective("auc", direction="max")},
    "tp": {"compile": ["acc", "Precision", "Recall", "TruePositives"], "objective": kt.Objective("true_positives", direction="max")},
    "fp": {"compile": ["acc", "Precision", "Recall", "FalsePositives"], "objective": kt.Objective("false_positives", direction="min")},
    "fn": {"compile": ["acc", "Precision", "Recall", "FalseNegatives"], "objective": kt.Objective("false_negatives", direction="min")},
    "tn": {"compile": ["acc", "Precision", "Recall", "TrueNegatives"], "objective": kt.Objective("true_negatives", direction="max")},
    "precision": {"compile": ["acc", "Precision", "Recall"], "objective": kt.Objective("precision", direction="max")},
    "recall": {"compile": ["acc", "Precision", "Recall"], "objective": kt.Objective("recall", direction="max")},
    "val_loss": {"compile": ["acc", "Precision", "Recall"], "objective": "val_loss"},
    "val_accuracy": {"compile": ["acc", "Precision", "Recall"], "objective": "val_acc"},
    "accuracy": {"compile": ["acc", "Precision", "Recall"], "objective": "acc"},
    # "accuracy": {"compile": [keras.metrics.BinaryAccuracy(name="acc")], "objective": "acc"},
    "loss": {"compile": ["acc", "Precision", "Recall"], "objective": "loss"},
    "mse": {"compile": ["acc", "Precision", "Recall", "mse"], "objective": "mse"},   
    "custom": {"compile": ["acc", "Precision", "Recall"], "objective": "custom_metric"} 
}

EVALML_OBJECTIVES = {
    "ExpVariance" : [],
    "MAE" : [],
    "MaxError": [],
    "Mean Squared Log Error": [],
    "MedianAE": [],
    "MSE": [],
    "R2": [],
    "Root Mean Squared Error": [],
    "Root Mean Squared Log Error": []    
}
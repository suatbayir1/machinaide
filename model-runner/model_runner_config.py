MONGO = dict(
    MONGO_URI = "mongodb://machinaide:erste2020@localhost:27017/",
    DATABASE = "machinaide"
)

INFLUX = dict(
    host = "http://127.0.0.1:8080",#'https://vmi474601.contaboserver.net:8086',
    orgID = "7566715625c95d64",# 'd572bde16b31757c',
    dbtoken = "KpDT_gr1Z5YAXrE3WMWpZyvmBT2RtM8KJEU6GSz_MPGKB9zI7Foul5WUfRBSpTpRnG05QqidGRq_PMRp_StMEg=="
)

API_URL = "http://127.0.0.1:9632/api/v1.0/"

POST_MODEL_LOG = f"{API_URL}ml/postModelLog"
UPDATE_LAST_DATA_POINT = f"{API_URL}ml/updateLastDataPoint"

MODELS_DIR = "/home/machinaide/project/machinaide/backend/models/"
EVALML_MODELS_DIR = "/home/machinaide/project/machinaide/evalml-server/models/"

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
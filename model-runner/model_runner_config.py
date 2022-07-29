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

POST_MODEL_LOG = f"{API_URL}ml/postModelLog"
UPDATE_LAST_DATA_POINT = f"{API_URL}ml/updateLastDataPoint"

MODELS_DIR = "/home/machinaide/backend/models/"
EVALML_MODELS_DIR = "/home/machinaide/evalml-server/models/"

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
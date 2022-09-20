from mlhelpers.automl.ml_config import AUTOML_SETTINGS_DIR
import json

experiment_name = "manual_test_from_controller"
session_id = "987654"
settings_dir = AUTOML_SETTINGS_DIR + experiment_name + "-" + session_id + ".json"

test_json = {
    "assetName": "TestAsset", 
    "fields": [
        {
            "@id": "Ana_hava_debi_act",
            "name": "Ana_hava_debi_act",
            "minValue": 10,
            "maxValue": 20,
            "parent": "sensor1",
            "type": "Field",
            "displayName": "Ana_hava_debi_act",
            "description": "Ana_hava_debi_act",
            "measurement": "Press031",
            "dataSource": "Ana_hava_debi_act",
            "database": "Ermetal"
        },
        {
            "@id": "Ana_hava_sic_act",
            "name": "Ana_hava_sic_act",
            "minValue": 5,
            "maxValue": 100,
            "parent": "sensor1",
            "type": "Field",
            "displayName": "Ana_hava_sic_act",
            "description": "Ana_hava_sic_act",
            "measurement": "Press031",
            "dataSource": "Ana_hava_sic_act",
            "database": "Ermetal"
        },
        {
            "@id": "Deng_hava_debi_act",
            "name": "Deng_hava_debi_act",
            "minValue": 5,
            "maxValue": 100,
            "parent": "sensor2",
            "type": "Field",
            "displayName": "Deng_hava_debi_act",
            "description": "Deng_hava_debi_act",
            "measurement": "Press031",
            "dataSource": "Deng_hava_debi_act",
            "isFillNullActive": True,
            "defaultValue": "25",
            "isOperationActive": True,
            "operation": "/",
            "operationValue": "1",
            "database": "Ermetal"
        }
    ],
    "minDataPoints": 200, 
    "customMetricEquation": "-", 
    "customMetricDirection": "-",
    "timeout": "2h", 
    "numberOfEpochs": 20, 
    "sessionID": "123456", 
    "experimentName": "test_read_settings", 
    "creator": "aysenur",
    "tunerType": "hyperband", 
    "optimizer": "val_accuracy", 
    "windowLength": 30, 
    "productID": "-1", 
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6Im1hY2hpbmFpZGUiLCJyb2xlIjoiYWRtaW4iLCJleHBpcnlfdGltZSI6MTY1NjQ4NTAzMS4wfQ.vT0qREvrbexmqTkjptyeboYGTKbkDJevAGr0n58VMjc"
}

with open(settings_dir, 'w') as fp:
    json.dump(test_json, fp)
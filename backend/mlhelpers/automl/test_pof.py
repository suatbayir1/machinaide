from POFAutoMLSession import POFAutoMLSession
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

settings = {
    "assetName": "Press031", 
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
    "sessionID": "44556677", 
    "experimentName": "pof_test_read_settings_01_07-2", 
    "creator": "aysenur",
    "tunerType": "hyperband", 
    "optimizer": "val_accuracy", 
    "productID": "-1", 
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6Im1hY2hpbmFpZGUiLCJyb2xlIjoiYWRtaW4iLCJleHBpcnlfdGltZSI6MTY1NzI2NDQ2MS4wfQ.eDdYEN3BeozM3nyVo3PJ12wYtae3VlhtEbmqeHwkcoI"
}
rul = POFAutoMLSession(settings)
rul.run()
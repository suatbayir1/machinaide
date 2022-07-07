from RULAutoMLSession import RULAutoMLSession
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

settings = {
    "assetName": "Press030",
    "type": "sensor",
    "database": "Ermetal",
    "measurement": "Press030",# "Press030",
    "field": "Ana_hava_debi_act_1",
    "minDataPoints": 200,
    "customMetricEquation": "",
    "customMetricDirection": "",
    "timeout": "2h",
    "numberOfFeatures": "",
    "numberOfEpochs": "",
    "sessionID": "",
    "experimentName": "test_experiment",
    "creator": "aysenur",
    "dbSettings": "",
    "startTime": "",
    "tunerType": "",
    "optimizer": "accuracy",
}
rul = RULAutoMLSession(settings)
rul.run()
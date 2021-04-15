from core.database.MongoDB import MongoDB
from bson.json_util import loads, dumps
from bson import ObjectId
import json
from application.helpers.Helper import cursor_to_json
from random import randrange

class PredictionModel():
    def __init__(self):
        self.db = MongoDB()
        self.collection = "predictions"

    def get_all_prediction(self):
        return self.db.find(self.collection)

    def get_prediction_by_id(self, payload):
        where = {
            'modelID': payload["modelID"]
        }
        return self.db.find(self.collection, where)

    def get_prediction_info(self, payload):
        where = {
            'modelID': payload["modelID"]
        }
        return self.db.find("prediction_info", where)

    def add_prediction(self):
        algorithms = ["K-means", "Isolation Forest", "ARIMA"]

        for i in range(1, 11):

            data = {
                "explanation": f"explanation {i}",
                "feedback": f"neutral",
                "modelID": f"modelID {i}",
                "modelName": f"modelName {i}",
                "modelVersion": 1,
                "time": "2021-02-24T01:58:01Z",
                "hardwares": f"hardwares {i}",
                "daysToFail": f"{i}",
                "value": 0.60,
                "confidence": "55",
                "algorithm": algorithms[randrange(3)]
            }
            
            self.db.insert_one(self.collection, data)

        return "added_prediction"

    def add_prediction_info(self):
        data = {
            "modelID": "modelID 1",
            "createdDate": "2021-01-27T01:58:01Z",
            "creator": "creator@gmail.com",
            "releatedHardware": ["hardware1", "hardware2", "hardware3"],
            "success": "",
            "totalFb": {
                "negative": 1,
                "neutral": 2,
                "positive": 3
            }
        }

        return self.db.insert_one("prediction_info", data)
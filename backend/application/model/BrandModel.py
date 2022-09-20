from core.database.MongoDB import MongoDB
from bson.json_util import loads, dumps
import json
from application.helpers.Helper import cursor_to_json
from bson import ObjectId

class BrandModel():
    def __init__(self):
        self.db = MongoDB()
        self.collection = "brand"

    def add(self, payload):
        try:
            if not self.is_exists(payload["brandName"], payload["modelName"]):
                self.db.insert_one(self.collection, payload)
                return True
            return 409
        except:
            return False 

    def is_exists(self, brandName, modelName):
        try:
            where = {
                "brandName": brandName,
                "modelName": modelName
            }
            
            return cursor_to_json(self.db.find(self.collection, where))
        except:
            return False

    def get(self, payload):
        try:
            where = {
                "type": payload["type"]
            }

            return self.db.find(self.collection, where)
        except:
            return False

    def delete(self, payload):
        try:
            where = {
                "_id": ObjectId(payload["brandId"])
            }

            return self.db.delete_one(self.collection, where)
        except:
            return False
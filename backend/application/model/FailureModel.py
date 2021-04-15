from core.database.MongoDB import MongoDB
from bson.json_util import loads, dumps
from bson import ObjectId
import json
from application.helpers.Helper import cursor_to_json

class FailureModel():
    def __init__(self):
        self.db = MongoDB()
        self.collection = "failures"

    def get_all_failures(self):
        return self.db.find(self.collection)

    def add_failure(self, payload):
        return self.db.insert_one(self.collection, payload)

    def is_failure_exist(self, payload):
        return cursor_to_json(self.db.find(self.collection, payload))

    def update_failure(self, payload):
        try:
            recordId = ObjectId(payload["recordId"])
            del payload["recordId"]

            updateData = {
                '$set': payload
            }

            where = {
                "_id": recordId
            }

            return self.db.update_one(self.collection, updateData, where)
        except:
            return False

    def remove_failure(self, payload):
        try:
            where = {
                "_id": ObjectId(payload["recordId"])
            }

            return self.db.delete_one(self.collection, where)
        except:
            return False
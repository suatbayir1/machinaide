from core.database.MongoDB import MongoDB
from bson.json_util import loads, dumps
from bson import ObjectId
import json
from application.helpers.Helper import cursor_to_json

class MaintenanceModel():
    def __init__(self):
        self.db = MongoDB()
        self.collection = "maintenance"

    def get_all_maintenance(self):
        return self.db.find(self.collection)

    def add_maintenance(self, payload):
        return self.db.insert_one(self.collection, payload)

    def update_maintenance(self, payload):
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
            False

    def remove_maintenance(self, payload):
        try:
            where = {
                "_id": ObjectId(payload["recordId"])
            }

            return self.db.delete_one(self.collection, where)
        except:
            return False

    def is_maintenance_exist(self, payload):
        return cursor_to_json(self.db.find(self.collection, payload))

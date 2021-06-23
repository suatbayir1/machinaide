from core.database.MongoDB import MongoDB
from bson.json_util import loads, dumps
from bson import ObjectId
import json
from application.helpers.Helper import cursor_to_json

class GeneralModel():
    def __init__(self):
        self.db = MongoDB()
        self.reports_col = "reports"

    def new_report(self, payload):
        try:
            return self.db.insert_one(self.reports_col, payload)
        except:
            return False

    def get_reports(self):
        return self.db.find(self.reports_col)

    def delete_report(self, payload):
        try:
            where = {
                "_id": ObjectId(payload["recordId"])
            }

            return self.db.delete_one(self.reports_col, where)
        except:
            return False

    def update_report(self, payload):
        try:
            recordId = ObjectId(payload["recordId"])
            del payload["recordId"]

            updateData = {
                '$set': payload
            }

            where = {
                "_id": recordId
            }

            return self.db.update_one(self.reports_col, updateData, where)
        except:
            False
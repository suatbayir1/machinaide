from core.database.MongoDB import MongoDB
from bson.json_util import loads, dumps
from bson import ObjectId
import json
from application.helpers.Helper import cursor_to_json

class HealthAssessmentModel():
    def __init__(self):
        self.db = MongoDB()
        self.collection = "health_assessment"
    
    def get_all_anomalies(self):
        return self.db.find(self.collection)

    def get_machine_anomalies(self, where):
        return self.db.find_one(self.collection, where)

    def add_anomaly(self, payload, where):
        return self.db.update_one(self.collection, payload, where)

    def delete_anomaly(self, payload, where):
        return self.db.update_one(self.collection, payload, where)
    
    def update_anomaly_feedback(self, payload, where, array_filters):
        return self.db.update_one_feedback(self.collection, payload, where, array_filters)

    def get_evidently_report(self, where):
        return self.db.find_one("evidently_reports", where)
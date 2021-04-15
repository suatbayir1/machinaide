from core.database.MongoDB import MongoDB
from bson.json_util import loads, dumps
from bson import ObjectId
import json
from application.helpers.Helper import cursor_to_json
from random import randrange

class LogModel():
    def __init__(self):
        self.db = MongoDB()
        self.collection = "logs"

    def get_logs(self, payload, skip, limit):
        return self.db.find_skip_limit(self.collection, payload, skip, limit)
    
    def get_logs_count(self, payload):
        return self.db.count(self.collection, payload)
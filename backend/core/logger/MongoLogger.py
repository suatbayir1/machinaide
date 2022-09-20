import logging
import datetime
from core.database.MongoDB import MongoDB


class MongoLogger():
    def __init__(self):
        self.db = MongoDB()
        self.collection = "logs"

    def add_log(self, log_type, ip, username, request_type, endpoint, payload, message, status):
        time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        data = {
            "log_type": log_type,
            "ip": ip,
            "username": username,
            "request_type": request_type,
            "endpoint": endpoint,
            "payload": payload,
            "message": message,
            "status": status,
            "time": time
        }

        self.db.insert_one(self.collection, data)

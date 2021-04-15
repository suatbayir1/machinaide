from core.database.MongoDB import MongoDB
from bson.json_util import loads, dumps
import json
from application.helpers.Helper import cursor_to_json
from werkzeug.security import generate_password_hash, check_password_hash

class AuthenticationModel():
    def __init__(self):
        self.db = MongoDB()
        self.collection = "user"

    def add_user(self, payload):
        is_user_exists = self.is_user_exists(payload["username"])

        if not is_user_exists:
            payload["password"] = generate_password_hash(payload["password"])
            self.db.insert_one(self.collection, payload)
            return True
        return False

    def is_user_exists(self, username):
        filter = {
            "username": username
        }

        return cursor_to_json(self.db.find(self.collection, filter))
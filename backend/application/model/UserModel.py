from core.database.MongoDB import MongoDB
from bson.json_util import loads, dumps
from bson import ObjectId
import json
from application.helpers.Helper import cursor_to_json
from random import randrange

class UserModel():
    def __init__(self):
        self.db = MongoDB()
        self.collection = "user"

    def get_all(self):
        filter = {
            'password': False
        }

        return cursor_to_json(self.db.find_by_columns(self.collection, {}, filter))

    def delete(self, id):
        try:
            where = {
                "_id": ObjectId(id)
            }

            return self.db.delete_one(self.collection, where)
        except:
            return False

    def get_user_by_username(self, username):
        try:
            collection = "user"

            where = {
                "username": username
            }

            return self.db.find_one(collection, where)
        except:
            return False

    def is_user_already_exist(self, payload):
        return cursor_to_json(self.db.find(self.collection, payload))

    def update(self, payload):
        try:
            where = {
                "_id": ObjectId(payload["oid"])
            }

            del payload["oid"]

            update_data = {
                '$set': payload
            }

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def add_user_to_organization(self, payload):
        try:
            where = {
                "username": payload["name"]
            }

            update_data = {
                '$push': {'organizations': payload["org"]}
            }

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def remove_user_from_organization(self, payload):
        try:
            where = {
                "username": payload["name"]
            }

            update_data = {
                '$pull': {'organizations': { 'id': payload["orgID"]}}
            }

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def remove_organization_from_all_users(self, payload):
        try:
            update_data = {
                '$pull': {'organizations': { 'id': payload["orgID"]}}
            }

            return self.db.update_many(self.collection, update_data)
        except:
            return False

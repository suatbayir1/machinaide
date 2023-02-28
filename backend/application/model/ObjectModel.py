from core.database.MongoDB import MongoDB
from bson.json_util import loads, dumps
import json
from application.helpers.Helper import cursor_to_json
from bson import ObjectId

class ObjectModel():
    def __init__(self):
        self.db = MongoDB()
        self.collection = "object_pool"

    def save_component_object(self, payload):
        where = {
            "name": payload["name"]
        }

        update_data = {
            '$set': payload
        }

        return self.db.update_one(self.collection, update_data, where, False)

    def save_as_component_object(self, payload):
        collection = "object_pool"

        where = {
            "name": payload["name"]
        }

        isExists = cursor_to_json(self.db.find(collection, where))

        if not isExists:
            return self.db.insert_one(collection, payload)
        else:
            return False

    def get_object_pool(self):
        collection = "object_pool"
        return self.db.find(collection)


    def remove_object(self, payload):
        data = cursor_to_json(self.db.find(self.collection))
        new_children = []

        for record in data:
            if "children" in record:
                for child in record["children"]:
                    if child['name'] != payload['name']:
                        new_children.append(child)


                where = {
                    'name': record['name']
                }

                if not new_children:
                    self.db.delete_one(self.collection, where)
                else:
                    update_data = {
                        '$set': {
                            'name': record['name'],
                            'children': new_children
                        }
                    }

                    self.db.update_one(self.collection, update_data, where, False)
            else:
                if record['name'] == payload['name']:
                    where = {
                        'name': record['name']
                    }

                    self.db.delete_one(self.collection, where)
        return True

    def delete_component_model(self, payload):
        try:
            where = {
                "_id": ObjectId(payload["id"])
            }

            return self.db.delete_one(self.collection, where)
        except:
            return False
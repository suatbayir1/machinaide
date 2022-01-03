from pymongo import MongoClient
import config

class MongoDB():
    def __init__(self):
        self.client = MongoClient(config.mongo["MONGO_URI"])
        self.db = self.client[config.mongo["DATABASE"]]

    def find(self, collection, filter = {}):
        return self.db[collection].find(filter)

    def find_one(self, collection, filter = {}):
        return self.db[collection].find_one(filter)

    def find_by_columns(self, collection, filter = {}, columns = {}):
        return self.db[collection].find(filter, columns)

    def find_skip_limit(self, collection, filter = {}, skip = 0, limit = 10):
        return self.db[collection].find(filter).limit(limit).skip(skip)

    def aggregate(self, collection, pipeline = []):
        return self.db[collection].aggregate(pipeline)

    def get_collection_list(self):
        return self.db.collection_names()

    def insert_one(self, collection, data):
        return self.db[collection].insert_one(data)

    def insert_many(self, collection, data):
        return self.db[collection].insert_many(data)
    
    def update_one(self, collection, data, filter = {}, upsert = True):
        return self.db[collection].update_one(filter, data, upsert)

    def update_many(self, collection, data, filter = {}, upsert = True):
        return self.db[collection].update_many(filter, data, upsert)

    def delete_many(self, collection, filter = {}):
        return self.db[collection].delete_many(filter)

    def delete_one(self, collection, filter = {}):
        return self.db[collection].delete_one(filter)

    def count(self, collection, filter = {}):
        return self.db[collection].find(filter).count()
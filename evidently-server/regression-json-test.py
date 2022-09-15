import json
from pymongo import MongoClient

with open("./classification_result.json") as file:
    data = json.load(file)

print(data.keys())

MONGO = dict(
    MONGO_URI = "mongodb://machinaide:erste2020@localhost:27017/",
    DATABASE = "machinaide"
)

client = MongoClient(MONGO["MONGO_URI"])
db = client[MONGO["DATABASE"]]
col = db["evidently_reports"]

x = col.insert_one(data)
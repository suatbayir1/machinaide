import pyodbc 
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from pymongo import MongoClient
from bson.json_util import dumps
import os
from apscheduler.schedulers.background import BackgroundScheduler
from sql_config import (
    MONGO,
)


app = Flask(__name__)
CORS(app, supports_credentials=True)

client = MongoClient(MONGO["MONGO_URI"])
db = client[MONGO["DATABASE"]]
mongo_isemri_unique = db["isemri_unique"]
mongo_isemri = db["isemri"]
mongo_sql_settings = db["sql_settings"]

all_data = mongo_isemri.find()
for record in all_data:
    already_exist_job = mongo_isemri_unique.count_documents({"isemri": str(record["isemri"])})
    if(already_exist_job):
        print("pass ", record["isemri"])
        print("-", record)
        pass
    else:
        print("new record")
        print("+", record)
        mongo_isemri_unique.insert_one(record)








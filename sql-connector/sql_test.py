import pyodbc 
import pandas as pd
from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from pymongo import MongoClient
from bson.json_util import dumps
from tzlocal import get_localzone
import pytz
from sql_config import (
    MONGO,
)
# Some other example server values are
# server = 'localhost\sqlexpress' # for a named instance
# server = 'myserver,port' # to specify an alternate port
client = MongoClient(MONGO["MONGO_URI"])
db = client[MONGO["DATABASE"]]
mongo_failures = db["failures"]
mongo_maintenance = db["maintenance"]
mongo_sql_settings = db["sql_settings"]

server = '10.16.5.2,1433' 
database = 'MNADE' 
username = 'iotiq' 
password = '1TT1ja/AzSMu9XCC' 
# ENCRYPT defaults to yes starting in ODBC Driver 18. It's good to always specify ENCRYPT=yes on the client side to avoid MITM attacks.
cnxn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER='+server+';DATABASE='+database+';ENCRYPT=yes;UID='+username+';PWD='+ password + ';TrustServerCertificate=yes;')

df = pd.read_sql_query('SELECT * FROM BOYS_CLOSED_ORDERS', cnxn)

print(df)
print(type(df))
print(df.shape)
print(df.iloc[0]["BASTAR"][:10], type(df.iloc[0]["BASTAR"]), df.iloc[0]["BASSA"], type(df.iloc[0]["BASSA"]), type(df.iloc[0]["kayit_tarihi"]))

""" sql_settings = mongo_sql_settings.find_one({})
if(sql_settings):
    print("result:", sql_settings["lastRecordDate"])
    mongo_sql_settings.update_one({"lastRecordDate": sql_settings["lastRecordDate"]}, {"$set": {"lastRecordDate": df.iloc[df.shape[0]-1]["kayit_tarihi"]}})
else:
    print("new")
    new_sql_settings = {"lastRecordDate": df.iloc[df.shape[0]-1]["kayit_tarihi"]}
    mongo_sql_settings.insert_one(new_sql_settings) """

already_exist = mongo_failures.find({"kayit_tarihi": df.iloc[2]["kayit_tarihi"]})
if(already_exist):
    pass
    print("yes", already_exist)
else:
    print("nope")
print("here")
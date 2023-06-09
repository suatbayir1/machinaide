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
mongo_isemri = db["isemri"]
mongo_sql_settings = db["sql_settings"]

server = '10.16.5.2,1433' 
database = 'MNADE' 
username = 'iotiq' 
password = '1TT1ja/AzSMu9XCC' 

cnxn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER='+server+';DATABASE='+database+';ENCRYPT=yes;UID='+username+';PWD='+ password + ';TrustServerCertificate=yes;')
fields = ['IDD', 'isemri', 'kd', 'part', 'tanim', 'ob', 'duedate', 'en', 'boy',
       'kalinlik', 'urungr', 'kalite', 'kayit_tarihi']

def write_is_emri_to_mongo(df):
    written = 0
    for i in range(df.shape[0]):
        record = {}
        for field in fields:
            record[field] = df.iloc[i][field]
        record["IDD"] = str(record["IDD"])
        already_exist_job = mongo_isemri.count_documents({"isemri": str(record["isemri"])})
        if(already_exist_job):
            print("pass ", record["isemri"])
            print("-", record)
            pass
        else:
            written += 1
            print("new record")
            print("+", record)
            mongo_isemri.insert_one(record)
    print("data written count:", written)

def connect_to_sql():
    query = "select * from qad_wodet ORDER BY duedate"
    query2 = "select * from qad_wodet ORDER BY kayit_tarihi"

    df = pd.read_sql_query(query, cnxn)

    df2 = pd.read_sql_query(query2, cnxn)

    print(df)
    print(type(df))
    print(df.shape)
    # print(df.iloc[0])
    # print(df.columns)
    # change last written record date
    sql_settings = mongo_sql_settings.find_one({})
    if(sql_settings):
        if("lastIsEmriRecordDate" in sql_settings):
            if(sql_settings['lastIsEmriRecordDate'] != df.iloc[df.shape[0]-1]["kayit_tarihi"]):
                write_is_emri_to_mongo(df)
                mongo_sql_settings.update_one({"lastIsEmriRecordDate": sql_settings["lastIsEmriRecordDate"]}, {"$set": {"lastIsEmriRecordDate": df.iloc[df.shape[0]-1]["kayit_tarihi"]}})
                print("update")
            else:
                print("no update")
        else:
            write_is_emri_to_mongo(df)
            mongo_sql_settings.update_one({"lastRecordDate": sql_settings["lastRecordDate"]}, {"$set": {"lastIsEmriRecordDate": df.iloc[df.shape[0]-1]["kayit_tarihi"]}})
            print("new field")
    else:
        write_is_emri_to_mongo(df)
        new_sql_settings = {"lastRecordDate": "", "lastIsEmriRecordDate": df.iloc[df.shape[0]-1]["kayit_tarihi"]}
        mongo_sql_settings.insert_one(new_sql_settings)
        print("new")

scheduler = BackgroundScheduler()
if __name__ == "__main__":
    # scheduler.add_job(func=test, trigger="cron", hour=15, minute=13, timezone=local_tz, id='test')
    connect_to_sql()
    scheduler.add_job(func=connect_to_sql, trigger="interval", minutes=60, id='connect_to_sql')
    scheduler.start()
    port = int(os.environ.get('PORT', 6667))
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=port)
    # connect_to_sql()









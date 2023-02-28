import pyodbc 
import pandas as pd
from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from pymongo import MongoClient
from bson.json_util import dumps
from tzlocal import get_localzone
from apscheduler.schedulers.background import BackgroundScheduler
import pytz
import os
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

app = Flask(__name__)
CORS(app, supports_credentials=True)

client = MongoClient(MONGO["MONGO_URI"])
db = client[MONGO["DATABASE"]]

scheduler = BackgroundScheduler()

failure_fields = ["IDD", "REFERANSNO", "ISEMRIYILI", "ISEMNO", "OLSTAR", "OLSSA", "VARLIKKODU", "EKIPTURTANIM", "URETIMDURUMU", "DURUSSURE", "ISEMRITURUTANIMI", 
            "BASTAR", "BASSA", "BITTAR", "BITSA", "YAPILANIS", "ISTIPITANIMI", "ARZKOMPTANIM", "durum", "kayit_tarihi"]
failure_useds_fields = ["BASTAR", "BASSA", "BITTAR", "BITSA", "YAPILANIS"]

maintenance_fields = ["IDD", "REFERANSNO", "ISEMRIYILI", "ISEMNO", "OLSTAR", "OLSSA", "VARLIKKODU", "EKIPTURTANIM", "DURUSSURE", "URETIMDURUMU", "ISEMRITURUTANIMI", 
            "BASTAR", "BASSA", "BITTAR", "BITSA", "YAPILANIS", "ISTIPITANIMI", "ARZKOMPTANIM", "durum", "kayit_tarihi"]

maintenance_used_fields = ["BASTAR", "BASSA", "BITTAR", "BITSA", "YAPILANIS", "DURUSSURE"]

machine_types = {"03.03.0030": "Press030", "03.03.0031": "Press031", "03.03.0032": "Press032","03.03.0033": "Press033", "03.03.0034": "Press034"}

# get local timezone    
local_tz = get_localzone() 

def write_records_to_mongo(df):   
    for i in range(df.shape[0]):
        varlik_kodu = df.iloc[i]["VARLIKKODU"]
        if(varlik_kodu in machine_types.keys()):
            record_type = df.iloc[i]["ISEMRITURUTANIMI"]
            desc = df.iloc[i]["YAPILANIS"]
            downtime = df.iloc[i]["DURUSSURE"]
            downtime = df.iloc[i]["DURUSSURE"]
            maintenance_info = df.iloc[i]["ARZKOMPTANIM"]
            maintenance_request = df.iloc[i]["ISTIPITANIMI"]
            # print(start_time, "--", dt_obj, "--", d_aware, "--", d_aware.isoformat(),)
            # print("--***--***")
            # print(utc_dt, utc_dt.isoformat(), utc_dt.strftime("%Y-%m-%dT%H:%M:00.000Z"))
            # print("-----/////")
            # print(dt_obj_aware, dt_obj_aware.strftime("%Y-%m-%dT%H:%M:00.000Z"))
            # .000Z 'Europe/Istanbul'

            timezone = pytz.timezone('Europe/Istanbul')

            # start time merge
            start_time = f'{df.iloc[i]["BASTAR"][:10]} {df.iloc[i]["BASSA"][:5]}'
            start_dt_obj = datetime.strptime(start_time, '%d.%m.%Y %H:%M')
            start_d_aware = timezone.localize(start_dt_obj)
            start_utc_dt = start_d_aware.astimezone(pytz.utc)
            start_adjusted_dt = start_utc_dt # - timedelta(hours=1)
            start_date_str = start_adjusted_dt.strftime("%Y-%m-%dT%H:%M:00.000Z")
            print(start_time, start_adjusted_dt, start_adjusted_dt.strftime("%Y-%m-%dT%H:%M:00.000Z"))

            # end time merge
            end_time = f'{df.iloc[i]["BITTAR"][:10]} {df.iloc[i]["BITSA"][:5]}'
            end_dt_obj = datetime.strptime(end_time, '%d.%m.%Y %H:%M')
            end_d_aware = timezone.localize(end_dt_obj)
            end_utc_dt = end_d_aware.astimezone(pytz.utc)
            end_adjusted_dt = end_utc_dt # - timedelta(hours=1)
            end_date_str = end_adjusted_dt.strftime("%Y-%m-%dT%H:%M:00.000Z")
            print(end_time, end_adjusted_dt, end_adjusted_dt.strftime("%Y-%m-%dT%H:%M:00.000Z"))

            already_exist_fails = mongo_failures.count_documents({"ISEMNO": str(df.iloc[i]["ISEMNO"])})
            already_exist_mains = mongo_maintenance.count_documents({"ISEMNO": str(df.iloc[i]["ISEMNO"])})
            print("already_exist_fails", already_exist_fails, "already_exist_mains", already_exist_mains)
            if(already_exist_fails or already_exist_mains):
                print("pass", df.iloc[i]["ISEMNO"])
                pass
            else:
                if("ARIZA" in desc):
                    failure = {"type": record_type, "sourceName": machine_types[varlik_kodu], "sid": machine_types[varlik_kodu], "severity": "acceptable", "factoryID": "Ermetal", 
                        "description": desc, "startTime": start_date_str, "endTime": end_date_str}
                    for field in failure_fields:
                        failure[field] = df.iloc[i][field]
                    # print("-->", type(failure["kayit_tarihi"]))
                    failure["IDD"] = str(failure["IDD"])
                    failure["REFERANSNO"] = str(failure["REFERANSNO"])
                    print(failure)
                    mongo_failures.insert_one(failure)
                elif(record_type == "EWO" or record_type == "ARIZA"):
                    failure = {"type": record_type, "sourceName": machine_types[varlik_kodu], "sid": machine_types[varlik_kodu], "severity": "acceptable", "factoryID": "Ermetal", 
                        "description": desc, "startTime": start_date_str, "endTime": end_date_str}
                    for field in failure_fields:
                        failure[field] = df.iloc[i][field]
                    # print("-->", type(failure["kayit_tarihi"]))
                    failure["IDD"] = str(failure["IDD"])
                    failure["REFERANSNO"] = str(failure["REFERANSNO"])
                    print(failure)
                    mongo_failures.insert_one(failure)
                    # break
                elif(record_type == "PERİYODİK" or record_type == "PLANLI"):
                    maintenance = {"type": record_type, "maintenanceType": record_type, "asset": machine_types[varlik_kodu], "sid": machine_types[varlik_kodu], "severity": "acceptable", "factoryID": "Ermetal", "failure": None,
                        "maintenanceReason": desc, "maintenanceTime": start_date_str, "maintenanceEndTime": end_date_str, "maintenanceRequest": maintenance_request, "maintenanceInfo": maintenance_info, "maintenanceDownTime": downtime,
                        "maintenanceCost": "", "personResponsible": ""}
                    for field in maintenance_fields:
                        maintenance[field] = df.iloc[i][field]
                    maintenance["IDD"] = str(maintenance["IDD"])
                    maintenance["REFERANSNO"] = str(maintenance["REFERANSNO"])
                    print(maintenance)
                    mongo_maintenance.insert_one(maintenance)

def connect_sql():
    server = '10.16.5.2,1433' 
    database = 'MNADE' 
    username = 'iotiq' 
    password = '1TT1ja/AzSMu9XCC' 
    # ENCRYPT defaults to yes starting in ODBC Driver 18. It's good to always specify ENCRYPT=yes on the client side to avoid MITM attacks.
    cnxn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER='+server+';DATABASE='+database+';ENCRYPT=yes;UID='+username+';PWD='+ password + ';TrustServerCertificate=yes;')

    sql_settings = mongo_sql_settings.find_one({})  
    
    query = f"SELECT * FROM BOYS_CLOSED_ORDERS WHERE CAST(kayit_tarihi as datetime2)>CAST('{sql_settings['lastRecordDate']}' as datetime2) and convert(datetime, BASTAR, 104)>'2020-01-01' ORDER BY convert(datetime, BASTAR, 104)"
    query2 = f"SELECT * FROM BOYS_CLOSED_ORDERS WHERE CAST(kayit_tarihi as datetime2)>CAST('{sql_settings['lastRecordDate']}' as datetime2) and convert(datetime, BASTAR, 104)>'2020-01-01' ORDER BY kayit_tarihi"
    print(query)
    df = pd.read_sql_query(query, cnxn)
    df2 = pd.read_sql_query(query2, cnxn)

    if(sql_settings):
        if(sql_settings['lastRecordDate'] != df2.iloc[df2.shape[0]-1]["kayit_tarihi"]):            
            print("result:", sql_settings["lastRecordDate"]==df2.iloc[df2.shape[0]-1]["kayit_tarihi"])
            write_records_to_mongo(df)
            mongo_sql_settings.update_one({"lastRecordDate": sql_settings["lastRecordDate"]}, {"$set": {"lastRecordDate": df2.iloc[df2.shape[0]-1]["kayit_tarihi"]}})
            print("update")
        else:
            print("no update")
    else:
        new_sql_settings = {"lastRecordDate": df2.iloc[df2.shape[0]-1]["kayit_tarihi"]}
        write_records_to_mongo(df)
        mongo_sql_settings.insert_one(new_sql_settings)
        print("new")

def test():
    print("test scheduler")

if __name__ == "__main__":
    # scheduler.add_job(func=test, trigger="cron", hour=15, minute=13, timezone=local_tz, id='test')
    scheduler.add_job(func=connect_sql, trigger="cron", hour=11, minute=11, timezone=local_tz, id='connect_sql')
    scheduler.start()
    port = int(os.environ.get('PORT', 6666))
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=port)
    # write_records()
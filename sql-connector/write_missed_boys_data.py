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

# failures = db["failures"].find({})
# print(dumps(failures))

server = '10.16.5.2,1433' 
database = 'MNADE' 
username = 'iotiq' 
password = '1TT1ja/AzSMu9XCC' 
# ENCRYPT defaults to yes starting in ODBC Driver 18. It's good to always specify ENCRYPT=yes on the client side to avoid MITM attacks.
cnxn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER='+server+';DATABASE='+database+';ENCRYPT=yes;UID='+username+';PWD='+ password + ';TrustServerCertificate=yes;')

query = "SELECT * FROM BOYS_CLOSED_ORDERS where convert(datetime, BASTAR, 104)>'2020-01-01' and YAPILANIS like '%arıza%' ORDER BY convert(datetime, BASTAR, 104)"

df = pd.read_sql_query(query, cnxn)

print(df)
print(type(df))
print(df.shape)
print(df.iloc[0]["BASTAR"][:10], type(df.iloc[0]["BASTAR"]), df.iloc[0]["BASSA"], type(df.iloc[0]["BASSA"]), type(df.iloc[0]["kayit_tarihi"]))


machine_types = {"03.03.0030": "Press030", "03.03.0031": "Press031", "03.03.0032": "Press032","03.03.0033": "Press033", "03.03.0034": "Press034"}

failure_fields = ["IDD", "REFERANSNO", "ISEMRIYILI", "ISEMNO", "OLSTAR", "OLSSA", "VARLIKKODU", "EKIPTURTANIM", "URETIMDURUMU", "DURUSSURE", "ISEMRITURUTANIMI", 
            "BASTAR", "BASSA", "BITTAR", "BITSA", "YAPILANIS", "ISTIPITANIMI", "ARZKOMPTANIM", "durum", "kayit_tarihi"]
failure_useds_fields = ["BASTAR", "BASSA", "BITTAR", "BITSA", "YAPILANIS"]

maintenance_fields = ["IDD", "REFERANSNO", "ISEMRIYILI", "ISEMNO", "OLSTAR", "OLSSA", "VARLIKKODU", "EKIPTURTANIM", "DURUSSURE", "URETIMDURUMU", "ISEMRITURUTANIMI", 
            "BASTAR", "BASSA", "BITTAR", "BITSA", "YAPILANIS", "ISTIPITANIMI", "ARZKOMPTANIM", "durum", "kayit_tarihi"]

maintenance_used_fields = ["BASTAR", "BASSA", "BITTAR", "BITSA", "YAPILANIS", "DURUSSURE"]

# get local timezone    
local_tz = get_localzone() 

for i in range(df.shape[0]):
    varlik_kodu = df.iloc[i]["VARLIKKODU"]
    if(varlik_kodu in machine_types.keys()):
        print("here 1")
        record_type = df.iloc[i]["ISEMRITURUTANIMI"]
        desc = df.iloc[i]["YAPILANIS"]
        downtime = df.iloc[i]["DURUSSURE"]
        downtime = df.iloc[i]["DURUSSURE"]
        maintenance_info = df.iloc[i]["ARZKOMPTANIM"]
        maintenance_request = df.iloc[i]["ISTIPITANIMI"]

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

        already_exist = mongo_failures.count_documents({"IDD": str(df.iloc[i]["IDD"])})
        print("already_exist", already_exist)
        if(already_exist):
            print("pass", df.iloc[i]["IDD"])
            pass
        else:
            failure = {"type": record_type, "sourceName": machine_types[varlik_kodu], "sid": machine_types[varlik_kodu], "severity": "acceptable", "factoryID": "Ermetal", 
                    "description": desc, "startTime": start_date_str, "endTime": end_date_str}
            for field in failure_fields:
                failure[field] = df.iloc[i][field]
            # print("-->", type(failure["kayit_tarihi"]))
            failure["IDD"] = str(failure["IDD"])
            failure["REFERANSNO"] = str(failure["REFERANSNO"])
            print(failure)
            mongo_failures.insert_one(failure)
        

print("-----------")
""" cursor = cnxn.cursor()

cursor.execute('SELECT top 10 * FROM BOYS_CLOSED_ORDERS')

for i in cursor:
    print(i)

row = cursor.fetchone() 
while row: 
    print(row[-1])
    row = cursor.fetchone() """

""" import pyodbc 

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};'
                      'Server=10.16.5.2;'
                      'Database=MNADE;'
                      'Trusted_Connection=yes;')

cursor = conn.cursor()
cursor.execute('SELECT * FROM verimot_losts')

for i in cursor:
    print(i) """

""" import pyodbc

# Trusted Connection to Named Instance
connection = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=WIN-8CUUT2UPA3K\SQLEXPRESS;DATABASE=MNADE;Trusted_Connection=yes;')

cursor=connection.cursor()
cursor.execute("SELECT @@VERSION as version")

while 1:
    row = cursor.fetchone()
    if not row:
        break
    print(row.version)

cursor.close()
connection.close() """
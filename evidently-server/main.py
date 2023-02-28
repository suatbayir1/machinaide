# run with PYTHONPATH=. python3 main.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from bson.json_util import dumps
from datetime import datetime, timedelta
from RULEvidentlyReport import RULEvidentlyReport
from RULRegEvidentlyReport import RULRegEvidentlyReport
from threading import Thread
import os

from evidently_config import (
    MONGO, INFLUX
)

from pymongo import MongoClient
from influxdb_client import InfluxDBClient

influxdb_client = InfluxDBClient(url=INFLUX["host"], token=INFLUX["dbtoken"], org=INFLUX["orgID"], verify_ssl = False) 
query_api = influxdb_client.query_api()

app = Flask(__name__)
CORS(app, supports_credentials=True)

client = MongoClient(MONGO["MONGO_URI"])
db = client[MONGO["DATABASE"]]

@app.route('/testEvidentlyServer', methods=['GET'])
def testServer():
    return {"msg": "Evidently server is working like a miracle"}, 200

@app.route('/addReport', methods=['POST'])
def addReport():
    model_id = request.json["modelID"]
    created_report = request.json["report"]
    report = db["evidently_reports"].find_one({"modelID": model_id})
    if(report):
        x = db["evidently_reports"].update_one({"modelID": model_id}, {"$set": created_report})
    else:
        print(created_report)
        x = db["evidently_reports"].insert_one(created_report)
    
    return {"msg": "Report is created"}, 200

@app.route('/createRULEvidentlyReport/<model_id>', methods=['POST'])
def createRULEvidentlyReport(model_id):
    print("lol", model_id)
    logs = db["model_logs"].find_one({"modelID": model_id})
    if("logs" in logs):
        logs_in_range = []
        for log in reversed(logs["logs"]):
            date_obj = datetime.strptime(log["time"], "%Y-%m-%dT%H:%M:%S.%fZ")
            now = datetime.now()
            thirty_days = now - timedelta(3)
            if(date_obj>=thirty_days):
                logs_in_range.insert(0, log)
            else:
                break
        print("len is: ", len(logs["logs"]), "-", len(logs_in_range))
        settings = {
            "modelID": model_id,
            "fields": request.json["fields"], 
            "daterange": request.json["daterange"], 
            "logsInRange": logs_in_range}

        rul_evidently = RULEvidentlyReport(settings)
        Thread(target=rul_evidently.create_report).start()

        return {"msg": "Report creation on progress."}, 200
    return {"msg": "No log has found to create report."}, 200

@app.route('/createRULRegEvidentlyReport/<model_id>', methods=['POST'])
def createRULRegEvidentlyReport(model_id):
    print("lol", model_id)
    logs = db["model_logs"].find_one({"modelID": model_id})
    if("logs" in logs):
        logs_in_range = []
        for log in reversed(logs["logs"]):
            date_obj = datetime.strptime(log["time"], "%Y-%m-%dT%H:%M:%S.%fZ")
            now = datetime.now()
            thirty_days = now - timedelta(3)
            if(date_obj>=thirty_days):
                logs_in_range.insert(0, log)
            else:
                break
        print("len is: ", len(logs["logs"]), "-", len(logs_in_range))
        settings = {
            "modelID": model_id,
            "fields": request.json["fields"], 
            "daterange": request.json["daterange"], 
            "logsInRange": logs_in_range}

        rulreg_evidently = RULRegEvidentlyReport(settings)
        Thread(target=rulreg_evidently.create_report).start()

        return {"msg": "Report creation on progress."}, 200
    return {"msg": "No log has found to create report."}, 200

@app.route('/returnEvidentlyReport/<model_id>', methods=['GET'])
def returnEvidentlyReport(model_id):
    report = db["evidently_reports"].find_one({"modelID": model_id})
    return dumps(report), 200

@app.route('/getLog', methods=['POST'])
def getLog():
    feedback = request.json["feedback"]
    timestamp = request.json["timestamp"]
    modelID = request.json["modelID"]
    query = {"modelID": modelID, "logs.time": timestamp}
    update_set = {"logs.$.feedback": feedback}
    data = {"$set": update_set}
    logs = db["model_logs"].update_one(query, data)
    print(logs)
    return jsonify(msg="Model log feedback is updated"), 200

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 6161))
    app.run(debug=True, host='0.0.0.0', port=port)
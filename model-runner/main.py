import os
import gc
import json
import evalml
import datetime
from bson import ObjectId
from flask_cors import CORS
from model_runner_config import (
    MONGO
)
from tensorflow import keras
from pymongo import MongoClient
from flask import Flask, jsonify
from tensorflow.keras import backend as k
from apscheduler.schedulers.background import BackgroundScheduler
# from model_runner import RULModelRunner, POFModelRunner, RULRegModelRunner, CustomMetric

app = Flask(__name__)
CORS(app, supports_credentials=True)

client = MongoClient(MONGO["MONGO_URI"])
db = client[MONGO["DATABASE"]]

scheduler = BackgroundScheduler()

def test_scheduler():
    print("we workin")

if __name__ == "__main__":
    # load_models()
    # predict_rul_and_pof()
    # scheduler.add_job(func=load_models, trigger="interval", minutes=5, id='load_models')
    # scheduler.add_job(func=predict_rul_and_pof, trigger="interval", minutes=15, id='predict_rul_and_pof')
    # delete and reload models from memory once a day
    # scheduler.add_job(func=delete_and_reload_models, trigger="interval", days=1, id='delete_and_reload_models')
    scheduler.add_job(func=test_scheduler, trigger="interval", seconds=5, id='test_scheduler')
    scheduler.start()
    # predict_rul_and_pof()
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=port)
    # PYTHONPATH=. python3 main.py
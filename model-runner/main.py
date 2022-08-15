import os
import gc
import json
import evalml
import datetime
from bson import ObjectId
from flask_cors import CORS
from model_runner_config import (
    MONGO,
    MODELS_DIR,
    EVALML_MODELS_DIR
)
from tensorflow import keras
from pymongo import MongoClient
from flask import Flask, jsonify
from tensorflow.keras import backend as k
from model_runner import POFModelRunner, RULModelRunner, RULRegModelRunner, CustomMetric
from apscheduler.schedulers.background import BackgroundScheduler

# from model_runner import RULModelRunner, POFModelRunner, RULRegModelRunner, CustomMetric

app = Flask(__name__)
CORS(app, supports_credentials=True)

client = MongoClient(MONGO["MONGO_URI"])
db = client[MONGO["DATABASE"]]

scheduler = BackgroundScheduler()

models = {}

def test_scheduler():
    print("we workin")

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, (datetime.date, datetime.datetime)):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

def weibull_loglik_discrete(y_true, ab_pred, name=None):
    """
        Discrete log-likelihood for Weibull hazard function on censored survival data
        y_true is a (samples, 2) tensor containing time-to-event (y), and an event indicator (u)
        ab_pred is a (samples, 2) tensor containing predicted Weibull alpha (a) and beta (b) parameters
        For math, see https://ragulpr.github.io/assets/draft_master_thesis_martinsson_egil_wtte_rnn_2016.pdf (Page 35)
    """
    y_ = y_true[:, 0]
    u_ = y_true[:, 1]
    a_ = ab_pred[:, 0]
    b_ = ab_pred[:, 1]

    hazard0 = k.pow((y_ + 1e-35) / a_, b_)
    hazard1 = k.pow((y_ + 1) / a_, b_)

    return -1 * k.mean(u_ * k.log(k.exp(hazard1 - hazard0) - 1.0) - hazard1)

def activate(ab):
    """
        Custom Keras activation function, outputs alpha neuron using exponentiation and beta using softplus
    """
    a = k.exp(ab[:, 0])
    b = k.softplus(ab[:, 1])

    a = k.reshape(a, (k.shape(a)[0], 1))
    b = k.reshape(b, (k.shape(b)[0], 1))

    return k.concatenate((a, b), axis=1)

def load_models():
    # load enabled models to global object
    basic_models_collection = db['basic_models']
    basic_models = basic_models_collection.find({"enabled": True})
    models_list = list(basic_models)

    global models

    # get modelIDs
    modelIDs = list(models)

    for model in models_list:
        print(model["task"])
        model_id = model["modelID"]
        if(model["task"] == "rulreg"):
            model_id = model["pipelineID"]
        if(model_id in modelIDs):
            modelIDs.remove(model_id)
        else:
            if(model["task"] == "pof"):
                settings = {}
                settings["modelID"] = model_id
                settings["task"] = "pof"
                if("lastDataPoint" in model):
                    settings["lastDataPoint"] = model["lastDataPoint"]
                else:
                    settings["lastDataPoint"] = None
                if("dataInfo" in model):
                    settings["asset"] = model["dataInfo"]["asset"]
                    settings["fields"] = model["dataInfo"]["fields"]
                
                model_path = MODELS_DIR + model["modelID"] + "/model.h5"
                if(os.path.exists(model_path)):
                    settings["loadedModel"] = keras.models.load_model(model_path,
                                        custom_objects = {"weibull_loglik_discrete": weibull_loglik_discrete, "activate": activate})
                    models[model_id] = settings
            elif(model["task"] == "rul"):
                settings = {}
                settings["modelID"] = model_id
                settings["task"] = "rul"
                if("lastDataPoint" in model):
                    settings["lastDataPoint"] = model["lastDataPoint"]
                else:
                    settings["lastDataPoint"] = None
                if("dataInfo" in model):
                    settings["asset"] = model["dataInfo"]["asset"]
                    settings["fields"] = model["dataInfo"]["fields"]                    
                    if("sequenceLength" in model["dataInfo"]):
                        settings["sequenceLength"] = model["dataInfo"]["sequenceLength"]
                    else:
                        settings["sequenceLength"] = 50
                    if("optimizer" in model["dataInfo"]):
                        if(model["dataInfo"]["optimizer"] == "custom"):
                            settings["optimizer"] = "custom"
                            settings["customEquation"] = model["dataInfo"]["customEquation"]
                            model_path = MODELS_DIR + model["modelID"] + "/model.h5"
                            if(os.path.exists(model_path)):
                                settings["loadedModel"] = keras.models.load_model(model_path, custom_objects={"CustomMetric": CustomMetric})
                        else:
                            model_path = MODELS_DIR + model["modelID"] + "/model.h5"
                            if(os.path.exists(model_path)):
                                settings["loadedModel"] = keras.models.load_model(model_path)
                    else:
                        model_path = MODELS_DIR + model["modelID"] + "/model.h5"
                        if(os.path.exists(model_path)):
                            settings["loadedModel"] = keras.models.load_model(model_path)
                else:
                    model_path = MODELS_DIR + model["modelID"] + "/model.h5"
                    if(os.path.exists(model_path)):
                        settings["loadedModel"] = keras.models.load_model(model_path)
                model_path = MODELS_DIR + model["modelID"] + "/model.h5"
                if(os.path.exists(model_path)):        
                    models[model_id] = settings
            elif(model["task"] == "rulreg"):
                settings = {}
                pipeline_id = model["pipelineID"]
                settings["pipelineID"] = pipeline_id
                settings["task"] = "rulreg"
                if("dataInfo" in model):
                    settings["asset"] = model["dataInfo"]["assetName"]
                    settings["fields"] = model["dataInfo"]["fields"]
                if("optional" in model):
                    settings["features"] = model["optional"]["features"]
                if("lastDataPoint" in model):
                    settings["lastDataPoint"] = model["lastDataPoint"]
                else:
                    settings["lastDataPoint"] = None
                
                pipeline_no = pipeline_id[-1]
                model_path = EVALML_MODELS_DIR + model["modelID"] + "/pipeline" + pipeline_no + ".cloudpickle"
                if(os.path.exists(model_path)):  
                    settings["loadedModel"] = evalml.pipelines.PipelineBase.load(model_path)
                    models[pipeline_id] = settings
    print(models)
    # free stopped models
    for mid in modelIDs:
        del models[mid]

    # explicitly invoke the Garbage Collector to release unreferenced memory
    gc.collect()

def delete_and_reload_models():
    # free models
    global models
    # use list() to force a copy of the keys to be made to avoid RuntimeError: dictionary changed size during iteration
    for modelID in list(models):
        del models[modelID]
    
    # explicitly invoke the Garbage Collector to release unreferenced memory
    gc.collect()

    load_models()

def predict_rul_and_pof():
    print("START OF THE PREDICTION ------------------------------------------------------------------------------------")
    global models
    # use list() to force a copy of the keys to be made to avoid RuntimeError: dictionary changed size during iteration
    for model in list(models):
        print(models[model]["task"])
        if(models[model]["task"] == "rul"):
            rul_runner = RULModelRunner(models[model])
            rul_runner.run()
            # invoke the Garbage Collector after every prediction
            _ = gc.collect() # referring https://stackoverflow.com/a/64210176
        elif(models[model]["task"] == "pof"):
            pof_runner = POFModelRunner(models[model])
            pof_runner.run()
            # invoke the Garbage Collector after every prediction
            _ = gc.collect() # referring https://stackoverflow.com/a/64210176
        elif(models[model]["task"] == "rulreg"):
            rulreg_runner = RULRegModelRunner(models[model])
            rulreg_runner.run()
            # invoke the Garbage Collector after every prediction
            _ = gc.collect() # referring https://stackoverflow.com/a/64210176
    # print(models)
    print("END OF THE PREDICTION ------------------------------------------------------------------------------------")

if __name__ == "__main__":
    load_models()
    predict_rul_and_pof()
    scheduler.add_job(func=load_models, trigger="interval", minutes=5, id='load_models')
    scheduler.add_job(func=predict_rul_and_pof, trigger="interval", minutes=30, id='predict_rul_and_pof')
    # delete and reload models from memory once a day
    scheduler.add_job(func=delete_and_reload_models, trigger="interval", days=1, id='delete_and_reload_models')
    # scheduler.add_job(func=test_scheduler, trigger="interval", seconds=5, id='test_scheduler')
    scheduler.start()
    # predict_rul_and_pof()
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=port)
    # PYTHONPATH=. python3 main.py
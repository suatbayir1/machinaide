# run with PYTHONPATH=. python3 main.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
import os
from datetime import datetime
import subprocess
import json
from bson.json_util import dumps
from ml_config import (
        AUTOML_SETTINGS_DIR,
        MONGO,
    )
import evalml
import featuretools as ft
import config
from pymongo import MongoClient

app = Flask(__name__)
# app.config['MONGO_DBNAME'] = automldb
# app.config['MONGO_URI'] = AUTOML_MONGO_URI
CORS(app, supports_credentials=True)
# mongo = PyMongo(app)
# mongo_models = PyMongo(app, uri=METADATA_MONGO_URI)

client = MongoClient(MONGO["MONGO_URI"])
db = client[MONGO["DATABASE"]]

""" @app.route('/testAPI', methods=['GET'])
def testAPI():
    print(os.getcwd())
    for i in range(1,4):
        pipeline_copy = evalml.pipelines.PipelineBase.load(MODELDIR + "pipeline" + str(i) + ".cloudpickle")
        print(pipeline_copy.describe())
        saved_features = ft.load_features("/root/BackUp_Pianism/pianism/evalml-server/models-test/f6aa52d16c244f4b818726ca62ef0282/feature_definitions.json")
        print(saved_features)
        print(len(saved_features))
    return jsonify(msg="Regression ML server is working"), 200 """

""" @app.route('/testReadModel', methods=['GET'])
def testReadModel():
    models = mongo_models.db.basic_models.find({"task": "rulreg"})
    models_list = list(models)
    # print(len(list(models)))
    model = models_list[-1]
    print(model["Directory"])
    pipeline_copy = evalml.pipelines.PipelineBase.load(model["Directory"] + "pipeline1.cloudpickle")
    print(pipeline_copy.describe())
    features = model["Optional"]["features"]
    saved_features = ft.load_features(features)
    print(saved_features)
    return jsonify(msg="model read is working"), 200 """

@app.route('/testAlert', methods=['POST'])
def testAlert():
    print("------------TICK WORKS-----------------")
    print(request.json)
    print("***************")
    print(request.headers)
    models = db["basic_models"].find({})
    return dumps(models), 200

@app.route('/testRULRegServer', methods=['GET'])
def testServer():
    return {"msg": "EvalML working like a miracle"}, 200

reg_rul_process_pool = {}

""" @app.route('/postRegExperiment', methods=["POST"])
def postRegExperiment():
    # regmodels = mongo.db.regmodels
    experiments = mongo.db.experiments
    pkg = request.json
    experiments.insert_one(json.loads(pkg))
    # regmodels.insert_one(pkg)     
    return jsonify(msg="Regression experiment has added."), 201 """

@app.route('/startRULRegModelTraining', methods=['POST'])
def startRULRegModelTraining():
    print("working?")
    global reg_rul_process_pool

    if not os.path.isdir(AUTOML_SETTINGS_DIR):
        os.mkdir(AUTOML_SETTINGS_DIR)

    experiment_name = request.json['experimentName']
    session_id = str(request.json["sessionID"])

    now = datetime.now()
    
    settings_dir = AUTOML_SETTINGS_DIR + experiment_name + "-" + session_id + ".json"

    with open(settings_dir, 'w') as fp:
        json.dump(request.json, fp)
    
    cmd = F"python3 {config.PROJECT_URL}/evalml-server/rul_reg_runner_ver2.py" + " -en " + experiment_name + " -sid " + session_id 
    print(cmd)
    process = subprocess.Popen(cmd.split(), close_fds=True)
    reg_rul_process_pool[str(now)] = process

    print("background check")
    msg = "experiment " + str(now) + " started for " + experiment_name + " with sid: " + session_id
    return {"msg": msg}


""" @app.route('/startRULRegModelTraining', methods=['POST'])
def startRULRegModelTraining():
    print("working?")

    now = datetime.now()
    part_name = request.json["partName"]
    type = request.json["type"]
    database = request.json["database"]  # machine
    measurement = request.json["measurement"]  # component
    field = request.json["field"]  # sensor
    
    objective = request.json["evalMLObjective"]
    if(not objective):
        objective = "MSE"
    
    timeout = request.json["evalMLTimeout"]
    if(not timeout):
        timeout = "3 h"

    if("productID" in request.json):
        productID = request.json["productID"]
    else:
        productID = -1
    min_data_points = request.json["minDataPoints"]

    max_iterations = request.json["evalMLMaxIterations"]
    if(not max_iterations):
        max_iterations = "10"
    
    early_guess_punishment = request.json["earlyGuessPunishment"]
    late_guess_punishment = request.json["lateGuessPunishment"]

    objective = objective.replace(" ","-")
    admin_settings = " -to " + timeout + " -o " + objective + " -mdp " + str(min_data_points) + " -mi " + max_iterations + " -egp " + early_guess_punishment + " -lgp " + late_guess_punishment
    settings_cmd = " -n " + part_name + " -t " + type + " -db " + database + " -pid " + productID 
    if(len(measurement)):
        settings_cmd += " -m " + measurement 
    if(len(field)):
        settings_cmd += " -f " + field 
    
    settings_cmd += admin_settings

    username = request.json['username']
    model_name = request.json['modelName']
    model_name = model_name.replace(" ", "-")
    username = username.replace(".com", "")
    username = username.replace(".","-")
    
    cmd = "python3 ./rul_reg_runner.py" + " -u " + username + " -mn " + model_name + settings_cmd 
    print(cmd)

    global reg_rul_process_list
    process = subprocess.Popen(cmd.split(), close_fds=True)
    reg_rul_process_list[str(now)] = process

    print("background check")
    msg = "experiment " + str(now) + " started for " + part_name + " from user: " + username
    return {"msg": msg} """

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 6363))
    app.run(debug=True, host='0.0.0.0', port=port)
from application.model.MLModel import MLModel
# from application.helper.Helper import role_authorization, org_separation, org_separation_with_role
from flask import Blueprint, request, jsonify
import json
from datetime import datetime
import time
import config
from bson import ObjectId
import requests
from bson.json_util import dumps
import os
import subprocess
from pathlib import Path
from multiprocessing import Process, Queue
from multiprocessing.pool import ThreadPool
from mlhelpers.mlwrappers import MLSession, ModelRunner
from mlhelpers.automl.ml_config import AUTOML_SETTINGS_DIR, AUTOML_EXPERIMENTS_DIR, MODELS_DIR
import codecs
from application.helpers.Helper import return_response, token_required
import math
# from mlserver.flask_app_ml.mlconstants import VAE_SENSOR_DIR

mlserver = Blueprint("mlserver", __name__)

mongo_model = MLModel()

session_kill_queues = {}
inference_futures = {}
inference_kill_queues = {}
automl_futures = {}

alert_module = None
alert_module_future = None

######## vae training pool
vae_tp = ThreadPool(None)

######## pof model training pool
tp = ThreadPool(None)

pof_process_list = {}
vae_process_list = {}
starts_with = "Epoch "

def callProcessVAE(cmd, now):
    process = subprocess.Popen(cmd.split(), close_fds=True)
    vae_process_list[str(now)] = process

def callProcessPOF(cmd, now):
    process = subprocess.Popen(cmd.split(), close_fds=True)
    pof_process_list[str(now)] = process


class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, (datetime.date, datetime.datetime)):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

@mlserver.route('/getMLReport/<report_path>', methods=['GET'])
def getMLReport(report_path):
    reports_path= f"{config.PROJECT_URL}/influxdb/ui/public/"
    path = reports_path + report_path
    html_file = codecs.open(path, "r", "utf-8")
    file_str = html_file.read()
    return {"report": file_str}


@mlserver.route('/queueTrainingSession', methods=['POST'])
@mlserver.route('/queueTrainingSession/<auto>', methods=['POST'])
def queueTrainingSession(auto=None):
    settings = request.json
    print(settings.keys())
    if auto is None:
        if ( 'creator' not in settings.keys()
            or 'sessionID' not in settings.keys()
            or 'dbSettings' not in settings.keys()
            or 'endTime' not in settings.keys()
            or 'startTime' not in settings.keys()
            or 'sensors' not in settings.keys()
            or 'params' not in settings.keys()):
            return "BAD REQUEST: Missing key.", 400

        # algs = []  
        # if settings['types'] == "Predictors":
        #     for p_alg in config.G_ALGS["Predictors"]:
        #         algs.append(p_alg)
        # elif settings['types'] == "Classifiers":
        #     for c_alg in config.G_ALGS["Classifiers"]:
        #         algs.append(c_alg)
        # else:
        #     for p_alg in config.G_ALGS["Predictors"]:
        #         algs.append(p_alg)
        #     for c_alg in config.G_ALGS["Classifiers"]:
        #         algs.append(c_alg)

        algs = settings["params"].keys()

        print(settings['startTime'])
        print(settings['endTime'])

        used_params = {}
        for alg in algs:
            used_params[alg] = settings['params'][alg]

        kill_sig_queue = Queue()
        session = MLSession(settings, algs, used_params, kill_sig_queue)
        session_kill_queues[settings['sessionID']] = kill_sig_queue
        session.start()

        model_name = "vae_" + str(settings['sessionID'])
        settings_cmd = " -h " + settings['dbSettings']['host'] + " -p " + str(settings['dbSettings']['port']) + " -db " + settings['dbSettings']['db'] + " -rp " + settings['dbSettings']['rp']
        cmd = "python3 ./mlhelpers/auto_vae.py" + " -u " + settings['creator'] + " -sid " + str(settings['sessionID']) +  " -mn " + model_name + settings_cmd
        if not os.path.isdir(config.VAE_SENSOR_DIR):
            os.makedirs(config.VAE_SENSOR_DIR)
        if not os.path.isdir(config.VAE_HPS_DIR):
            os.makedirs(config.VAE_HPS_DIR)
        with open(config.VAE_SENSOR_DIR + model_name + ".json", "w") as f:
            json.dump(settings['sensors'], f)
        # vae_tp.apply_async(callProcessVAE, (cmd, datetime.now(), ))
        return "OK", 201
    else:
        print(settings.keys())
        if ('tuner_type' not in settings.keys()
            or 'modelName' not in settings.keys()
            or 'nfeatures' not in settings.keys()
            or 'nepochs' not in settings.keys()
            or 'dbSettings' not in settings.keys()
            or 'username' not in settings.keys()
            or 'timeout' not in settings.keys()
            or 'sessionID' not in settings.keys()
            or 'task' not in settings.keys()):
            return "BAD REQUEST: Missing key for rul.", 400
        # session = AutoMLSession(settings)
        # automl_futures[settings['sessionID']] = session.run()    
        # global process
        if not os.path.isdir(config.AUTOML_SETTINGS_DIR):
            os.mkdir(config.AUTOML_SETTINGS_DIR)

        experiment_name = settings['modelName']
        username = request.json['username']
        username = username.replace(".com", "")
        username = username.replace(".","-")
        settings["username"] = username
        settings["startTime"] = datetime.now().timestamp()
        
        t_dir = config.AUTO_SETTINGS_DIR + experiment_name + "-" + username + ".json"
        with open(t_dir, 'w') as fp:
            json.dump(settings, fp)
        timeout = str(settings['timeout']) + "h"
        # cmd = "timeout -k 10 " + timeout + \
        cmd = "python3 ./mlhelpers/automl_runner.py -e " + experiment_name + \
            " -u " + username + " -t " + settings['task']
        print(cmd)
        process = subprocess.Popen(cmd.split(), close_fds=True)
        msg = "experiment " + experiment_name + " started with timeout " + timeout + " from user: " + username
        return {"msg": msg}


@mlserver.route('/rootCauseAnalysis', methods=['POST'])
def startRootCauseAnalysis():
    settings = request.json
    t_dir = config.models_path + str(settings['sessionID'])
    os.makedirs(t_dir)

    print(settings["m2s"])
    for msr in settings["m2s"]:
        for field in settings["m2s"][msr]:
            field_settings = {"sessionID": settings['sessionID'], "m2s": {msr: [field]}, 
            "prev_hours": settings['prev_hours'], 
            "end_date": settings['end_date'], 
            "window_size": settings['window_size'], 
            "bucket_minutes": settings['bucket_minutes'],
            "failureName": settings["failureName"],
            "failureIDD": settings["failureIDD"],
            "topLevelTreeComponent": settings["topLevelTreeComponent"],
            "usedModel": settings["usedModel"]
            }
            with open(t_dir + "/sessioninfo_" + field + ".json", 'w') as fp:
                json.dump(field_settings, fp)
            cmd = " python3 ./mlhelpers/mlsession.py -t root -s " + str(settings['sessionID']) + " -f " + str(field)
            process = subprocess.Popen(cmd.split(), close_fds=True)
    field_settings = {"sessionID": settings['sessionID'], "m2s": settings["m2s"],
        "prev_hours": settings['prev_hours'], 
        "end_date": settings['end_date'], 
        "window_size": settings['window_size'], 
        "bucket_minutes": settings['bucket_minutes'],
        "failureName": settings["failureName"],
        "failureIDD": settings["failureIDD"],
        "topLevelTreeComponent": settings["topLevelTreeComponent"],
        "usedModel": settings["usedModel"],
    }
    with open(t_dir + "/sessioninfo_ALL" + ".json", 'w') as fp:
        json.dump(field_settings, fp)
    cmd = " python3 ./mlhelpers/mlsession.py -t root -s " + str(settings['sessionID']) + " -f " + "ALL"
    process = subprocess.Popen(cmd.split(), close_fds=True)
    requests.post(url="http://localhost:9632/api/v1.0/health/postRootCauseAnalysis", json={"failureIDD": settings["failureIDD"],
    "failureName": settings["failureName"],
    "topLevelTreeComponent": settings["topLevelTreeComponent"],
    "usedModel": settings["usedModel"],
    "usedParameterValues": [settings["prev_hours"], settings["window_size"], settings["bucket_minutes"]]
    })
    print(settings)
    msg = "root trial"
    return {"msg": msg}, 201


""" @mlserver.route('/startPOFModelTraining', methods=['POST'])
def startPOFModelTraining():
    print("working?")
    global pof_process_list

    now = datetime.now()
    upload_time = now.strftime("%m-%d-%Y-%H-%M-%S")

    part_name = request.json["partName"]
    type = request.json["type"]
    database = request.json["database"]  # machine
    measurement = request.json["measurement"]  # component
    field = request.json["field"]  # sensor
    groupwith = request.json["groupwith"]  # function for grouping one hour data
    tuner_type = request.json["tuner_type"]
    nfeatures = request.json["nfeatures"]
    nepochs = request.json["nepochs"]
    timeout = request.json["timeout"]
    optimizer = request.json["optimizer"]

    admin_settings = " -tt " + tuner_type + " -nf " + nfeatures + " -ne " + nepochs + " -to " + str(timeout) + " -o " + optimizer
    settings_cmd = " -n " + part_name + " -t " + type + " -db " + database + " -g " + groupwith + admin_settings
    if(len(measurement)):
        settings_cmd += " -m " + measurement 
    if(len(field)):
        settings_cmd += " -f " + field 

    username = request.json['username']
    model_name = request.json['modelName']
    username = username.replace(".com", "")
    username = username.replace(".","-")
    
    cmd = "python3 ./mlhelpers/pof_runner.py" + " -u " + username + " -mn " + model_name + settings_cmd 
    print(cmd)
    tp.apply_async(callProcessPOF, (cmd, now, ))
    print("background check")
    msg = "experiment " + str(now) + " started for " + part_name + " from user: " + username
    return {"msg": msg} """


@mlserver.route('/createTask', methods=['POST'])
def createTask():
    task_data = request.get_json()
    # print(task_data)
    task_id = task_data["id"]

    if not os.path.isdir(config.TASK_DIRECTORY):
        os.makedirs(config.TASK_DIRECTORY)

    mongo_model.post_task(task_data)

    with open(config.TASK_DIRECTORY + str(task_id) + ".json", "w") as f:
        if '_id' in task_data:
            del task_data['_id']
        json.dump(task_data, f)

    return "CREATED"

@mlserver.route('/getTasks', methods=['GET'])
def getTasks():
    task_data = mongo_model.get_tasks()
    return dumps(task_data)


# @mlserver.route('/getAutomlSettings', methods=['GET'])
# def getAutomlSettings():
#     setting = mongo_model.get_settings()
#     if(setting):
#         return dumps(setting)
#     else:
#         new_setting = {"tunerType": "Hyperband", "nfeatures": "1.5n", "nepochs": "5","optimizer": "accuracy"}
#         mongo_model.post_settings(new_setting)
#         setting = mongo_model.get_settings()
#         return dumps(setting)
    
# @mlserver.route('/updateAutomlSettings', methods=['PUT'])
# def updateAutomlSettings():
#     setting = mongo_model.get_settings()
#     if(setting):
#         pass
#     else:
#         new_setting = {"tunerType": "Hyperband", "nfeatures": "1.5n", "nepochs": "5","optimizer": "accuracy"}
#         mongo_model.post_settings(new_setting)
#         setting = mongo_model.get_settings()
#     sid = setting["_id"] 
#     setting["tunerType"] = request.json['tunerType']
#     setting["nfeatures"] = request.json['nfeatures']
#     setting["nepochs"] = request.json['nepochs']
#     setting["optimizer"] = request.json['optimizer']
#     mongo_model.update_settings({"_id":sid}, {"$set": setting})
#     return {"msg": "automl settings updated"}

@mlserver.route('/params', methods=['GET'])
def getParams():
    print("params")
    return config.G_INFO

@mlserver.route('/getTrialDetails/<experiment>', methods=['GET'])
def getTrialDetails(experiment):
    experiment_path = config.experiments_path_2 + experiment # + "/intro_to_kt_pianism"

    if not os.path.exists(experiment_path):
        return jsonify(trials=dumps([]))
    else:
        trials = [ f.path for f in os.scandir(experiment_path) if f.is_dir() ]
        result = []
        for trial in trials:
            trial_path = trial + '/trial.json'
            trial_result = {}
            detail_text = open(trial_path,'r').read()
            detail_text = detail_text.replace('NaN', 'null')
            detail = json.loads(detail_text)
            trial_result["trialID"] = detail["trial_id"]
            trial_result["hyperparams"] = detail["hyperparameters"]["values"]
            if("loss" in detail["metrics"]["metrics"]):
                trial_result["loss"] = detail["metrics"]["metrics"]["loss"]["observations"][0]["value"][0]
            else:
                trial_result["loss"] = 0.0

            if("accuracy" in detail["metrics"]["metrics"]):
                trial_result["accuracy"] = detail["metrics"]["metrics"]["accuracy"]["observations"][0]["value"][0]
            else:
                if("acc" in detail["metrics"]["metrics"]):
                    trial_result["accuracy"] = detail["metrics"]["metrics"]["acc"]["observations"][0]["value"][0]
                else:
                    trial_result["accuracy"] = 0.0

            if("val_loss" in detail["metrics"]["metrics"]):
                trial_result["val_loss"] = detail["metrics"]["metrics"]["val_loss"]["observations"][0]["value"][0]
            else:
                trial_result["val_loss"] = 0.0

            if("val_accuracy" in detail["metrics"]["metrics"]):
                trial_result["val_accuracy"] = detail["metrics"]["metrics"]["val_accuracy"]["observations"][0]["value"][0]
            else:
                if("val_acc" in detail["metrics"]["metrics"]):
                    trial_result["val_accuracy"] = detail["metrics"]["metrics"]["val_acc"]["observations"][0]["value"][0]
                else:
                    trial_result["val_accuracy"] = 0.0

            if("precision" in detail["metrics"]["metrics"]):
                trial_result["precision"] = detail["metrics"]["metrics"]["precision"]["observations"][0]["value"][0]
            else:
                trial_result["precision"] = 0.0

            if("recall" in detail["metrics"]["metrics"]):
                trial_result["recall"] = detail["metrics"]["metrics"]["recall"]["observations"][0]["value"][0]
            else:
                trial_result["recall"] = 0.0

            if(detail["score"]):
                trial_result["score"] = detail["score"]
            else:
                trial_result["score"] = 0.0
            trial_result["status"] = detail["status"]
            result.append(trial_result)
        return jsonify(trials=dumps(result))

@mlserver.route('/getTrialIntermediates/<experiment>', methods=['GET'])
def getTrialIntermediates(experiment):
    exp = mongo_model.get_experiment({"experimentName": experiment})
    start_time = ""
    for trial in exp["trials"]:
        """ trial = json.loads(trial) """
        if(trial["trialNo"] == 1):
            start_time = trial["timestamp"]
    timeout = int(exp["timeout"])
    if(start_time != ""):
        now = time.time()
        expire = start_time + (60 * 60 * timeout)
        if(exp["experimentStatus"] == "RUNNING" and now > expire):
            mongo_model.update_experiment({"experimentName": experiment}, {"$set": {"experimentStatus": "TIMEOUT"}})
    exp_return = mongo_model.get_experiment({"experimentName": experiment})
    return dumps(exp_return)


# NEW VERISON

@mlserver.route('/testWritingJson', methods=['GET'])
def testWritingJson():
    experiment_name = "manual_test_from_controller_backend"
    session_id = "987654"
    settings_dir = AUTOML_SETTINGS_DIR + experiment_name + "-" + session_id + ".json"

    test_json = {
        "assetName": "TestAsset", 
        "fields": [
            {
                "@id": "Ana_hava_debi_act",
                "name": "Ana_hava_debi_act",
                "minValue": 10,
                "maxValue": 20,
                "parent": "sensor1",
                "type": "Field",
                "displayName": "Ana_hava_debi_act",
                "description": "Ana_hava_debi_act",
                "measurement": "Press031",
                "dataSource": "Ana_hava_debi_act",
                "database": "Ermetal"
            },
            {
                "@id": "Ana_hava_sic_act",
                "name": "Ana_hava_sic_act",
                "minValue": 5,
                "maxValue": 100,
                "parent": "sensor1",
                "type": "Field",
                "displayName": "Ana_hava_sic_act",
                "description": "Ana_hava_sic_act",
                "measurement": "Press031",
                "dataSource": "Ana_hava_sic_act",
                "database": "Ermetal"
            },
            {
                "@id": "Deng_hava_debi_act",
                "name": "Deng_hava_debi_act",
                "minValue": 5,
                "maxValue": 100,
                "parent": "sensor2",
                "type": "Field",
                "displayName": "Deng_hava_debi_act",
                "description": "Deng_hava_debi_act",
                "measurement": "Press031",
                "dataSource": "Deng_hava_debi_act",
                "isFillNullActive": True,
                "defaultValue": "25",
                "isOperationActive": True,
                "operation": "/",
                "operationValue": "1",
                "database": "Ermetal"
            }
        ],
        "minDataPoints": 200, 
        "customMetricEquation": "-", 
        "customMetricDirection": "-",
        "timeout": "2h", 
        "numberOfEpochs": 20, 
        "sessionID": "123456", 
        "experimentName": "test_read_settings", 
        "creator": "aysenur",
        "tunerType": "hyperband", 
        "optimizer": "val_accuracy", 
        "windowLength": 30, 
        "productID": "-1", 
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6Im1hY2hpbmFpZGUiLCJyb2xlIjoiYWRtaW4iLCJleHBpcnlfdGltZSI6MTY1NjQ4NTAzMS4wfQ.vT0qREvrbexmqTkjptyeboYGTKbkDJevAGr0n58VMjc"
    }

    print(settings_dir)
    with open(settings_dir, 'w') as fp:
        json.dump(test_json, fp)

    return {"msg": "writen"}

@mlserver.route('/testReadJson', methods=['GET'])
def testReadJson():
    experiment_name = "manual_test_from_controller_backend"
    session_id = "987654"

    settings_path = AUTOML_SETTINGS_DIR + experiment_name + "-" + session_id + ".json"

    print(settings_path)

    with open(settings_path, 'r') as fp:
        settings = json.load(fp)


    cmd = f"python3 {config.PROJECT_URL}/backend/mlhelpers/automl/test_read_json.py" 
    print(cmd)
    process = subprocess.Popen(cmd.split(), close_fds=True)

    return settings



rul_experiment_process_pool = {}

@mlserver.route('/startRULModelTraining', methods=['POST'])
def startRULModelTraining():
    print("working?")
    global rul_experiment_process_pool

    if not os.path.isdir(AUTOML_SETTINGS_DIR):
        os.mkdir(AUTOML_SETTINGS_DIR)

    experiment_name = request.json['experimentName']
    session_id = str(request.json["sessionID"])

    now = datetime.now()
    
    settings_dir = AUTOML_SETTINGS_DIR + experiment_name + "-" + session_id + ".json"

    with open(settings_dir, 'w') as fp:
        json.dump(request.json, fp)

    """ asset_name = request.json["assetName"]
    type = request.json["type"]
    database = request.json["database"]  # machine
    measurement = request.json["measurement"]  # component
    field = request.json["field"]  # sensor
    min_data_points = request.json["minDataPoints"] 
    custom_metric_equation = request.json["customMetricEquation"] 
    custom_metric_direction = request.json["customMetricDirection"] 
    timeout = request.json["timeout"]
    number_of_epochs = request.json["numberOfEpochs"] 
    session_id = request.json["sessionID"]
    tuner_type = request.json["tunerType"]
    optimizer = request.json["optimizer"]
    window_length = request.json["windowLength"]
    product_id = request.json["productID"]
    token = request.json["token"]

    part1 = " -an " + asset_name + " -t " + type + " -db " +  database + " -m " + measurement + " -f " + field
    part2 = " -mdp " + min_data_points + " -cme " + custom_metric_equation + " -cmd " + custom_metric_direction
    part3 = " -to " + timeout + " -noe " + number_of_epochs + " -sid " + session_id + " -tt " + tuner_type + " -o " + optimizer
    part4 = " -wl " + window_length + " -pid " + product_id + " -tk " + token  

    settings = part1 + part2 + part3 + part4

    username = request.json['creator']
    model_name = request.json['experimentName']
    username = username.replace(".com", "")
    username = username.replace(".","-") """
    
    cmd = f"python3 {config.PROJECT_URL}/backend/mlhelpers/automl/rul_automl_runner_ver2.py" + " -en " + experiment_name + " -sid " + session_id 
    print(cmd)
    process = subprocess.Popen(cmd.split(), close_fds=True)
    rul_experiment_process_pool[str(now)] = process

    print("background check")
    msg = "experiment " + str(now) + " started for " + experiment_name + " with sid: " + session_id
    return {"msg": msg}

pof_experiment_process_pool = {}


@mlserver.route('/createClusterer', methods=['POST'])
def createClusterer():
    settings = request.json
    t_dir = config.models_path + str(settings['sessionID'])
    os.makedirs(t_dir)
    with open(t_dir + "/sessioninfo.json", 'w') as fp:
        json.dump(settings, fp)
    cmd = " python3 ./mlhelpers/mlsession.py -t cluster -s " + str(settings['sessionID'])
    process = subprocess.Popen(cmd.split(), close_fds=True)
    # print(settings)
    msg = "cluster trial"
    return {"msg": msg}, 201


@mlserver.route('/startPOFModelTraining', methods=['POST'])
def startPOFModelTraining():
    print("working?")
    global pof_experiment_process_pool

    if not os.path.isdir(AUTOML_SETTINGS_DIR):
        os.mkdir(AUTOML_SETTINGS_DIR)

    experiment_name = request.json['experimentName']
    session_id = str(request.json["sessionID"])

    now = datetime.now()
    
    settings_dir = AUTOML_SETTINGS_DIR + experiment_name + "-" + session_id + ".json"

    with open(settings_dir, 'w') as fp:
        json.dump(request.json, fp)
    
    cmd = f"python3 {config.PROJECT_URL}/backend/mlhelpers/automl/pof_automl_runner.py" + " -en " + experiment_name + " -sid " + session_id 
    print(cmd)
    process = subprocess.Popen(cmd.split(), close_fds=True)
    pof_experiment_process_pool[str(now)] = process

    print("background check")
    msg = "experiment " + str(now) + " started for " + experiment_name + " with sid: " + session_id
    return {"msg": msg}

@mlserver.route('/postExperiment', methods=['POST'])
def postExperiment():
    experiment_name = request.json['experimentName']
    experiment_job = request.json['experimentJob']
    creator = request.json['creator']
    timeout = request.json['timeout']
    settings = request.json['settings']
    features = request.json['features']
    upload_time = request.json['uploadTime']
    optimizer = request.json["optimizer"]
    custom_metric_equation = request.json["customMetricEquation"]
    custom_metric_direction = request.json["customMetricDirection"]
    start_time = request.json["startTime"]

    experiment_settings = {"experimentName": experiment_name, 'experimentStatus': "RUNNING", "uploadTime": upload_time ,"creator": creator,
        "experimentJob": experiment_job, "timeout": timeout, "settings": settings ,"features": features, "optimizer": optimizer,
        "customMetricEquation": custom_metric_equation, "customMetricDirection": custom_metric_direction, "startTime": start_time, "trials": []}
    
    if("windowLength" in request.json):
        window_length = request.json["windowLength"]
        experiment_settings["windowLength"] = window_length

    mongo_model.post_experiment(experiment_settings)

    return {"msg": "New experiment with name " + experiment_name + " is added."}

@mlserver.route('/postRULRegExperiment', methods=['POST'])
def postRULRegExperiment():
    # load string as json
    experiment_settings = json.loads(request.json)
    print(experiment_settings)
    experiment_name = experiment_settings["experimentName"]
    mongo_model.post_experiment(experiment_settings)

    return {"msg": "New rulreg experiment with name " + experiment_name + " is added."}

@mlserver.route('/changeExperimentStatus', methods=['PUT'])
def changeExperimentStatus():
    print("here")
    experiment_name = request.json['experimentName']
    mongo_model.update_experiment({"experimentName": experiment_name}, {'$set': {'experimentStatus': "COMPLETED"}})
    return {"msg": "Status of experiment " + experiment_name + " is changed to COMPLETED"}

@mlserver.route('/updateExperiment', methods=['PUT'])
def updateExperiment():
    update_set = {"trainingDone": True}
    json_res = json.loads(request.json)
    for key in json_res:
        update_set[key] = json_res[key]
    data = {"$set": update_set}
    experiment_name = json_res['experiment_name']
    mongo_model.update_experiment({"experimentName": experiment_name}, data)
    return {"msg": "Experiment " + experiment_name + " is updated with metric and end time."}

@mlserver.route('/createClusterer', methods=['POST'])
def createClusterer():
    settings = request.json
    t_dir = config.models_path + str(settings['sessionID'])
    os.makedirs(t_dir)
    with open(t_dir + "/sessioninfo.json", 'w') as fp:
        json.dump(settings, fp)
    cmd = " python3 ./mlhelpers/mlsession.py -t cluster -s " + str(settings['sessionID'])
    process = subprocess.Popen(cmd.split(), close_fds=True)
    # print(settings)
    msg = "cluster trial"
    return {"msg": msg}, 201


@mlserver.route('/updateMLModel/<modelID>', methods=['PUT'])
def updateMLModel(modelID):
    query = {"modelID": modelID}
    update_set = {"trainingDone": True, "endTime": time.time()}
    for key in request.json:
        update_set[key] = request.json[key]

    data = {"$set": update_set}
    mongo_model.update_ml_model(query, data)
    return jsonify(msg="Model is updated."), 200

@mlserver.route('/postMLModel', methods=['POST'])
def postMLModel():
    pkg = request.json
    mongo_model.post_ml_model(pkg)
    return "OK", 201

@mlserver.route('/deleteMLModel/<modelID>', methods=['DELETE'])
def deleteMLModel(modelID):
    query = {"modelID": modelID}
    mongo_model.delete_ml_model(query)
    model_dir_path = F"{MODELS_DIR}{modelID}"
    model_path = F"{MODELS_DIR}{modelID}/model.h5"
    # remove folder first delete model then check if folder empty then delete
    if(os.path.exists(model_path)):
        os.remove(model_path)
    if(os.path.exists(model_dir_path)):
        os.rmdir(model_dir_path)       
    return jsonify(msg="Model is deleted."), 200

@mlserver.route('/deleteMLPipeline/<pipelineID>', methods=['DELETE'])
def deleteMLPipeline(pipelineID):
    print("delete pipeline ", pipelineID)
    query = {"pipelineID": pipelineID}
    mongo_model.delete_ml_model(query)
    pipeline_path = F"{os.path.join( os.path.dirname( os.getcwd()), '' )}evalml-server/models/{pipelineID[:-1]}/pipeline{pipelineID[-1]}.cloudpickle" 
    if(os.path.exists(pipeline_path)):
        os.remove(pipeline_path)     
    return jsonify(msg="Pipeline is deleted."), 200

@mlserver.route('/changeStatus', methods=['PUT'])
def changeStatus():
    experiment_name = request.json['experiment_name']
    mongo_model.update_experiment({"experimentName": experiment_name}, {'$set': {'experimentStatus': "COMPLETED", "endTime": time.time()}})
    return {"msg": "Status of experiment " + experiment_name + " is changed to COMPLETED"}

@mlserver.route('/getAutoMLSettings', methods=['GET'])
def getAutoMLSettings():
    print("run")
    setting = mongo_model.get_automl_settings()
    if(setting):
        return dumps(setting)
    else:
        new_setting = {"kerasTunerType": "Hyperband", "kerasTunerOptimizer": "accuracy", "kerasTunerNumberOfEpochs": "20",
            "kerasTunerMinDataPoints": "200", "kerasTunerCustomMetricEquation": "", "kerasTunerCustomMetricDirection": "max",
            "evalMLObjective": "mae", "evalMLMinDataPoints": "200", "evalMLMaxIterations": "20", "evalMLTimeout": "5 h",
            "evalMLCustomEarlyGuessPunishment": "2", "evalMLCustomLateGuessPunishment": "5"}
        mongo_model.post_automl_settings(new_setting)
        setting = mongo_model.get_automl_settings()
        return dumps(setting)

@mlserver.route('/updateAutoMLSettings', methods=['PUT'])
def updateAutoMLSettings():
    settings_type = request.json["settingsType"]
    settings = mongo_model.get_automl_settings()
    if(settings):
        pass
    else:
        new_settings = {"kerasTunerType": "Hyperband", "kerasTunerOptimizer": "accuracy", "kerasTunerNumberOfEpochs": "20",
            "kerasTunerMinDataPoints": "200", "kerasTunerCustomMetricEquation": "", "kerasTunerCustomMetricDirection": "max",
            "evalMLObjective": "mae", "evalMLMinDataPoints": "200", "evalMLMaxIterations": "20", "evalMLTimeout": "5 h",
            "evalMLCustomEarlyGuessPunishment": "2", "evalMLCustomLateGuessPunishment": "5"}
        mongo_model.post_automl_settings(new_settings)
        settings = mongo_model.get_automl_settings()
    print("--", settings)
    sid = settings["_id"]
    if(settings_type == "kerasTuner"):
        settings["kerasTunerType"] = request.json["kerasTunerType"]
        settings["kerasTunerOptimizer"] = request.json["kerasTunerOptimizer"]
        settings["kerasTunerNumberOfEpochs"] = request.json["kerasTunerNumberOfEpochs"]
        settings["kerasTunerMinDataPoints"] = request.json["kerasTunerMinDataPoints"]
        settings["kerasTunerCustomMetricEquation"] = request.json["kerasTunerCustomMetricEquation"]
        settings["kerasTunerCustomMetricDirection"] = request.json["kerasTunerCustomMetricDirection"]
    elif(settings_type == "evalML"):
        settings["evalMLObjective"] = request.json["evalMLObjective"]
        settings["evalMLMinDataPoints"] = request.json["evalMLMinDataPoints"]
        settings["evalMLMaxIterations"] = request.json["evalMLMaxIterations"]
        settings["evalMLTimeout"] = request.json["evalMLTimeout"]
        settings["evalMLCustomEarlyGuessPunishment"] = request.json["evalMLCustomEarlyGuessPunishment"]
        settings["evalMLCustomLateGuessPunishment"] = request.json["evalMLCustomLateGuessPunishment"]
    mongo_model.update_automl_settings({"_id":sid}, {"$set": settings})
    return return_response(success = True, message = "Settings are updated successfully", code = 200), 200


@mlserver.route('/getMLModels', methods=['POST'])
def getMLModels():
    settings = request.json
    models = mongo_model.get_ml_models({"assetName": {"$regex" :settings["assetName"]}})
    return json.dumps(list(models), cls=JSONEncoder)

@mlserver.route('/getMLModelsWithID', methods=['POST'])
def getMLModelsWithID():
    settings = request.json
    if("pipelineID" in settings):
        models = mongo_model.get_ml_models({"pipelineID": settings["pipelineID"]})
        return json.dumps(list(models), cls=JSONEncoder)
    models = mongo_model.get_ml_models({"modelID": settings["modelID"]})
    return json.dumps(list(models), cls=JSONEncoder)

@mlserver.route('/startStopModel', methods=['POST'])
def startStopModel():
    model_name = request.json["modelName"]
    enabled = request.json["enabled"]
    mongo_model.update_ml_model({"modelName": model_name}, {"$set": {"enabled": enabled}})
    return {"msg": "model is updated"}


## AutoML APIs
@mlserver.route('/getExperiment', methods=['POST'])
def getExperiment():
    settings = request.json
    experiment = mongo_model.get_experiment({"modelID": settings["modelID"]})
    return json.dumps(experiment, cls=JSONEncoder)

@mlserver.route('/getTrialsFromDB', methods=['POST'])
def getTrialsFromDB():
    experiment_name = request.json["experimentName"]
    experiment = mongo_model.get_experiment({"experimentName": experiment_name})
    start_time = ""
    for trial in experiment["trials"]:
        if(trial["trialNo"] == 1):
            start_time = trial["timestamp"]
            break
    timeout = int(experiment["timeout"][:-1])

    # checking if experiment timeout
    if(start_time != ""):
        now = time.time()
        expire = start_time + (60 * 60 * timeout)
        if(experiment["experimentStatus"] == "RUNNING" and now > expire):
            mongo_model.update_experiment({"experimentName": experiment_name}, {"$set": {"experimentStatus": "TIMEOUT"}})
    exp_return = mongo_model.get_experiment({"experimentName": experiment_name})
    return dumps(exp_return)

@mlserver.route('/getTrialsFromDirectory', methods=['POST'])
def getTrialsFromDirectory():
    experiment_name = request.json["experimentName"]
    experiment_path = AUTOML_EXPERIMENTS_DIR + experiment_name 

    if not os.path.exists(experiment_path):
        return jsonify(trials=dumps([]))
    else:
        trials = [ f.path for f in os.scandir(experiment_path) if f.is_dir() ]
        result = []
        for trial in trials:
            trial_path = trial + '/trial.json'
            trial_result = {}
            detail_text = open(trial_path,'r').read()
            detail_text = detail_text.replace('NaN', 'null')
            detail = json.loads(detail_text)
            trial_result["trialID"] = detail["trial_id"]
            trial_result["hyperparams"] = detail["hyperparameters"]["values"]
            if("loss" in detail["metrics"]["metrics"]):
                trial_result["loss"] = detail["metrics"]["metrics"]["loss"]["observations"][0]["value"][0]
            else:
                trial_result["loss"] = 0.0

            if("accuracy" in detail["metrics"]["metrics"]):
                trial_result["accuracy"] = detail["metrics"]["metrics"]["accuracy"]["observations"][0]["value"][0]
            else:
                if("acc" in detail["metrics"]["metrics"]):
                    trial_result["accuracy"] = detail["metrics"]["metrics"]["acc"]["observations"][0]["value"][0]
                else:
                    trial_result["accuracy"] = 0.0

            if("val_loss" in detail["metrics"]["metrics"]):
                trial_result["val_loss"] = detail["metrics"]["metrics"]["val_loss"]["observations"][0]["value"][0]
            else:
                trial_result["val_loss"] = 0.0

            if("val_accuracy" in detail["metrics"]["metrics"]):
                trial_result["val_accuracy"] = detail["metrics"]["metrics"]["val_accuracy"]["observations"][0]["value"][0]
            else:
                if("val_acc" in detail["metrics"]["metrics"]):
                    trial_result["val_accuracy"] = detail["metrics"]["metrics"]["val_acc"]["observations"][0]["value"][0]
                else:
                    trial_result["val_accuracy"] = 0.0

            if("precision" in detail["metrics"]["metrics"]):
                trial_result["precision"] = detail["metrics"]["metrics"]["precision"]["observations"][0]["value"][0]
            else:
                trial_result["precision"] = 0.0

            if("recall" in detail["metrics"]["metrics"]):
                trial_result["recall"] = detail["metrics"]["metrics"]["recall"]["observations"][0]["value"][0]
            else:
                trial_result["recall"] = 0.0

            if(detail["score"]):
                trial_result["score"] = detail["score"]
            else:
                trial_result["score"] = 0.0
            trial_result["status"] = detail["status"]
            result.append(trial_result)
        return jsonify(trials=dumps(result))

@mlserver.route('/postTrial', methods=['POST'])
def postTrial():
    experiment_name = request.json['experimentName']
    one_trial = json.loads(request.json['trial'])
    mongo_model.update_experiment({"experimentName": experiment_name}, {'$push': {'trials': one_trial}})
    return {"msg": "Trial is added to experiment " + experiment_name}

@mlserver.route('/postModelLog', methods=['POST'])
def postModelLog():
    # if modelid in db add to logs array else add with one
    modelID = request.json["modelID"]
    print("modelID ", modelID)
    logs = mongo_model.get_model_logs({"modelID": modelID})
    if(logs.count() == 0):
        # create one 
        print("create new-------------")
        log = request.json["log"]
        mongo_model.post_model_logs({"modelID": modelID, "logs": [log]})
        return {"msg": "Model " + modelID + " logs object is created."}
    else:
        # add to existing one
        print("push one -------------")
        log = request.json["log"]
        update_set = {"logs": log}
        data = {"$push": update_set}
        mongo_model.update_model_log({"modelID": modelID}, data)
        return {"msg": "Model " + modelID + " log is added."}  

@mlserver.route('/updateLastDataPoint/<modelID>', methods=['PUT'])
def updateLastDataPoint(modelID):
    query = {"modelID": modelID}
    last_data_point = request.json["lastDataPoint"]
    update_set = {"lastDataPoint": last_data_point}
    data = {"$set": update_set}
    mongo_model.update_ml_model(query, data)
    return jsonify(msg="Last data point is updated"), 200 

def return_probability(alpha, beta, days=30):
    if(alpha != 0 or alpha != "0"):
        alpha = float(alpha)
        beta = float(beta)
        probability = 1 - math.e ** (-1 * (days/alpha)**beta)
        return probability
    else:
        return 0

@mlserver.route('/getModelLogsOnCondition/<model_id>', methods=['POST'])
def getModelLogsOnCondition(model_id):
    task = request.json["task"]
    model_logs = mongo_model.get_model_logs({"modelID": model_id})
    if(model_logs.count() == 0):
        return dumps([]), 200
    if(task == "rul"):
        model_logs = [log for log in model_logs[0]["logs"] if log["prediction"] == "1"][-100:]
        return dumps(model_logs), 200
    elif(task == "pof"):
        model_logs = [log for log in model_logs[0]["logs"]][-100:] # if return_probability(log["prediction"][0], log["prediction"][1])>=0.75]
        return dumps(model_logs), 200
    return dumps(model_logs[0]["logs"][-100:]), 200

@mlserver.route('/getModelLogs/<model_id>', methods=['GET'])
def getModelLogs(model_id):
    model_logs = mongo_model.get_model_logs({"modelID": model_id})
    if(model_logs.count() == 0):
        return dumps([]), 200
    return dumps(model_logs[0]["logs"]), 200

@mlserver.route('/getModelLastLog/<model_id>', methods=['GET'])
def getModelLastLog(model_id):
    model_logs = mongo_model.get_model_logs({"modelID": model_id})
    if(model_logs.count() == 0):
        return dumps(None), 200
    return dumps(model_logs[0]["logs"][-1]), 200

@mlserver.route('/getMLModel', methods=['POST'])
def getMLModel():
    settings = request.json
    model_id = settings["modelID"]
    task = settings["task"]
    if(task == "rulreg"):
        model = mongo_model.get_ml_model({"pipelineID": model_id})
        return json.dumps(model, cls=JSONEncoder)
    model = mongo_model.get_ml_model({"modelID": model_id})
    return json.dumps(model, cls=JSONEncoder)
# @mlserver.route('/experiments', methods=['GET'])
# def get_experiments():
#     exps = mongo_model.get_experiments()
#     return json.dumps(list(exps), cls=JSONEncoder)

@mlserver.route('/updateModelLogFeedback', methods=['PUT'])
def updateModelLogFeedback():
    feedback = request.json["feedback"]
    feedbackRange = request.json["feedbackRange"]
    timestamp = request.json["timestamp"]
    modelID = request.json["modelID"]
    query = {"modelID": modelID, "logs.time": timestamp}
    update_set = {"logs.$.feedback": feedback, "logs.$.feedbackRange": feedbackRange}
    data = {"$set": update_set}
    mongo_model.update_model_log(query, data)
    return jsonify(msg="Model log feedback is updated"), 200
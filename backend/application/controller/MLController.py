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
import codecs
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
    reports_path= "/home/machinaide/influxdb/ui/public/"
    path = reports_path + report_path
    html_file = codecs.open(path, "r", "utf-8")
    file_str = html_file.read()
    return {"report": file_str}

@mlserver.route('/getAutomlSettings', methods=['GET'])
def getAutomlSettings():
    print("run")
    setting = mongo_model.get_settings()
    if(setting):
        return dumps(setting)
    else:
        new_setting = {"tunerType": "Hyperband", "nfeatures": "1.5n", "nepochs": "5","optimizer": "accuracy"}
        mongo_model.post_settings(new_setting)
        setting = mongo_model.get_settings()
        return dumps(setting)

@mlserver.route('/updateAutomlSettings', methods=['PUT'])
def updateAutomlSettings():
    setting = mongo_model.get_settings()
    if(setting):
        pass
    else:
        new_setting = {"tunerType": "Hyperband", "nfeatures": "1.5n", "nepochs": "5","optimizer": "accuracy"}
        mongo_model.post_settings(new_setting)
        setting = mongo_model.get_settings()

    sid = setting["_id"] 
    setting["tunerType"] = request.json['tunerType']
    setting["nfeatures"] = request.json['nfeatures']
    setting["nepochs"] = request.json['nepochs']
    setting["optimizer"] = request.json['optimizer']
    mongo_model.update_settings({"_id":sid}, {"$set": setting})
    return {"msg": "automl settings updated"}, 200


@mlserver.route('/queueTrainingSession', methods=['POST'])
@mlserver.route('/queueTrainingSession/<auto>', methods=['POST'])
def queueTrainingSession(auto=None):
    settings = request.json
    if auto is None:
        if ('types' not in settings.keys()
            or 'creator' not in settings.keys()
            or 'sessionID' not in settings.keys()
            or 'dbSettings' not in settings.keys()
            or 'endTime' not in settings.keys()
            or 'startTime' not in settings.keys()
            or 'sensors' not in settings.keys()
            or 'params' not in settings.keys()):
            return "BAD REQUEST: Missing key.", 400
        if len(settings.keys()) > 8:
            return "BAD REQUEST: Unnecessary key.", 400

        algs = []  
        if settings['types'] == "Predictors":
            for p_alg in config.G_ALGS["Predictors"]:
                algs.append(p_alg)
        elif settings['types'] == "Classifiers":
            for c_alg in config.G_ALGS["Classifiers"]:
                algs.append(c_alg)
        else:
            for p_alg in config.G_ALGS["Predictors"]:
                algs.append(p_alg)
            for c_alg in config.G_ALGS["Classifiers"]:
                algs.append(c_alg)

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
            os.makedirs(config.VAE_SENSOR_DIR)
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
        if not os.path.isdir(config.AUTO_SETTINGS_DIR):
            os.mkdir(config.AUTO_SETTINGS_DIR)

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
        cmd = "timeout -k 10 " + timeout + \
            " python3 ./mlhelpers/automl_runner.py -e " + experiment_name + \
            " -u " + username + " -t " + settings['task']
        print(cmd)
        process = subprocess.Popen(cmd.split(), close_fds=True)
        msg = "experiment " + experiment_name + " started with timeout " + timeout + " from user: " + username
        return {"msg": msg}


@mlserver.route('/startPOFModelTraining', methods=['POST'])
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
    return {"msg": msg}

@mlserver.route('/postTrial', methods=['POST'])
def postTrial():
    experiment_name = request.json['experiment_name']
    one_trial = json.loads(request.json['trial'])
    mongo_model.update_experiment({"experimentName": experiment_name}, {'$push': {'trials': one_trial}})
    return {"msg": "Trial is added to experiment " + experiment_name}

@mlserver.route('/postExperiment', methods=['POST'])
def postExperiment():
    experiment_name = request.json['experiment_name']
    username = request.json['owner']
    timeout = request.json['timeout']
    settings = request.json['settings']
    features = request.json['features']
    upload_time = request.json['uploadTime']
    experiment_job = request.json['experiment_job']
    mongo_model.post_experiment({"experimentName": experiment_name, 'experimentStatus': "RUNNING", "startTime": upload_time ,"owner": username,
         "experimentJob": experiment_job, "timeout": timeout, "settings": settings ,"features": features,  "trials": []})
    return {"msg": "New experiment with name " + experiment_name + " is added."}

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

@mlserver.route('/changeStatus', methods=['PUT'])
def changeStatus():
    experiment_name = request.json['experiment_name']
    mongo_model.update_experiment({"experimentName": experiment_name}, {'$set': {'experimentStatus': "COMPLETED"}})
    return {"msg": "Status of experiment " + experiment_name + " is changed to COMPLETED"}

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

# @mlserver.route('/experiments', methods=['GET'])
# def get_experiments():
#     exps = mongo_model.get_experiments()
#     return json.dumps(list(exps), cls=JSONEncoder)
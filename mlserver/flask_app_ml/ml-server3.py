from flask import (
    Flask,
    jsonify,
    request,
    Response,
)
# from flask_restful import (
#     Api,
#     Resource,
# )
from mlconstants import (
#    MAX_WORKERS,
#    MAX_TASKS, 
    G_ALGS, 
#    AUTOSETTINGSDIR,
    G_INFO,
#    ALERT_MODULE_SETTINGS
)
from multiprocessing import Process, Queue
from flask_cors import CORS
import requests
import uuid
import os
import json
import subprocess
from mlwrappers import MLSession, ModelRunner, AlertModule

app = Flask(__name__)
# api = Api(app)
CORS(app, supports_credentials=True)


session_kill_queues = {}
inference_futures = {}
automl_futures = {}

alert_module = None
alert_module_future = None


@app.route('/cancelInference/<session_id>/<model_id>', methods=['DELETE'])
def cancelInference(session_id, model_id):
    try:
        inference_kill_queues[session_id].put(model_id)
        return "DELETED"
    except Exception as e:
        return "ERROR"


@app.route('/cancelModelTraining/<session_id>/<model_id>', methods=['DELETE'])
def cancelModelTraining(session_id, model_id):
    try:
        session_kill_queues[session_id].put(model_id)
        return "DELETED"
    except Exception as e:
        return "ERROR"

@app.route('/queueTrainingSession', methods=['POST'])
@app.route('/queueTrainingSession/<auto>', methods=['POST'])
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
            for p_alg in G_ALGS["Predictors"]:
                algs.append(p_alg)
        elif settings['types'] == "Classifiers":
            for c_alg in G_ALGS["Classifiers"]:
                algs.append(c_alg)
        else:
            for p_alg in G_ALGS["Predictors"]:
                algs.append(p_alg)
            for c_alg in G_ALGS["Classifiers"]:
                algs.append(c_alg)

        used_params = {}
        for alg in algs:
            used_params[alg] = settings['params'][alg]

        kill_sig_queue = Queue()
        session = MLSession(settings, algs, used_params, kill_sig_queue)
        session_kill_queues[settings['sessionID']] = kill_sig_queue
        session.start()
        return "OK", 201
#    else:
#        if ('tunerType' not in settings.keys()
#            or 'experimentName' not in settings.keys()
#            or 'nfeatures' not in settings.keys()
#            or 'nepochs' not in settings.keys()
#            or 'dbSettings' not in settings.keys()
#            or 'username' not in settings.keys()
#            or 'timeout' not in settings.keys()
#            or 'endTime' not in settings.keys()
#            or 'startTime' not in settings.keys()
#            or 'sensors' not in settings.keys()
#            or 'sessionID' not in settings.keys()):
#            return "BAD REQUEST: Missing key.", 400
#         session = AutoMLSession(settings)
#         automl_futures[settings['sessionID']] = session.run()    
#         global process
#        if not os.path.isdir(AUTOSETTINGSDIR):
#            os.mkdir(AUTOSETTINGSDIR)

#        experiment_name = settings['experimentName']
#        username = settings['username']
#        t_dir = AUTOSETTINGSDIR + experiment_name + "-" + username + ".json"
#        with open(t_dir, 'w') as fp:
#            json.dump(settings, fp)
#        timeout = str(settings['timeout']) + "h"
#        cmd = "timeout -k 10 " + timeout + \
#            " python3 automl_runner.py -e " + experiment_name + \
#            " -u " + username
#        print(cmd)
#        process = subprocess.Popen(cmd.split(), close_fds=True)
#        msg = "experiment " + experiment_name + " started with timeout " + timeout + " from user: " + username
#        return {"msg": msg}


@app.route('/startInferenceJob/<session_id>/<model_id>')
def startInferenceJob(session_id, model_id):
    url = POSTTRAININGURL + session_id + "/" + model_id
    post_training_info = requests.get(url=url)
    runner = ModelRunner(post_training_info.json())
    if session_id not in inference_futures.keys():
        inference_futures[session_id] = {}
    inference_futures[session_id][model_id] = runner.run()

    return "OK", 201

@app.route('/basicTraining/<task>', methods=['POST'])
def basicTraining(task):
    settings = request.json
    kill_sig_queue = Queue()
    session = AutoMLSession(settings, kill_sig_queue)
    session_kill_queues[settings['sessionID']] = kill_sig_queue
    session.start()

    return "OK", 201

@app.route('/basicRun/<session_id>/<model_id>', methods=['POST'])
def basicRun(model_id):
    update_pkg = {
        "modelID": model_id,
        "status": "running"
    }
    requests.post(url=UPDATEROWURL, json=update_pkg)
    url = 'http://localhost:7392/getBasicModel/' + model_id
    settings = requests.get(url=url)
    print(settings.json())
    runner = ModelRunner(settings.json())
    runner.start()

    return "OK", 201
        

if __name__ == '__main__':
#    alert_module = AlertModule(ALERT_MODULE_SETTINGS)
#    alert_module_future = alert_module.run()
    app.run(debug = True, port=9798)

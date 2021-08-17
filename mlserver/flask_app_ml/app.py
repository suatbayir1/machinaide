from flask import Flask, request, jsonify
import time
import requests
import os
import json
import subprocess
from multiprocessing import Queue
from mlwrappers import ADSession, AutoMLSession, ModelRunner
from mlconstants import (
    G_ALGS,
    GET_POST_TRAINING_URL,
    AUTO_SETTINGS_DIR
)


server = Flask(__name__)

session_kill_queues = {}
automl_futures = {}
inference_futures = {}

@server.route('/queueTrainingSession', methods=['POST'])
@server.route('/queueTrainingSession/<auto>', methods=['POST'])
def queue_training_session(auto=None):
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
        if settings['types'] == "AD":
            for ad_alg in G_ALGS["AD"]:
                algs.append(ad_alg)
        elif settings['types'] == "RUL":
            for rul_alg in G_ALGS["RUL"]:
                algs.append(rul_alg)
        elif settings['types'] == "FP":
            for fp_alg in G_ALGS["FP"]:
                algs.append(fp_alg)
        # else:
        #     for p_alg in G_ALGS["Predictors"]:
        #         algs.append(p_alg)
        #     for c_alg in G_ALGS["Classifiers"]:
        #         algs.append(c_alg)

        used_params = {}
        for alg in algs:
            used_params[alg] = settings['params'][alg]


        kill_sig_queue = Queue()
        if settings['types'] == "AD":
            session = ADSession(settings, algs, used_params, kill_sig_queue)
        session_kill_queues[settings['sessionID']] = kill_sig_queue
        session.start()
    else:
        if ('tunerType' not in settings.keys()
           or 'experimentName' not in settings.keys()
           or 'nfeatures' not in settings.keys()
           or 'nepochs' not in settings.keys()
           or 'dbSettings' not in settings.keys()
           or 'username' not in settings.keys()
           or 'timeout' not in settings.keys()
           or 'endTime' not in settings.keys()
           or 'startTime' not in settings.keys()
           or 'sensors' not in settings.keys()
           or 'sessionID' not in settings.keys()):
            return "BAD REQUEST: Missing key.", 400
        session = AutoMLSession(settings)
        automl_futures[settings['sessionID']] = session.run()    
        global process
        if not os.path.isdir(AUTO_SETTINGS_DIR):
            os.mkdir(AUTO_SETTINGS_DIR)

        experiment_name = settings['experimentName']
        username = settings['username']
        t_dir = AUTO_SETTINGS_DIR + experiment_name + "-" + username + ".json"
        with open(t_dir, 'w') as fp:
            json.dump(settings, fp)
        timeout = str(settings['timeout']) + "h"
        cmd = "timeout -k 10 " + timeout + \
            " python3 automl_runner.py -e " + experiment_name + \
            " -u " + username
        print(cmd)
        process = subprocess.Popen(cmd.split(), close_fds=True)
        msg = "experiment " + experiment_name + " started with timeout " + timeout + " from user: " + username
        return {"msg": msg}
    return "OK", 201


@server.route('/cancelModelTraining/<session_id>/<model_id>', methods=['DELETE'])
def cancelModelTraining(session_id, model_id):
    try:
        session_kill_queues[session_id].put(model_id)
        return "DELETED"
    except Exception as e:
        return "ERROR"


@server.route('/startInferenceJob/<session_id>/<model_id>')
def startInferenceJob(session_id, model_id):
    url = GET_POST_TRAINING_URL + session_id + "/" + model_id
    post_training_info = requests.get(url=url)
    runner = ModelRunner(post_training_info.json())
    if session_id not in inference_futures.keys():
        inference_futures[session_id] = {}
    inference_futures[session_id][model_id] = runner.run()

    return "OK", 201

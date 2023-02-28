import spacy
from fuzzywuzzy import process # string matching based on a score https://github.com/seatgeek/fuzzywuzzy
import dateparser
import random 
import datetime
import datetime as dt
from spellchecker import SpellChecker
from spacy.util import minibatch, compounding, decaying
from spacy.matcher import Matcher

from flask import Flask
from flask_cors import CORS
from flask import jsonify
from flask import request
from flask_pymongo import PyMongo
from pymongo import MongoClient

# for querying influxdb through api
import requests
import json
from bson.json_util import dumps
import datetime
import config

# flask server
app = Flask(__name__)
#app.config['MONGO_DBNAME'] = 'machinaide' ## name of the used database
#app.config['MONGO_URI'] = 'mongodb://machinaide:erste2020@localhost:27017/admin'
CORS(app,supports_credentials=True)
# mongo = PyMongo(app, uri='mongodb://machinaide:erste2020@localhost:27017/machinaide')
mongo = MongoClient('mongodb://machinaide:erste2020@localhost:27017/')# .machinaide
db = "machinaide"

nlp = spacy.load(f"{config.PROJECT_URL}/nlp/mongo-textcat/training/model-best")

@app.route('/findcat', methods=['GET'])
def which_cat():
    textcat = nlp.get_pipe("textcat")
    query = request.json["query"]
    doc = nlp(query)
    scores = textcat.predict([doc])
    # nlp.set_annotations(doc, scores)
    print("#########  ", query, "\n", scores)
    predicted_labels = scores.argmax(axis=1)
    textcat_labels = [textcat.labels[label] for label in predicted_labels]
    return jsonify(cat=dumps(textcat_labels))

@app.route('/mongotest', methods=['GET'])
def get_sources_from_failures():
    from_date = datetime.datetime(2021, 4, 10, 12, 30, 30, 125000)
    to_date = datetime.datetime.now()
    start = request.json["start"]
    end = request.json["end"]
    if(end == ''):
        end = datetime.datetime.now().isoformat()
    failures = mongo.machinaide.failures.find()
    """ for i in range(failures.count()):
        if(failures[i]["endTime"] == ""):
            print(failures[i]["endTime"])
            failures[i]["endTime"] = to_date.isoformat()
            print("-->",failures[i]["endTime"], to_date.isoformat()) """
        # print("fail", failure)
        # print(datetime.datetime.fromisoformat(failure["startTime"]))
    res = []
    for failure in failures:
        if(datetime.datetime.fromisoformat(failure["startTime"])>from_date):
            if(failure["endTime"] == ""):
                # print(failure)
                res.append(failure["sourceName"])
            else:
                if(datetime.datetime.fromisoformat(failure["endTime"])<to_date):
                    # print(failure)
                    res.append(failure["sourceName"])
    # res = [failure["endTime"] for failure in failures if (datetime.datetime.fromisoformat(failure["startTime"])>from_date)]
    """ failures = mongo.machinaide.failures.find()
    checking = [failure for failure in failures if (datetime.datetime.fromisoformat(failure["startTime"])>from_date)]
    print(checking) """
    res = list(dict.fromkeys(res))
    print(res)
    return jsonify(count=len(res),res=dumps(res))

@app.route('/maintest', methods=['GET'])
def get_sources_from_maintenance():
    from_date = datetime.datetime(2021, 4, 10, 12, 30, 30, 125000)
    to_date = datetime.datetime.now()
    start = request.json["start"]
    end = request.json["end"]
    if(end == ''):
        end = datetime.datetime.now().isoformat()
    maintenances = mongo.machinaide.maintenance.find()
    res = [maintenance["asset"] for maintenance in maintenances if (datetime.datetime.fromisoformat(maintenance["date"])>from_date)]
    res = list(dict.fromkeys(res))
    # print(res)
    return jsonify(count=len(res),res=dumps(res))


@app.route('/counttest', methods=['GET'])
def maintenance_count():
    source = request.json["source"]
    maintenance_count = mongo.machinaide.maintenance.find({"asset": source}).count()
    print(maintenance_count)
    return jsonify(count=maintenance_count)
    

@app.route('/test', methods=['GET'])
def testAPI():
    # res = dumps(mongo.db.nlp_questions.find())
    res = dumps(mongo.db.failures.find())
    print(res)
    return jsonify(msg="Working", res=res)

if __name__ == '__main__':
    print("test server started running")
    app.run(debug=True, port=6666)
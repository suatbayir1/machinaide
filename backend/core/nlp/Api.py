import json
import time
import random
import argparse
import requests
import sys
sys.path.insert(1, '/home/machinaide/backend')
from flask import Flask, jsonify, request, Response
from flask_classful import FlaskView, route
from flask_cors import CORS
from core.nlp.QuestionCorrector import QuestionCorrector
from core.nlp.MongoManager import MongoManager
from core.nlp.Helper import Helper
from core.nlp.NLPStarter import nlp, matcher, stat_matcher
from core.nlp.NLPHandler import NLPHandler
from core.nlp.JsonToText import JsonToText
import config

class Api(FlaskView):
    def __init__(self):
        self.questionCorrector = QuestionCorrector()
        self.mongoManager = MongoManager()
        self.helper = Helper()
        self.handler = NLPHandler()
        self.jsonToText = JsonToText()

    @route("postQuestion", methods = ["POST"])
    def postQuestion(self):
        try:
            question = request.json["question"]
            fixed_question, is_question_fixed = self.questionCorrector.fixed_question(question)

            in_mongodb = self.handler.check_in_training_data(fixed_question)

            if(in_mongodb["exists"]):
                query_result = in_mongodb["query"]
                labels = in_mongodb["labels"]
                textcat_labels = [self.helper.category_parse(in_mongodb["cat"])]
                mongo_template = self.helper.template_parse(in_mongodb["mongoTextcat"])
                graph_overlay = False
            else:
                # ner part
                doc = nlp(fixed_question)
                result = self.handler.create_query(fixed_question)
                query_result = result["query"]
                labels = result["labels"]
                textcat_labels = result["textcatLabels"]
                mongo_template = result["mongoTextcat"]
                graph_overlay = result["graphOverlay"]

            if(textcat_labels[0] == "influxdb"):
                payload2 = "{\"query\": \"" + query_result + "\",\"type\": \"flux\"}"
                url = "http://localhost:8086/api/v2/query?orgID=" + config.influx["orgID"] #d572bde16b31757c"
                headers = {'Authorization': 'Token '+ config.influx["dbtoken"],'Content-Type': 'application/json'}
                api_response = requests.request('POST', url, headers=headers, data=payload2)
                
                if('json' in api_response.headers.get('Content-Type')):
                    return jsonify(
                        error=api_response.json()["message"], 
                        entities=labels, 
                        fixedQuestion=fixed_question,
                        isFixed=is_question_fixed, 
                        graphOverlay=False, 
                        textcatLabels=textcat_labels
                    )
                if(api_response.text):
                    return jsonify(
                        query=query_result, 
                        data=api_response.text, 
                        entities=labels, 
                        fixedQuestion=fixed_question, 
                        isFixed=is_question_fixed, 
                        graphOverlay=graph_overlay, 
                        textcatLabels=textcat_labels, 
                        mongoTextcat=mongo_template
                    )
                else:
                    return jsonify(
                        msg="No response", 
                        entities=labels, 
                        fixedQuestion=fixed_question, 
                        isFixed=is_question_fixed, 
                        graphOverlay=graph_overlay, 
                        textcatLabels=textcat_labels,
                        mongoTextcat=mongo_template
                    )
            elif(textcat_labels[0] == "mongodb"):
                text = self.jsonToText.return_response(labels, mongo_template, query_result)

                return jsonify(
                    query=query_result,
                    data="mongo-data", 
                    entities=labels, 
                    fixedQuestion=fixed_question, 
                    isFixed=is_question_fixed, 
                    graphOverlay=graph_overlay, 
                    textcatLabels=textcat_labels, 
                    mongoTextcat=mongo_template,
                    resultText=text
                )
        except:
            return jsonify(
                error= "An unexpected error has occurred",
                entities="", 
                fixedQuestion="",
                isFixed=False, 
                graphOverlay=False, 
                textcatLabels=""
            )

    @route('/postTrainData', methods=['PUT'])
    def postTrainData(self):
        res = self.mongoManager.post_train_data(request.json)
        return jsonify(msg="Train data added.")

    @route('/wordFrequency', methods=['GET'])
    def wordFrequency(self):
        print("word frequency")
        result = self.handler.word_frequency()
        return jsonify(result = result)

def parse_args():
    parser = argparse.ArgumentParser(description='Parameters that can be sent')
    parser.add_argument('--host', type=str, required=False, default='localhost', help='Hostname of Api')
    parser.add_argument('--port', type=int, required=False, default=9092, help='Port of Api')
    return parser.parse_args()

if __name__ == "__main__":
    app = Flask(__name__)
    CORS(app,supports_credentials=True)
    Api.register(app, route_base = '/')
    args = parse_args()
    app.run(debug = True, port = 8787)
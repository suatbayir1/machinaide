from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.NLPModel import NLPModel
import json
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger
import time
import random
import argparse
import requests
import config
import sys
sys.path.insert(1, f'{config.PROJECT_URL}/backend')
from core.nlp.QuestionCorrector import QuestionCorrector
from core.nlp.MongoManager import MongoManager
from core.nlp.Helper import Helper
from core.nlp.NLPStarter import nlp, matcher, stat_matcher
from core.nlp.NLPHandler import NLPHandler
from core.nlp.JsonToText import JsonToText
from application.classes.SentenceSimilarityCalculator import SentenceSimilarityCalculator
from application.classes.Validator import Validator

nlpserver = Blueprint("nlp", __name__)

# Instances
model = NLPModel()
logger = MongoLogger()
handler = NLPHandler()
mongoManager = MongoManager()
questionCorrector = QuestionCorrector()
helper = Helper()
jsonToText = JsonToText()
sentenceSimilarityCalculator = SentenceSimilarityCalculator()
validator = Validator()

@nlpserver.route("/postQuestion", methods = ["POST"])
@token_required(roles = ["admin", "member", "editor"])
def postQuestion(token):
    try:
        question = request.json["question"]

        fixed_question, is_question_fixed = questionCorrector.fixed_question(question)
        in_mongodb = handler.check_in_training_data(fixed_question)

        if(in_mongodb["exists"]):
            query_result = in_mongodb["query"]
            labels = in_mongodb["labels"]
            textcat_labels = [helper.category_parse(in_mongodb["cat"])]
            mongo_template = helper.template_parse(in_mongodb["mongoTextcat"])
            graph_overlay = False
        else:
            # ner part
            doc = nlp(fixed_question)
            result = handler.create_query(fixed_question)
            query_result = result["query"]
            labels = result["labels"]
            textcat_labels = result["textcatLabels"]
            mongo_template = result["mongoTextcat"]
            graph_overlay = result["graphOverlay"]

        if(textcat_labels[0] == "influxdb"):
            payload2 = "{\"query\": \"" + query_result + "\",\"type\": \"flux\"}"
            # url = "http://localhost:8086/api/v2/query?orgID=" + config.influx["orgID"]
            url = config.influx["host"] + "/api/v2/query?orgID=" + config.influx["orgID"]
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
            text = jsonToText.return_response(labels, mongo_template, query_result)

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

@nlpserver.route('/wordFrequency', methods=['GET'])
@token_required(roles = ["admin", "member", "editor"])
def wordFrequency(token):
    print("word frequency")
    result = handler.word_frequency()
    return jsonify(result = result)

@nlpserver.route('/postTrainData', methods=['PUT'])
@token_required(roles = ["admin", "member", "editor"])
def postTrainData(token):
    res = mongoManager.post_train_data(request.json)
    return jsonify(msg="Train data added.")

@nlpserver.route('/similarQuestions', methods = ['POST'])
@token_required(roles = ["admin", "member", "editor"])
def similarQuestions(token):
    try: 
        print("1")
        message, confirm = validator.check_request_params(request.json, ["question"])
        print("2")

        if not confirm:
            return return_response(success = False, message = message, code = 400), 400

        print("3")

        questions = model.get_questions({"question": 1, "_id": 0})
        print("4")
        
        if not questions:
            return return_response(data = [], success = False, message = "There are no questions in the database", code = 403), 403
        print("5")

        questions = [question["question"] for question in questions]
        print("6")

        similarity_table = sentenceSimilarityCalculator.calculate_jaccard_similarity(request.json["question"], questions)
        # similarity_table = sentenceSimilarityCalculator.calculate_cosine_similarity(request.json["question"], questions)
        # similarity_table = sentenceSimilarityCalculator.calculate_similarity_with_spacy(request.json["question"], questions)
        # similarity_table = sentenceSimilarityCalculator.sentence_transformer_semantic_search(request.json["question"], questions)

        print("table will here", similarity_table)
        return return_response(data = similarity_table, success = True, message = "Questions were brought to the 5 most similar questions to the question")
    except:
        return return_response(success = False, message = "Unexpected error occurred", code = 403), 403

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


from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.NLPModel import NLPModel
import json
from werkzeug.utils import secure_filename
import os
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger

nlp = Blueprint("nlp", __name__)

model = NLPModel()
logger = MongoLogger()


handler = NLPHandler()


@nlp.route('/wordFrequency', methods=['GET'])
# @token_required(roles = ["admin"])
def wordFrequency(token):
    print("word frequency")
    result = handler.word_frequency()
    return jsonify(result = result)
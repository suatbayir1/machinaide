from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.PredictionModel import PredictionModel
import json
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger

prediction = Blueprint("prediction", __name__)

model = PredictionModel()
logger = MongoLogger()

@prediction.route("/getAllPrediction", methods = ["GET"])
@token_required(roles = ["admin", "member", "superadmin"])
def get_all_prediction(token):
    result = model.get_all_prediction()
    message = "get_all_prediction"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = result, success = True, message = message), 200

@prediction.route("/getPredictionById", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def get_prediction_by_id(token):
    result = model.get_prediction_by_id(request.json)
    message = "get_prediction_by_id"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
    return return_response(data = result, success = True, message = message), 200

@prediction.route("/getPredictionInfo", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def get_prediction_info(token):
    result = model.get_prediction_info(request.json)
    message = "get_prediction_info"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
    return return_response(data = result, success = True, message = message), 200

@prediction.route("/addPrediction", methods = ["POST"])
def add_prediction():
    result = model.add_prediction()
    message = "added_prediction"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = [], success = True, message = message)

@prediction.route("/addPredictionInfo", methods = ["POST"])
def add_prediction_info():
    result = model.add_prediction_info()
    message = "added_prediction_info"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = [], success = True, message = message)

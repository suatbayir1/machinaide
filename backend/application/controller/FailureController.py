from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.FailureModel import FailureModel
import json
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger

failure = Blueprint("failure", __name__)

model = FailureModel()
logger = MongoLogger()

@failure.route("/getAllFailures", methods = ["GET"])
@token_required(roles = ["admin", "member", "superadmin"])
def get_all_failures(token):
    result = model.get_all_failures()
    message = "get_all_failures"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = result, success = True, message = message), 200

@failure.route("/addFailure", methods = ["POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def add_failure(token):
    result = model.add_failure(request.json)
    message = "added_failure"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
    return return_response(success = True, message = message), 200

@failure.route("/isFailureExist", methods = ["POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def is_failure_exist(token):
    result = model.is_failure_exist(request.json)
    if not result:
        message = "failure_not_exists"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message), 200
    else:
        message = "failure_already_exists"
        logger.add_log("DUPLICATED", request.remote_addr, token["username"], request.method, request.url, request.json, message,  409)
        return return_response(success = True, message = "failure_already_exists"), 409

@failure.route("/updateFailure", methods = ["POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def update_failure(token):
    result = model.update_failure(request.json)

    if not result:
        message = "Invalid recordId"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message), 400
    else:
        message = "updated_failure"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message), 200

@failure.route("/removeFailure", methods = ["POST", "DELETE"])
@token_required(roles = ["admin", "member", "superadmin"])
def remove_failure(token):
    result = model.remove_failure(request.json)

    if not result:
        message = "Invalid recordId"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message), 400
    else:
        message = "removed_failure"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message), 200
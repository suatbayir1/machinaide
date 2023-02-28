from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.FailureModel import FailureModel
import json
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger
from bson import ObjectId
from bson.json_util import dumps
import requests

failure = Blueprint("failure", __name__)

model = FailureModel()
logger = MongoLogger()

@failure.route("/getAllFailures", methods = ["GET"])
@token_required(roles = ["admin", "member", "editor"])
def get_all_failures(token):
    result = model.get_all_failures()
    message = "get_all_failures"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = result, success = True, message = message), 200
    # return return_response(data = result[result.count()-30:], success = True, message = message), 200

@failure.route("/getFailures", methods = ["POST"])
@token_required(roles = ["admin", "member", "editor"])
def get_failures(token):
    source_name = request.json["sourceName"]
    result = model.get_failures({"sourceName": source_name, "description" : {"$regex" : "ariza", '$options' : 'i'}})
    message = "get_failures"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    # return dumps({"sourceName": source_name, "token": token})
    # return dumps(result), 200
    # return return_response(data = result[result.count()-30:], success = True, message = message), 200
    return return_response(data = result, success = True, message = message), 200

@failure.route("/getLastFailures", methods = ["POST"])
@token_required(roles = ["admin", "member", "editor"])
def get_last_failures(token):
    source_name = request.json["sourceName"]
    result = model.get_failures({"sourceName": source_name, "description" : {"$regex" : "ariza", '$options' : 'i'}})
    message = "get_last_failures"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    # return dumps({"sourceName": source_name, "token": token})
    # return dumps(result), 200
    # return return_response(data = result[result.count()-30:], success = True, message = message), 200
    return return_response(data = list(result)[-100:], success = True, message = message), 200

@failure.route("/getTokenTest", methods = ["POST"])
@token_required(roles = ["admin", "member", "editor"])
def get_token_test(token):
    message = "token test"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    headers = {
        'token': request.json["token"],
        'Content-Type': 'application/json'
    }
    res = requests.post(url="https://vmi474601.contaboserver.net/api/v1.0/failure/getFailures", json={"sourceName": "Press031"}, headers=headers)
    # return dumps({"sourceName": source_name, "token": token})
    return dumps({"msg": "token test", "token": token}), 200

@failure.route("/testFailures/<source_name>", methods = ["GET"])
def test_failures(source_name):
    return dumps({"sourceName": source_name})

@failure.route("/addFailure", methods = ["POST"])
@token_required(roles = ["admin", "editor", "member"])
def add_failure(token):
    result = model.add_failure(request.json)
    message = "added_failure"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
    return return_response(success = True, message = message), 200

@failure.route("/isFailureExist", methods = ["POST"])
@token_required(roles = ["admin", "editor", "member"])
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

@failure.route("/updateFailure", methods = ["POST", "PUT"])
@token_required(roles = ["admin", "editor", "member"])
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
@token_required(roles = ["admin", "editor", "member"])
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

@failure.route("/getByCondition", methods = ["POST"])
@token_required(roles = ["admin", "editor", "member"])
def get_by_condition(token):
    try:
        if not request.json:
            message = "Payload cannot be empty"
            log_type = "ERROR"
            return return_response(success = False, message = message), 400

        payload = {"description" : {"$regex" : "ariza", '$options' : 'i'}}

        if "regex" in request.json:
            for item in request.json["regex"]:
                for key, value in item.items():
                    payload[key] = { '$regex': f"{value}$"}

        if "exists" in request.json:
            for item in request.json["exists"]:
                for key, value in item.items():
                    payload[key] = { '$exists': value}

        if "match" in request.json:
            for item in request.json["match"]:
                for key, value in item.items():
                    payload[key] = value


        if "inArray" in request.json:
            for item in request.json["inArray"]:

                objectid_array = [ObjectId(i) for i in request.json["inArray"][item]]
                payload[item] = {'$in': objectid_array}

        print("payload", payload)

        result = model.get_by_condition(payload)

        print("len", type(result))
        print("len2", len(result))

        message = f"Failure records were successfully fetched. Count: {len(result)}"
        log_type = "INFO"
        return return_response(data = result[len(result)-30:], success = True, message = message), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        return return_response(success = False, message = message), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  200)

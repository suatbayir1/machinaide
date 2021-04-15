from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.FactoryModel import FactoryModel
import json
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger

factory = Blueprint("factory", __name__)

model = FactoryModel()
logger = MongoLogger()

@factory.route("/getFactories", methods = ["GET"])
@token_required(roles = ["admin", "member", "superadmin"])
def get_factories(token):
    data = model.get_factories()
    message = "get_factories_successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message), 200

@factory.route("/getMachines", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def get_machines(token):
    data = model.get_machines(request.json)
    message = "get_machines_successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message)

@factory.route("/getComponents", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def get_components(token):
    data = model.get_components(request.json)
    message = "get_components_successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message)

@factory.route("/getSensors", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def get_sensors(token):
    data = model.get_sensors(request.json)
    message = "get_sensors_successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = "get_sensors_successfully")

@factory.route("/addMachineAction", methods = ["POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def add_machine_action(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400

    result = model.add_machine_action(request.json)
    message = "Machine action added successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(success = True, message = message, code = 200), 200

@factory.route("/getAllMachineActions", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def get_all_machine_actions(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400

    data = model.get_all_machine_actions(request.json)
    message = "All machine action information has been successfully fetched"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message), 200

@factory.route("/updateMachineAction", methods = ["POST", "PUT"])
@token_required(roles = ["admin", "member", "superadmin"])
def update_machine_action(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400

    result = model.update_machine_action(request.json)

    if not result:        
        message = "Invalid recordId"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Machine action updated successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
        return return_response(success = True, message = message, code = 200), 200

@factory.route("/deleteMachineAction", methods = ["POST", "DELETE"])
@token_required(roles = ["admin", "member", "superadmin"])
def delete_machine_action(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400
    
    result = model.delete_machine_action(request.json)

    if not result:
        message = "Invalid recordId"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Machine action deleted successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
        return return_response(success = True, message = message, code = 200), 200

@factory.route("/isMachineActionExists", methods = ["POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def is_machine_action_exists(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400

    result = model.is_machine_action_exists(request.json)

    if not result:
        message = "Machine action record not exists"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message, code = 200)
    else:
        message = "Machine action record already exists"
        logger.add_log("DUPLICATED", request.remote_addr, token["username"], request.method, request.url, request.json, message,  409)
        return return_response(success = True, message = message, code = 409)
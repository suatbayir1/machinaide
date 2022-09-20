from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.MaintenanceModel import MaintenanceModel
import json
from application.helpers.Helper import return_response, token_required, request_validation
from core.logger.MongoLogger import MongoLogger
from bson import ObjectId

maintenance = Blueprint("maintenance", __name__)

model = MaintenanceModel()
logger = MongoLogger()


@maintenance.route("/getAllMaintenance", methods = ["GET"])
@token_required(roles = ["admin", "member", "editor"])
def get_all_maintenance(token):
    result = model.get_all_maintenance()
    message = "All maintenance records were successfully fetched"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = result, success = True, message = message), 200

@maintenance.route("/addMaintenance", methods = ["POST"])
@token_required(roles = ["admin", "editor"])
def add_maintenance(token):
    requiredField = ["asset", "maintenanceTime"]

    for field in requiredField:
        if field not in request.json:
            message = "[asset, maintenanceTime cannot be empty]"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
            return return_response(data = [], success = False, message = message, total_count = 0, code = 0), 400

    result = model.add_maintenance(request.json)
    message = "Maintenance record added successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
    return return_response(data = [], success = True, message = message, code = 200), 200

@maintenance.route("/updateMaintenance", methods = ["POST", "PUT"])
@token_required(roles = ["admin", "editor"])
def update_maintenance(token):
    result = model.update_maintenance(request.json)

    if not result:
        message = "Invalid recordId"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Maintenance record updated successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message, code = 200), 200

@maintenance.route("/removeMaintenance", methods = ["POST", "DELETE"])
@token_required(roles = ["admin", "editor"])
def remove_maintenance(token):
    result = model.remove_maintenance(request.json)

    if not result:
        message = "Invalid recordId"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Maintenance record deleted successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message, code = 200), 200

@maintenance.route("/isMaintenanceExist", methods = ["POST"])
@token_required(roles = ["admin", "editor"])
def is_maintenance_exist(token):
    result = model.is_maintenance_exist(request.json)
    if not result:
        message = "Maintenance record not exists"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message, code = 200)
    else:
        message = "Maintenance record already exists"
        logger.add_log("DUPLICATED", request.remote_addr, token["username"], request.method, request.url, request.json, message,  409)
        return return_response(success = True, message = message, code = 409)


@maintenance.route("/getByCondition", methods = ["POST"])
@token_required(roles = ["admin", "editor", "member"])
def get_by_condition(token):
    try:
        if not request.json:
            message = "Payload cannot be empty"
            log_type = "ERROR"
            return return_response(success = False, message = message), 400

        payload = {}

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

        if "inside" in request.json:
            for item in request.json["inside"]:
                for key, value in item.items():
                    payload[key] = {'$regex': f'.*{value}.*'}

        if "inArray" in request.json:
            print("inside in array")
            for item in request.json["inArray"]:
                print("item", item)

                objectid_array = [ObjectId(i) for i in request.json["inArray"][item]]
                print("objectid_array", objectid_array)
                payload[item] = {'$in': objectid_array}
                print("after inArray")

        print("payload", payload)

        result = model.get_by_condition(payload)

        message = "Maintenance records were successfully fetched"
        log_type = "INFO"
        return return_response(data = result, success = True, message = message), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        return return_response(success = False, message = message), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  200)

from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.MaintenanceModel import MaintenanceModel
import json
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger

maintenance = Blueprint("maintenance", __name__)

model = MaintenanceModel()
logger = MongoLogger()


@maintenance.route("/getAllMaintenance", methods = ["GET"])
@token_required(roles = ["admin", "member", "superadmin"])
def get_all_maintenance(token):
    result = model.get_all_maintenance()
    message = "All maintenance records were successfully fetched"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = result, success = True, message = message), 200

@maintenance.route("/addMaintenance", methods = ["POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def add_maintenance(token):
    requiredField = ["asset", "date", "maintenanceType", "faultType"]

    for field in requiredField:
        if field not in request.json:
            message = "[asset, date, maintenanceType, faultType cannot be empty]"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
            return return_response(data = [], success = False, message = message, total_count = 0, code = 0), 400

    result = model.add_maintenance(request.json)
    message = "Maintenance record added successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
    return return_response(data = [], success = True, message = message, code = 200), 200

@maintenance.route("/updateMaintenance", methods = ["POST"])
@token_required(roles = ["admin", "member", "superadmin"])
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
@token_required(roles = ["admin", "member", "superadmin"])
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
@token_required(roles = ["admin", "member", "superadmin"])
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
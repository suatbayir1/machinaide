from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.GeneralModel import GeneralModel
import json
import os
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger
import config

general = Blueprint("general", __name__)

model = GeneralModel()
logger = MongoLogger()


@general.route("/newReport", methods = ["POST"])
@token_required(roles = ["admin", "member", "editor"])
def new_report(token):
    result = model.new_report(request.json)

    if not result:
        message = "Report record could not be created"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Report record created successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message, code = 200), 200

@general.route("/getReports", methods = ["GET"])
@token_required(roles = ["admin", "member", "editor"])
def get_reports(token):
    result = model.get_reports()
    message = "All report records were successfully fetched"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(success = True, data = result, message = message, code = 200), 200

@general.route("/getCreatedReports", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "editor"])
def get_created_reports(token):
    try:
        root_path = f"{config.PROJECT_URL}/influxdb/ui/assets/reports"
        reports_path = os.path.join(root_path, request.json['title'])

        reports = [f for f in os.listdir(reports_path) if os.path.isfile(os.path.join(reports_path, f))]

        result = {
            "root_path": f"/assets/reports/{request.json['title']}",
            "files": reports
        }

        message = "All created report records were successfully fetched"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
        return return_response(success = True, data = result, message = message, code = 200), 200
    except:
        message = "No reports have been generated yet"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400


@general.route("/deleteReport", methods = ["POST", "DELETE"])
@token_required(roles = ["admin", "member", "editor"])
def delete_report(token):
    result = model.delete_report(request.json)

    if not result:
        message = "Report record could not be deleted"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Report record deleted successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message, code = 200), 200

@general.route("/updateReport", methods = ["POST", "PUT"])
@token_required(roles = ["admin", "editor", "member"])
def update_report(token):
    result = model.update_report(request.json)

    if not result:
        message = "Invalid recordId"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Report record updated successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message, code = 200), 200
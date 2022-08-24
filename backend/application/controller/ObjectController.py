from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.ObjectModel import ObjectModel
import json
from werkzeug.utils import secure_filename
import os
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger
from application.classes.Validator import Validator

obj = Blueprint("object", __name__)

model = ObjectModel()
logger = MongoLogger()
validator = Validator()

@obj.route("/getObjectPool", methods = ["GET"])
@token_required(roles = ["admin", "editor", "member"])
def get_object_pool(token):
    data = model.get_object_pool()
    message = "Get_Object_Pool_Successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message), 200

@obj.route("/saveComponentObject", methods = ["PUT"])
@token_required(roles = ["admin", "editor", "member"])
def save_component_object(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["name", "children"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        result = model.save_component_object(request.json)

        message = "Component saved succesfully"
        log_type = "INFO"
        status_code = 200
        return return_response(success = True, message = message, code = 200), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message, code = 400), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)


@obj.route("/saveAsComponentObject", methods = ["POST"])
@token_required(roles = ["admin", "editor", "member"])
def save_as_component_object(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["name", "children"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        result = model.save_as_component_object(request.json)         

        if not result:
            message = "Object Already Exists"
            status_code = 409
            log_type = "DUPLICATED"
            return return_response(success = False, message = message, code = 409), 409
        else:
            message = "All Objects Saved Successfully"
            status_code = 200
            log_type = "INFO"
            return return_response(success = True, message = message, code = 200), 200          
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message, code = 400), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)

@obj.route("/removeObject", methods = ["POST", "DELETE"])
@token_required(roles = ["admin", "editor", "member"])
def remove_object(token):
    result = model.remove_object(request.json)
    if result:
        message = "Removed_Object_Successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message), 200
    else:
        message = "Error_While_Deleting_Object"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = 'Error_While_Deleting_Object'), 400


@obj.route("/deleteComponentModel", methods = ["DELETE"])
@token_required(roles = ["admin", "editor", "member"])
def deleteComponentModel(token):
    try:
        print("test")
        message, confirm = validator.check_request_params(
            request.json, 
            ["id"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        delete_result = model.delete_component_model(request.json)

        if not delete_result:
            message = "An error occurred while deleting a component model"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Component model deleted succesfully"
        log_type = "INFO"
        status_code = 200
        return return_response(success = True, message = message, code = 200), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message, code = 400), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)
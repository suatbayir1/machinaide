from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.BrandModel import BrandModel
import json
from application.helpers.Helper import return_response, token_required, request_validation
from core.logger.MongoLogger import MongoLogger

brand = Blueprint("brand", __name__)

model = BrandModel()
logger = MongoLogger()

@brand.route("/add", methods = ["POST"])
@token_required(roles = ["admin", "editor"])
def add(token):
    try:
        missed_keys, confirm = request_validation(request.json, ["brandName", "modelName", "price", "country", "type"])

        if not confirm:
            message = f"{missed_keys} field(s) cannot be empty or undefined"
            log_type = "ERROR"
            return return_response(success = False, message = message), 400

        result = model.add(request.json)

        if result == 409:
            message = "This brand and model name already exists"
            log_type = "DUPLICATED"
            return return_response(success = False, message = message), 409
        elif not result:
            message = "An error occurred while adding a new brand record"
            log_type = "ERROR"
            return return_response(success = False, message = message), 400

        message = "Brand record created successfully"
        log_type = "INFO"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
        return return_response(success = True, message = message), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        return return_response(success = False, message = message), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  200)


@brand.route("/get", methods = ["POST"])
@token_required(roles = ["admin", "editor", "member"])
def get(token):
    try:
        missed_keys, confirm = request_validation(request.json, ["type"])

        if not confirm:
            message = f"{missed_keys} field(s) cannot be empty or undefined"
            log_type = "ERROR"
            return return_response(success = False, message = message), 400
        
        result = model.get(request.json)

        if not result:
            message = "An error occurred while fetching brands"
            log_type = "ERROR"
            return return_response(success = False, message = message), 400

        message = "All brand records were successfully fetched"
        log_type = "INFO"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
        return return_response(data = result, success = True, message = message), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        return return_response(success = False, message = message), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  200)


@brand.route("/delete", methods = ["DELETE"])
@token_required(roles = ["admin", "editor", "member"])
def delete(token):
    try:
        missed_keys, confirm = request_validation(request.json, ["brandId"])

        if not confirm:
            message = f"{missed_keys} field(s) cannot be empty or undefined"
            log_type = "ERROR"
            return return_response(success = False, message = message), 400

        result = model.delete(request.json)

        if not result:
            message = "An error occurred while deleting brand record"
            log_type = "ERROR"
            return return_response(success = False, message = message), 400

        message = "Brand record deleted successfully"
        log_type = "INFO"
        return return_response(success = True, message = message), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        return return_response(success = False, message = message), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  200)

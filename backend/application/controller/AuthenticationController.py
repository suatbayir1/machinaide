from flask import Blueprint, request, jsonify, make_response
from flask_cors import CORS, cross_origin
from application.model.AuthenticationModel import AuthenticationModel
import json
from werkzeug.utils import secure_filename
import os
from application.helpers.Helper import return_response, token_required
import jwt
import datetime
import config
import time
from werkzeug.security import check_password_hash
from core.logger.MongoLogger import MongoLogger

auth = Blueprint("auth", __name__)

model = AuthenticationModel()
logger = MongoLogger()


@auth.route("/login", methods = ["POST"])
def login():
    if not request.json:
        message = "username_password_cannot_be_empty"
        logger.add_log("ERROR", request.remote_addr, '', request.method, request.url, "", message,  400)
        return return_response(data = [], success = False, message = message, code = 400), 400

    if not request.json["username"] or not request.json["password"]:
        message = "username_password_cannot_be_empty"
        logger.add_log("ERROR", request.remote_addr, '', request.method, request.url, request.json, message,  400)
        return return_response(data = [], success = False, message = message, code = 400), 400

    request_data = {
        "username": request.json["username"],
        "password": request.json["password"]
    }

    get_user_data = model.is_user_exists(request_data["username"])

    if not get_user_data:
        message = "user_is_not_found"
        logger.add_log("ERROR", request.remote_addr, '', request.method, request.url, request.json, message,  404)
        return return_response(data = [], success = False, message = message, code = 404), 404
    else:
        if check_password_hash(get_user_data[0]["password"], request_data["password"]):

            token = jwt.encode({
                "username": get_user_data[0]["username"],
                "role": get_user_data[0]["role"],
                "expiry_time": time.mktime((datetime.datetime.now() + datetime.timedelta(days=7)).timetuple())
            }, config.authentication["SECRET_KEY"])

            message = "user_login_successfully"
            logger.add_log("INFO", request.remote_addr, get_user_data[0]["username"], request.method, request.url, request.json, message,  200)
            return return_response(data = [{'token': token.decode("UTF-8"), 'role': get_user_data[0]["role"]}], success = True, message = message, code = 200), 200

        message = "password_is_wrong"
        logger.add_log("ERROR", request.remote_addr, get_user_data[0]["username"], request.method, request.url, request.json, message,  400)
        return return_response(data = [], success = False, message = message, code = 400), 400

@auth.route("/signup", methods = ["POST"])
@token_required(roles = ["admin"])
def signup(token):
    if not request.json["username"] or not request.json["password"] or not request.json["role"]:
        message = "Username, password and role cannot be empty"
        logger.add_log("ERROR", request.remote_addr, '', request.method, request.url, request.json, message,  400)
        return return_response(data=[], success=False, message = message), 400

    request_data = {
        "username": request.json["username"],
        "password": request.json["password"],
        "role": request.json["role"]
    }

    optinal_keys = ["userID", "status", "organizations"]

    for key in optinal_keys:
        if key in request.json:
            request_data[key] = request.json[key]

    result = model.add_user(request_data)

    if result:
        message = "new_user_created_successfully"
        logger.add_log("INFO", request.remote_addr, '', request.method, request.url, request.json, message,  200)
        return return_response(data = [], success = True, message = message, code = 200), 200

    message = "username_already_exists"
    logger.add_log("DUPLICATED", request.remote_addr, '', request.method, request.url, request.json, message,  409)
    return return_response(data = [], success = False, message = message, code = 409), 409
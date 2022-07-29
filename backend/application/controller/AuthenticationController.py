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
import ldap
import requests
import base64

auth = Blueprint("auth", __name__)

model = AuthenticationModel()
logger = MongoLogger()

@auth.route("/loginWithInflux", methods = ["POST"])
def loginWithInflux():
    try:
        username_password = f'{config.authentication["USER_NAME"]}:{config.authentication["USER_PASSWORD"]}'
        encoded = base64.b64encode(username_password.encode('ascii'))
        url = f'{config.url["CHRONOGRAPH"]}api/v2/signin'
        headers = {'Authorization': f'Basic {encoded.decode("utf-8")}'}

        response = requests.post(url, headers=headers)

        return {"status": response.status_code}
    except:
        return {"message": "error"}

@auth.route("/loginWithLDAP", methods = ["POST"])
def loginWithLDAP():
    print("test")
    if not request.json:
        message = "username_password_cannot_be_empty"
        logger.add_log("ERROR", request.remote_addr, '', request.method, request.url, "", message,  400)
        return return_response(data = [], success = False, message = message, code = 400), 400

    if not request.json["username"] or not request.json["password"]:
        message = "username_password_cannot_be_empty"
        logger.add_log("ERROR", request.remote_addr, '', request.method, request.url, request.json, message,  400)
        return return_response(data = [], success = False, message = message, code = 400), 400

    username = request.json["username"]
    password = request.json["password"]

    try:
        print(config.LDAP["URL"])
        con = ldap.initialize(config.LDAP["URL"], bytes_mode=False)
        print("con", con)
        con.protocol_version = ldap.VERSION3
        print("protocol")
        con.set_option(ldap.OPT_REFERRALS, 0)
        print("set option")

        print("username", username)
        result = con.search_s(config.LDAP["DC"], ldap.SCOPE_SUBTREE, f"(uid={username})")   
        print("result", result)

        if not result:
            raise Exception("User not found")

        userInfo = {}

        for item in result:
            dn = item[0]

            for att in item[0].split(","):
                splitted_att = att.split("=")
                if splitted_att[0] == "ou":
                    role = splitted_att[1]

            for att in item[1]:
                if att != 'userPassword':
                    userInfo[att] = item[1][att][0].decode('utf-8')

        con.simple_bind_s(dn, password)

        token = jwt.encode({
            "username": username,
            "role": role,
            "expiry_time": time.mktime((datetime.datetime.now() + datetime.timedelta(days=7)).timetuple())
        }, config.authentication["SECRET_KEY"])

        response = {
            'token': token.decode("UTF-8"), 
            'role': role,
            'userInfo': userInfo,
        }

        message = "user_login_successfully"
        logger.add_log("INFO", request.remote_addr, username, request.method, request.url, request.json, message,  200)
        return return_response(data = [response], success = True, message = message, code = 200), 200

    except ldap.INVALID_CREDENTIALS:
        con.unbind()
        message = "password_is_wrong"
        logger.add_log("ERROR", request.remote_addr, username, request.method, request.url, request.json, message,  400)
        return return_response(data = [], success = False, message = message, code = 400), 400
    except ldap.SERVER_DOWN as e:
        print(e)
        message = "LDAP Server is not running"
        logger.add_log("ERROR", request.remote_addr, username, request.method, request.url, request.json, message,  400)
        return return_response(data = [], success = False, message = message, code = 400), 400
    except Exception as error:
        message = error.args[0]
        logger.add_log("ERROR", request.remote_addr, username, request.method, request.url, request.json, message,  400)
        return return_response(data = [], success = False, message = message, code = 400), 400

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
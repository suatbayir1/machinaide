from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.UserModel import UserModel
import json
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger

user = Blueprint("user", __name__)

model = UserModel()
logger = MongoLogger()

@user.route("/getAll", methods = ["GET"])
@token_required(roles = ["admin"])
def get_all(token):
    result = model.get_all()
    message = "All users fetched in successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = result, success = True, message = message, code = 200), 200

@user.route("/getEmails", methods = ["GET"])
@token_required(roles = ["admin"])
def get_emails(token):
    result = model.get_emails()
    message = "All emails fetched in successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = result, success = True, message = message, code = 200), 200

@user.route("/getPhoneNumbers", methods = ["GET"])
@token_required(roles = ["admin"])
def get_phone_numbers(token):
    result = model.get_phone_numbers()
    message = "All phone numbers fetched in successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = result, success = True, message = message, code = 200), 200


@user.route("/delete", methods = ["POST", "DELETE"])
@token_required(roles = ["admin"])
def delete(token):
    result = model.delete(request.json["userID"])

    if not result:
        message = "An error occurred while deleting an user"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "User successfully deleted"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message, code = 200), 200

@user.route("/deleteEmail", methods = ["POST", "DELETE"])
@token_required(roles = ["admin"])
def delete_email(token):
    result = model.delete_email(request.json["oid"])

    if not result:
        message = "An error occurred while deleting an email"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Email successfully deleted"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message, code = 200), 200

@user.route("/deletePhoneNumber", methods = ["POST", "DELETE"])
@token_required(roles = ["admin"])
def delete_phone_number(token):
    result = model.delete_phone_number(request.json["oid"])

    if not result:
        message = "An error occurred while deleting a phone number"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Phone number successfully deleted"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message, code = 200), 200

@user.route("/update", methods = ["POST", "PUT", "PATCH"])
@token_required(roles = ["admin"])
def update(token):
    try:
        key_list = ["oid", "status", "role", "organizations"]
        
        request_data = {}

        for key in key_list:
            if key in request.json:
                request_data[key] = request.json[key]


        result = model.update(request_data)

        if not result:
            message = "An error occurred while updating an user"
            logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
            return return_response(success = False, message = message, code = 400), 400
        else:
            message = "User successfully updated"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
            return return_response(success = True, message = message, code = 200), 200
    except:
        return {"text": "error"}

@user.route("/isUserAlreadyExist", methods = ["POST"])
@token_required(roles = ["admin"])
def is_user_already_exist(token):
    result = model.is_user_already_exist(request.json)

    if not result:
        message = "User record not exist"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = False, message = message, code = 200)
    else:
        message = "User record already exist"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  409)
        return return_response(success = True, message = message, code = 409)


@user.route("/addUserToOrganization", methods = ["POST", "PUT"])
@token_required(roles = ["admin"])
def add_user_to_organization(token):
    try:
        result = model.add_user_to_organization(request.json)

        if not result:
            message = "An error occurred while adding a member to organization"
            logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
            return return_response(success = False, message = message, code = 400), 400
        else:
            message = "Member added to organization successfully"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
            return return_response(success = True, message = message, code = 200), 200
    except:
        return {"text": "error"}

@user.route("/addEmail", methods = ["POST", "PUT"])
@token_required(roles = ["admin"])
def add_email(token):
    try:
        result = model.add_email(request.json)

        if not result:
            message = "An error occurred while adding an email to system"
            logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
            return return_response(success = False, message = message, code = 400), 400
        else:
            message = "Email added to system successfully"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
            return return_response(success = True, message = message, code = 200), 200
    except:
        return return_response(success = False, message = "An error occurred while adding an email to system", code = 500), 500

@user.route("/addPhoneNumber", methods = ["POST", "PUT"])
@token_required(roles = ["admin"])
def add_phone_number(token):
    try:
        result = model.add_phone_number(request.json)

        if not result:
            message = "An error occurred while adding phone number to system"
            logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
            return return_response(success = False, message = message, code = 400), 400
        else:
            message = "Phone number added to system successfully"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
            return return_response(success = True, message = message, code = 200), 200
    except:
        return return_response(success = False, message = "An error occurred while adding an email to system", code = 500), 500


@user.route("/removeUserFromOrganization", methods = ["POST", "DELETE"])
@token_required(roles = ["admin"])
def remove_user_from_organization(token):
    try:
        result = model.remove_user_from_organization(request.json)

        if not result:
            message = "An error occurred while deleting a member from organization"
            logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
            return return_response(success = False, message = message, code = 400), 400
        else:
            message = "Member deleting from organization successfully"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
            return return_response(success = True, message = message, code = 200), 200
    except:
        return {"text": "error"}

@user.route("/removeOrganizationFromAllUsers", methods = ["POST", "DELETE"])
@token_required(roles = ["admin"])
def remove_organization_from_all_users(token):
    try:
        result = model.remove_organization_from_all_users(request.json)

        if not result:
            message = "An error occurred while deleting an organization."
            logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
            return return_response(success = False, message = message, code = 400), 400
        else:
            message = "Organization deleting successfully"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
            return return_response(success = True, message = message, code = 200), 200
    except:
        return {"text": "error"}
from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.ObjectModel import ObjectModel
import json
from werkzeug.utils import secure_filename
import os
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger

obj = Blueprint("object", __name__)

model = ObjectModel()
logger = MongoLogger()

@obj.route("/getObjectPool", methods = ["GET"])
@token_required(roles = ["admin", "member", "superadmin"])
def get_object_pool(token):
    data = model.get_object_pool()
    message = "Get_Object_Pool_Successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message), 200

@obj.route("/saveComponentObject", methods = ["POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def save_component_object(token):
    if request.method == "POST":
        result = model.save_component_object(request.json)
        message = "All_Objects_Saved_Successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message)

@obj.route("/saveAsComponentObject", methods = ["POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def save_as_component_object(token):
    if request.method == "POST":
        result = model.save_as_component_object(request.json)         

        if not result:
            message = "Object_Already_Exists"
            logger.add_log("DUPLICATED", request.remote_addr, token["username"], request.method, request.url, request.json, message,  409)
            return return_response(success = False, message = message), 409
        else:
            message = "All_Objects_Saved_Successfully"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
            return return_response(success = True, message = message), 200          

@obj.route("/removeObject", methods = ["POST", "DELETE"])
@token_required(roles = ["admin", "member", "superadmin"])
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
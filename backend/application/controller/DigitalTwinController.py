from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.DigitalTwinModel import DigitalTwinModel
import json
from werkzeug.utils import secure_filename
import os
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger

UPLOAD_FOLDER =  "/home/machinaide/influxdb/ui/assets/images"

dt = Blueprint("dt", __name__)

model = DigitalTwinModel()
logger = MongoLogger()


@dt.route("/", methods = ["GET"])   
@token_required(roles = ["admin", "editor", "member"])
def get_all(token):
    data = model.get_all()
    message = "Get data successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message), 200


@dt.route("/getGeneralInfo", methods = ["GET"])
@token_required(roles = ["admin", "editor", "member"])
def get_general_info(token):
    data = model.get_general_info()
    message = "Get general info data successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message), 200

@dt.route("/add", methods = ["POST"])
@token_required(roles = ["admin"])
def add(token):
    if request.method == "POST":
        if request.json["type"] == "Machine":
            result = model.add_machine(request.json)
            if not result:
                message = "Machine_Already_Exists"
                logger.add_log("DUPLICATED", request.remote_addr, token["username"], request.method, request.url, request.json, message,  409)
                return return_response(success = False, message = message), 409
            else:
                message = "Added_Machine_Successfully"
                logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
                return return_response(success = True, message = message), 200
        elif request.json["type"] == "Component":
            result = model.add_component(request.json)
            if not result:
                message = "Component_Already_Exists"
                logger.add_log("DUPLICATED", request.remote_addr, token["username"], request.method, request.url, request.json, message,  409)
                return return_response(success = False, message = message), 409
            else:
                message = "Added_Component_Successfully"
                logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
                return return_response(success = True, message = "Added_Component_Successfully"), 200
        elif request.json["type"] == "Sensor":
            result = model.add_sensor(request.json)
            if not result:
                message = "Sensor_Already_Exists"
                logger.add_log("DUPLICATED", request.remote_addr, token["username"], request.method, request.url, request.json, message,  409)
                return return_response(success = False, message = "Sensor_Already_Exists"), 409
            else:
                message = "Added_Sensor_Successfully"
                logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
                return return_response(success = True, message = "Added_Sensor_Successfully"), 200

@dt.route("/delete", methods = ["POST", "DELETE"])
@token_required(roles = ["admin"])
def delete(token):
    print(request.json)
    if request.json["type"] == "ProductionLine":
        result = model.delete_production_line(request.json)
        message = "production_line_deleted_successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message, 200)
        return return_response(success = True, message = message), 200
    elif request.json["type"] == "Machine":
        result = model.delete_machine(request.json)
        message = "machine_deleted_successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message), 200
    elif request.json["type"] == "Component":
        result = model.delete_component(request.json)
        message = "component_deleted_successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message), 200
    elif request.json["type"] == "Sensor":
        result = model.delete_sensor(request.json)
        message = "sensor_deleted_successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message), 200
    else:
        return return_response(success = False, message = "Type must be Machine, Component or Sensor"), 400

@dt.route("/updateSensor", methods = ["POST", "PUT"])
@token_required(roles = ["admin"])
def update_sensor(token):
    try:
        result = model.update_sensor(request.json)

        if not result:
            message = "An error occurred while updating a sensor"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
            return return_response(success = True, message = message, code = 400), 400
        else:
            message = "Sensor updated successfully"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
            return return_response(success = True, message = message, code = 200), 200
    except:
        return return_response(success = False, message = "An error occurred while updating a sensor"), 400

@dt.route("/fileUpload", methods = ["POST"])
@token_required(roles = ["admin"])
def file_upload(token):
    target = os.path.join(UPLOAD_FOLDER, 'textures')
    if not os.path.isdir(target):
        os.mkdir(target)

    file = request.files['file']
    original_filename = secure_filename(file.filename)
    _, extension = os.path.splitext(original_filename)
    user_filename = request.form["filename"]
    filename = f"{user_filename}{extension}"

    if filename in os.listdir(target):
        message = "File_Already_Exists"
        logger.add_log("DUPLICATED", request.remote_addr, token["username"], request.method, request.url, "", message,  409)
        return return_response(success = False, message = "File_Already_Exists"), 409
    else:
        destination = "/".join([target, filename])
        file.save(destination)
        message = "File_Uploaded_Successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
        return return_response(data = {"file_url": destination},
                                success = True, 
                                message = "File_Uploaded_Successfully"), 200

@dt.route("/getFileInfo", methods = ["GET"])
@token_required(roles = ["admin", "editor", "member"])
def get_file_info(token):
    source = os.path.join(UPLOAD_FOLDER, 'textures')
    if not os.path.isdir(source):
        os.mkdir(source)
    fileList = os.listdir(source)

    data = []

    for file in fileList:
        filename, extension = os.path.splitext(file)
        data.append({
            "filename": filename,
            "file": file
        })

    message = "Get_Files_Successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = 'Get_Files_Successfully'), 200

@dt.route("/addRelationship", methods = ["POST"])
@token_required(roles = ["admin"])
def add_relationship(token):
    print("add")
    try:
        if request.method == "POST":
            result = model.add_relationship(request.json)
            
            print(result)

            if not result:
                message = "Could not add relationship"
                logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
                return return_response(success = False, message = message, code = 400), 400
            else:
                message = "Added relationship successfully"
                logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
                return return_response(success = True, message = message, code = 200), 200
    except:
        return return_response(success = False, message = "An error occurred while adding a relationship"), 400

@dt.route("/removeRelationship", methods = ["POST", "DELETE"])
@token_required(roles = ["admin", "editor"])
def remove_relationship(token):
    try:
        if not request.data:
            message = "Request data cannot be empty"
            logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
            return return_response(success = False, message = message), 400
        
        result = model.remove_relationship(request.json)

        print(result)

        if not result:
            message = "Could not delete data flow setting"
            logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
            return return_response(success = False, message = message, code = 400), 400
        else:
            message = "Data flow setting deleted successfully"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
            return return_response(success = True, message = message, code = 200), 200
    except:
        return return_response(success = False, message = message), 400



@dt.route("updateAll", methods = ["POST"])
def update_all_dt():
    if request.method == "POST":
        result = model.update_dt()
        return {"data": "data updated"}
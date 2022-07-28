from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.DigitalTwinModel import DigitalTwinModel
from application.model.MaintenanceModel import MaintenanceModel
from application.model.FailureModel import FailureModel
import json
from werkzeug.utils import secure_filename
import os
from application.helpers.Helper import return_response, token_required, request_validation
from core.logger.MongoLogger import MongoLogger
from application.classes.Validator import Validator
from application.model.ObjectModel import ObjectModel
from application.helpers.Helper import cursor_to_json
import config

UPLOAD_FOLDER =  f"{config.PROJECT_URL}/influxdb/ui/assets/images"

dt = Blueprint("dt", __name__)

model = DigitalTwinModel()
maintenanceModel = MaintenanceModel()
failureModel = FailureModel()
objectModel = ObjectModel()
logger = MongoLogger()
validator = Validator()


@dt.route("/", methods = ["GET"])   
@token_required(roles = ["admin", "editor", "member"])
def get_all(token):
    try:
        data = model.get_all()
        message = "Get data successfully"
        log_type = "INFO"
        status_code = 200

        object_pool = cursor_to_json(objectModel.get_object_pool())

        for factory in data:
            for pl in factory["productionLines"]:
                for machine in pl["machines"]:
                    for component in machine["contents"]:
                        if component["@type"] == "Component":
                            if component["visual"] != "":
                                visual = [visual for visual in object_pool if visual["_id"]["$oid"] == component["visual"]]

                                if not visual:
                                    component["visual"] = ""
                                elif visual[0]:
                                    component["visual"] = {
                                        "id": visual[0]["_id"]["$oid"],
                                        "objects": visual[0]["children"]
                                    }       
                            for sensor in component["sensors"]:
                                if sensor["visual"] != "":
                                    visual = [visual for visual in object_pool if visual["_id"]["$oid"] == sensor["visual"]]

                                    if not visual:
                                        sensor["visual"] = ""
                                    elif visual[0]:
                                        sensor["visual"] = {
                                            "id": visual[0]["_id"]["$oid"],
                                            "objects": visual[0]["children"]
                                        }       

        return return_response(data = data, success = True, message = message), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message, code = 400), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)

@dt.route("/getGeneralInfo", methods = ["GET"])
@token_required(roles = ["admin", "editor", "member"])
def get_general_info(token):
    try:
        data = model.get_general_info()
        message = "Get general info data successfully"
        log_type = "INFO"
        status_code = 200
        return return_response(data = data, success = True, message = message), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message, code = 400), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)

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

@dt.route("/update", methods = ["POST", "PUT"])
@token_required(roles = ["admin", "editor"])
def update(token):
    try:
        missed_keys, confirm = request_validation(request.json, ["type", "name"])

        if not confirm:
            message = f"{missed_keys} field(s) cannot be empty or undefined"
            log_type = "ERROR"
            status_code = 200
            return return_response(success = False, message = message), 400

        name = request.json["name"]
        keys = ["deploymentTime", "brand"]
        payload = {}

        for item in keys:
            if item in request.json:
                payload[item] = request.json[item]

        result = model.update(name, request.json["type"], payload)
        
        if not result:
            message = f"An error occurred while updating a {request.json['type']}"
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message), 400

        message = f"{request.json['type']} has been successfully updated"
        status_code = 200
        log_type = "INFO"
        return return_response(success = True, message = message), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)

@dt.route("/fileUpload", methods = ["POST"])
@token_required(roles = ["admin"])
def file_upload(token):
    try:
        target = os.path.join(UPLOAD_FOLDER, 'textures')
        if not os.path.isdir(target):
            os.mkdir(target)

        file = request.files['file']
        original_filename = secure_filename(file.filename)
        _, extension = os.path.splitext(original_filename)
        user_filename = request.form["filename"]
        filename = f"{user_filename}{extension}"

        if filename in os.listdir(target):
            message = "Filename Already Exists"
            logger.add_log("DUPLICATED", request.remote_addr, token["username"], request.method, request.url, "", message,  409)
            return return_response(success = False, message = message, code = 409), 409
        else:
            destination = "/".join([target, filename])
            file.save(destination)
            message = "File Uploaded Successfully"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
            return return_response(data = {"file_url": destination},
                                    success = True, 
                                    message = message, code = 200), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message, code = 400), 400

@dt.route('/modelFileUpload', methods = ["POST"])
@token_required(roles = ["admin"])
def model_file_upload(token):
    try:
        if not "file" in request.files or not "filename" in request.form:
            message = "File and filename cannot be empty"
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        target = os.path.join(UPLOAD_FOLDER, 'model')
        if not os.path.isdir(target):
            os.mkdir(target)

        file = request.files['file']
        original_filename = secure_filename(file.filename)
        _, extension = os.path.splitext(original_filename)
        user_filename = request.form["filename"]
        filename = f"{user_filename}{extension}"

        if filename in os.listdir(target):
            message = "Filename already exists"
            log_type = "DUPLICATED"
            status_code = 409
            return return_response(success = False, message = message, code = 400), 400
        else:
            destination = "/".join([target, filename])
            file.save(destination)
            message = "File uploaded successfully"
            log_type = "INFO"
            status_code = 200
            return return_response(data = {"file_url": destination}, success = True, message = message, code = 200), 200

        message = "Model file uploaded succesfully"
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

@dt.route('/deleteModelFile', methods = ["DELETE"])
@token_required(roles = ["admin"])
def delete_model_file(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["file"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        target = os.path.join(UPLOAD_FOLDER, 'model')
        if not os.path.isdir(target):
            os.mkdir(target)

        filepath = os.path.join(target, request.json["file"])

        if os.path.isfile(filepath):
            os.remove(filepath)
            message = "File removed successfully"
            log_type = "INFO"
            status_code = 200
        else:
            message = "No file found"
            log_type = "ERROR"
            status_code = 404

        return return_response(success = True, message = message, code = status_code), status_code
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message, code = 400), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)

@dt.route('/deleteTexture', methods = ["DELETE"])
@token_required(roles = ["admin"])
def deleteTexture(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["file"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        target = os.path.join(UPLOAD_FOLDER, 'textures')
        if not os.path.isdir(target):
            os.mkdir(target)

        filepath = os.path.join(target, request.json["file"])

        if os.path.isfile(filepath):
            os.remove(filepath)
            message = "Texture removed successfully"
            log_type = "INFO"
            status_code = 200
        else:
            message = "No texture found"
            log_type = "ERROR"
            status_code = 404

        return return_response(success = True, message = message, code = status_code), status_code
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message, code = 400), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)

@dt.route("/getModelFiles", methods = ["GET"])
@token_required(roles = ["admin", "editor", "member"])
def get_model_files(token):
    try:
        source = os.path.join(UPLOAD_FOLDER, 'model')
        if not os.path.isdir(source):
            os.mkdir(source)
        print("source", source)
        fileList = os.listdir(source)
        print("filelist", fileList)

        data = []

        for file in fileList:
            filename, extension = os.path.splitext(file)
            data.append({
                "filename": filename,
                "file": file
            })

        message = "Fetched uploaded model files successfully"
        log_type = "INFO"
        status_code = 200
        return return_response(data = data, success = True, message = message, code = 200), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message, code = 400), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)

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
    try:
        if request.method == "POST":
            result = model.add_relationship(request.json)

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

@dt.route("/retire", methods = ["POST"])
@token_required(roles = ["admin", "editor"])
def retire(token):
    try:
        missed_keys, confirm = request_validation(request.json, ["type", "name"])

        if not confirm:
            message = f"{missed_keys} field(s) cannot be empty or undefined"
            log_type = "ERROR"
            status_code = 200
            return return_response(success = False, message = message), 400

        retired_id = model.retire(request.json)

        where_maintenance = { 
            "asset": { '$regex': f"{request.json['name']}$"},
            "retired": {'$exists': False} 
        }
        where_failure = { 
            "sourceName": { '$regex': f"{request.json['name']}$"},
            "retired": {'$exists': False}
        }
        
        updateData = {
            '$set': { 'retired': str(retired_id) }
        }

        maintenance_result = maintenanceModel.update_many_maintenance(where_maintenance, updateData)
        failure_result = failureModel.update_many_failure(where_failure, updateData)
        update_result = model.update(request.json["name"], request.json["type"], {"brand": {}, "deploymentTime": ""})

        if not maintenance_result or not failure_result or not update_result:
            message = "An error occurred while adding a retire record"
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message), 400

        message = "Retire record added successfully"
        log_type = "INFO"
        status_code = 200
        return return_response(success = True, message = message), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)

@dt.route("/getRetired", methods = ["POST"])
@token_required(roles = ["admin", "editor"])
def get_retired(token):
    try:
        missed_keys, confirm = request_validation(request.json, ["name"])

        if not confirm:
            message = f"{missed_keys} field(s) cannot be empty or undefined"
            log_type = "ERROR"
            status_code = 200
            return return_response(success = False, message = message), 400

        where = {
            "name": request.json["name"]
        }

        result = model.get_retired(where)

        if result == 500:
            message = "An error occurred while fetching a retired records"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message), 500

        for oldPart in result:
            maintenances = maintenanceModel.get_by_condition({"retired": oldPart["_id"]["$oid"]})
            maintenance_array = [maintenance["_id"]["$oid"] for maintenance in maintenances]
            oldPart["maintenanceIDs"] = maintenance_array
            failures = failureModel.get_by_condition({"retired": oldPart["_id"]["$oid"]})
            failure_array = [failure["_id"]["$oid"] for failure in failures]
            oldPart["failureIDs"] = failure_array


        message = "Retired records has been fetched successfully"
        log_type = "INFO"
        status_code = 200
        return return_response(data = result, success = True, message = message), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)

@dt.route("/insertFactory", methods = ["POST"])
@token_required(roles = ["admin", "editor"])
def insertFactory(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["id", "factoryName", "location", "name", "type", "productionLines"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        is_exist = model.is_item_already_exists(request.json["id"])

        if is_exist:
            message = "This id is used by another element"
            log_type = "ERROR"
            status_code = 409
            return return_response(success = False, message = message, code = 409), 409

        insert_result = model.insert_factory(request.json)

        if insert_result == 409:
            message = "A factory has already been created. You can create only 1 factory"
            log_type = "ERROR"
            status_code = 409
            return return_response(success = False, message = message, code = 409), 409

        if not insert_result:
            message = "An error occurred while creating a factory"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Factory created succesfully"
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

@dt.route("/updateFactory", methods = ["PUT"])
@token_required(roles = ["admin", "editor"])
def updateFactory(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["id", "factoryName", "location"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        update_result = model.update_factory(request.json)

        if not update_result:
            message = "An error occurred while updating a factory"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Factory updated succesfully"
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

@dt.route("/deleteFactory", methods = ["DELETE"])
@token_required(roles = ["admin", "editor"])
def deleteFactory(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["id"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        delete_result = model.delete_factory(request.json)

        if not delete_result:
            message = "An error occurred while deleting a factory"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Factory deleted succesfully"
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

@dt.route("/insertProductionLine", methods = ["POST"])
@token_required(roles = ["admin", "editor"])
def insertProductionLine(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["@id", "name", "parent", "displayName", "type", "machines"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        is_exist = model.is_item_already_exists(request.json["@id"])

        if is_exist:
            message = "This id is used by another element"
            log_type = "ERROR"
            status_code = 409
            return return_response(success = False, message = message, code = 409), 409

        insert_result = model.insert_production_line(request.json)

        if not insert_result:
            message = "An error occurred while creating a production line"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Production line created succesfully"
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

@dt.route("/updateProductionLine", methods = ["PUT"])
@token_required(roles = ["admin", "editor"])
def updateProductionLine(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["id", "displayName"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        update_result = model.update_production_line(request.json)

        if not update_result:
            message = "An error occurred while updating a production line"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Production line updated succesfully"
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

@dt.route("/deleteProductionLine", methods = ["DELETE"])
@token_required(roles = ["admin", "editor"])
def deleteProductionLine(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["id"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        delete_result = model.delete_production_line(request.json)

        if not delete_result:
            message = "An error occurred while deleting a production line"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Production Line deleted succesfully"
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

@dt.route("/insertMachine", methods = ["POST"])
@token_required(roles = ["admin", "editor"])
def insertMachine(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["@id", "name", "parent", "displayName", "type", "@type", "contents"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        is_exist = model.is_item_already_exists(request.json["@id"])

        if is_exist:
            message = "This id is used by another element"
            log_type = "ERROR"
            status_code = 409
            return return_response(success = False, message = message, code = 409), 409

        insert_result = model.insert_machine(request.json)

        if not insert_result:
            message = "An error occurred while creating a machine"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Machine created succesfully"
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

@dt.route("/updateMachine", methods = ["PUT"])
@token_required(roles = ["admin", "editor"])
def updateMachine(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["measurements", "id", "displayName"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        update_result = model.update_machine(request.json)

        if not update_result:
            message = "An error occurred while updating a machine"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Machine updated succesfully"
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

@dt.route("/deleteMachine", methods = ["DELETE"])
@token_required(roles = ["admin", "editor"])
def deleteMachine(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["id"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        delete_result = model.delete_machine(request.json)

        if not delete_result:
            message = "An error occurred while deleting a machine"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Machine deleted succesfully"
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

@dt.route("/insertComponent", methods = ["POST"])
@token_required(roles = ["admin", "editor"])
def insertComponent(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["@id", "name", "parent", "displayName", "type", "@type", "sensors", "visual"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        is_exist = model.is_item_already_exists(request.json["@id"])

        if is_exist:
            message = "This id is used by another element"
            log_type = "ERROR"
            status_code = 409
            return return_response(success = False, message = message, code = 409), 409

        insert_result = model.insert_component(request.json)

        if not insert_result:
            message = "An error occurred while creating a component"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Component created succesfully"
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

@dt.route("/updateComponent", methods = ["PUT"])
@token_required(roles = ["admin", "editor"])
def updateComponent(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["id", "displayName", "visual"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        update_result = model.update_component(request.json)

        if not update_result:
            message = "An error occurred while updating a component"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Component updated succesfully"
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

@dt.route("/deleteComponent", methods = ["DELETE"])
@token_required(roles = ["admin", "editor"])
def deleteComponent(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["id"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        delete_result = model.delete_component(request.json)

        if not delete_result:
            message = "An error occurred while deleting a component"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Component deleted succesfully"
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

@dt.route("/insertSensor", methods = ["POST"])
@token_required(roles = ["admin", "editor"])
def insertSensor(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["@id", "name", "parent", "displayName", "type", "@type", "fields", "visual"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        is_exist = model.is_item_already_exists(request.json["@id"])

        if is_exist:
            message = "This id is used by another element"
            log_type = "ERROR"
            status_code = 409
            return return_response(success = False, message = message, code = 409), 409

        insert_result = model.insert_sensor(request.json)

        if not insert_result:
            message = "An error occurred while creating a sensor"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Sensor created succesfully"
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

@dt.route("/updateSensor", methods = ["PUT"])
@token_required(roles = ["admin", "editor"])
def updateSensor(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["id", "unit", "status", "@type", "displayName", "visual"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        update_result = model.update_sensor(request.json)

        if not update_result:
            message = "An error occurred while updating a sensor"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Sensor updated succesfully"
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

@dt.route("/deleteSensor", methods = ["DELETE"])
@token_required(roles = ["admin", "editor"])
def deleteSensor(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["id"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        delete_result = model.delete_sensor(request.json)

        if not delete_result:
            message = "An error occurred while deleting a sensor"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Sensor deleted succesfully"
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

@dt.route("/insertField", methods = ["POST"])
@token_required(roles = ["admin", "editor"])
def insertField(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["@id", "name", "parent", "displayName", "type", "minValue", "maxValue", "isFillNullActive", "defaultValue", "isOperationActive", "operation", "operationValue"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        is_exist = model.is_item_already_exists(request.json["@id"])

        if is_exist:
            message = "This id is used by another element"
            log_type = "ERROR"
            status_code = 409
            return return_response(success = False, message = message, code = 409), 409

        insert_result = model.insert_field(request.json)

        if not insert_result:
            message = "An error occurred while creating a field"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Field created succesfully"
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

@dt.route("/updateField", methods = ["PUT"])
@token_required(roles = ["admin", "editor"])
def updateField(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["id", "dataSource", "minValue", "maxValue", "measurement", "displayName", "isFillNullActive", "defaultValue", "isOperationActive", "operation", "operationValue"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        update_result = model.update_field(request.json)

        if not update_result:
            message = "An error occurred while updating a field"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Field updated succesfully"
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

@dt.route("/deleteField", methods = ["DELETE"])
@token_required(roles = ["admin", "editor"])
def deleteField(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["id"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        delete_result = model.delete_field(request.json)

        if not delete_result:
            message = "An error occurred while deleting a field"
            log_type = "ERROR"
            status_code = 500
            return return_response(success = False, message = message, code = 500), 500

        message = "Field deleted succesfully"
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

@dt.route("updateAll", methods = ["POST"])
def update_all_dt():
    if request.method == "POST":
        result = model.update_dt()
        return {"data": "data updated"}
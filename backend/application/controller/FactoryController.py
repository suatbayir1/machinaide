from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.FactoryModel import FactoryModel
import json
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger
from application.classes.Validator import Validator
from application.classes.FactoryManager import FactoryManager


factory = Blueprint("factory", __name__)

model = FactoryModel()
logger = MongoLogger()
validator = Validator()
factoryManager = FactoryManager()

@factory.route("/getFactories", methods = ["GET"])
@token_required(roles = ["admin", "member", "editor"])
def get_factories(token):
    data = model.get_factories()
    message = "get_factories_successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message), 200

@factory.route("/getProductionLines", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "editor"])
def get_production_lines(token):
    data = model.get_production_lines(request.json)
    message = "Production lines successfully fetched"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message), 200

@factory.route("/getMachines", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "editor"])
def get_machines(token):
    data = model.get_machines(request.json)
    message = "get_machines_successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message)

@factory.route("/getComponents", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "editor"])
def get_components(token):
    data = model.get_components(request.json)
    message = "get_components_successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message)

@factory.route("/getSensors", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "editor"])
def get_sensors(token):
    data = model.get_sensors(request.json)
    message = "get_sensors_successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = "get_sensors_successfully")

@factory.route("/getFields", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "editor"])
def get_fields(token):
    try:
        data = model.get_fields(request.json)
        log_type = "INFO"
        status_code = 200
        message = "Fields returned successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
        return return_response(data = data, success = True, message = message)
    except:
        message = "An expected error has occurred while fetching fields record"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message, code = 400), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)

@factory.route("/addMachineAction", methods = ["POST"])
@token_required(roles = ["admin", "editor"])
def add_machine_action(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400

    result = model.add_machine_action(request.json)
    message = "Machine action added successfully"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(success = True, message = message, code = 200), 200

@factory.route("/getAllMachineActions", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "editor"])
def get_all_machine_actions(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400

    data = model.get_all_machine_actions(request.json)
    message = "All machine action information has been successfully fetched"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message), 200

@factory.route("/updateMachineAction", methods = ["POST", "PUT"])
@token_required(roles = ["admin", "editor"])
def update_machine_action(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400

    result = model.update_machine_action(request.json)

    if not result:        
        message = "Invalid recordId"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Machine action updated successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
        return return_response(success = True, message = message, code = 200), 200

@factory.route("/deleteMachineAction", methods = ["POST", "DELETE"])
@token_required(roles = ["admin", "editor"])
def delete_machine_action(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400
    
    result = model.delete_machine_action(request.json)

    if not result:
        message = "Invalid recordId"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Machine action deleted successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
        return return_response(success = True, message = message, code = 200), 200

@factory.route("/isMachineActionExists", methods = ["POST"])
@token_required(roles = ["admin", "editor", "member"])
def is_machine_action_exists(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400

    result = model.is_machine_action_exists(request.json)

    if not result:
        message = "Machine action record not exists"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message, code = 200)
    else:
        message = "Machine action record already exists"
        logger.add_log("DUPLICATED", request.remote_addr, token["username"], request.method, request.url, request.json, message,  409)
        return return_response(success = True, message = message, code = 409)

@factory.route("/addMaterial", methods = ["POST"])
@token_required(roles = ["admin", "editor"])
def add_material(token):
    try:
        if not request.data:
            message = "Request data cannot be empty"
            logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
            return return_response(success = False, message = message), 400

        result = model.add_material(request.json)

        if not result:
            message = "An error occurred while adding material record"
            logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
            return return_response(success = False, message = message, code = 400), 400
        else:
            message = "Material record added successfully"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
            return return_response(success = True, message = message, code = 200), 200
    except:
        return return_response(success = False, message = "An unexpected error has occured"), 400

@factory.route("/getMaterials", methods = ["GET"])
@token_required(roles = ["admin", "member", "editor"])
def get_materials(token):
    data = model.get_materials()
    message = "All material record information has been successfully fetched"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message), 200


@factory.route("/deleteMaterial", methods = ["POST", "DELETE"])
@token_required(roles = ["admin", "editor"])
def delete_material(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400
    
    result = model.delete_material(request.json)

    if not result:
        message = "Invalid recordId"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Material deleted successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
        return return_response(success = True, message = message, code = 200), 200

@factory.route("/updateMaterial", methods = ["POST", "PUT"])
@token_required(roles = ["admin", "editor"])
def update_material(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400

    result = model.update_material(request.json)

    if not result:        
        message = "Invalid recordId"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Machine action updated successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
        return return_response(success = True, message = message, code = 200), 200

@factory.route("/isMaterialExists", methods = ["POST"])
@token_required(roles = ["admin", "editor", "member"])
def is_material_exists(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400

    result = model.is_material_exists(request.json)

    if not result:
        message = "Material record not exists"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message, code = 200)
    else:
        message = "Material record already exists"
        logger.add_log("DUPLICATED", request.remote_addr, token["username"], request.method, request.url, request.json, message,  409)
        return return_response(success = True, message = message, code = 409)

@factory.route("/createDashboard", methods = ["POST"])
@token_required(roles = ["admin", "editor", "member"])
def create_dashboard(token):
    try:
        if not request.data:
            message = "Request data cannot be empty"
            logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
            return return_response(success = False, message = message), 400

        result = model.create_dashboard(request.json)

        if not result:
            message = "An error occurred while adding dashboard"
            logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
            return return_response(success = False, message = message, code = 400), 400
        else:
            message = "Dashboard added successfully"
            logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
            return return_response(success = True, message = message, code = 200), 200
    except:
        return return_response(success = False, message = "An unexpected error has occured"), 400


@factory.route("/deleteDashboard", methods = ["POST", "DELETE"])
@token_required(roles = ["admin", "editor", "member"])
def delete_dashboard(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400
    
    result = model.delete_dashboard(request.json)

    if not result:
        message = "An error occurred while deleting dashboard"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, request.json, message,  400)
        return return_response(success = False, message = message, code = 400), 400
    else:
        message = "Dashboard deleted successfully"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
        return return_response(success = True, message = message, code = 200), 200

@factory.route("/getDashboards", methods = ["GET"])
@token_required(roles = ["admin", "member", "editor"])
def get_dashboards(token):
    data = model.get_dashboards()
    message = "All dashboard information has been successfully fetched"
    logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, "", message,  200)
    return return_response(data = data, success = True, message = message), 200

@factory.route("/isDashboardExists", methods = ["POST"])
@token_required(roles = ["admin", "editor", "member"])
def is_dashboard_exists(token):
    if not request.data:
        message = "Request data cannot be empty"
        logger.add_log("ERROR", request.remote_addr, token["username"], request.method, request.url, "", message,  400)
        return return_response(success = False, message = message), 400

    result = model.is_dashboard_exists(request.json)

    if not result:
        message = "Dashboard record not exists"
        logger.add_log("INFO", request.remote_addr, token["username"], request.method, request.url, request.json, message,  200)
        return return_response(success = True, message = message, code = 200)
    else:
        message = "Dashboard record already exists"
        logger.add_log("DUPLICATED", request.remote_addr, token["username"], request.method, request.url, request.json, message,  409)
        return return_response(success = True, message = message, code = 409)


@factory.route("/getMetadataByProcessId", methods = ["POST"])
@token_required(roles = ["admin", "editor", "member"])
def getMetadataByProcessId(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["processId"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        if not isinstance(request.json["processId"], int):
            message = "processId must be integer"
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        processId = str(request.json["processId"])

        processes = {
            "1": factoryManager.get_production_line_by_name,
            "2": factoryManager.get_machine_by_name,
            "3": factoryManager.get_component_by_name,
            "4": factoryManager.get_sensor_by_name,
            "5": factoryManager.get_machine_actions_by_name,
            "6": factoryManager.get_reports_by_name,
            "7": factoryManager.get_detail_sensor_info_by_name
        }

        chosen_operation_function = processes.get(processId, factoryManager.invalid_operation)

        result = chosen_operation_function(request.json)

        if result["success"] == False:
            message = result["message"]
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        message = result["message"]
        log_type = "INFO"
        status_code = 200
        return return_response(success = True, message = message, data = result["data"], code = 200, total_count = len(result["data"])), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message, code = 400), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)

@factory.route("/getSectionsByFactory", methods = ["POST"])
@token_required(roles = ["admin", "editor", "member"])
def getSectionsByFactory(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["factoryID"]
        )

        if not confirm:
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        result = model.get_sections_by_factory({"factoryID": request.json["factoryID"]})

        if not result:
            message = "An error occurred while fetching sections by factory"
            log_type = "ERROR"
            status_code = 400
            return return_response(success = False, message = message, code = 400), 400

        message = "Sections successfully fetched"
        log_type = "INFO"
        status_code = 200
        return return_response(success = True, message = message, data = result, code = 200, total_count = len(result)), 200
    except:
        message = "An expected error has occurred"
        log_type = "ERROR"
        status_code = 400
        return return_response(success = False, message = message, code = 400), 400
    finally:
        logger.add_log(log_type, request.remote_addr, token["username"], request.method, request.url, "", message,  status_code)
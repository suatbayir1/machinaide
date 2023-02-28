from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.HealthAssessmentModel import HealthAssessmentModel
import json
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger
from bson import ObjectId
from application.helpers.JSONEncoder import JSONEncoder


# TODO: add logger

health_assessment = Blueprint("health_assessment", __name__)

model = HealthAssessmentModel()

@health_assessment.route("/getAllAnomalies", methods = ["GET"])
# @token_required(roles = ["admin", "member", "editor"])
def get_all_anomalies():
    result = model.get_all_anomalies()
    return return_response(data = result, success = True), 200

@health_assessment.route("/getMachineAnomalies/<machine_id>", methods = ["GET"])
# @token_required(roles = ["admin", "member", "editor"])
def get_machine_anomalies(machine_id):
    result = model.get_machine_anomalies({"machineID": machine_id})
    if(result):
        result = result["anomalies"]
    return return_response(data = result, success = True), 200


@health_assessment.route('/getRootCauseAnalysis/<failureIDD>', methods=['GET'])
def get_root_cause_analysis(failureIDD):
    analysis = model.db.find_one("root_cause_analysis_info", {"failureIDD": failureIDD})

    print(analysis)
    return json.dumps(analysis, cls=JSONEncoder)


@health_assessment.route('/postRootCauseAnalysis', methods=["POST"])
def post_root_cause_analysis():
    analysis = request.json

    model.db.insert_one("root_cause_analysis_info", analysis)


    return return_response(success=True), 201


@health_assessment.route("/addAnomalyToMachine/<machine_id>/<model_id>", methods = ["PUT"])
# @token_required(roles = ["admin", "member", "editor"])
def add_anomaly_to_machine(machine_id, model_id):
    anomaly = request.json["anomaly"]
    model_key = "anomalies.{}".format(model_id)
    payload = {"$push": {model_key : anomaly}}
    where = {"machineID": machine_id}
    model.add_anomaly(payload, where)
    return return_response(success = True), 200

@health_assessment.route("/deleteAnomalyFromMachine/<machine_id>/<model_id>", methods = ["PUT"])
# @token_required(roles = ["admin", "member", "editor"])
def delete_anomaly_from_machine(machine_id, model_id):
    anomaly = request.json["anomaly"]
    timestamp = anomaly["timestamp"]
    model_key = "anomalies.{}".format(model_id)
    payload = {"$pull": {model_key : {"timestamp": timestamp}}}
    where = {"machineID": machine_id}
    model.delete_anomaly(payload, where)
    return return_response(success = True), 200

@health_assessment.route("/updateAnomaly/<machine_id>/<model_id>", methods = ["PUT"])
# @token_required(roles = ["admin", "member", "editor"])
def update_anomaly(machine_id, model_id):
    anomaly = request.json["anomaly"]
    model_key = "anomalies.{}".format(model_id)
    code_key = model_key + ".$[idx].code"
    description_key = model_key + ".$[idx].description"
    timestamp = anomaly["timestamp"]
    code = anomaly["code"]
    description = anomaly["description"]    
    payload = {"$set": {code_key: code, description_key: description}}
    array_filters = [{ "idx.timestamp" : timestamp}]
    where = {"machineID": machine_id}
    model.update_anomaly_feedback(payload, where, array_filters)
    return return_response(success = True), 200

@health_assessment.route("/changeFeedback/<machine_id>/<model_id>", methods = ["PUT"])
# @token_required(roles = ["admin", "member", "editor"])
def change_feedback(machine_id, model_id):
    anomaly = request.json["anomaly"]
    model_key = "anomalies.{}".format(model_id)
    element_key = model_key + ".$[idx].feedback"
    timestamp = anomaly["timestamp"]
    feedback = anomaly["feedback"]
    payload = {"$set": {element_key : feedback}}
    array_filters = [{ "idx.timestamp" : timestamp}]
    where = {"machineID": machine_id}
    model.update_anomaly_feedback(payload, where, array_filters)
    return return_response(success = True), 200

@health_assessment.route("/getEvidentlyReport/<model_id>", methods = ["GET"])
def get_evidently_report(model_id):
    result = model.get_evidently_report({"modelID": model_id})
    return return_response(data = result, success = True), 200
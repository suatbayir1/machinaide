from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from application.model.LogModel import LogModel
import json
from application.helpers.Helper import return_response, token_required
from core.logger.MongoLogger import MongoLogger
from application.helpers.Helper import cursor_to_json

log = Blueprint("log", __name__)

model = LogModel()
logger = MongoLogger()

@log.route("/getLogs", methods = ["GET", "POST"])
@token_required(roles = ["admin", "member", "superadmin"])
def get_logs(token):
    regexList = ["ip", "username", "endpoint"]
    arrayList = ["request_type", "log_type", "status"]

    payload = {}

    if "skip" in request.json:
        skip = request.json["skip"]
    else:
        skip = 0

    if "limit" in request.json:
        limit = request.json["limit"]
    else:
        limit = 10

    if "startTime" and "endTime" in request.json:
        payload["time"] = {'$gte': request.json["startTime"], '$lte': request.json["endTime"]} 

    for item in regexList:
        if item in request.json:
            payload[item] = { '$regex': f".*{request.json[item]}.*"}

    for item in arrayList:
        if item in request.json:
            payload[item] = {'$in': request.json[item]}


    result = model.get_logs(payload, skip, limit)
    record_count = model.get_logs_count(payload)
    message = "get_all_logs"
    return return_response(data = result, success = True, message = message, total_count = record_count), 200
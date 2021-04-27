from bson.json_util import loads, dumps
from flask import jsonify
import json
from functools import wraps
import functools
from flask import request, jsonify
import jwt
import config
import time
import datetime
from core.logger.MongoLogger import MongoLogger

logger = MongoLogger()


def return_response(data = [], success = True, message = "success", total_count = 0, code = 0):
    return {
        "data": {
            "data": dumps(data),
            "success": success,
            "message": {
                "text": message
            },
            "summary": {
                "total_count": total_count,
                "code": code
            }
        }
    }

def cursor_to_json(data):
    return json.loads(dumps(list(data), indent = 2))

def token_required(f=None, roles=None):
    if not f:
        return functools.partial(token_required, roles=roles)
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('token')

        if not token:
            message = "Token is missing"
            logger.add_log("ERROR", request.remote_addr, '', request.method, request.url, '', message,  403)
            return return_response(data = [], success = False, message = message, code = 403), 403

        try:
            data = jwt.decode(token, config.authentication["SECRET_KEY"])
            current_time = time.mktime((datetime.datetime.now()).timetuple())

            if data["expiry_time"] > current_time:
                if data["role"] in roles:
                    return f(data)
                else:
                    message = "This user cannot access this method"
                    logger.add_log("ERROR", request.remote_addr, data["username"], request.method, request.url, '', message,  401)
                    return return_response(data = [], success = False, message = "This user cannot access this method", code = 401), 401
            else:
                message = "Token expired"
                logger.add_log("ERROR", request.remote_addr, data["username"], request.method, request.url, '', message,  401)
                return return_response(data = [], success = False, message = message, code = 401), 401
        except:
            message = "Token is invalid"
            logger.add_log("ERROR", request.remote_addr, '', request.method, request.url, '', message,  401)
            return return_response(data = [], success = False, message = message), 401

        return f(*args, **kwargs)
    return decorated

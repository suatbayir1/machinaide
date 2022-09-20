from flask import Blueprint, request, jsonify
from application.helpers.Helper import return_response, token_required
from application.classes.InfluxManager import InfluxManager
from application.classes.Validator import Validator

influx = Blueprint("influx", __name__)
influxManager = InfluxManager()
validator = Validator()

@influx.route("/query", methods = ["POST"])
@token_required(roles = ["admin", "editor", "member"])
def query(token):
    try:
        message, confirm = validator.check_request_params(
            request.json, 
            ["bucket", "startTimestamp", "endTimestamp", "period", "measurements", "fields", "function"]
        )

        if not confirm:
            return return_response(success = False, message = message, code = 400), 400

        if not request.json["measurements"] or not request.json["fields"]:
            return return_response(success = False, message = "Measurements and fields list cannot be empty", code = 400), 400

        message, confirm = Validator.influx_query_validate(request.json)

        if not confirm:
            return return_response(success = False, message = message, code = 400), 400
            
        query = InfluxManager.create_flux_query(request.json)
        print("query", query)


        data = influxManager.get_data_from_influxdb(query)

        return return_response(success = True, data = data, message = "test", code = 200, total_count = len(data)), 200
    except:
        return return_response(success = False, message = "An unexpected error has occured", code = 400), 400
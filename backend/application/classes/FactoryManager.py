from application.model.FactoryModel import FactoryModel
from application.model.GeneralModel import GeneralModel
from application.classes.Validator import Validator
import datetime

class FactoryManager:
    def __init__(self):
        self.model = FactoryModel()
        self.generalModel = GeneralModel()
        self.validator = Validator()

    def get_production_line_by_name(self, params):
        message, confirm = self.validator.check_request_params(
            params, 
            ["searchText"]
        )

        if not confirm:
            return {"message": message, "success": False}

        hierarchy = self.model.convert_data_to_json()
        data = []
        for factory in hierarchy:
            for productionLine in factory["productionLines"]:
                if params["searchText"].lower() in productionLine["displayName"].lower():
                    data.append({
                        "plId": productionLine["@id"],
                        "plName": productionLine["displayName"],
                        "machineCount": len(productionLine["machines"])
                    })

        if not data:
            return {"message": "No results matched with your searching criteria", "success": False}

        return {"message": "Matched production lines returned", "success": True, "data": data}

    def get_machine_by_name(self, params):
        message, confirm = self.validator.check_request_params(
            params, 
            ["searchText"]
        )

        if not confirm:
            return {"message": message, "success": False}

        hierarchy = self.model.convert_data_to_json()
        data = []
        for factory in hierarchy:
            for productionLine in factory["productionLines"]:
                for machine in productionLine["machines"]:
                    if params["searchText"].lower() in machine["displayName"].lower():
                        componentCount = 0
                        for component in machine["contents"]:
                            if component["@type"] == "Component":
                                componentCount += 1
                        data.append({
                            "plId": productionLine["@id"],
                            "machineId": machine["@id"],
                            "machineName": machine["displayName"],
                            "componentCount": componentCount
                        })

        if not data:
            return {"message": "No results matched with your searching criteria", "success": False}

        return {"message": "Matched machines returned", "success": True, "data": data}

    def get_component_by_name(self, params):
        message, confirm = self.validator.check_request_params(
            params, 
            ["searchText"]
        )

        if not confirm:
            return {"message": message, "success": False}

        hierarchy = self.model.convert_data_to_json()
        data = []
        for factory in hierarchy:
            for productionLine in factory["productionLines"]:
                for machine in productionLine["machines"]:
                    for component in machine["contents"]:
                        if component["@type"] == "Component" and params["searchText"].lower() in component["displayName"].lower():
                            data.append({
                                "plId": productionLine["@id"],
                                "machineId": machine["@id"],
                                "machineName": machine["displayName"],
                                "componentId": component["@id"],
                                "componentName": component["displayName"],
                                "sensorCount": len(component["sensors"])
                            })

        if not data:
            return {"message": "No results matched with your searching criteria", "success": False}

        return {"message": "Matched components returned", "success": True, "data": data}

    def get_sensor_by_name(self, params):
        message, confirm = self.validator.check_request_params(
            params, 
            ["searchText"]
        )

        if not confirm:
            return {"message": message, "success": False}

        hierarchy = self.model.convert_data_to_json()
        data = []
        for factory in hierarchy:
            for productionLine in factory["productionLines"]:
                for machine in productionLine["machines"]:
                    for component in machine["contents"]:
                        if component["@type"] == "Component":
                            for sensor in component["sensors"]:
                                if params["searchText"].lower() in sensor["displayName"].lower() \
                                    or params["searchText"].lower() in sensor["status"].lower() \
                                    or params["searchText"].lower() in sensor["@type"][1].lower():
                                        data.append({
                                            "plId": productionLine["@id"],
                                            "machineId": machine["@id"],
                                            "machineName": machine["displayName"],
                                            "componentId": component["@id"],
                                            "componentName": component["displayName"],
                                            "sensorId": sensor["@id"],
                                            "sensorName": sensor["displayName"],
                                            "fieldCount": len(sensor["fields"])
                                        })

        if not data:
            return {"message": "No results matched with your searching criteria", "success": False}

        return {"message": "Matched sensor returned", "success": True, "data": data}

    def get_machine_actions_by_name(self, params):
        message, confirm = self.validator.check_request_params(
            params, 
            ["startDate", "endDate", "searchText"]
        )

        if not confirm:
            return {"message": message, "success": False}

        where = {
            "$or": [
                {"jobName": {"$regex": params["searchText"], '$options': 'i'}},
                {"jobDescription": {"$regex": params["searchText"], '$options': 'i'}}
            ]
        }

        machineActions = self.model.get_machine_actions_by_condition(where)

        queryStartTime = datetime.datetime.strptime(params['startDate'], "%Y-%m-%dT%H:%M")
        queryEndTime = datetime.datetime.strptime(params['endDate'], "%Y-%m-%dT%H:%M")

        data = []
        for action in machineActions:
            actionStartTime = datetime.datetime.strptime(action["startTime"], "%Y-%m-%dT%H:%M")
            actionEndTime = datetime.datetime.strptime(action["endTime"], "%Y-%m-%dT%H:%M") if action["endTime"].strip() != "" else datetime.datetime.now()

            print("actionStartTime", actionStartTime, " queryStartTime", queryStartTime)
            print("actionEndTime",actionEndTime, " queryEndTime", queryEndTime)

            if (actionStartTime > queryStartTime and actionEndTime < queryEndTime):
                data.append({
                    "machineId": action["machineID"],
                    "jobName": action["jobName"],
                    "jobDescription": action["jobDescription"]
                })

        if not data:
            return {"message": "No results matched with your searching criteria", "success": False}

        return {"message": "Matched machine actions returned", "success": True, "data": data}

    def get_reports_by_name(self, params):
        message, confirm = self.validator.check_request_params(
            params, 
            ["searchText"]
        )

        if not confirm:
            return {"message": message, "success": False}

        where = {
            "$or": [
                {"Author": {"$regex": params["searchText"], '$options': 'i'}},
                {"ReportConfig.description": {"$regex": params["searchText"], '$options': 'i'}},
                {"ReportConfig.title": {"$regex": params["searchText"], '$options': 'i'}},
                {"Receivers": {"$regex": params["searchText"], '$options': 'i'}},
            ]
        }

        data = self.generalModel.get_report_by_condition(where)

        if not data:
            return {"message": "No results matched with your searching criteria", "success": False}

        return {"message": "Matched reports returned", "success": True, "data": data}

    def get_detail_sensor_info_by_name(self, params):
        message, confirm = self.validator.check_request_params(
            params, 
            ["searchText"]
        )

        if not confirm:
            return {"message": message, "success": False}

        hierarchy = self.model.convert_data_to_json()
        data = []
        for factory in hierarchy:
            for productionLine in factory["productionLines"]:
                for machine in productionLine["machines"]:
                    for component in machine["contents"]:
                        if component["@type"] == "Component":
                            for sensor in component["sensors"]:
                                if params["searchText"].lower() in sensor["displayName"].lower() \
                                    or params["searchText"].lower() in sensor["@id"].lower():
                                        data.append(sensor)

        if not data:
            return {"message": "No results matched with your searching criteria", "success": False}

        return {"message": "Matched sensor detail information returned", "success": True, "data": data}

    def invalid_operation(self, params):
        return {"message": "Invalid processId. processId can be one of [1,2,3,4,5,6,7]", "success": False}
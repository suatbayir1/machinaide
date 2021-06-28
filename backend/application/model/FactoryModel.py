from core.database.MongoDB import MongoDB
from bson.json_util import loads, dumps
import json
from application.helpers.Helper import cursor_to_json
from bson import ObjectId

class FactoryModel():
    def __init__(self):
        self.db = MongoDB()
        self.collection = "digital_twin"

    def convert_data_to_json(self):
        data = self.db.find(self.collection)
        json_data = json.loads(dumps(list(data), indent = 2))
        return json_data

    def get_factories(self):
        try:
            data = self.convert_data_to_json()
            return data
        except:
            return False

    def get_production_lines(self, payload):
        try:
            data = self.convert_data_to_json()
            productionLines = []

            for factory in data:
                if factory["id"] == payload["factoryId"]:   
                    for productionLine in factory["productionLines"]:
                        currentProductionLine = {
                            "id": productionLine["@id"],
                            "plName": productionLine["displayName"],
                            "description": productionLine["description"],
                            "name": productionLine["name"],
                            "machineCount": len(productionLine["machines"])
                        }

                        productionLines.append(currentProductionLine)

            return productionLines
        except:
            return False

    def get_machines(self, payload):
        try:
            data = self.convert_data_to_json()
            machines = []

            for factory in data:
                if factory["id"] == payload["factoryId"]:   
                    for pl in factory["productionLines"]:
                        if payload["plId"] == "all":
                            for machine in pl["machines"]:
                                currentMachine = {
                                    "id": machine["@id"],
                                    "machineName": machine["displayName"],
                                    "description": machine["description"],
                                    "name": machine["name"],
                                    "componentCount": len([comp for comp in machine["contents"] if comp["@type"] == "Component"])
                                }

                                machines.append(currentMachine)
                        else:
                            if pl["@id"] == payload["plId"]:
                                for machine in pl["machines"]:
                                    currentMachine = {
                                        "id": machine["@id"],
                                        "machineName": machine["displayName"],
                                        "description": machine["description"],
                                        "name": machine["name"],
                                        "componentCount": len([comp for comp in machine["contents"] if comp["@type"] == "Component"])
                                    }

                                    machines.append(currentMachine)

            return machines
        except:
            return False

    def get_components(self, payload):
        try:
            data = self.convert_data_to_json()
            components = []

            for factory in data:
                if factory["id"] == payload["factoryId"]:
                    for pl in factory["productionLines"]:
                        # if pl["@id"] == payload["plId"]:
                        for machine in pl["machines"]:
                            if machine["@id"] == payload["machineId"]:
                                for component in machine["contents"]:
                                    if component["@type"] == "Component":
                                        currentComponent = {
                                            "id": component["@id"],
                                            "componentName": component["displayName"],
                                            "description": component["description"],
                                            "name": component["name"],
                                            "sensorCount": len(component["sensors"])
                                        }
                                        
                                        components.append(currentComponent)
            
            return components
        except:
            return False

    def get_sensors(self, payload):
        data = self.convert_data_to_json()
        sensors = []

        for factory in data:
            if factory["id"] == payload["factoryId"]:
                for pl in factory["productionLines"]:
                    # if pl["@id"] == payload["plId"]:
                    for machine in pl["machines"]:
                        if machine["@id"] == payload["machineId"]:
                            for component in machine["contents"]:
                                if component["@type"] == "Component" and component["@id"] == payload["componentId"]:
                                    for sensor in component["sensors"]:
                                        currentSensor = {
                                            "id": sensor["@id"],
                                            "sensorType": sensor["@type"][1],
                                            "unit": sensor["unit"],
                                            "type": sensor["type"],
                                            "displayName": sensor["displayName"],
                                            "name": sensor["name"],
                                            "description": sensor["description"],
                                            "sensorStatus": sensor["status"] if "status" in sensor else "unknown",
                                        }

                                        sensors.append(currentSensor)

        return sensors

    def add_machine_action(self, payload):
        collection = "machine_actions"
        return self.db.insert_one(collection, payload)

    def get_all_machine_actions(self, payload):
        collection = "machine_actions"

        if payload["machineID"] == "*":
            where = {}
        else:
            where = {
                "machineID": payload["machineID"]
            }

        return self.db.find(collection, where)

    def update_machine_action(self, payload):
        collection = "machine_actions"

        try:
            recordId = ObjectId(payload["recordId"])
            del payload["recordId"]

            updateData = {
                '$set': payload
            }

            where = {
                "_id": recordId
            }

            return self.db.update_one(collection, updateData, where)
        except:
            False

    def delete_machine_action(self, payload):
        collection = "machine_actions"

        try:
            where = {
                "_id": ObjectId(payload["recordId"])
            }

            return self.db.delete_one(collection, where)
        except:
            return False

    def is_machine_action_exists(self, payload):
        collection = "machine_actions"
        return cursor_to_json(self.db.find(collection, payload))

    def add_material(self, payload):
        try:
            collection = "materials"
            return self.db.insert_one(collection, payload)
        except:
            return False

    def get_materials(self):
        try:
            collection = "materials"
            return self.db.find(collection)
        except:
            return False

    def delete_material(self, payload):
        collection = "materials"

        try:
            where = {
                "_id": ObjectId(payload["recordId"])
            }

            return self.db.delete_one(collection, where)
        except:
            return False

    def update_material(self, payload):
        collection = "materials"

        try:
            recordId = ObjectId(payload["recordId"])
            del payload["recordId"]

            updateData = {
                '$set': payload
            }

            where = {
                "_id": recordId
            }

            return self.db.update_one(collection, updateData, where)
        except:
            False

    def is_material_exists(self, payload):
        collection = "materials"
        return cursor_to_json(self.db.find(collection, payload))

    def create_dashboard(self, payload):
        try:
            collection = "dashboards"
            return self.db.insert_one(collection, payload)
        except:
            return False

    def delete_dashboard(self, payload):
        collection = "dashboards"

        try:
            where = {
                "dashboardID": payload["id"]
            }

            return self.db.delete_one(collection, where)
        except:
            return False

    def get_dashboards(self):
        try:
            collection = "dashboards"
            return self.db.find(collection)
        except:
            return False

    def is_dashboard_exists(self, payload):
        collection = "dashboards"
        return cursor_to_json(self.db.find(collection, payload))
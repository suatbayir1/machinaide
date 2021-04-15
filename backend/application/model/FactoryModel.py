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
        data = self.convert_data_to_json()
        factories = []

        for factory in data:
            currentFactory = {
                "id": factory["id"],
                "factoryName": factory["factoryName"],
                "zone": factory["zone"],
                "description": factory["description"],
                "name": factory["name"],
                "machineCount": len(factory["machines"])
            }
            
            factories.append(currentFactory)

        return factories

    def get_machines(self, payload):
        data = self.convert_data_to_json()
        machines = []

        for factory in data:
            if factory["id"] == payload["factoryId"]:   
                for machine in factory["machines"]:
                    currentMachine = {
                        "id": machine["@id"],
                        "machineName": machine["displayName"],
                        "description": machine["description"],
                        "name": machine["name"],
                        "componentCount": len(machine["contents"])
                    }

                    machines.append(currentMachine)

        return machines

    def get_components(self, payload):
        data = self.convert_data_to_json()
        components = []

        for factory in data:
            if factory["id"] == payload["factoryId"]:
                for machine in factory["machines"]:
                    if machine["@id"] == payload["machineId"]:
                        for component in machine["contents"]:
                            currentComponent = {
                                "id": component["@id"],
                                "componentName": component["displayName"],
                                "description": component["description"],
                                "name": component["name"],
                                "sensorCount": len(component["sensors"])
                            }
                            
                            components.append(currentComponent)
        
        return components

    def get_sensors(self, payload):
        data = self.convert_data_to_json()
        sensors = []

        for factory in data:
            if factory["id"] == payload["factoryId"]:
                for machine in factory["machines"]:
                    if machine["@id"] == payload["machineId"]:
                        for component in machine["contents"]:
                            if component["@id"] == payload["componentId"]:
                                for sensor in component["sensors"]:
                                    currentSensor = {
                                        "id": sensor["@id"],
                                        "sensorType": sensor["@type"][1],
                                        "unit": sensor["unit"],
                                        "type": sensor["type"],
                                        "displayName": sensor["displayName"],
                                        "name": sensor["name"],
                                        "description": sensor["description"],
                                        "sensorStatus": sensor["status"],
                                    }

                                    sensors.append(currentSensor)

        return sensors

    def add_machine_action(self, payload):
        collection = "machine_actions"
        return self.db.insert_one(collection, payload)

    def get_all_machine_actions(self, payload):
        collection = "machine_actions"

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

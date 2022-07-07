from core.database.MongoDB import MongoDB
from bson.json_util import loads, dumps
import json
from application.helpers.Helper import cursor_to_json

class DigitalTwinModel():
    def __init__(self):
        self.db = MongoDB()
        self.collection = "digital_twin"

    """
    GET all components and sensor visual object
    This method does not required payload
    """
    def get_all(self):
        data = self.db.find(self.collection)
        json_data = json.loads(dumps(list(data), indent = 2))

        return json_data

    """
    GET General info methods
    """
    def get_general_info(self):
        data = self.db.find(self.collection)
        json_data = json.loads(dumps(list(data), indent = 2))

        factoryName = ""
        factoryID = ""
        productionLineList = []
        machineList = []
        componentList = []
        sensorList = []

        for factory in json_data:
            factoryName = factory["factoryName"]
            factoryID = factory["id"]
            for productionLine in factory["productionLines"]:
                productionLineList.append(productionLine["name"])
                for machine in productionLine["machines"]:
                    machineList.append(machine['name'])
                    for component in machine["contents"]:
                        if component["@type"] == "Component":
                            componentList.append(component['name'])
                            for sensor in component["sensors"]:
                                sensorList.append(sensor['name'])

        response = {
            'productionLineList': productionLineList,
            'machineList': machineList,
            'componentList': componentList,
            'sensorList': sensorList,
            "factoryID": factoryID,
            "factory": factoryName,
            'productionLineCount': len(productionLineList),
            "machineCount": len(machineList),
            "componentCount": len(componentList),
            "sensorCount": len(sensorList)
        }

        return response

    def add_sensor(self, payload):
        data = self.db.find(self.collection)
        json_data = json.loads(dumps(list(data), indent = 2))
        isExists = self.is_item_already_exists(payload['name'])

        if not isExists:
            for factory in json_data:
                del factory['_id']
                for pl in factory["productionLines"]:
                    for machine in pl['machines']:
                        for component in machine['contents']:
                            if component["@type"] == "Component" and component["name"] == payload["parent"]:
                                component['sensors'].append(payload)


            update_data = {
                '$set': json_data[0]
            }

            where = {
               "id": factory["id"]
            }

            return self.db.update_one(self.collection, update_data, where)
        else:
            return False

    def add_relationship(self, payload):
        try:
            data = self.db.find(self.collection)
            json_data = json.loads(dumps(list(data), indent = 2))
            isExists = False

            for factory in json_data:
                del factory['_id']
                for pl in factory["productionLines"]:
                    for machine in pl['machines']:
                        if machine["@id"] == payload["source"]:
                            for component in machine['contents']:
                                if component["@type"] == "Relationship":
                                    isExists = True
                            machine['contents'].append(payload)

            if isExists:
                return False

            update_data = {
                '$set': json_data[0]
            }

            where = {
                "id": factory["id"]
            }

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def remove_relationship(self, payload):
        try:
            data = self.db.find(self.collection)
            json_data = json.loads(dumps(list(data), indent = 2))

            for factory in json_data:
                del factory['_id']
                for pl in factory["productionLines"]:
                    for machine in pl['machines']:
                        for component in machine['contents']:
                            if component["@type"] == "Relationship" and component["name"] == payload["name"]:
                                machine['contents'].remove(component)

            update_data = {
                '$set': json_data[0]
            }

            where = {
                "id": factory["id"]
            }

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def delete_production_line(self, payload):
        hierarchy = self.get_all()

        for factory in hierarchy:
            del factory['_id']
            for pl in factory["productionLines"]:
                if (pl["@id"] == payload["id"]):
                    factory["productionLines"].remove(pl)
        
        update_data = {
            '$set': hierarchy[0]
        }

        where = {
            "id": factory["id"]
        }

        return self.db.update_one(self.collection, update_data, where)

    def delete_machine(self, payload):
        hierarchy = self.get_all()

        for factory in hierarchy:
            del factory['_id']
            for pl in factory["productionLines"]:
                for machine in pl["machines"]:
                    if machine["@id"] == payload["id"]:
                        pl["machines"].remove(machine)
        
        update_data = {
            '$set': hierarchy[0]
        }

        where = {
            "id": factory["id"]
        }

        return self.db.update_one(self.collection, update_data, where)

    def delete_component(self, payload):
        hierarchy = self.get_all()
        factoryID = ""

        for factory in hierarchy:
            del factory['_id']
            for pl in factory["productionLines"]:
                for machine in pl["machines"]:
                    for component in machine["contents"]:
                        if component["@type"] == "Component" and payload["id"] == component["@id"]:
                            machine["contents"].remove(component)
                            factoryID = factory["id"]
        
        update_data = {
            '$set': hierarchy[0]
        }

        where = {
            "id": factory["id"]
        }

        if not factoryID:
            return False

        return self.db.update_one(self.collection, update_data, where)

    def delete_sensor(self, payload):
        hierarchy = self.get_all()
        factoryID = ""

        for factory in hierarchy:
            del factory['_id']
            for pl in factory["productionLines"]:
                for machine in pl["machines"]:
                    for component in machine["contents"]:
                        if component["@type"] == "Component":
                            for sensor in component["sensors"]:
                                if sensor["@id"] == payload["id"]:
                                    component["sensors"].remove(sensor)
                                    factoryID = factory["id"]
            
        update_data = {
            '$set': hierarchy[0]
        }

        where = {
            "id": factory["id"]
        }

        if not factoryID:
            return False

        return self.db.update_one(self.collection, update_data, where)

    def update(self, name, type, payload):
        try:
            hierarchy = self.get_all()

            for factory in hierarchy:
                del factory['_id']
                for pl in factory["productionLines"]:
                    for machine in pl["machines"]:
                        if machine["name"] == name and type == "Machine":
                            machine.update(payload)
                        for component in machine["contents"]:
                            if component["@type"] == "Component":
                                if component["name"] == name and type == "Component":
                                    component.update(payload)
                                for sensor in component["sensors"]:
                                    if sensor["name"] == name and type == "Sensor":
                                        sensor.update(payload)

            update_data = {
                '$set': hierarchy[0]
            }

            where = {
                "id": factory["id"]
            }

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def insert_factory(self, payload):
        try:
            hierarchy = self.get_all()

            if len(hierarchy) > 0:
                return 409

            return self.db.insert_one(self.collection, payload)
        except:
            return False

    def insert_production_line(self, payload):
        try:
            hierarchy = self.get_all()
            factoryID = ""

            for factory in hierarchy:
                del factory['_id']
                if factory["id"] == payload["parent"]:
                    factory["productionLines"].append(payload)
                    factoryID = factory["id"]  
                
            update_data = {
                '$set': hierarchy[0]
            }

            where = {
                "id": factoryID
            }

            if not factoryID:
                return False

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def insert_machine(self, payload):
        try:
            hierarchy = self.get_all()
            factoryID = ""

            for factory in hierarchy:
                del [factory['_id']]
                for pl in factory["productionLines"]:
                    if pl["name"] == payload["parent"]:
                        pl["machines"].append(payload)      
                        factoryID = factory["id"]  

            update_data = {
                '$set': hierarchy[0]
            }              

            where = {
                "id": factoryID
            }

            if not factoryID:
                return False

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def insert_component(self, payload):
        try:
            hierarchy = self.get_all()
            factoryID = ""

            for factory in hierarchy:
                del factory['_id']
                for pl in factory["productionLines"]:
                    for machine in pl['machines']:
                        if machine['name'] == payload["parent"]:
                            machine['contents'].append(payload)
                            factoryID = factory["id"]  

            update_data = {
                '$set': hierarchy[0]
            }

            where = {
                "id": factoryID
            }

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False    

    def insert_sensor(self, payload):
        try:
            hierarchy = self.get_all()
            factoryID = ""

            for factory in hierarchy:
                del factory['_id']
                for pl in factory["productionLines"]:
                    for machine in pl['machines']:
                        for component in machine["contents"]:
                            if component["@type"] == "Component":
                                if component["name"] == payload["parent"]:
                                    component['sensors'].append(payload)
                                    factoryID = factory["id"]  

            update_data = {
                '$set': hierarchy[0]
            }

            where = {
                "id": factoryID
            }

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def insert_field(self, payload):
        try:
            hierarchy = self.get_all()
            factoryID = ""

            for factory in hierarchy:
                del factory["_id"]
                for pl in factory["productionLines"]:
                    for machine in pl["machines"]:
                        for component in machine["contents"]:
                            if component["@type"] == "Component":
                                for sensor in component["sensors"]:
                                    if sensor["@id"] == payload["parent"]:
                                        sensor["fields"].append(payload)
                                        factoryID = factory["id"]

            update_data = { 
                '$set': hierarchy[0]
            }

            where = {
                "id": factoryID
            }

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False
        
    def update_factory(self, payload):
        try:
            hierarchy = self.get_all()

            for factory in hierarchy:
                del factory['_id']
                if factory["id"] == payload["id"]:
                    factory["bucket"] = payload["bucket"]
                    factory["factoryName"] = payload["factoryName"]
                    factory["location"] = payload["location"]
                    factory["description"] = payload["description"]
                
            update_data = {
                '$set': hierarchy[0]
            }

            where = {
                "id": payload["id"]
            }

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def update_production_line(self, payload):
        try:
            hierarchy = self.get_all()
            factoryID = ""

            for factory in hierarchy:
                del factory['_id']
                for pl in factory["productionLines"]:
                    if pl["@id"] == payload["id"]:
                        pl["displayName"] = payload["displayName"]
                        pl["description"] = payload["description"]
                        factoryID = factory["id"]
                
            update_data = {
                '$set': hierarchy[0]
            }

            where = {
                "id": factoryID
            }

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def update_machine(self, payload):
        try:
            hierarchy = self.get_all()
            factoryID = ""

            for factory in hierarchy:
                del factory['_id']
                for pl in factory["productionLines"]:
                    for machine in pl["machines"]:
                        if machine["@id"] == payload["id"]:
                            machine["measurements"] = payload["measurements"]
                            machine["displayName"] = payload["displayName"]
                            machine["description"] = payload["description"]
                            factoryID = factory["id"]
                
            update_data = {
                '$set': hierarchy[0]
            }

            where = {
                "id": factoryID
            }

            if not factoryID:
                return False

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def update_component(self, payload):
        try:
            hierarchy = self.get_all()
            factoryID = ""

            for factory in hierarchy:
                del factory['_id']
                for pl in factory["productionLines"]:
                    for machine in pl["machines"]:
                        for component in machine["contents"]:
                            if component["@type"] == "Component" and component["@id"] == payload["id"]:
                                component["displayName"] = payload["displayName"]
                                component["description"] = payload["description"]
                                component["visual"] = payload["visual"]
                                factoryID = factory["id"]
                
            update_data = {
                '$set': hierarchy[0]
            }

            where = {
                "id": factoryID
            }

            if not factoryID:
                return False

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def update_sensor(self, payload):
        try:
            hierarchy = self.get_all()
            factoryID = ""

            for factory in hierarchy:
                del factory['_id']
                for pl in factory["productionLines"]:
                    for machine in pl["machines"]:
                        for component in machine["contents"]:
                            if component["@type"] == "Component":
                                for sensor in component["sensors"]:
                                    if sensor["@id"] == payload["id"]:
                                        sensor["unit"] = payload["unit"]
                                        sensor["schema"] = payload["unit"]
                                        sensor["status"] = payload["status"]
                                        sensor["@type"] = payload["@type"]
                                        sensor["displayName"] = payload["displayName"]
                                        sensor["description"] = payload["description"]
                                        sensor["visual"] = payload["visual"]
                                        factoryID = factory["id"]
                
            update_data = {
                '$set': hierarchy[0]
            }

            where = {
                "id": factoryID
            }

            if not factoryID:
                return False

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def delete_factory(self, payload):
        try:
            where = {
                "id": payload["id"]
            }

            return self.db.delete_one(self.collection, where)
        except:
            return False

    def update_field(self, payload):
        try:
            hierarchy = self.get_all()
            factoryID = ""

            for factory in hierarchy:
                del factory["_id"]
                for pl in factory["productionLines"]:
                    for machine in pl["machines"]:
                        for component in machine["contents"]:
                            if component["@type"] == "Component":
                                for sensor in component["sensors"]:
                                    for field in sensor["fields"]:
                                        if field["@id"] == payload["id"]:
                                            field["dataSource"] = payload["dataSource"]
                                            field["minValue"] = payload["minValue"]
                                            field["maxValue"] = payload["maxValue"]
                                            field["measurement"] = payload["measurement"]
                                            field["displayName"] = payload["displayName"]
                                            field["description"] = payload["description"]
                                            field["isFillNullActive"] = payload["isFillNullActive"]
                                            field["defaultValue"] = payload["defaultValue"]
                                            field["isOperationActive"] = payload["isOperationActive"]
                                            field["operation"] = payload["operation"]
                                            field["operationValue"] = payload["operationValue"]
                                            factoryID = factory["id"]

            update_data = { 
                '$set': hierarchy[0]
            }

            where = {
                "id": factoryID
            }

            return self.db.update_one(self.collection, update_data, where)
        except:
            return False

    def delete_field(self, payload):
        hierarchy = self.get_all()
        factoryID = ""

        for factory in hierarchy:
            del factory['_id']
            for pl in factory["productionLines"]:
                for machine in pl["machines"]:
                    for component in machine["contents"]:
                        if component["@type"] == "Component":
                            for sensor in component["sensors"]:
                                for field in sensor["fields"]:
                                    if field["@id"] == payload["id"]:
                                        sensor["fields"].remove(field)
                                        factoryID = factory["id"]

        update_data = {
            '$set': hierarchy[0]
        }

        where = {
            "id": factoryID
        }

        if not factoryID:
            return False

        return self.db.update_one(self.collection, update_data, where)

    def is_item_already_exists(self, item):
        data = self.db.find(self.collection)
        json_data = json.loads(dumps(list(data), indent = 2))
        isExists = False

        for factory in json_data:
            if factory["id"] == item:
                isExists = True
                break
            for pl in factory["productionLines"]:
                if pl["@id"] == item:
                    isExists = True
                    break
                for machine in pl['machines']:
                    if machine["@id"] == item:
                        isExists = True
                        break
                    for component in machine['contents']:
                        if component['@type'] == 'Component':
                            if component["@id"] == item:
                                isExists = True
                                break
                            for sensor in component['sensors']:
                                if sensor['@id'] == item:
                                    isExists = True
                                    break
                                for field in sensor["fields"]:
                                    if field["@id"] == item:
                                        isExists = True
                                        break
        return isExists

    def retire(self, payload):
        try:
            return self.db.insert_one("retired", payload).inserted_id
        except:
            return False

    def get_retired(self, where):
        try:
            return cursor_to_json(self.db.find("retired", where))
        except:
            return 500


    def update_dt(self):
        payload = {
            '$set' : {
                "id" : "Ermetal",
                "description" : "Ermetal A.Ş , sac parça şekillendirme ve montajı konusunda tecrübeli çalışanları ve yapmakta olduğu yeni yatırımlar ile Türk Otomotiv Sanayisinin öncü kuruluşlarından birisidir.",
                "factoryName" : "Ermetal Otomotiv A.Ş",
                "name" : "Ermetal",
                "type" : "Factory",
                "location" : "Dumlupınar / Osmangazi, Bursa",
                "bucket": "Ermetal",
                "productionLines": [
                    {
                        "@id": "1600T_Press_Line",
                        "type": "ProductionLine",
                        "parent": "Ermetal",
                        "displayName": "1600T Press Line",
                        "description": "description",
                        "name": "1600T_Press_Line",
                        "machines" : [ 
                            {
                                "@id" : "Press030",
                                "type" : "Machine",
                                "parent" : "1600T_Press_Line",
                                "@type" : "Interface",
                                "displayName" : "Press030",
                                "description" : "machine description",
                                "name" : "Press030",
                                "measurements": [],
                                "contents" : [ 
                                    {
                                        "@type" : "Relationship",
                                        "name" : "Press030ToPress031",
                                        "source" : "Press030",
                                        "target" : "Press031"
                                    }
                                ]
                            }, 
                            {
                                "@id" : "Press031",
                                "name" : "Press031",
                                "type" : "Machine",
                                "parent" : "1600T_Press_Line",
                                "@type" : "Interface",
                                "displayName" : "Press031",
                                "description" : "machine description",
                                "measurements": ["Press031"],
                                "contents" : [ 
                                    {
                                        "@id" : "anaMotor",
                                        "@type" : "Component",
                                        "name" : "anaMotor",
                                        "displayName" : "Ana Motor",
                                        "description" : "<description>",
                                        "type" : "Component",
                                        "parent" : "Press031",
                                        "visual" : [ 
                                            {
                                                "isRender" : False,
                                                "name" : "en_üst_çark",
                                                "geometryType" : "BoxGeometry",
                                                "boxMeasure" : {
                                                    "x" : 0.8,
                                                    "y" : 0.5,
                                                    "z" : 1
                                                },
                                                "position" : {
                                                    "x" : -1.1,
                                                    "y" : 5.3,
                                                    "z" : -1
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 6084188,
                                                "opacity" : 0.7
                                            }
                                        ],
                                        "sensors" : []
                                    }, 
                                    {
                                        "@id" : "yaglama",
                                        "@type" : "Component",
                                        "name" : "yaglama",
                                        "displayName" : "Yağlama",
                                        "description" : "<description>",
                                        "type" : "Component",
                                        "parent" : "Press031",
                                        "visual" : [],
                                        "sensors" : []
                                    }, 
                                    {
                                        "@id" : "volan",
                                        "@type" : "Component",
                                        "name" : "volan",
                                        "displayName" : "Volan",
                                        "description" : "<description>",
                                        "type" : "Component",
                                        "parent" : "Press031",
                                        "visual" : [ 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "üst_silindirli_dikdörtgen",
                                                "boxMeasure" : {
                                                    "x" : 1.8,
                                                    "y" : 1,
                                                    "z" : 2.9
                                                },
                                                "position" : {
                                                    "x" : -1.1,
                                                    "y" : 4.6,
                                                    "z" : -1
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 14803434,
                                                "opacity" : 0.7
                                            }
                                        ],
                                        "sensors" : []
                                    }, 
                                    {
                                        "@id" : "dengeleme",
                                        "@type" : "Component",
                                        "name" : "dengeleme",
                                        "displayName" : "Dengeleme",
                                        "description" : "<description>",
                                        "type" : "Component",
                                        "parent" : "Press031",
                                        "visual" : [ 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "sol_alt",
                                                "boxMeasure" : {
                                                    "x" : 2,
                                                    "y" : 2,
                                                    "z" : 0.2
                                                },
                                                "position" : {
                                                    "x" : -1.1,
                                                    "y" : 1,
                                                    "z" : 0.4
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 6720767,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "sag_alt",
                                                "boxMeasure" : {
                                                    "x" : 2,
                                                    "y" : 2,
                                                    "z" : 0.2
                                                },
                                                "position" : {
                                                    "x" : -1.1,
                                                    "y" : 1,
                                                    "z" : -2.38
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 6720767,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "sol_alt_küçük_dikdörtgen1",
                                                "boxMeasure" : {
                                                    "x" : 0.5,
                                                    "y" : 0.5,
                                                    "z" : 0.5
                                                },
                                                "position" : {
                                                    "x" : -1.5,
                                                    "y" : 0.6,
                                                    "z" : 0.5
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 14803434,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "sag_alt_küçük_dikdörtgen1",
                                                "boxMeasure" : {
                                                    "x" : 0.5,
                                                    "y" : 0.5,
                                                    "z" : 0.5
                                                },
                                                "position" : {
                                                    "x" : -1.5,
                                                    "y" : 0.6,
                                                    "z" : -2.45
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 14803434,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "sol_alt_küçük_dikdörtgen2",
                                                "boxMeasure" : {
                                                    "x" : 0.5,
                                                    "y" : 0.5,
                                                    "z" : 0.5
                                                },
                                                "position" : {
                                                    "x" : -1.5,
                                                    "y" : 1.4,
                                                    "z" : 0.5
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 14803434,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "sag_alt_küçük_dikdörtgen2",
                                                "boxMeasure" : {
                                                    "x" : 0.5,
                                                    "y" : 0.5,
                                                    "z" : 0.5
                                                },
                                                "position" : {
                                                    "x" : -1.5,
                                                    "y" : 1.4,
                                                    "z" : -2.4
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 14803434,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "sol_alt_küçük_dikdörtgen3",
                                                "boxMeasure" : {
                                                    "x" : 0.5,
                                                    "y" : 0.5,
                                                    "z" : 0.5
                                                },
                                                "position" : {
                                                    "x" : -0.6,
                                                    "y" : 1.4,
                                                    "z" : 0.5
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 14803434,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "sag_alt_küçük_dikdörtgen3",
                                                "boxMeasure" : {
                                                    "x" : 0.5,
                                                    "y" : 0.5,
                                                    "z" : 0.5
                                                },
                                                "position" : {
                                                    "x" : -0.5,
                                                    "y" : 1.4,
                                                    "z" : -2.4
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 14803434,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "sol_alt_küçük_dikdörtgen4",
                                                "boxMeasure" : {
                                                    "x" : 0.5,
                                                    "y" : 0.5,
                                                    "z" : 0.5
                                                },
                                                "position" : {
                                                    "x" : -0.6,
                                                    "y" : 0.6,
                                                    "z" : 0.5
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 14803434,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "sag_alt_küçük_dikdörtgen4",
                                                "boxMeasure" : {
                                                    "x" : 0.5,
                                                    "y" : 0.5,
                                                    "z" : 0.5
                                                },
                                                "position" : {
                                                    "x" : -0.7,
                                                    "y" : 0.6,
                                                    "z" : -2.5
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 14803434,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "orta_alt",
                                                "boxMeasure" : {
                                                    "x" : 1.5,
                                                    "y" : 0.3,
                                                    "z" : 2.6
                                                },
                                                "position" : {
                                                    "x" : -1,
                                                    "y" : 0.3,
                                                    "z" : -1
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 16776960,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "orta_üst",
                                                "boxMeasure" : {
                                                    "x" : 1.5,
                                                    "y" : 0.3,
                                                    "z" : 2.6
                                                },
                                                "position" : {
                                                    "x" : -1,
                                                    "y" : 1.5,
                                                    "z" : -1
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 16776960,
                                                "opacity" : 0.7
                                            }
                                        ],
                                        "sensorGroups": [
                                            {
                                                "name": "Robot",
                                                "fields": ["Rob_ctr_sic_act", "Robot_hava_debi_act", "Robot_hava_sic_act"]
                                            },
                                            {
                                                "name": "Yaglama",
                                                "fields": ["Yaglama_bas_act", "Yaglama_sic_act"]
                                            }
                                        ],
                                        "sensors" : [ 
                                            {
                                                "@type" : [ 
                                                    "Telemetry", 
                                                    "Temperature"
                                                ],
                                                "@id" : "presAnaHavaAkis",
                                                "name" : "presAnaHavaAkis",
                                                "schema" : "real",
                                                "type" : "Sensor",
                                                "parent" : "dengeleme",
                                                "unit" : "double",
                                                "displayName" : "Pres Ana Hava Akış",
                                                "description" : "degreeCelcius",
                                                "status" : "enable",
                                                "fields": [
                                                    {
                                                        "@id": "Robot_hava_debi_act",
                                                        "name": "Robot_hava_debi_act",
                                                        "minValue": 10,
                                                        "maxValue": 20,
                                                        "parent": "presAnaHavaAkis",
                                                        "type": "Field",
                                                        "displayName": "Robot_hava_debi_act",
                                                        "description": "Robot_hava_debi_act",
                                                        "measurement": "Press031",
                                                        "dataSource": "Robot_hava_debi_act"
                                                    },
                                                    {
                                                        "@id": "Robot_hava_sic_act",
                                                        "name": "Robot_hava_sic_act",
                                                        "minValue": 5,
                                                        "maxValue": 100,
                                                        "parent": "presAnaHavaAkis",
                                                        "type": "Field",
                                                        "displayName": "Robot_hava_sic_act",
                                                        "description": "Robot_hava_sic_act",
                                                        "measurement": "Press031",
                                                        "dataSource": "Robot_hava_sic_act"
                                                    }
                                                ],
                                                "visual" : {
                                                    "isRender" : False,
                                                    "geometryType" : "BoxGeometry",
                                                    "name" : "pres_ana_hava_akis",
                                                    "boxMeasure" : {
                                                        "x" : 0.2,
                                                        "y" : 0.2,
                                                        "z" : 0.2
                                                    },
                                                    "position" : {
                                                        "x" : 0,
                                                        "y" : 0.1,
                                                        "z" : -2.4
                                                    },
                                                    "rotate" : {
                                                        "x" : 0,
                                                        "y" : 0,
                                                        "z" : 0
                                                    },
                                                    "color" : 13369344,
                                                    "opacity" : 0.7
                                                }
                                            }, 
                                            {
                                                "@type" : [ 
                                                    "Telemetry", 
                                                    "Temperature"
                                                ],
                                                "@id" : "sensor1",
                                                "name" : "sensor1",
                                                "schema" : "real",
                                                "type" : "Sensor",
                                                "parent" : "dengeleme",
                                                "unit" : "double",
                                                "displayName" : "sensor1",
                                                "description" : "degreeCelcius",
                                                "status" : "enable",
                                                "fields": [
                                                    {
                                                        "@id": "Ana_hava_debi_act",
                                                        "name": "Ana_hava_debi_act",
                                                        "minValue": 10,
                                                        "maxValue": 20,
                                                        "parent": "sensor1",
                                                        "type": "Field",
                                                        "displayName": "Ana_hava_debi_act",
                                                        "description": "Ana_hava_debi_act",
                                                        "measurement": "Press031",
                                                        "dataSource": "Ana_hava_debi_act"
                                                    },
                                                    {
                                                        "@id": "Ana_hava_sic_act",
                                                        "name": "Ana_hava_sic_act",
                                                        "minValue": 5,
                                                        "maxValue": 100,
                                                        "parent": "sensor1",
                                                        "type": "Field",
                                                        "displayName": "Ana_hava_sic_act",
                                                        "description": "Ana_hava_sic_act",
                                                        "measurement": "Press031",
                                                        "dataSource": "Ana_hava_sic_act"
                                                    }
                                                ],
                                                "visual" : {
                                                    "geometryType" : "BoxGeometry",
                                                    "isRender" : False,
                                                    "name" : "sensor1",
                                                    "boxMeasure" : {
                                                        "x" : 0.2,
                                                        "y" : 0.2,
                                                        "z" : 0.2
                                                    },
                                                    "position" : {
                                                        "x" : 0,
                                                        "y" : 1.1,
                                                        "z" : -2.4
                                                    },
                                                    "rotate" : {
                                                        "x" : 0,
                                                        "y" : 0,
                                                        "z" : 0
                                                    },
                                                    "color" : 13369344,
                                                    "opacity" : 0.7
                                                }
                                            }, 
                                            {
                                                "@type" : [ 
                                                    "Telemetry", 
                                                    "Temperature"
                                                ],
                                                "@id" : "sensor2",
                                                "name" : "sensor2",
                                                "schema" : "real",
                                                "type" : "Sensor",
                                                "parent" : "dengeleme",
                                                "unit" : "double",
                                                "displayName" : "sensor2",
                                                "description" : "degreeCelcius",
                                                "status" : "enable",
                                                "fields": [
                                                    {
                                                        "@id": "Deng_hava_bas_act",
                                                        "name": "Deng_hava_bas_act",
                                                        "minValue": 10,
                                                        "maxValue": 20,
                                                        "parent": "sensor2",
                                                        "type": "Field",
                                                        "displayName": "Deng_hava_bas_act",
                                                        "description": "Deng_hava_bas_act",
                                                        "measurement": "Press031",
                                                        "dataSource": "Deng_hava_bas_act"
                                                    },
                                                    {
                                                        "@id": "Deng_hava_debi_act",
                                                        "name": "Deng_hava_debi_act",
                                                        "minValue": 5,
                                                        "maxValue": 100,
                                                        "parent": "sensor2",
                                                        "type": "Field",
                                                        "displayName": "Deng_hava_debi_act",
                                                        "description": "Deng_hava_debi_act",
                                                        "measurement": "Press031",
                                                        "dataSource": "Deng_hava_debi_act"
                                                    }
                                                ],
                                                "visual" : {
                                                    "geometryType" : "BoxGeometry",
                                                    "isRender" : False,
                                                    "name" : "sensor2",
                                                    "boxMeasure" : {
                                                        "x" : 0.2,
                                                        "y" : 0.2,
                                                        "z" : 0.2
                                                    },
                                                    "position" : {
                                                        "x" : 0,
                                                        "y" : 2.1,
                                                        "z" : -2.35
                                                    },
                                                    "rotate" : {
                                                        "x" : 0,
                                                        "y" : 0,
                                                        "z" : 0
                                                    },
                                                    "color" : 13369344,
                                                    "opacity" : 0.7
                                                }
                                            }
                                        ]
                                    }, 
                                    {
                                        "@id" : "genelPres",
                                        "@type" : "Component",
                                        "name" : "genelPres",
                                        "displayName" : "Genel Pres",
                                        "description" : "<description>",
                                        "type" : "Component",
                                        "parent" : "Press031",
                                        "visual" : [ 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "sol_üst",
                                                "boxMeasure" : {
                                                    "x" : 2,
                                                    "y" : 2,
                                                    "z" : 0.2
                                                },
                                                "position" : {
                                                    "x" : -1.1,
                                                    "y" : 3,
                                                    "z" : 0.4
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 14803434,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "sag_üst",
                                                "boxMeasure" : {
                                                    "x" : 2,
                                                    "y" : 2,
                                                    "z" : 0.2
                                                },
                                                "position" : {
                                                    "x" : -1.1,
                                                    "y" : 3,
                                                    "z" : -2.35
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 14803434,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "orta_üst_büyük",
                                                "boxMeasure" : {
                                                    "x" : 1.5,
                                                    "y" : 1,
                                                    "z" : 2.6
                                                },
                                                "position" : {
                                                    "x" : -1,
                                                    "y" : 2.2,
                                                    "z" : -1
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 16777164,
                                                "opacity" : 0.7
                                            }, 
                                            {
                                                "isRender" : False,
                                                "geometryType" : "BoxGeometry",
                                                "name" : "orta_üst_kapak",
                                                "boxMeasure" : {
                                                    "x" : 1.8,
                                                    "y" : 0.2,
                                                    "z" : 2.9
                                                },
                                                "position" : {
                                                    "x" : -1.1,
                                                    "y" : 4,
                                                    "z" : -1
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 14803434,
                                                "opacity" : 0.7
                                            }
                                        ],
                                        "sensors" : []
                                    }, 
                                    {
                                        "@id" : "robot",
                                        "@type" : "Component",
                                        "name" : "robot",
                                        "displayName" : "Robot",
                                        "description" : "<description>",
                                        "type" : "Component",
                                        "parent" : "Press031",
                                        "visual" : [],
                                        "sensors" : []
                                    }, 
                                    {
                                        "@type" : "Relationship",
                                        "name" : "Press031ToPress032",
                                        "source" : "Press031",
                                        "target" : "Press032"
                                    }
                                ]
                            }, 
                            {
                                "@id" : "Press032",
                                "name" : "Press032",
                                "type" : "Machine",
                                "parent" : "1600T_Press_Line",
                                "@type" : "Interface",
                                "displayName" : "Press032",
                                "description" : "machine description",
                                "measurements": [],
                                "contents" : [ 
                                    {
                                        "@type" : "Relationship",
                                        "name" : "Press032ToPress033",
                                        "source" : "Press032",
                                        "target" : "Press033"
                                    }
                                ]
                            }, 
                            {
                                "@id" : "Press033",
                                "name" : "Press033",
                                "type" : "Machine",
                                "parent" : "1600T_Press_Line",
                                "@type" : "Interface",
                                "displayName" : "Press033",
                                "description" : "machine description",
                                "measurements": [],
                                "contents" : [ 
                                    {
                                        "@type" : "Relationship",
                                        "name" : "Press033ToPress034",
                                        "source" : "Press033",
                                        "target" : "Press034"
                                    }
                                ]
                            }, 
                            {
                                "@id" : "Press034",
                                "name" : "Press034",
                                "type" : "Machine",
                                "parent" : "1600T_Press_Line",
                                "@type" : "Interface",
                                "displayName" : "Press034",
                                "description" : "machine description",
                                "measurements": [],
                                "contents" : []
                            }, 
                            {
                                "@id" : "Robot",
                                "name" : "Robot",
                                "type" : "Machine",
                                "parent" : "1600T_Press_Line",
                                "@type" : "Interface",
                                "displayName" : "Robot",
                                "description" : "machine description",
                                "measurements": [],
                                "contents" : [ 
                                    {
                                        "@id" : "robotPart1",
                                        "@type" : "Component",
                                        "name" : "robotPart1",
                                        "displayName" : "Robot Part 1",
                                        "description" : "<description>",
                                        "type" : "Component",
                                        "parent" : "Robot",
                                        "visual" : [ 
                                            {
                                                "isRender" : False,
                                                "name" : "collada_file",
                                                "geometryType" : "ColladaFile",
                                                "fileName" : "abb_irb52_7_120.dae",
                                                "boxMeasure" : {
                                                    "x" : 4,
                                                    "y" : 4,
                                                    "z" : 4
                                                },
                                                "position" : {
                                                    "x" : 4,
                                                    "y" : 0,
                                                    "z" : -1.5
                                                },
                                                "rotate" : {
                                                    "x" : 0,
                                                    "y" : 0,
                                                    "z" : 0
                                                },
                                                "color" : 6084188,
                                                "opacity" : 0.7
                                            }
                                        ],
                                        "sensors" : []
                                    }, 
                                    {
                                        "@type" : "Relationship",
                                        "name" : "RobotToPress030",
                                        "source" : "Robot",
                                        "target" : "Press030"
                                    }
                                ]
                            }
                        ],
                    },
                    {
                        "@id": "ProductionLine1",
                        "type": "ProductionLine",
                        "parent": "Ermetal",
                        "displayName": "Production Line 1",
                        "description": "description",
                        "name": "ProductionLine1",
                        "machines": []
                    },
                    {
                        "@id": "ProductionLine2",
                        "type": "ProductionLine",
                        "parent": "Ermetal",
                        "displayName": "Production Line 2",
                        "description": "description",
                        "name": "ProductionLine2",
                        "machines": []
                    },
                    {
                        "@id": "ProductionLine3",
                        "type": "ProductionLine",
                        "parent": "Ermetal",
                        "displayName": "Production Line 3",
                        "description": "description",
                        "name": "ProductionLine3",
                        "machines": []
                    },
                    {
                        "@id": "ProductionLine4",
                        "type": "ProductionLine",
                        "parent": "Ermetal",
                        "displayName": "Production Line 4",
                        "description": "description",
                        "name": "ProductionLine4",
                        "machines": []
                    },
                ],
            }
        }

        where = {
            "id": "Ermetal"
        }

        print("updated")
        return self.db.update_one(self.collection, payload, where)
import sys
sys.path.insert(1, '/home/machinaide/backend')
import random
import json
from bson.json_util import loads, dumps
from core.database.MongoDB import MongoDB

import pathlib
print(pathlib.Path().absolute())


sensors = [f"comp{component}_sensor{sensor}" for sensor in range(1, 51) for component in range(1, 6)]
custom_sensors = ["sensor1", "sensor2", "presAnaHavaAkis"]
sensors = sensors + custom_sensors

def get_sensor_names():
    db = MongoDB()
    data = db.find("digital_twin")
    json_data = json.loads(dumps(list(data), indent = 2))

    plList = []
    machineList = []
    componentList = []
    sensorList = []

    for factory in json_data:
        factoryName = factory["factoryName"]
        for pl in factory["productionLines"]:
            plList.append(pl["name"])
            for machine in pl["machines"]:
                machineList.append(machine['name'])
                for component in machine["contents"]:
                    if component["@type"] == "Component":
                        componentList.append(component['name'])
                        for sensor in component["sensors"]:
                            sensorList.append(sensor['name'])

    return sensorList


sensorList = get_sensor_names()

def get_sensor_data():
    return {
        "name": sensorList[random.randint(0, len(sensorList) - 1)],
        "current_value": random.randint(0, 100)
    }

if __name__ == "__main__":
    print(get_sensor_data())
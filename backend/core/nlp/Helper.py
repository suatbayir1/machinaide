import json
from bson.json_util import loads, dumps

class Helper():
    def category_parse(self, cat):
        if(cat == "Sensor data"):
            return "influxdb"
        elif(cat == "Metadata"):
            return "mongodb"
    
    def template_parse(self, temp):
        if(temp == "Maintenance"):
            return "maintenance"
        elif(temp == 'Maintenance Count'):
            return 'maintenancecount'
        elif(temp == 'Failure'):
            return 'failure'
        elif(temp == 'Failure Count'):
            return 'failure'
        elif(temp == 'Completed Job'):
            return 'completed_job'
        else:
            return temp

    def cursor_to_json(self, data):
        return json.loads(dumps(list(data), indent = 2))
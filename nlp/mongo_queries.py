from pymongo import MongoClient
from bson.json_util import dumps
import datetime

mongo = MongoClient('mongodb://machinaide:erste2020@localhost:27017/')

all_severity_types = ["minor", "major", "severe"]
all_maintenance_types = ["Maintenance 1", "Maintenance 2", "Maintenance 3"]

def testMongoConnection():
    failures = mongo.machinaide.failures.find()
    print(dumps(failures))

def get_sources_from_failures(from_date, to_date, severity):
    # from_date = datetime.datetime(2021, 4, 10, 12, 30, 30, 125000)
    # to_date = datetime.datetime.now()
    failure_records = mongo.machinaide.failures.find()

    if(len(severity) == 0):
        severity = all_severity_types
    failures = [failure for failure in failure_records if(failure["severity"] in severity)]

    res = []
    if(from_date != ""):
        for failure in failures:
            if(datetime.datetime.fromisoformat(failure["startTime"])>from_date):
                if(failure["endTime"] == ""):
                    # print(failure)
                    res.append(failure["sourceName"])
                else:
                    if(datetime.datetime.fromisoformat(failure["endTime"])<to_date):
                        # print(failure)
                        res.append(failure["sourceName"])
    else:
        res = [failures["sourceName"] for failure in failures]
    # eliminate duplicates
    res = list(dict.fromkeys(res))
    print(res)
    return dumps(res)

def failure_count(sources, from_date, to_date, severity):
    query = []
    print("failure count", sources)
    for source in sources:
        search_source = ".*" + source + ".*"
        query.append({"sourceName": {"$regex": search_source}})
    print(query)

    if(to_date == ""):
        to_date = datetime.datetime.now()

    failures = mongo.machinaide.failures.find({"$or": query}) # .count()
    if(len(severity) == 0):
        severity = all_severity_types
    failure_records = [failure for failure in failures if(failure["severity"] in severity)]

    failure_count = []
    if(from_date != ""):
        for failure in failure_records:
            if(datetime.datetime.fromisoformat(failure["startTime"])>from_date):
                if(failure["endTime"] == ""):
                    failure_count.append(failure)
                else:
                    if(datetime.datetime.fromisoformat(failure["endTime"])<to_date):
                        failure_count.append(failure)
    else:
        failure_count = [failure for failure in failure_records]
    # print(failure_count, len(failure_count))
    return len(failure_count)

def get_sources_from_maintenance(from_date, type):
    # maintenance only have one date value in db
    # from_date = datetime.datetime(2021, 4, 28, 10, 30, 30, 125000)
    now = datetime.datetime.now()
    maintenance_records = mongo.machinaide.maintenance.find()

    if(len(type) == 0):
        type = all_maintenance_types
    maintenances = [maintenance for maintenance in maintenance_records if(maintenance["maintenanceType"] in type)]

    if(from_date != ""):
        res = [maintenance["asset"] for maintenance in maintenances if (datetime.datetime.fromisoformat(maintenance["date"])>from_date and datetime.datetime.fromisoformat(maintenance["date"])<now)]
    else:
        res = [maintenance["asset"] for maintenance in maintenances]
    res = list(dict.fromkeys(res))
    # print(res)
    return res


def maintenance_count(source, time, type):
    query = []
    print("maintenance count", sources)
    now = datetime.datetime.now()
    for source in sources:
        search_source = ".*" + source + ".*"
        query.append({"asset": {"$regex": search_source}})
    print(query)
    maintenances = mongo.machinaide.maintenance.find({"$or": query}) # .count()
    if(len(type) == 0):
        type = all_maintenance_types
    maintenance_records = [maintenance for maintenance in maintenances if(maintenance["maintenanceType"] in type)]

    if(time != ""):
        time = datetime.datetime.now() - datetime.timedelta(days=1)
        maintenance_count = [maintenance["asset"] for maintenance in maintenances if (datetime.datetime.fromisoformat(maintenance["date"])>time and datetime.datetime.fromisoformat(maintenance["date"])<now)]
    else:
        maintenance_count = [maintenance["asset"] for maintenance in maintenances if (datetime.datetime.fromisoformat(maintenance["date"])<now)]
    # print(maintenance_count, len(maintenance_count))
    return len(maintenance_count)

# testMongoConnection()
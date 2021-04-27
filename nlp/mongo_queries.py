from pymongo import MongoClient
from bson.json_util import dumps
import datetime

mongo = MongoClient('mongodb://machinaide:erste2020@localhost:27017/')

def testMongoConnection():
    failures = mongo.machinaide.failures.find()
    print(dumps(failures))

def get_sources_from_failures(from_date, to_date):
    # from_date = datetime.datetime(2021, 4, 10, 12, 30, 30, 125000)
    # to_date = datetime.datetime.now()
    failures = mongo.machinaide.failures.find()
    res = []
    for failure in failures:
        if(datetime.datetime.fromisoformat(failure["startTime"])>from_date):
            if(failure["endTime"] == ""):
                # print(failure)
                res.append(failure["sourceName"])
            else:
                if(datetime.datetime.fromisoformat(failure["endTime"])<to_date):
                    # print(failure)
                    res.append(failure["sourceName"])
    # eliminate duplicates
    res = list(dict.fromkeys(res))
    print(res)
    return dumps(res)

def failure_count(sources, from_date, to_date):
    query = []
    print("failure count", sources)
    for source in sources:
        search_source = ".*" + source + ".*"
        query.append({"sourceName": {"$regex": search_source}})
    print(query)
    if(from_date == ""):
        from_date = datetime.datetime.now() - datetime.timedelta(days=13)
    if(to_date == ""):
        to_date = datetime.datetime.now()
    failure_records = mongo.machinaide.failures.find({"$or": query}) # .count()
    failure_count = []
    for failure in failure_records:
        if(datetime.datetime.fromisoformat(failure["startTime"])>from_date):
            if(failure["endTime"] == ""):
                # print(failure)
                failure_count.append(failure)
            else:
                if(datetime.datetime.fromisoformat(failure["endTime"])<to_date):
                    # print(failure)
                    failure_count.append(failure)
    # print(failure_count, len(failure_count))
    return len(failure_count)

def get_sources_from_maintenance(from_date):
    # maintenance only have one date value in db
    # from_date = datetime.datetime(2021, 4, 10, 12, 30, 30, 125000)
    maintenances = mongo.machinaide.maintenance.find()
    res = [maintenance["asset"] for maintenance in maintenances if (datetime.datetime.fromisoformat(maintenance["date"])>from_date)]
    res = list(dict.fromkeys(res))
    # print(res)
    return res


def maintenance_count(source, time):
    query = []
    print("maintenance count", sources)
    for source in sources:
        search_source = ".*" + source + ".*"
        query.append({"asset": {"$regex": search_source}})
    print(query)
    if(time == ""):
        time = datetime.datetime.now() - datetime.timedelta(days=1)
    maintenance_records = mongo.machinaide.maintenance.find({"$or": query}) # .count()
    maintenance_count = [maintenance["asset"] for maintenance in maintenances if (datetime.datetime.fromisoformat(maintenance["date"])>time)]
    # print(maintenance_count, len(maintenance_count))
    return len(maintenance_count)

# testMongoConnection()
import json
from model_runner import RULRegModelRunner, RULModelRunner, POFModelRunner

""" with open("./test_rulreg_model.json", 'r') as fp:
    settings = json.load(fp)

# print(settings)
x = {}
x["loadedModel"] = None
x["asset"] = settings["assetName"]
x["fields"] = settings["dataInfo"]["fields"]
x["pipelineID"] = settings["pipelineID"]
x["features"] = settings["Optional"]["features"]
x["lastDataPoint"] = None

rulreg = RULRegModelRunner(x)

rulreg.run() """

""" with open("./test_rul_model.json", 'r') as fp:
    settings = json.load(fp)

# print(settings)
x = {}
x["loadedModel"] = None
x["asset"] = settings["assetName"]
x["fields"] = settings["dataInfo"]["fields"]
x["modelID"] = settings["modelID"]
x["sequenceLength"] = settings["dataInfo"]["sequenceLength"]
x["lastDataPoint"] = None

rul = RULModelRunner(x)

rul.run() """

with open("./test_pof_model.json", 'r') as fp:
    settings = json.load(fp)

# print(settings)
x = {}
x["loadedModel"] = None
x["asset"] = settings["assetName"]
x["fields"] = settings["dataInfo"]["fields"]
x["modelID"] = settings["modelID"]
x["lastDataPoint"] = None

pof = POFModelRunner(x)

pof.run()
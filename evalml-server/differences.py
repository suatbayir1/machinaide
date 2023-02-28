
@alertserver.route('/returnFailures/<part_name>', methods=['GET'])
def returnFailures(part_name):
    part_name_reg = '^' + part_name + '$' # made regex
    failures = model.get_failures({"failureAsset":{'$regex' : part_name_reg, '$options' : 'i'}})
    return dumps(failures), 200

@metadataserver.route('/getSensorsNotUsedInML', methods=['GET'])
def getSensorsNotUsedInML():
    sensors = model.get_sensors({"dontUseInML": True})
    return dumps(sensors), 200    

@metadataserver.route('/getSensorFromMapping/<mapping>', methods=['GET'])
def getSensorFromMapping(mapping):
    sensor = model.get_sensor({"mapping": mapping})
    return dumps(sensor)

@metadataserver.route('/postBasicModel', methods=['POST'])
def postBasicModel():
    pkg = request.json
    model.post_basic_model(pkg)
    return "OK", 201
from application.model.MetaDataModel import MetaDataModel
from application.helpers.JSONEncoder import JSONEncoder
# from application.helper.Helper import role_authorization, org_separation, org_separation_with_role

from flask import Blueprint, request, jsonify
import json
import datetime
import config
from bson import ObjectId
import requests
from bson.json_util import dumps

metadataserver = Blueprint("metadataserver", __name__)

model = MetaDataModel()

@metadataserver.route('/getBasicModels', methods=['GET'])
def getBasicModels():
    basic_models = model.get_basic_models()
    return json.dumps(list(basic_models), cls=JSONEncoder)

@metadataserver.route('/getSessions', methods=['GET'])
def getSessions():
    sessions = model.db.find("ml_sessions")

    return json.dumps(list(sessions), cls=JSONEncoder)
    # chronograf_user_api = config.CHRONOGRAF_API
    # payload={}
    # headers = {'Cookie': request.headers.get('Cookie')}
    # api_response = requests.request('GET', chronograf_user_api, headers=headers, data=payload)
    # roles = config.EDITOR_ROLE
    # if(api_response.text == ''):
    #     return []
    # else:
    #     me = api_response.json()
    #     current_org_id = me['currentOrganization']['id']
    #     for role in me['roles']:
    #         if(role['organization'] == current_org_id):
    #             if(role['name'] in roles ):
    #                 print(role['name'])
    #                 dbs = []
    #                 mappings = model.get_orgDbMappings({"orgId": current_org_id}) 
    #                 if(mappings and mappings.count()):
    #                     mappings = mappings[0]["databases"]
    #                 else:
    #                     mappings = []
    #                 for db in mappings:
    #                     dbs.append(db["name"])
    #                 print(current_org_id, dbs)
    #                 sessions_sent = []
    #                 sessions = model.get_ml_sessions()
    #                 for session in sessions:
    #                     for db in dbs:
    #                         if db.lower() in session["database"].lower():
    #                             sessions_sent.append(session)
    #                             break
    #                 return dumps(sessions_sent)
    #             else:
    #                 print(role['name'])
    #                 return dumps([])
    #     return dumps([])

@metadataserver.route('/postSession', methods=['POST'])
def post_session():
    session = request.json
    session["sessionID"] = str(session["sessionID"])
    model.db.insert_one("ml_sessions", session)
    # mongo.db.ml_sessions.insert_one(session)

    return "CREATED", 201


@metadataserver.route('/updateRetrainMethod', methods=['POST'])
def update_retrain():
    print(request.json)
    modelID = request.json['modelID']
    query = {"modelID": modelID}
    new_values = {"$set": {"retrainMethod": request.json['retrainMethod']}}
    model.db.update_one("basic_models", new_values, query)

    return "CREATED", 201



@metadataserver.route('/postModelData', methods=['POST'])
def post_model_data():
    model_data = request.json
    print(model_data)
    model.db.insert_one("model_data", model_data)
    # mongo.db.model_data.insert_one(model_data)

    return "CREATED", 201


@metadataserver.route('/getModelData/<session_id>', methods=['GET'])
def get_model_data(session_id):
    model_data = model.db.find("model_data", {"sessionID": session_id})
    # model_data = model.db.find("ml_sessions")

    to_return = json.dumps(list(model_data), cls=JSONEncoder)
    # model_data = mongo.db.model_data.find({"sessionID": session_id})

    return to_return


@metadataserver.route('/getCellData/<session_id>/<model_id>', methods=['GET'])
def get_cell_data(session_id, model_id):
    cell_data = model.db.find("model_data", {"sessionID": session_id, "modelID": model_id})
    # cell_data = mongo.db.model_data.find({"sessionID": session_id, "modelID": model_id})

    return json.dumps(list(cell_data), cls=JSONEncoder)


@metadataserver.route('/updateModelData', methods=['POST'])
def update_model_data():
    update_data = request.json
    query = {"modelID": update_data["modelID"], "sessionID": update_data["sessionID"]}
    new_values = {"$set": {"Status": update_data["Status"], "Running": update_data["Running"], "Explanation": update_data["Explanation"]}}

    model.db.update_one("model_data", new_values, query)
    # mongo.db.model_data.update_one(query, new_values)

    return "UPDATED", 201



@metadataserver.route('/getPostTrainingData/<session_id>/<model_id>', methods=['GET'])
def get_post_training_data(session_id, model_id):
    post_training_data = model.db.find_one("post_training", {"modelID": model_id, "sessionID": session_id})
    # post_training = mongo.db.post_training
    # post_training_data = post_training.find_one({"modelID": model_id, "sessionID": session_id})

    return jsonify(post_training_data)


@metadataserver.route('/getBasicModels', methods=['GET'])
def get_basic_models():
    models = model.db.find("basic_models")
    # basic_models = mongo.db.basic_models
    # models = basic_models.find({})

    return json.dumps(list(models), cls=JSONEncoder)


@metadataserver.route('/postBasicModel', methods=['POST'])
def post_basic_model():
    # model = request.json
    # print(model)
    model.db.insert_one("basic_models", request.json)
    # mongo.db.basic_models.insert_one(model)

    return "UPDATED", 201
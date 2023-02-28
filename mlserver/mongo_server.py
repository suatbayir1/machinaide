from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
import datetime
from bson import ObjectId
import os
from flask_cors import CORS
import json


app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://machinaide:erste2020@localhost:27017/machineLearning?authSource=admin"
mongo = PyMongo(app)
CORS(app)

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, (datetime.date, datetime.datetime)):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

@app.route('/insertPostTrainingData', methods=['POST'])
def insert_post_training_data():
    post_training_data = request.json
    mongo.db.post_training.insert_one(post_training_data)

    return "CREATED", 201


@app.route('/getSessions', methods=['GET'])
def get_sessions():
    sessions = mongo.db.ml_sessions.find({})

    return json.dumps(list(sessions), cls=JSONEncoder)


@app.route('/postSession', methods=['POST'])
def post_session():
    session = request.json
    mongo.db.ml_sessions.insert_one(session)

    return "CREATED", 201


@app.route('/postModelData', methods=['POST'])
def post_model_data():
    model_data = request.json
    mongo.db.model_data.insert_one(model_data)

    return "CREATED", 201


@app.route('/getModelData/<session_id>', methods=['GET'])
def get_model_data(session_id):
    model_data = mongo.db.model_data.find({"sessionID": session_id})

    return json.dumps(list(model_data), cls=JSONEncoder)


@app.route('/getCellData/<session_id>/<model_id>', methods=['GET'])
def get_cell_data(session_id, model_id):
    cell_data = mongo.db.model_data.find({"sessionID": session_id, "modelID": model_id})

    return json.dumps(list(cell_data), cls=JSONEncoder)


@app.route('/updateModelData', methods=['POST'])
def update_model_data():
    update_data = request.json
    query = {"modelID": update_data["modelID"], "sessionID": update_data["sessionID"]}
    new_values = {"$set": {"Status": update_data["Status"], "Running": update_data["Running"], "Explanation": update_data["Explanation"]}}

    mongo.db.model_data.update_one(query, new_values)

    return "UPDATED", 201



@app.route('/getPostTrainingData/<session_id>/<model_id>', methods=['GET'])
def get_post_training_data(session_id, model_id):
    post_training = mongo.db.post_training
    post_training_data = post_training.find_one({"modelID": model_id, "sessionID": session_id})

    return jsonify(post_training_data)


@app.route('/getBasicModels', methods=['GET'])
def get_basic_models():
    basic_models = mongo.db.basic_models
    models = basic_models.find({})

    return json.dumps(list(models), cls=JSONEncoder)


@app.route('/postBasicModel', methods=['POST'])
def post_basic_model():
    model = request.json
    print(model)
    mongo.db.basic_models.insert_one(model)

    return "UPDATED", 201
    

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=7393)





from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
import os


app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://machinaide:erste2020@localhost:27017/machineLearning"
mongo = PyMongo(app)

@app.route('/insertPostTrainingData', methods=['POST'])
def insert_post_training_data():
    post_training_data = request.json
    mongo.db.post_training.insert_one(post_training_data)

    return "CREATED", 201



@app.route('/postModelData', methods=['POST'])
def post_model_data():
    model_data = request.json
    mongo.db.model_data.insert_one(model_data)

    return "CREATED", 201


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


if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=7392)





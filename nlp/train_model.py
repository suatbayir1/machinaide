import json

from flask import Flask
from flask_pymongo import PyMongo
from bson.json_util import dumps
import os
 
# flask server
app = Flask(__name__)
app.config['MONGO_DBNAME'] = 'machinaide' ## name of the used database
app.config['MONGO_URI'] = 'mongodb://machinaide:erste2020@localhost:27017/machinaide'
mongo = PyMongo(app)

def train_model():
    train_data = []
    questions = mongo.db.nlp_questions.find()
    
    # turn mongodb train data into json file
    for question in questions:
        entities = []
        for entity in question["entities"]:
            entities.append([entity["start"], entity["end"], entity["tag"]])
        train_data.append([question["question"], {"entities": entities}])

    with open('/home/machinaide/nlp/assets/train_data.json', 'w') as outfile:
        outfile.write(
            '[\n\t' +
            ',\n\t'.join(json.dumps(data) for data in train_data) +
            '\n]\n')

    current_dir = os.getcwd()
    print("current dir : ", current_dir)

    # turn json data into binary form
    os.system("python3 {}/convert.py en {}/assets/train_data.json {}/corpus/train.spacy".format(current_dir, current_dir, current_dir))
    os.system("python3 {}/convert.py en {}/assets/train_data.json {}/corpus/dev.spacy".format(current_dir, current_dir, current_dir))

    # train the model
    os.system("python3 -m spacy train {}/configs/config.cfg --output {}/training/ --paths.train {}/corpus/train.spacy --paths.dev {}/corpus/dev.spacy --training.eval_frequency 10 --training.max_steps 100".format(current_dir, current_dir, current_dir,current_dir))

schedule.every().day.at("03:00").do(train_model)

while True:
    schedule.run_pending()
    time.sleep(60) # wait one minute
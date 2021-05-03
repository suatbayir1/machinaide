import json

from flask import Flask
from flask_pymongo import PyMongo
from pymongo import MongoClient
from bson.json_util import dumps
import os
import schedule
import time
import train_data_helpers as helper
 
# # flask server
# app = Flask(__name__)
# app.config['MONGO_DBNAME'] = 'machinaide' ## name of the used database
# app.config['MONGO_URI'] = 'mongodb://machinaide:erste2020@localhost:27017/admin'
# mongo = PyMongo(app)
# mongo = MongoClient('mongodb://machinaide:erste2020@localhost:27017/')

def train_model():

    # turn mongodb train data into json file
    helper.create_ner_train_data()
    helper.create_texcat_train_data()
    helper.create_mongo_texcat_train_data()

    current_dir = os.getcwd()
    print("current dir : ", current_dir)

    ner_path = current_dir + '/ner-pipe'
    textcat_path = current_dir + '/textcat-pipe'
    mongo_textcat_path = current_dir + '/mongo-textcat-pipe'

    # turn json data into binary form for ner
    os.system("python3 {}/convert.py en {}/assets/ner_train_data.json {}/corpus/train.spacy".format(ner_path, ner_path, ner_path))
    os.system("python3 {}/convert.py en {}/assets/ner_train_data.json {}/corpus/dev.spacy".format(ner_path, ner_path, ner_path))

    # train the ner pipe
    os.system("python3 -m spacy train {}/configs/config.cfg --output {}/training/ --paths.train {}/corpus/train.spacy --paths.dev {}/corpus/dev.spacy --training.eval_frequency 10 --training.max_steps 100".format(ner_path, ner_path, ner_path, ner_path))


    # turn jsonl data into binary form for textcat
    os.system("python3 {}/convert-jsonl.py en {}/assets/textcat_train_data.jsonl {}/corpus/train.spacy".format(textcat_path, textcat_path, textcat_path))
    os.system("python3 {}/convert-jsonl.py en {}/assets/textcat_train_data.jsonl {}/corpus/dev.spacy".format(textcat_path, textcat_path, textcat_path))
    
    # train the textcat pipe
    os.system("python3 -m spacy train {}/configs/config.cfg --output {}/training/ --paths.train {}/corpus/train.spacy --paths.dev {}/corpus/dev.spacy".format(textcat_path, textcat_path, textcat_path, textcat_path))

    # turn jsonl data into binary form for mongo-textcat
    os.system("python3 {}/convert-data.py en {}/assets/mongo_textcat_train_data.jsonl {}/corpus/train.spacy".format(mongo_textcat_path, mongo_textcat_path, mongo_textcat_path))
    os.system("python3 {}/convert-data.py en {}/assets/mongo_textcat_train_data.jsonl {}/corpus/dev.spacy".format(mongo_textcat_path, mongo_textcat_path, mongo_textcat_path))
    
    # train the mongo-textcat pipe
    os.system("python3 -m spacy train {}/configs/config.cfg --output {}/training/ --paths.train {}/corpus/train.spacy --paths.dev {}/corpus/dev.spacy".format(mongo_textcat_path, mongo_textcat_path, mongo_textcat_path, mongo_textcat_path))
    
    # python3 -m spacy train ./configs/config.cfg --output ./training/ --paths.train ./corpus/train.spacy --paths.dev ./corpus/dev.spacy
    # python3 ./convert-data.py en ./assets/train_data.jsonl ./corpus/train.spacy
    # python3 ./convert-data.py en ./assets/train_data.jsonl ./corpus/dev.spacy
    # python3 ./convert-jsonl.py en ./assets/train_data.jsonl ./corpus/train.spacy
    # python3 ./convert-jsonl.py en ./assets/train_data.jsonl ./corpus/dev.spacy
    
schedule.every().day.at("03:00").do(train_model)

while True:
    schedule.run_pending()
    time.sleep(60) # wait one minute

# train_model()
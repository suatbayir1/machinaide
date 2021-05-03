import json

from flask import Flask
from flask_pymongo import PyMongo
from pymongo import MongoClient
from bson.json_util import dumps
import os
import schedule
import time
import srsly
 
mongo = MongoClient('mongodb://machinaide:erste2020@localhost:27017/')

###### FOR CREATING NER JSON FILE, IT TAKES ONE HAND WRITTEN JSON FILE AND TRAIN DATA IN MONGODB THEN CREATES ANOTHER JSON 

def create_ner_train_data():
    train_data = []
    questions = mongo.machinaide.nlp_questions.find()
    
    # turn mongodb train data into json format
    for question in questions:
        entities = []
        for entity in question["entities"]:
            entities.append([entity["start"], entity["end"], entity["tag"]])
        train_data.append([question["question"], {"entities": entities}])
        

    with open('/home/machinaide/nlp/ner-pipe/assets/ner_train_data.json', 'w') as outfile:
        outfile.write(
            '[\n\t')
        for text, annot in srsly.read_json('/home/machinaide/nlp/ner-pipe/assets/train_data.json'):
            outfile.write(
            '\n\t["' + text +'", ' + json.dumps(annot) + '],')
        outfile.write('\n\t'+
            ',\n\t'.join(json.dumps(data) for data in train_data) +
            '\n]\n')

    current_dir = os.getcwd()
    print("current dir : ", current_dir)


def create_texcat_train_data():
    train_data = []
    questions = mongo.machinaide.nlp_questions.find()
    
    # turn mongodb train data into jsonl format
    for question in questions:
        obj = {}
        obj["text"] = question["question"]
        if(question["cat"] == "Sensor data"):
            obj["cats"] = {"mongodb": 0.0, "influxdb": 1.0}
        elif(question["cat"] == "Metadata"):
            obj["cats"] = {"mongodb": 1.0, "influxdb": 0.0}
        train_data.append(obj)
        

    with open('/home/machinaide/nlp/textcat-pipe/assets/textcat_train_data.jsonl', 'w') as outfile:
        for line in srsly.read_jsonl('/home/machinaide/nlp/textcat-pipe/assets/train_data.jsonl'):
            outfile.write(json.dumps(line))
            outfile.write('\n')
        outfile.write('\n'.join(json.dumps(data) for data in train_data))
        

    current_dir = os.getcwd()
    print("current dir : ", current_dir)

def create_mongo_texcat_train_data():
    train_data = []
    questions = mongo.machinaide.nlp_questions.find()
    
    # turn mongodb train data into jsonl format
    for question in questions:
        obj = {}
        obj["text"] = question["question"]
        if(question["cat"] == "Metadata"):
            if(question["mongoTextcat"] == "Maintenance"):
                obj["cats"] = {"maintenance": 1.0, "failure": 0.0, "maintenancecount": 0.0, "failurecount": 0.0}
            elif(question["mongoTextcat"] == "Maintenance Count"):
                obj["cats"] = {"maintenance": 0.0, "failure": 0.0, "maintenancecount": 1.0, "failurecount": 0.0}
            elif(question["mongoTextcat"] == "Failure"):
                obj["cats"] = {"maintenance": 0.0, "failure": 1.0, "maintenancecount": 0.0, "failurecount": 0.0}
            elif(question["mongoTextcat"] == "Failure Count"):
                obj["cats"] = {"maintenance": 0.0, "failure": 0.0, "maintenancecount": 0.0, "failurecount": 1.0}
            if("cats" in obj.keys()):
                train_data.append(obj)
        

    with open('/home/machinaide/nlp/mongo-textcat-pipe/assets/mongo_textcat_train_data.jsonl', 'w') as outfile:
        for line in srsly.read_jsonl('/home/machinaide/nlp/mongo-textcat-pipe/assets/train_data.jsonl'):
            outfile.write(json.dumps(line))
            outfile.write('\n')
        outfile.write('\n'.join(json.dumps(data) for data in train_data))
        

    current_dir = os.getcwd()
    print("current dir : ", current_dir)

def read_json():
    for text, annot in srsly.read_json('/home/machinaide/nlp/assets/train_data_test.json'):
        print(text)
        print("---------------------")
        print(annot)


# create_ner_train_data()
# create_texcat_train_data()
# create_mongo_texcat_train_data()
# read_json()
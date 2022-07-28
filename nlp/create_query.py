import spacy
from fuzzywuzzy import process # string matching based on a score https://github.com/seatgeek/fuzzywuzzy
import dateparser
import random 
import datetime
from spellchecker import SpellChecker
from spacy.util import minibatch, compounding, decaying
from spacy.matcher import Matcher

# for server
from flask import Flask
from flask_cors import CORS
from flask import jsonify
from flask import request
from flask_pymongo import PyMongo
from pymongo import MongoClient

# for querying influxdb through api
import requests
import json
from bson.json_util import dumps
import mongo_queries as mongoq
import config


# flask server
app = Flask(__name__)
# app.config['DATABASE'] = 'machinaide' ## name of the used database
# app.config['MONGO_URI'] = 'mongodb://machinaide:erste2020@localhost:27017/admin'
CORS(app,supports_credentials=True)
mongo = MongoClient('mongodb://machinaide:erste2020@localhost:27017/')
influx_api = "http://localhost:8086/api/v2"

# spellchecker
spell = SpellChecker()

orgID = 'd572bde16b31757c'
dbtoken = "FlviKxQ-RHHWxd1FRkHIc5VwNZuFnP6QTmsJcU6GI7nrd4cuqaTx3cCijZchENMH0zSGuKOew_e4LxW6V09Erw=="
# constants

comparisons = {'GREATER': '>', 'EQUAL': '==', 'LESS': '<'}
stats = {'MIN': 'min()', 'MAX': 'max()', 'AVG': 'mean()', 'CUR': 'last()'}
math_symbols = ['>', '>=', '<', '<=', '=', '==']
math_symbol_dict = {'>': ' greater than ', '>=': ' greater than or equal to ', '<': ' less than ', '<=': ' less than or equal to ', '=': ' equal to ', '==': ' equal to '}
threshold = 85 # string matching score threshold
all_severity_types = ["minor", "major", "severe"]
all_maintenance_types = ["Maintenance 1", "Maintenance 2", "Maintenance 3"]


# given machine/component/sensor names

COMP_NAMES = ["yaglama", "anaMotor", "compName", "sampleComp1", "sampleComp2", "cpu", "diskio"]
SENS_NAMES = ["pressSens", "usage_system", "io_time"]

nlp = spacy.load(f"{config.PROJECT_URL}/nlp/ner-pipe/training/model-best")

""" for pipe in nlp.pipeline:
    print(pipe) """

# The source pipeline with different components
source_nlp = spacy.load("en_core_web_trf")

# the textcat pipeline
textcat_nlp = spacy.load(f"{config.PROJECT_URL}/nlp/textcat-pipe/training/model-best")

# the mongodb textcat pipeline
mongo_textcat_nlp = spacy.load(f"{config.PROJECT_URL}/nlp/mongo-textcat-pipe/training/model-best")

# print("source pipes",source_nlp.pipe_names)
nlp.add_pipe("textcat", source=textcat_nlp)

for pipe in source_nlp.pipeline:
    if(pipe[0] != "ner" and pipe[0] != "textcat"):
        nlp.add_pipe(pipe[0], source=source_nlp)

print("after", nlp.pipe_names)

matcher = Matcher(nlp.vocab, validate=True)

# matcher for creating value queries

if(matcher.get('GREATER')):
    matcher.remove('GREATER')
if(matcher.get('LESS')):
    matcher.remove('LESS')
if(matcher.get('EQUAL')):
    matcher.remove('EQUAL')
    
greater_than_pattern = [{'LOWER': 'greater'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}]
larger_than_pattern = [{'LOWER': 'larger'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}]
great_pattern = [[{'LOWER': 'greater'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}], [{'LOWER': 'larger'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}]]
less_than_pattern = [[{'LOWER': 'less'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}]]
equal_to_pattern = [[{'LOWER': 'equal'}, {'LOWER': 'to', 'OP' : '?'}, {'POS' : 'NUM'}]]
matcher.add("GREATER", great_pattern)
matcher.add("LESS", less_than_pattern)
matcher.add("EQUAL", equal_to_pattern)

stat_matcher = Matcher(nlp.vocab, validate=True)

if(stat_matcher.get('MIN')):
    stat_matcher.remove('MIN')
if(stat_matcher.get('MAX')):
    stat_matcher.remove('MAX')
if(stat_matcher.get('AVG')):
    stat_matcher.remove('AVG')

min_pattern = [[{'LOWER': 'min'}], [{'LOWER': 'minimum'}], [{'LOWER': 'smallest'}]]
max_pattern = [[{'LOWER': 'max'}], [{'LOWER': 'maximum'}], [{'LOWER': 'biggest'}]]
avg_pattern = [[{'LOWER': 'avg'}], [{'LOWER': 'average'}], [{'LOWER': 'mean'}]]
current_pattern =[[{'LOWER': 'current'}], [{'LOWER': 'last'}]]
stat_matcher.add("MIN", min_pattern)
stat_matcher.add("MAX", max_pattern)
stat_matcher.add("AVG", avg_pattern)
stat_matcher.add("CUR", current_pattern)

# format date from dateparser's returned value
def format_date(date):
    year = date.year
    month = "0" + str(date.month) if date.month < 10 else date.month
    day = "0" + str(date.day) if date.day < 10 else date.day
    hour = "0" + str(date.hour) if date.hour < 10 else date.hour
    minute = "0" + str(date.minute) if date.minute < 10 else date.minute
    second = "0" + str(date.second) if date.second < 10 else date.second
    query_date = "{}-{}-{}T{}:{}:{}Z".format(year, month, day, hour, minute, second)
    return query_date

# format flux query based on detected entities

def createQuery(doc, matcher, stat_matcher):
    textcat = nlp.get_pipe("textcat")
    scores = textcat.predict([doc])
    # nlp.set_annotations(doc, scores)
    print("#########\n", scores)
    predicted_labels = scores.argmax(axis=1)
    textcat_labels = [textcat.labels[label] for label in predicted_labels]
    labels = [{"tag": ent.label_ , "start": ent.start_char, "end": ent.end_char, "thing": ent.text} for ent in doc.ents]
    print("LABELS", labels)
    # print([textcat.labels[label] for label in predicted_labels])
    if(textcat_labels[0] == 'influxdb'):

        query = ""
        
        # get the db/bucket
        machine_entities = [ent for ent in doc.ents if ent.label_ == "MACH"]
        # print(bucket)
        if(len(machine_entities) > 0):
            query = query + "from(bucket: {})".format("\"" + machine_entities[0].text + "\"")
        else:
            query = query + "from(bucket: \\{})".format("\"" + "nlp_sample" + "\\" + "\"")
        
        # get range
        range_entities = [ent for ent in doc.ents if ent.label_ == "RANGE"]

        if(len(range_entities) > 0):
            if(len(range_entities) == 1):
                which_date = range_entities[0].text
                date2 = which_date
                for token in range_entities[0]:
                    # if there is numerical value, get its head in dependency tree. e.g. 7-->days
                    # print(token.text, token.pos_)
                    if(token.pos_ == "NUM"):
                        date2 = token.text + token.head.text
                date = dateparser.parse(date2)
                if(not date):
                    date = dateparser.parse(which_date)
                print("date:",date, which_date)
                if(date):
                    query_date = format_date(date)
                    query = query + "|> range(start: {})".format(query_date)
                else:
                    query = query + "|> range(start: -1h)"
                    print("we need a default range query")
            elif(len(range_entities) == 2):
                start_date = range_entities[0].text
                start2 = start_date
                end_date = range_entities[1].text
                end2 = end_date
                for token in range_entities[0]:
                    if(token.pos_ == "NUM"):
                        start2 = token.text + token.head.text
                for token in range_entities[1]:
                    if(token.pos_ == "NUM"):
                        end2 = token.text + token.head.text
                date1 = dateparser.parse(start2)
                if(not date1):
                    date1 = dateparser.parse(start_date)
                date2 = dateparser.parse(end2)
                if(not date2):
                    date2 = dateparser.parse(end_date)
                if((not date1) and (not date2)):
                    query = query + "|> range(start: -1h)"
                elif(date1>date2):
                    query_date1 = format_date(date1)
                    query_date2 = format_date(date2)
                    query = query + "|> range(start: {}, stop: {})".format(query_date2, query_date1)
                elif(date1<date2):
                    query_date1 = format_date(date1)
                    query_date2 = format_date(date2)
                    query = query + "|> range(start: {}, stop: {})".format(query_date1, query_date2)

        else:
            query = query + "|> range(start: -1h)"
            print("we need a default range query")
        
        # get components/measurements
        comp_entities = [ent for ent in doc.ents if ent.label_ == "COMP"]
        comps = []
        for ent in comp_entities:
            comp_name = ""
            if(ent.text in COMP_NAMES):
                comp_name = ent.text
                comps.append(comp_name)
            else:
                res = process.extract(ent.text, COMP_NAMES, limit=1)
                # for now we get the best result but we need to set a score threshold
                if(len(res)>0 and res[0][1]>threshold):
                    comp_name = res[0][0]
                    comps.append(comp_name)
        comp_temp = ""
        #eliminate duplicates
        comps = list(dict.fromkeys(comps))
        # print("****COMPS****", comps)
        for i in range(len(comps)):
            if(i != len(comps)-1):
                comp_temp = comp_temp + " r._measurement == \\{} or".format("\"" + comps[i] + "\\" + "\"")
            else:
                comp_temp = comp_temp + " r._measurement == \\{}".format("\"" + comps[i] + "\\" + "\"")
        # for testing purposes comp_temp = comp_temp + " r._measurement == \\{}".format("\"" + "cpu" + "\\" + "\"")
        if(len(comp_temp) > 0):
            query = query + "|> filter(fn: (r) => {} )".format(comp_temp)
            
        # get sensors/fields
        sens_entities = [ent for ent in doc.ents if ent.label_ == "SENS"]
        sensors = []
        for ent in sens_entities:
            sens_name = ""
            if(ent.text in SENS_NAMES):
                sens_name = ent.text
                sensors.append(sens_name)
            else:
                res = process.extract(ent.text, SENS_NAMES, limit=1)
                # for now we get the best result but we need to set a score threshold
                if(len(res)>0  and res[0][1]>threshold):
                    sens_name = res[0][0]
                    sensors.append(sens_name)
        sens_temp = ""
        for i in range(len(sensors)):
            if(i != len(sensors)-1):
                sens_temp = sens_temp + " r._field == \\{} or".format("\"" + sensors[i] + "\\" + "\"")
            else:
                sens_temp = sens_temp + " r._field == \\{}".format("\"" + sensors[i] + "\\" + "\"")
            
        if(len(sens_temp) > 0):
            query = query + "|> filter(fn: (r) => {} )".format(sens_temp)
            
        # get value comparisons
        val_ents = [ent for ent in doc.ents if ent.label_ == "VALUE"]
        values = []
        for ent in val_ents:
            poses = [ent for token in ent if token.pos_=="CCONJ"]
            print("has conjunction:", poses)
            if len(poses) > 0:
                nums = [token.text for token in ent if token.pos_=="NUM"]
                print("nums are:", nums)
                big_num = max(int(nums[0]), int(nums[1]))
                small_num = min(int(nums[0]), int(nums[1]))
                sm_query = "> {}".format(small_num)
                values.append(sm_query)
                bn_query = "< {}".format(big_num)
                values.append(bn_query)
            else:
                for match_id, start, end in matcher(ent):
                    # bunun yerine sadece num u bul ve matchden çıkanla birleştir yapılabilir sanki daha iyi
                    # print(start, end, ent[start: end])
                    string_id = nlp.vocab.strings[match_id]  # Get string representation
                    replacement = comparisons[string_id]
                    if(start == 0):
                        # new_one = nlp.make_doc(f"{replacement} " + ent[-1].text)
                        new_one = f"{replacement} " + ent[-1].text
                    else: 
                        # new_one = nlp.make_doc(ent[:start].text + f"{replacement} " + ent[-1].text)
                        # print(new_one)
                        new_one = ent[:start].text + f"{replacement} " + ent[-1].text
                    values.append(new_one)
        # print(values)
        temp = ""
        for i in range(len(values)):
            if(i != len(values)-1):
                temp = temp + " r._value {} and".format(values[i])
            else:
                temp = temp + " r._value {}".format(values[i])
        # for value in values:
        #     temp = temp + " r._value {}".format(value)
        if(len(temp) > 0):
            query = query + "|> filter(fn: (r) => {} )".format(temp)

        stat_temp = ""
        graph_overlay = False
        for match_id, start, end in stat_matcher(doc):
            print("stats", doc[start:end])
            graph_overlay = True
            string_id = nlp.vocab.strings[match_id]
            replacement = stats[string_id]
            stat_temp = "|> {}".format(replacement)
            break
        
        if(len(stat_temp) > 0):
            query = query + stat_temp

        return {"query": query, "labels": labels, "graphOverlay": graph_overlay, "textcatLabels": textcat_labels, "mongoTextcat": ""}
    elif(textcat_labels[0] == 'mongodb'):
        # get range
        range_entities = [ent for ent in doc.ents if ent.label_ == "RANGE"]

        from_date = ""
        to_date = dateparser.parse("now")
        if(len(range_entities) > 0):
            if(len(range_entities) == 1):
                which_date = range_entities[0].text
                date2 = which_date
                for token in range_entities[0]:
                    # if there is numerical value, get its head in dependency tree. e.g. 7-->days
                    # print(token.text, token.pos_)
                    if(token.pos_ == "NUM"):
                        date2 = token.text + token.head.text
                date = dateparser.parse(date2)
                if(not date):
                    date = dateparser.parse(which_date)
                if(date):
                    from_date = date
            elif(len(range_entities) == 2):
                start_date = range_entities[0].text
                start2 = start_date
                end_date = range_entities[1].text
                end2 = end_date
                for token in range_entities[0]:
                    if(token.pos_ == "NUM"):
                        start2 = token.text + token.head.text
                for token in range_entities[1]:
                    if(token.pos_ == "NUM"):
                        end2 = token.text + token.head.text
                date1 = dateparser.parse(start2)
                if(not date1):
                    date1 = dateparser.parse(start_date)
                date2 = dateparser.parse(end2)
                if(not date2):
                    date2 = dateparser.parse(end_date)
                if(date1 and date2):
                    if(date1>date2):
                        from_date = date2
                        to_date = date1
                    else:
                        from_date = date1
                        to_date = date2
        else:
            print("we need a default range query for mongo")

        mongo_textcat = mongo_textcat_nlp.get_pipe("textcat")
        scores = mongo_textcat.predict([doc])
        # nlp.set_annotations(doc, scores)
        predicted_labels = scores.argmax(axis=1)
        textcat_labels_mongo = [mongo_textcat.labels[label] for label in predicted_labels]
        if(textcat_labels_mongo[0] == "failure"):
            # from_date = datetime.datetime(2021, 4, 10, 12, 30, 30, 125000)
            # to_date = datetime.datetime.now()
            # severity
            severities = [ent.text for ent in doc.ents if (ent.label_ == "SVR")]
            severity_entities = [ent for ent in severities if(ent in all_severity_types)]

            print("date-->>>>>>>", from_date, to_date)
            res = mongoq.get_sources_from_failures(from_date, to_date, severity_entities)
            res = ", ".join(res)
            return {"query": res, "labels": labels, "graphOverlay": False, "textcatLabels": textcat_labels, "mongoTextcat": "failure"}
        elif(textcat_labels_mongo[0] == "maintenance"):
            # from_date = datetime.datetime(2021, 4, 10, 12, 30, 30, 125000)
            mtypes = [ent.text for ent in doc.ents if (ent.label_ == "MTYPE")]
            mtype_entities = [ent for ent in mtypes if(ent in all_maintenance_types)]

            print("date-->>>>>>>", from_date)
            res = mongoq.get_sources_from_maintenance(from_date, mtype_entities)
            res = ", ".join(res)
            return {"query": res, "labels": labels, "graphOverlay": False, "textcatLabels": textcat_labels, "mongoTextcat": "maintenance"}
        elif(textcat_labels_mongo[0] == "failurecount"):
            # TODO check if these source names are in the given source names array, if not just throw them away
            source_entities = [ent.text for ent in doc.ents if (ent.label_ == "MACH" or ent.label_ == "COMP" or ent.label_ == "SENS")]

            severities = [ent.text for ent in doc.ents if (ent.label_ == "SVR")]
            severity_entities = [ent for ent in severities if(ent in all_severity_types)]

            print("date-->>>>>>>", from_date, to_date)
            if(len(source_entities)>0):
                res = mongoq.failure_count(source_entities, from_date, to_date, severity_entities)
                return {"query": str(res), "labels": labels, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "failurecount"}
            else:
                res = mongoq.failure_count(["default_source"], from_date, to_date, severity_entities)
                return {"query": str(res), "labels": labels, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "failurecount"}
        elif(textcat_labels_mongo[0] == "maintenancecount"):
            # TODO check if these source names are in the given source names array, if not just throw them away
            source_entities = [ent.text for ent in doc.ents if (ent.label_ == "MACH" or ent.label_ == "COMP" or ent.label_ == "SENS")]
            mtypes = [ent.text for ent in doc.ents if (ent.label_ == "MTYPE")]
            mtype_entities = [ent for ent in mtypes if(ent in all_maintenance_types)]

            print("date-->>>>>>>", from_date)
            if(len(source_entities)>0):
                res = mongoq.maintenance_count(source_entities, from_date, mtype_entities)
                return {"query": str(res), "labels": labels, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "maintenancecount"}
            else:
                res = mongoq.maintenance_count(["Press030"],from_date, mtype_entities)
                return {"query": str(res), "labels": labels, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "maintenancecount"}
        else:
            return {"query": "NOTHING", "labels": labels, "graphOverlay": False, "textcatLabels": textcat_labels, "mongoTextcat": ""}
    else:
        return {"query": "NOTHING", "labels": labels, "graphOverlay": False, "textcatLabels": textcat_labels}

""" doc2 = nlp("Show the component comname and component yaglam sensors with pressure value is less than 50 and larger 30 in the last 2 days")
for ent in doc.ents: 
    print(ent.label_, ent.text)
print("\n\n\n",createQuery(doc, matcher))
print("\n\n\n",createQuery(doc2, matcher)) """

def mongo_query(data):
    textcat_labels = ['mongodb']
    question = data["question"]
    entities = data["entities"]
    temp =""
    if(data["mongoTextcat"]):
        temp = template_parse(data["mongoTextcat"])
    source_entities = [question[entity["start"]:entity["end"]] for entity in entities if (entity["tag"]=="MACH" or entity["tag"]=="COMP" or entity["tag"]=="SENS")]
    range_entities = [question[entity["start"]:entity["end"]] for entity in entities if entity["tag"]=="RANGE"]
    from_date = ""
    to_date = dateparser.parse("now")
    if(len(range_entities) > 0):
        if(len(range_entities) == 1):
            which_date = range_entities[0]
            date2 = which_date
            for token in source_nlp(range_entities[0]):
                # if there is numerical value, get its head in dependency tree. e.g. 7-->days
                # print(token.text, token.pos_)
                if(token.pos_ == "NUM"):
                    date2 = token.text + token.head.text
            date = dateparser.parse(date2)
            if(not date):
                date = dateparser.parse(which_date)
            if(date):
                from_date = date
        elif(len(range_entities) == 2):
            start_date = range_entities[0]
            start2 = start_date
            end_date = range_entities[1]
            end2 = end_date
            for token in source_nlp(range_entities[0]):
                if(token.pos_ == "NUM"):
                    start2 = token.text + token.head.text
            for token in source_nlp(range_entities[1]):
                if(token.pos_ == "NUM"):
                    end2 = token.text + token.head.text
            date1 = dateparser.parse(start2)
            if(not date1):
                date1 = dateparser.parse(start_date)
            date2 = dateparser.parse(end2)
            if(not date2):
                date2 = dateparser.parse(end_date)
            if(date1 and date2):
                if(date1>date2):
                    from_date = date2
                    to_date = date1
                else:
                    from_date = date1
                    to_date = date2
    else:
        print("we need a default range query for mongo")
    if(temp == "failure"):
        # from_date = datetime.datetime(2021, 4, 10, 12, 30, 30, 125000)
        # to_date = datetime.datetime.now()
        print("date-->>>>>>>", from_date, to_date)
        res = mongoq.get_sources_from_failures(from_date, to_date)
        res = ", ".join(res)
        return {"query": res, "labels": entities, "graphOverlay": False, "textcatLabels": textcat_labels, "mongoTextcat": "failure"}
    elif(temp == "maintenance"):
        # from_date = datetime.datetime(2021, 4, 10, 12, 30, 30, 125000)
        print("date-->>>>>>>", from_date)
        res = mongoq.get_sources_from_maintenance(from_date)
        res = ", ".join(res)
        return {"query": res, "labels": entities, "graphOverlay": False, "textcatLabels": textcat_labels, "mongoTextcat": "maintenance"}
    elif(temp == "failurecount"):
        # TODO check if these source names are in the given source names array, if not just throw them away
        print("date-->>>>>>>", from_date, to_date)
        if(len(source_entities)>0):
            res = mongoq.failure_count(source_entities, from_date, to_date)
            return {"query": str(res), "labels": entities, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "failurecount"}
        else:
            res = mongoq.failure_count("default_source", from_date, to_date)
            return {"query": str(res), "labels": entities, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "failurecount"}
    elif(temp == "maintenancecount"):
        # TODO check if these source names are in the given source names array, if not just throw them away
        print("date-->>>>>>>", from_date)
        if(len(source_entities)>0):
            res = mongoq.maintenance_count(source_entities, from_date)
            return {"query": str(res), "labels": entities, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "maintenancecount"}
        else:
            res = mongoq.maintenance_count("Press030",from_date)
            return {"query": str(res), "labels": entities, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "maintenancecount"}
    else:
        return {"query": "NOTHING", "labels": labels, "graphOverlay": False, "textcatLabels": textcat_labels, "mongoTextcat": ""}

def from_train_data(data):
    query = ""
    question = data["question"]
    entities = data["entities"]
    machines = [question[entity["start"]:entity["end"]] for entity in entities if entity["tag"]=="MACH"]
    components = [question[entity["start"]:entity["end"]] for entity in entities if entity["tag"]=="COMP"]
    sensors = [question[entity["start"]:entity["end"]] for entity in entities if entity["tag"]=="SENS"]
    values = [question[entity["start"]:entity["end"]] for entity in entities if entity["tag"]=="VALUE"]
    ranges = [question[entity["start"]:entity["end"]] for entity in entities if entity["tag"]=="RANGE"]

    # db part of the query
    if(len(machines) > 0):
        query = query + "from(bucket: {})".format("\"" + machines[0] + "\"")
    else:
        query = query + "from(bucket: \\{})".format("\"" + "nlp_sample" + "\\" + "\"")

    # range part of the query
    if(len(ranges) > 0):
        which_date = ranges[0]
        for token in source_nlp(ranges[0]):
            # if there is numerical value, get its head in dependency tree. e.g. 7-->days
            # print(token.text, token.pos_)
            if(token.pos_ == "NUM"):
                which_date = token.text + token.head.text
        date = dateparser.parse(which_date)
        # print("date:",date, which_date)
        if(date):
            year = date.year
            month = "0" + str(date.month) if date.month < 10 else date.month
            day = "0" + str(date.day) if date.day < 10 else date.day
            hour = "0" + str(date.hour) if date.hour < 10 else date.hour
            minute = "0" + str(date.minute) if date.minute < 10 else date.minute
            second = "0" + str(date.second) if date.second < 10 else date.second
            query_date = "{}-{}-{}T{}:{}:{}Z".format(year, month, day, hour, minute, second)
            query = query + "|> range(start: {})".format(query_date)
        else:
            print("we need a default range query")
    
    # component part of the query
    comp_temp = ""
    for i in range(len(components)):
        if(i != len(components)-1):
            comp_temp = comp_temp + " r._measurement == \\{} or".format("\"" + components[i] + "\\" + "\"")
        else:
            comp_temp = comp_temp + " r._measurement == \\{}".format("\"" + components[i] + "\\" + "\"")
        
    if(len(comp_temp) > 0):
        query = query + "|> filter(fn: (r) => {} )".format(comp_temp)

    # sensor part of the query
    sens_temp = ""
    for i in range(len(sensors)):
        if(i != len(sensors)-1):
            sens_temp = sens_temp + " r._field == {} or".format("\"" + sensors[i] + "\"")
        else:
            sens_temp = sens_temp + " r._field == {}".format("\"" + sensors[i] + "\"")
        
    if(len(sens_temp) > 0):
        query = query + "|> filter(fn: (r) => {} )".format(sens_temp)

    # get value comparisons
    values_query = []
    for ent in values:
        ent = source_nlp(ent)
        poses = [ent for token in ent if token.pos_=="CCONJ"]
        print("has conjunction:", poses)
        if len(poses) > 0:
            nums = [token.text for token in ent if token.pos_=="NUM"]
            print("nums are:", nums)
            big_num = max(int(nums[0]), int(nums[1]))
            small_num = min(int(nums[0]), int(nums[1]))
            sm_query = "> {}".format(small_num)
            values_query.append(sm_query)
            bn_query = "< {}".format(big_num)
            values_query.append(bn_query)
        else:
            for match_id, start, end in matcher(ent):
                # bunun yerine sadece num u bul ve matchden çıkanla birleştir yapılabilir sanki daha iyi
                # print(start, end, ent[start: end])
                string_id = nlp.vocab.strings[match_id]  # Get string representation
                replacement = comparisons[string_id]
                if(start == 0):
                    # new_one = nlp.make_doc(f"{replacement} " + ent[-1].text)
                    new_one = f"{replacement} " + ent[-1].text
                else: 
                    # new_one = nlp.make_doc(ent[:start].text + f"{replacement} " + ent[-1].text)
                    # print(new_one)
                    new_one = ent[:start].text + f"{replacement} " + ent[-1].text
                values_query.append(new_one)
    # print(values)
    temp = ""
    for i in range(len(values_query)):
        if(i != len(values_query)-1):
            temp = temp + " r._value {} and".format(values_query[i])
        else:
            temp = temp + " r._value {}".format(values_query[i])
    # for value in values:
    #     temp = temp + " r._value {}".format(value)
    if(len(temp) > 0):
        query = query + "|> filter(fn: (r) => {} )".format(temp)
    return {"query": query}

def check_in_training_data(question):
    exist = mongo.machinaide.nlp_questions.find_one({"question": question})
    if(exist):
        # send annotations to create query from annotations
        if(category_parse(exist["cat"]) == 'influxdb'):
            data = from_train_data(exist)
        elif(category_parse(exist["cat"]) == 'mongodb'):
            data = mongo_query(exist)
        return {"exists":True, "query":data["query"], "labels": exist["entities"], "cat": exist["cat"], "mongoTextcat": exist["mongoTextcat"] }
    else:
        # tell that model should create the query
        return {"exists":False}

def category_parse(cat):
    if(cat == "Sensor data"):
        return "influxdb"
    elif(cat == "Metadata"):
        return "mongodb"
        
def template_parse(temp):
    if(temp == "Maintenance"):
        return "maintenance"
    elif(temp == 'Maintenance Count'):
        return 'maintenancecount'
    elif(temp == 'Failure'):
        return 'failure'
    elif(temp == 'Failure Count'):
        return 'failure'

@app.route('/postQuestion', methods=['POST'])
def post_question():
    # check if any comparison symbols are used
    question = request.json["question"]

    for symbol in math_symbols:
        if(symbol in question):
            # print(symbol)
            question = question.replace(symbol, math_symbol_dict[symbol])
    # print("Q------------------>", question)

    # misspel corrections
    question = question.split()
    misspelled = spell.unknown(question)
    print("misspelled before: ", misspelled)

    # remove comp/later other names too from misspelled list
    for misspelled_word in misspelled.copy():
        if(misspelled_word in COMP_NAMES):
            misspelled.remove(misspelled_word)
        else:
            score = process.extract(misspelled_word, COMP_NAMES, limit=1)
            if(len(score)>0 and score[0][1]>threshold):
                # TODO: correct the misspelled word in the question
                misspelled.remove(misspelled_word)
    print("misspelled after: ", misspelled)

    is_question_fixed = False
    words = question
    for word in misspelled:
        # Get the one `most likely` answer
        if(word != spell.correction(word)): 
            print(word,"-->", spell.correction(word))
            is_question_fixed = True
            words = [spell.correction(word) if old_word==word else old_word for old_word in words.copy()]
    print(words)
    for index, word in enumerate(words):
        if(word in COMP_NAMES):
            continue
        else:
            score = process.extract(word, COMP_NAMES, limit=1)
            if(len(score)>0 and score[0][1]>threshold):
                words[index] = score[0][0]

    fixed_question = ' '.join(words)
    print("fixed ", fixed_question)
    # replace double spaces with one space
    fixed_question = fixed_question.replace('  ', ' ')
    
    in_mongodb = check_in_training_data(fixed_question)
    if(in_mongodb["exists"]):
        print("from mongo data ---- ", in_mongodb["query"])
        query_result = in_mongodb["query"]
        labels = in_mongodb["labels"]
        textcat_labels = [category_parse(in_mongodb["cat"])]
        mongo_template = template_parse(in_mongodb["mongoTextcat"])
        graph_overlay = False # TODO: create min/max check for training data 
    else:
        print("get result from model")
        # ner part
        doc = nlp(fixed_question)
        result = createQuery(doc, matcher, stat_matcher)
        query_result = result["query"]
        labels = result["labels"]
        textcat_labels = result["textcatLabels"]
        mongo_template = result["mongoTextcat"]
        graph_overlay = result["graphOverlay"]
        print("from nlp-----> ", query_result)
        
    if(textcat_labels[0] == "influxdb"):
        # payload = "{\"query\": \"from(bucket: \\\"nlp_sample\\\")|> range(start: 2021-03-04T13:42:06Z)|> filter(fn: (r) =>  r._measurement == \\\"sampleComp1\\\" )|> filter(fn: (r) =>  r._value > 4 and r._value < 77 )\",\"type\": \"flux\"}"
        payload2 = "{\"query\": \"" + query_result + "\",\"type\": \"flux\"}"
        # print("*** ", payload)
        print("-- ", payload2)
        url = "http://localhost:8086/api/v2/query?orgID=" + orgID #d572bde16b31757c"
        headers = {'Authorization': 'Token '+dbtoken,'Content-Type': 'application/json'}
        api_response = requests.request('POST', url, headers=headers, data=payload2)
        
        if('json' in api_response.headers.get('Content-Type')):
            print(api_response.json())
            return jsonify(error=api_response.json()["message"], entities=labels, fixedQuestion=fixed_question, isFixed=is_question_fixed, graphOverlay=False, textcatLabels=textcat_labels)
        if(api_response.text):
            """ lines = api_response.text.split('\r\n')
            data = []
            print("lines? ",len(lines), lines)
            for line in lines:
                if(line != ''):
                    data.append(line.split(','))
            sensor_index = -1
            component_index = -1
            for i in range(0, len(data[0])):
                if(data[0][i] == '_field'):
                    sensor_index = i
                if(data[0][i] == '_measurement'):
                    component_index = i

            send_data = {"components": [], "sensors": []}
            for j in range(1, len(data)):
                if(sensor_index != -1):
                    send_data['sensors'].append(data[j][sensor_index])
                if(component_index != -1):
                    send_data['components'].append(data[j][component_index])

            print("data: ", send_data)
            return jsonify(result=send_data) """
            return jsonify(query=query_result, data=api_response.text, entities=labels, fixedQuestion=fixed_question, isFixed=is_question_fixed, graphOverlay=graph_overlay, textcatLabels=textcat_labels, mongoTextcat=mongo_template)
        else:
            return jsonify(msg="No response", entities=labels, fixedQuestion=fixed_question, isFixed=is_question_fixed, graphOverlay=graph_overlay, textcatLabels=textcat_labels, mongoTextcat=mongo_template)
    elif(textcat_labels[0] == "mongodb"):
        # print("result of mongo textcat-->", result["mongoTextcat"])
        return jsonify(query=query_result,data="mongo-data", entities=labels, fixedQuestion=fixed_question, isFixed=is_question_fixed, graphOverlay=graph_overlay, textcatLabels=textcat_labels, mongoTextcat=mongo_template)

@app.route('/postTrainData', methods=['PUT'])
def postTrainData():
    res = mongo.machinaide.nlp_questions.update_one({"question": request.json['question']}, {"$set": {"entities": request.json["entities"], "cat": request.json["cat"], "mongoTextcat": request.json["mongoTextcat"]}}, upsert=True)
    return jsonify(msg="Train data added.")
    """ exist = mongo.db.nlp_questions.find_one({"question": request.json['question']})
    if(exist):
        return jsonify(msg="This question is already exist in train data.")
    else:
        mongo.db.nlp_questions.insert_one(request.json)
        return jsonify(msg="Train data added.") """

@app.route('/sampleQuery', methods=['GET'])
def sample_query():
    url = "http://localhost:8086/api/v2/query?orgID=d572bde16b31757c"

    payload="{\"query\": \"from(bucket: \\\"nlp_sample\\\")|> range(start: -1h)|> filter(fn: (r) => r._measurement == \\\"cpu\\\" )\",\"type\": \"flux\"\r\n}"
    headers = {
    'Authorization': 'Token 1R2BL-i8752-arl1RkvHL2_4Av9A_v_EcrEoCM0uWGriJ9sFlhA3tOvG-F-OnSA5xgW3u3Em1G-wfVeOLrQtKQ==',
    'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)
    return response.text

@app.route('/testAPI', methods=['GET'])
def testAPI():
    res = dumps(mongo.machinaide.nlp_questions.find())
    # res = dumps(mongo.machinaide.failures.find())
    print(res)
    return jsonify(msg="Working", res=res)

if __name__ == '__main__':
    print("NLP server started running")
    app.run(debug=True, port=7777)


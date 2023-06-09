from core.database.MongoDB import MongoDB
from core.nlp.Helper import Helper
import dateparser
from core.nlp.NLPStarter import source_nlp, matcher, stat_matcher, nlp, mongo_textcat_nlp
import datetime
import config
from bson.json_util import dumps

class MongoManager():
    def __init__(self):
        self.db = MongoDB()
        self.helper = Helper()
        self.collection = "nlp_questions"

    def is_question_exist(self, question):
        where = {
            "question": question
        }

        return self.helper.cursor_to_json(self.db.find(self.collection, where))

    def get_sources_from_maintenance(self, from_date, type = []):
        now = datetime.datetime.now()
        maintenance_records = self.db.find("maintenance")

        if(len(type) == 0):
            type = config.parts["all_maintenance_types"]
        maintenances = [maintenance for maintenance in maintenance_records if(maintenance["maintenanceType"] in type)]

        if(from_date != ""):
            res = [maintenance["asset"] for maintenance in maintenances if (datetime.datetime.strptime(maintenance["date"], "%Y-%m-%dT%H:%M:%S.000Z")>from_date and datetime.datetime.strptime(maintenance["date"], "%Y-%m-%dT%H:%M:%S.000Z")<now)]
        else:
            res = [maintenance["asset"] for maintenance in maintenances]
        res = list(dict.fromkeys(res))
        return res

    def get_sources_from_failures(self, from_date, to_date, severity = []):
        failure_records = self.helper.cursor_to_json(self.db.find("failures"))

        if(len(severity) == 0):
            severity = config.parts["all_severity_types"]
        failures = [failure for failure in failure_records if(failure["severity"] in severity)]

        res = []

        if(from_date != ""):
            for failure in failures:
                # print("failure time: ", failure["startTime"])
                if(datetime.datetime.strptime(failure["startTime"], "%Y-%m-%dT%H:%M:%S.000Z")>from_date):
                    if(failure["endTime"] == ""):
                        res.append(failure["sourceName"])
                    else:
                        if(datetime.datetime.strptime(failure["endTime"], "%Y-%m-%dT%H:%M:%S.000Z")<to_date):
                            res.append(failure["sourceName"])
        else:
            res = [failures["sourceName"] for failure in failures]
        res = list(dict.fromkeys(res))
        return dumps(res)

    def maintenance_count(self, sources, time, type = []):
        query = []
        now = datetime.datetime.now()

        for source in sources:
            search_source = ".*" + source + ".*"
            query.append({"asset": {"$regex": search_source}})
        maintenances = self.helper.cursor_to_json(self.db.find("maintenance", {"$or": query}))

        if(len(type) == 0):
            type = config.parts["all_maintenance_types"]
        maintenance_records = [maintenance for maintenance in maintenances if(maintenance["maintenanceType"] in type)]

        if(time != ""):
            time = datetime.datetime.now() - datetime.timedelta(days=1)
            maintenance_count = [maintenance["asset"] for maintenance in maintenances if (datetime.datetime.strptime(maintenance["date"], "%Y-%m-%dT%H:%M:%S.000Z")<now)]
        else:
            maintenance_count = [maintenance["asset"] for maintenance in maintenances if (datetime.datetime.strptime(maintenance["date"], "%Y-%m-%dT%H:%M:%S.000Z")<now)]
        return len(maintenance_count)

    def failure_count(self, sources, from_date, to_date, severity = []):
        query = []
        for source in sources:
            search_source = ".*" + source + ".*"
            print("source: ", search_source)
            query.append({"sourceName": {"$regex": search_source}})

        if(to_date == ""):
            to_date = datetime.datetime.now()

        failures = self.db.find("failures", {"$or": query}) 
        if(len(severity) == 0):
            severity = config.parts["all_severity_types"]
        failure_records = [failure for failure in failures if(failure["severity"] in severity)]

        failure_count = []
        if(from_date != ""):
            for failure in failure_records:
                if(datetime.datetime.strptime(failure["startTime"], "%Y-%m-%dT%H:%M:%S.000Z")>from_date):
                    if(failure["endTime"] == ""):
                        failure_count.append(failure)
                    else:
                        if(datetime.datetime.strptime(failure["startTime"], "%Y-%m-%dT%H:%M:%S.000Z")<to_date):
                            failure_count.append(failure)
        else:
            failure_count = [failure for failure in failure_records]
        return len(failure_count)

    def completed_job(self, sources, from_date, to_date):
        query = []
        for source in sources:
            search_source = ".*" + source + ".*"
            query.append({"machineID": {"$regex": search_source}})

        print("query", query)
        completed_job = self.helper.cursor_to_json(self.db.find("machine_actions", {"$or": query})) 

        if(to_date == ""):
            to_date = datetime.datetime.now()

        print(len(completed_job))

        job_count = []
        if(from_date != ""):
            for job in completed_job:
                if(datetime.datetime.strptime(job["startTime"], "%Y-%m-%dT%H:%M:%S.000Z") > from_date):
                    if(job["endTime"] == ""):
                        job_count.append(job)
                    else:
                        if(datetime.datetime.strptime(job["endTime"], "%Y-%m-%dT%H:%M:%S.000Z") < to_date):
                            job_count.append(job)
        else:
            job_count = [job for job in completed_job]
        return len(job_count)
        
    def mongo_query(self, data, fixed_question):
        doc = nlp(fixed_question)
        textcat = nlp.get_pipe("textcat")
        scores = textcat.predict([doc])
        predicted_labels = scores.argmax(axis=1)
        textcat_labels = [textcat.labels[label] for label in predicted_labels]
        labels = [{"tag": ent.label_ , "start": ent.start_char, "end": ent.end_char, "thing": ent.text} for ent in doc.ents]


        textcat_labels = ['mongodb']
        question = data["question"]
        entities = data["entities"]
        temp =""

        print("data", data)
        print("temp previous", data["mongoTextcat"])

        if(data["mongoTextcat"]):
            temp = self.helper.template_parse(data["mongoTextcat"])
        
        source_entities = [question[entity["start"]:entity["end"]] for entity in entities if (entity["tag"]=="MACH" or entity["tag"]=="COMP" or entity["tag"]=="SENS")]
        range_entities = [question[entity["start"]:entity["end"]] for entity in entities if entity["tag"]=="RANGE"]

        from_date = ""
        to_date = dateparser.parse("now")
        
        if(len(range_entities) > 0):
            if(len(range_entities) == 1):
                which_date = range_entities[0]
                date2 = which_date

                for token in source_nlp(range_entities[0]):
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

        print("temp", temp)

        if(temp == "failure"):
            res = self.get_sources_from_failures(from_date, to_date)
            res = ", ".join(res)
            return {"query": res, "labels": entities, "graphOverlay": False, "textcatLabels": textcat_labels, "mongoTextcat": "failure"}
        elif(temp == "maintenance"):
            res = self.get_sources_from_maintenance(from_date)
            res = ", ".join(res)
            return {"query": res, "labels": entities, "graphOverlay": False, "textcatLabels": textcat_labels, "mongoTextcat": "maintenance"}
        elif(temp == "failurecount"):
            # TODO check if these source names are in the given source names array, if not just throw them away
            if(len(source_entities)>0):
                res = self.failure_count(source_entities, from_date, to_date)
                return {"query": str(res), "labels": entities, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "failurecount"}
            else:
                res = self.failure_count("Press031", from_date, to_date)
                return {"query": str(res), "labels": entities, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "failurecount"}
        elif(temp == "maintenancecount"):
            # TODO check if these source names are in the given source names array, if not just throw them away
            if(len(source_entities)>0):
                res = self.maintenance_count(source_entities, from_date)
                return {"query": str(res), "labels": entities, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "maintenancecount"}
            else:
                res = self.maintenance_count("Press030",from_date)
                return {"query": str(res), "labels": entities, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "maintenancecount"}
        elif(temp == 'completed_job'):
            res = self.completed_job(source_entities, from_date, to_date)
            return {"query": str(res), "labels": entities, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "completed_job"}
        else:
            return {"query": "NOTHING", "labels": labels, "graphOverlay": False, "textcatLabels": textcat_labels, "mongoTextcat": ""}

    def create_query(self, question, textcat_labels, labels):
         # get range
        doc = nlp(question)
        range_entities = [ent for ent in doc.ents if ent.label_ == "RANGE"]

        from_date = ""
        to_date = dateparser.parse("now")
        if(len(range_entities) > 0):
            if(len(range_entities) == 1):
                which_date = range_entities[0].text
                date2 = which_date
                for token in range_entities[0]:
                    # if there is numerical value, get its head in dependency tree. e.g. 7-->days
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
        print("mongo_textcat", scores)
        predicted_labels = scores.argmax(axis=1)
        textcat_labels_mongo = [mongo_textcat.labels[label] for label in predicted_labels]

        print("textcat_labels_mongo", textcat_labels_mongo[0])

        if(textcat_labels_mongo[0] == "failure"):
            severities = [ent.text for ent in doc.ents if (ent.label_ == "SVR")]
            severity_entities = [ent for ent in severities if(ent in config.parts["all_severity_types"])]
            res = self.get_sources_from_failures(from_date, to_date, severity_entities)
            res = res.replace("[", "")
            res = res.replace("]", "")
            res = res.replace('"', "")
            return {"query": res, "labels": labels, "graphOverlay": False, "textcatLabels": textcat_labels, "mongoTextcat": "failure"}
        elif(textcat_labels_mongo[0] == "maintenance"):
            mtypes = [ent.text for ent in doc.ents if (ent.label_ == "MTYPE")]
            mtype_entities = [ent for ent in mtypes if(ent in config.parts["all_maintenance_types"])]
            res = self.get_sources_from_maintenance(from_date, mtype_entities)
            res = ", ".join(res)
            return {"query": res, "labels": labels, "graphOverlay": False, "textcatLabels": textcat_labels, "mongoTextcat": "maintenance"}
        elif(textcat_labels_mongo[0] == "failurecount"):
            source_entities = [ent.text for ent in doc.ents if (ent.label_ == "MACH" or ent.label_ == "COMP" or ent.label_ == "SENS")]

            severities = [ent.text for ent in doc.ents if (ent.label_ == "SVR")]
            severity_entities = [ent for ent in severities if(ent in config.parts["all_severity_types"])]

            if(len(source_entities)>0):
                res = self.failure_count(source_entities, from_date, to_date, severity_entities)
                return {"query": str(res), "labels": labels, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "failurecount"}
            else:
                res = self.failure_count(["Press031"], from_date, to_date, severity_entities)
                return {"query": str(res), "labels": labels, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "failurecount"}
        elif(textcat_labels_mongo[0] == "maintenancecount"):
            # TODO check if these source names are in the given source names array, if not just throw them away
            source_entities = [ent.text for ent in doc.ents if (ent.label_ == "MACH" or ent.label_ == "COMP" or ent.label_ == "SENS")]
            mtypes = [ent.text for ent in doc.ents if (ent.label_ == "MTYPE")]
            mtype_entities = [ent for ent in mtypes if(ent in config.parts["all_maintenance_types"])]

            if(len(source_entities)>0):
                res = self.maintenance_count(source_entities, from_date, mtype_entities)
                return {"query": str(res), "labels": labels, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "maintenancecount"}
            else:
                res = self.maintenance_count(["Press030"],from_date, mtype_entities)
                return {"query": str(res), "labels": labels, "graphOverlay": True, "textcatLabels": textcat_labels, "mongoTextcat": "maintenancecount"}
        else:
            return {"query": "NOTHING", "labels": labels, "graphOverlay": False, "textcatLabels": textcat_labels, "mongoTextcat": ""}

    def post_train_data(self, payload):
        updateData = {
            '$set': {
                "entities": payload["entities"], 
                "cat": payload["cat"], 
                "mongoTextcat": payload["mongoTextcat"]
            }
        }

        where = {
            "question": payload['question']
        }

        return self.db.update_one(self.collection, updateData, where)

    def get_questions(self):
        return self.helper.cursor_to_json(self.db.find(self.collection))
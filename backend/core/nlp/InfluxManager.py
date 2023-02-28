from core.nlp.NLPStarter import source_nlp, matcher, stat_matcher, nlp, mongo_textcat_nlp
import dateparser
import datetime
import config
from fuzzywuzzy import process 

class InfluxManager():
    def format_date(self, date):
        year = date.year
        month = "0" + str(date.month) if date.month < 10 else date.month
        day = "0" + str(date.day) if date.day < 10 else date.day
        hour = "0" + str(date.hour) if date.hour < 10 else date.hour
        minute = "0" + str(date.minute) if date.minute < 10 else date.minute
        second = "0" + str(date.second) if date.second < 10 else date.second
        query_date = "{}-{}-{}T{}:{}:{}Z".format(year, month, day, hour, minute, second)
        return query_date

    def create_query(self, question, textcat_labels, labels):
        query = ""
        doc = nlp(question)

        # get the db/bucket
        machine_entities = [ent for ent in doc.ents if ent.label_ == "MACH"]

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
                    if(token.pos_ == "NUM"):
                        date2 = token.text + token.head.text
                date = dateparser.parse(date2)
                if(not date):
                    date = dateparser.parse(which_date)
                if(date):
                    query_date = self.format_date(date)
                    query = query + "|> range(start: {})".format(query_date)
                else:
                    query = query + "|> range(start: -1h)"
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
        
        # get components/measurements
        comp_entities = [ent for ent in doc.ents if ent.label_ == "COMP"]
        comps = []
        for ent in comp_entities:
            comp_name = ""
            if(ent.text in config.parts["COMP_NAMES"]):
                comp_name = ent.text
                comps.append(comp_name)
            else:
                res = process.extract(ent.text, config.parts["COMP_NAMES"], limit=1)
                # for now we get the best result but we need to set a score threshold
                if(len(res)>0 and res[0][1] > config.constants["threshold"]):
                    comp_name = res[0][0]
                    comps.append(comp_name)
        comp_temp = ""
        #eliminate duplicates
        comps = list(dict.fromkeys(comps))
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
                if(len(res)>0  and res[0][1] > config.constants["threshold"]):
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
            if len(poses) > 0:
                nums = [token.text for token in ent if token.pos_=="NUM"]
                big_num = max(int(nums[0]), int(nums[1]))
                small_num = min(int(nums[0]), int(nums[1]))
                sm_query = "> {}".format(small_num)
                values.append(sm_query)
                bn_query = "< {}".format(big_num)
                values.append(bn_query)
            else:
                for match_id, start, end in matcher(ent):
                    # bunun yerine sadece num u bul ve matchden çıkanla birleştir yapılabilir sanki daha iyi
                    string_id = nlp.vocab.strings[match_id]  # Get string representation
                    replacement = config.math["comparisons"][string_id]
                    if(start == 0):
                        # new_one = nlp.make_doc(f"{replacement} " + ent[-1].text)
                        new_one = f"{replacement} " + ent[-1].text
                    else: 
                        # new_one = nlp.make_doc(ent[:start].text + f"{replacement} " + ent[-1].text)
                        new_one = ent[:start].text + f"{replacement} " + ent[-1].text
                    values.append(new_one)
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
            graph_overlay = True
            string_id = nlp.vocab.strings[match_id]
            replacement = config.math["stats"][string_id]
            stat_temp = "|> {}".format(replacement)
            break
        
        if(len(stat_temp) > 0):
            query = query + stat_temp

        return {"query": query, "labels": labels, "graphOverlay": graph_overlay, "textcatLabels": textcat_labels, "mongoTextcat": ""}

    def from_train_data(self, data):
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
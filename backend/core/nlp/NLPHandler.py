from core.nlp.NLPStarter import nlp, matcher, stat_matcher
from core.nlp.MongoManager import MongoManager
from core.nlp.InfluxManager import InfluxManager
from core.nlp.Helper import Helper

class NLPHandler():
    def __init__(self):
        self.mongoManager = MongoManager()
        self.influxManager = InfluxManager()
        self.helper = Helper()

    def create_query(self, fixed_question):
        doc = nlp(fixed_question)
        textcat = nlp.get_pipe("textcat")
        scores = textcat.predict([doc])
        predicted_labels = scores.argmax(axis=1)
        textcat_labels = [textcat.labels[label] for label in predicted_labels]
        labels = [{"tag": ent.label_ , "start": ent.start_char, "end": ent.end_char, "thing": ent.text} for ent in doc.ents]

        print("create_query", textcat_labels[0])

        if (textcat_labels[0] == 'mongodb'):
            return self.mongoManager.create_query(fixed_question, textcat_labels, labels)
        elif (textcat_labels[0] == 'influxdb'):
            return self.influxManager.create_query(fixed_question, textcat_labels, labels)
        else:
            return {"query": "NOTHING", "labels": labels, "graphOverlay": False, "textcatLabels": textcat_labels}

    def check_in_training_data(self, question):
        exist = self.mongoManager.is_question_exist(question)

        if(exist):
            # send annotations to create query from annotations
            exist = exist[0]
            parsed_category = self.helper.category_parse(exist["cat"])

            if(parsed_category == 'influxdb'):
                data = self.influxManager.from_train_data(exist)
            elif(parsed_category == 'mongodb'):
                data = self.mongoManager.mongo_query(exist, question)

            return {
                "exists":True, 
                "query":data["query"], 
                "labels": exist["entities"], 
                "cat": exist["cat"], 
                "mongoTextcat": exist["mongoTextcat"] 
            }
        else:
            # tell that model should create the query
            return {"exists":False}
    
    def word_frequency(self):
        questions = self.mongoManager.get_questions()

        word_list = []
        word_freq = []
        for question in questions:
            word_list = word_list + question["question"].split()
        
        for word in word_list:
            word_freq.append(word_list.count(word))

        print(len(word_list))
        print(len(word_freq))
        word_freq_dict = {}
        for i in range(len(word_list)):
            word_freq_dict[word_list[i].lower()] = word_freq[i]


        # word_freq = str(list(zip(word_list, word_freq)))

        return {
            "word_frequency": word_freq_dict, 
            "total_word": len(word_list)
        }
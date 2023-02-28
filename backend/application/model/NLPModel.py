from core.database.MongoDB import MongoDB
from bson.json_util import loads, dumps
import json
from application.helpers.Helper import cursor_to_json

class NLPModel():
    def __init__(self):
        self.db = MongoDB()
        self.collection = "nlp_questions"

    def get_questions(self, columns):
        return cursor_to_json(self.db.find_by_columns(self.collection, {}, columns))
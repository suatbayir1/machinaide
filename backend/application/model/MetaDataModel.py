from core.database.MongoDB import MongoDB
import config

class MetaDataModel():
    def __init__(self):
        self.db = MongoDB()
    
    def get_basic_models(self, filter={}):
        return self.db.find("basic_models", filter)
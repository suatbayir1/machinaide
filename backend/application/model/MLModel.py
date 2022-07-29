from core.database.MongoDB import MongoDB
import config

class MLModel():
    def __init__(self):
        self.db = MongoDB()
    
    def get_automl_settings(self, filter={}):
        return self.db.find_one("automl_settings", filter)

    def post_automl_settings(self, setting):
        return self.db.insert_one("automl_settings", setting)

    def update_automl_settings(self, where, set_part):
        return self.db.update_one("automl_settings", set_part, where, upsert=False)

    def get_experiment(self, filter={}):
        return self.db.find_one("experiments", filter)

    def post_task(self, task):
        return self.db.insert_one("tasks", task)

    def get_tasks(self):
        return self.db.find("tasks")
    
    def post_experiment(self, settings):
        return self.db.insert_one("experiments", settings)

    def update_experiment(self, where, set_part):
        return self.db.update_one("experiments", set_part, where, upsert=False)
    
    def update_ml_model(self, where, set_part):
        return self.db.update_one("basic_models", set_part, where, upsert=False)
    
    def post_ml_model(self, data):
        return self.db.insert_one("basic_models", data)
    
    def get_ml_models(self, filter={}):
        return self.db.find("basic_models", filter)
    
    def get_model_logs(self, filter={}):
        return self.db.find("model_logs", filter)
    
    def post_model_logs(self, model_logs_object):
        return self.db.insert_one("model_logs", model_logs_object)

    def update_model_log(self, where, log):
        return self.db.update_one("model_logs", log, where, upsert=False)
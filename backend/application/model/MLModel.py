from core.database.MongoDB import MongoDB
import config

class MLModel():
    def __init__(self):
        self.db = MongoDB()
    
    def get_settings(self, filter={}):
        return self.db.find_one("settings", filter)

    def post_settings(self, setting):
        return self.db.insert_one("settings", setting)

    def update_settings(self, where, set_part):
        return self.db.update_one("settings", set_part, where, upsert=False)

    def get_experiment(self, filter={}):
        return self.db.find_one("experiments", filter)

    def post_task(self, task):
        return self.db.insert_one("tasks", task)

    def get_tasks(self):
        return self.db.find("tasks")
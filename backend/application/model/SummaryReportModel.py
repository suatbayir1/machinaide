from core.database.MongoDB import MongoDB
import config

class SummaryReportModel():
    def __init__(self):
        self.db = MongoDB()
    
    def get_failures(self, filter={}):
        return self.db.find("failures", filter)
    
    def get_maintenance_records(self, filter={}):
        return self.db.find("maintenance", filter)
    
    def get_isemri_records(self, filter={}):
        return self.db.find("isemri", filter)
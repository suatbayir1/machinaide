from influxdb_client import InfluxDBClient

class QueryHelper:
    def __init__(self, settings):
        self.url = settings['url']
        self.token = settings['token']
        self.org = settings["org"]
        self.client = InfluxDBClient(url=self.url, token=self.token, org=self.org, verify_ssl = False) 
        self.query_api = self.client.query_api()
    
    def query_db(self, query):
        res = self.query_api.query(org=self.org, query=query)
        return res
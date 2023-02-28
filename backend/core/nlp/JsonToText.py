class JsonToText():
    def return_response(self, labels, mongo_template, query_result):
        if not labels:
            labels = ""

        print("mongo_template", mongo_template)
        
        if mongo_template == "failurecount":
            return self.failurecount(labels, query_result)
        elif mongo_template == "maintenancecount":
            return self.maintenancecount(labels, query_result)
        elif mongo_template == "maintenance":
            return self.maintenance(labels, query_result)
        elif mongo_template == "failure":
            return self.failure(labels, query_result)
        elif mongo_template == "completed_job":
            return self.completed_job(labels, query_result)
        else:
            return f"No results found matching your criteria"

    def maintenance(self, labels, query_result):
        try:
            if 'thing' not in labels[0]:
                labels[0]['thing'] = ""

            if len(labels) == 1:
                return f"No maintenance records were found between the specified criteria."

            return f"{query_result} has maintenance {labels[0]['thing']} the {labels[1]['thing']}"
        except:
            return f"No results found matching your criteria"

    def failurecount(self, labels, query_result):
        try:
            return f"There are {int(query_result)} failure records in {labels[0]['thing']}"
        except:
            return f"No results found matching your criteria"

    def maintenancecount(self, labels, query_result):
        try:
            time_range = ""
            machine = ""

            for label in labels:
                if 'thing' in label:
                    if label['tag'] == 'RANGE':
                        time_range = label['thing']
                    elif label['tag'] == 'MACH':
                        machine = label['thing']
                        
            return f"There are {int(query_result)} maintenance records in {time_range} in the {machine}"
        except:
            return f"No results found matching your criteria"

    def failure(self, labels, query_result):
        try:
            return f"{query_result} has failure in the {labels[0]['thing']}"
        except:
            return f"No results found matching your criteria"
    
    def completed_job(self, labels, query_result):
        try:
            print("labels", labels)
            print("query_result", query_result)
            return f"A total of {query_result} job have been completed"
        except:
            return f"No results found matching your criteria"
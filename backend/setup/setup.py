import pymongo
import pandas as pd

class Setup:
    def __init__(self):
        self.xls = pd.ExcelFile('ermetal_setup.xls')
        client = pymongo.MongoClient('mongodb://machinaide:erste2020@localhost:27017/machinaide?authSource=admin')
        self.db = client.machinaide
        self.dt = []

    def iterate_sheets(self):
        for sheet in self.xls.sheet_names:
            df = pd.read_excel(self.xls, sheet)
            
            methods = {
                "Factory": self.add_factory,
                "ProductionLine": self.add_production_line,
                "Machine": self.add_machine,
                "Component": self.add_component,
                "Sensor": self.add_sensor,
                "Field": self.add_field
            }

            chosen_method = methods.get(sheet, self.invalid_operation)

            chosen_method(df)
    
    def add_factory(self, params):
        for index, row in params.iterrows():
            factory = {
                "id": row["name"],
                "description": row["description"],
                "factoryName": row["displayName"],
                "name": row["name"],
                "photoUrl": row["photo_url"],
                "location": row["location"],
                "type": "Factory",
                "productionLines": [],
                "bucket": ""
            }
            
            self.dt.append(factory)

    def add_production_line(self, params):
        for index, row in params.iterrows():
            for factory in self.dt:
                if factory["name"] == row["parent_id"]:
                    pl = {
                        "@id": row["name"],
                        "type": "ProductionLine",
                        "parent": row["parent_id"],
                        "displayName": row["displayName"],
                        "description": row["description"],
                        "name": row["name"],
                        "photoUrl": row["photo_url"],
                        "machines": []
                    }

                    factory["productionLines"].append(pl)
        
    def add_machine(self, params):
        for index, row in params.iterrows():
            for factory in self.dt:
                for pl in factory["productionLines"]:
                    if pl["name"] == row["parent_id"]:
                        machine = {
                            "@id": row["name"],
                            "name": row["name"],
                            "type": "Machine",
                            "parent": row["parent_id"],
                            "@type": "Interface",
                            "displayName": row["displayName"],
                            "description": row["description"],
                            "photoUrl": row["photo_url"],
                            "contents": [],
                            "measurements": []
                        }

                        pl["machines"].append(machine)
    
    def add_component(self, params):
        for index, row in params.iterrows():
            for factory in self.dt:
                for pl in factory["productionLines"]:
                    for machine in pl["machines"]:
                        if machine["name"] == row["parent_id"]:
                            component = {
                                "@id": row["name"],
                                "@type": "Component",
                                "name": row["name"],
                                "displayName": row["displayName"],
                                "description": row["description"],
                                "type": "Component",
                                "parent": row["parent_id"],
                                "sensors": [],
                                "visual": ""
                            }

                            machine["contents"].append(component)

    def add_sensor(self, params):
        for index, row in params.iterrows():
            for factory in self.dt:
                for pl in factory["productionLines"]:
                    for machine in pl["machines"]:
                        for component in machine["contents"]:
                            if component["name"] == row["parent_id"]:
                                sensor = {
                                    "@type": ["Telemetry", row["type"]],
                                    "@id": row["name"],
                                    "name": row["name"],
                                    "schema": row["unit"],
                                    "type": "Sensor",
                                    "parent": row["parent_id"],
                                    "unit": row["unit"],
                                    "displayName": row["displayName"],
                                    "description": row["description"],
                                    "status": "enable",
                                    "fields": [],
                                    "visual": ""
                                }

                                component["sensors"].append(sensor)
    
    def add_field(self, params):
        for index, row in params.iterrows():
            for factory in self.dt:
                for pl in factory["productionLines"]:
                    for machine in pl["machines"]:
                        for component in machine["contents"]:
                            for sensor in component["sensors"]:
                                if sensor["name"] == row["parent_id"]:
                                    field = {
                                        "@id": row["name"],
                                        "name": row["name"],
                                        "minValue": row["minValue"],
                                        "maxValue": row["maxValue"],
                                        "type": "Field",
                                        "parent": row["parent_id"],
                                        "displayName": row["displayName"],
                                        "description": row["description"],
                                    }

                                    sensor["fields"].append(field)


    def invalid_operation(self, params):
        pass

    def insert_dt(self):
        for factory in self.dt:
            self.db.digital_twin.insert_one(factory)
    
    def add_root(self):
        root = {
            "username": "machinaide.ldp@ermetal.local",
            "role": "admin",
            "status": "active"
        }

        print(root)
        self.db.user.insert_one(root)

    def add_sections(self):
        sections = [
            {
                "factoryID" : "Ermetal",
                "name" : "Section 1",
                "icon" : "ermetal_logo.png"
            },
            {
                "factoryID" : "Ermetal",
                "name" : "Section 2",
                "icon" : "erkalip_logo.jpg"
            }
        ]

        self.db.sections.insert_many(sections)

if __name__ == '__main__':
    setup = Setup()
    # setup.iterate_sheets()
    # setup.insert_dt()
    # setup.add_root()
    # setup.add_sections()
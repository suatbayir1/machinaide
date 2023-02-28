import pymongo
import pandas as pd
import math

class Setup:
    def __init__(self):
        self.xls = pd.ExcelFile('ermetal_setup_prototype.xls')
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
                "Inter": self.add_component,
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
                "bucket": row["bucket"]
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
                        "machines": [],
                        "section": row["section"]
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
                            "measurements": row["measurements"].split(',')
                        }

                        pl["machines"].append(machine)
    
    def add_component(self, params):
        for index, row in params.iterrows():
            for factory in self.dt:
                for pl in factory["productionLines"]:
                    for machine in pl["machines"]:
                        if machine["name"] == row["parent_id"]:
                            component = {
                                "@id": row["name"].strip().replace(" ", "_").replace(".", "_"),
                                "@type": "Component",
                                "name": row["name"].strip().replace(" ", "_").replace(".", "_"),
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
                            if component["name"] == row["parent_id"].strip().replace(" ", "_").replace(".", "_"):
                                sensor = {
                                    "@type": ["Telemetry", row["type"]],
                                    "@id": f'S_{row["name"].strip().replace(" ", "_").replace(".", "_")}',
                                    "name": f'S_{row["name"].strip().replace(" ", "_").replace(".", "_")}',
                                    "schema": row["unit"],
                                    "type": "Sensor",
                                    "parent": row["parent_id"].strip().replace(" ", "_").replace(".", "_"),
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
                                if sensor["name"] == f'S_{row["parent_id"].strip().replace(" ", "_").replace(".", "_")}':
                                    field = {
                                        "@id": f'F_{row["name"].strip().replace(" ", "_").replace(".", "_")}',
                                        "name": f'F_{row["name"].strip().replace(" ", "_").replace(".", "_")}',
                                        "minValue": round(row["minValue"], 2),
                                        "maxValue": round(row["maxValue"], 2),
                                        "type": "Field",
                                        "parent": f'S_{row["parent_id"].strip().replace(" ", "_").replace(".", "_")}',
                                        "displayName": row["displayName"],
                                        "description": row["description"],
                                        "measurement": row["measurement"],
                                        "dataSource": row["dataSource"]
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

    def delete(self):
        self.db.digital_twin.delete_many({})

if __name__ == '__main__':
    setup = Setup()
    setup.delete()
    setup.iterate_sheets()
    setup.insert_dt()
    # setup.add_root()
    # setup.add_sections()
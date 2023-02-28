import argparse

from mlwrappers import POFSession
from datetime import datetime

ap = argparse.ArgumentParser()
ap.add_argument("-n", "--name", required=True, type=str, help="sensor/component/machine name")
ap.add_argument("-t", "--type", required=True, type=str, help="one of them: sensor/component/machine")
ap.add_argument("-db", "--database", required=True, type=str, help="database/machine mapping")
ap.add_argument("-g", "--groupwith", required=True, type=str, help="mean/max")
ap.add_argument("-u", "--username", required=True, type=str, help="user that started the process")
# ap.add_argument("-mn", "--modelName", required=True, type=str, help="model name given by user")
ap.add_argument("-m", "--measurement", required=False, type=str, help="measurement/component mapping")
ap.add_argument("-f", "--field", required=False, type=str, help="field/sensor mapping")

# args = vars(ap.parse_args())
args, unknown = ap.parse_known_args()
part_name = args.name 
type = args.type
groupwith = args.groupwith
database = args.database
measurement = args.measurement 
field = args.field
username = args.username
# model_name = args.modelName
now = datetime.now().timestamp()

settings = {"partName": part_name, "type": type, "groupwith": groupwith, "username": username,
            "database": database, "measurement": measurement, "field": field, "startTime": now}

pof = POFSession(settings)
pof.run()
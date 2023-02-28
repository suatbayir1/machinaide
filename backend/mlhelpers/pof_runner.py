import argparse

from kafka.consumer import group
from mlhelpers.mlwrappers import POFAutoMLSession
from datetime import datetime

ap = argparse.ArgumentParser()
ap.add_argument("-n", "--name", required=True, type=str, help="sensor/component/machine name")
ap.add_argument("-t", "--type", required=True, type=str, help="one of them: sensor/component/machine")
ap.add_argument("-db", "--database", required=True, type=str, help="database/machine mapping")
ap.add_argument("-g", "--groupwith", required=True, type=str, help="mean/max")
ap.add_argument("-u", "--username", required=True, type=str, help="user that started the process")
ap.add_argument("-mn", "--modelName", required=True, type=str, help="model name given by user")
ap.add_argument("-m", "--measurement", required=False, type=str, help="measurement/component mapping")
ap.add_argument("-f", "--field", required=False, type=str, help="field/sensor mapping")
ap.add_argument("-o", "--optimizer", required=True, type=str,
        help="Optimizer function")
ap.add_argument("-tt", "--tunerType", required=True, type=str,
        help="Tuner Type of Keras Tuner")
ap.add_argument("-nf", "--nfeatures", required=True, type=str,
        help="Number of features")
ap.add_argument("-ne", "--nepochs", required=True, type=str,
        help="Number of epochs")
ap.add_argument("-to", "--timeout", required=True, type=str,
        help="timeout of experiment")

# args = vars(ap.parse_args())
args, unknown = ap.parse_known_args()
part_name = args.name 
type = args.type
groupwith = args.groupwith
database = args.database
measurement = args.measurement 
field = args.field
username = args.username
model_name = args.modelName
tuner_type = args.tunerType
nfeatures = args.nfeatures
nepochs = int(args.nepochs)
timeout = args.timeout
optimizer = args.optimizer
now = datetime.now().timestamp()

settings = {"partName": part_name, "type": type, "groupwith": groupwith, "username": username,
            "database": database, "measurement": measurement, "field": field, "startTime": now, "modelName": model_name,
            "tuner_type": tuner_type, "nfeatures": nfeatures, "nepochs": nepochs, "optimizer": optimizer, "timeout": timeout}

pof = POFAutoMLSession(settings)
pof.run()
# pof.get_fields()
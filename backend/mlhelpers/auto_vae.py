import argparse
import json
from kafka.consumer import group
from numpy.core.arrayprint import StructuredVoidFormat
from werkzeug.wrappers import StreamOnlyMixin
from mlwrappers import VAEAutoMLSession
from datetime import datetime
from config import VAESENSORDIR
from mlutils import QueryHelper

ap = argparse.ArgumentParser()
ap.add_argument("-u", "--username", required=True, type=str, help="user that started the process")
ap.add_argument("-mn", "--modelName", required=True, type=str, help="model name given by user")
ap.add_argument("-h", "--host", required=True, type=str, help="db host")
ap.add_argument("-p", "--port", required=True, type=StructuredVoidFormat, help="db port")
ap.add_argument("-db", "--database", required=True, type=str, help="db name")
ap.add_argument("-rp", "--retention", required=True, type=str, help="db retention policy")
ap.add_argument("-sid", "--sessionid", required=True, type=str, help="sessionid")

# args = vars(ap.parse_args())
args, unknown = ap.parse_known_args()

username = args.username
model_name = args.modelName
host = args.host
port = int(args.port)
database = args.database
rp = args.retention
session_id = args.sessionid
now = datetime.now().timestamp()

ex_name = 'vae-automl-test-' + now

with open(VAESENSORDIR + model_name) as f:
    sensors = json.load(f)


settings = {
    'dbSettings': {
        'host': host,
        'port': port,
        'db': database,
        'rp': rp
    },
    'sessionID': session_id,
    'modelName': model_name,
    'sequenceLength': 20,
    'alpha': 100,
    'ex_name': ex_name,
    'sensors': sensors
}


vae = VAEAutoMLSession(settings)
vae.start()
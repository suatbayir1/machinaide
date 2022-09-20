import json
import argparse
from datetime import datetime
from mlregressors_ver2 import RULRegressionSession
from ml_config import AUTOML_SETTINGS_DIR

ap = argparse.ArgumentParser()
ap.add_argument("-en", "--experimentName", required=True, type=str, help="experiment name")
ap.add_argument("-sid", "--sessionID", required=True, type=str, help="sessionID")

args, unknown = ap.parse_known_args()
experiment_name = args.experimentName
session_id = args.sessionID

settings = {}
settings_path = AUTOML_SETTINGS_DIR + experiment_name + "-" + session_id + ".json"
with open(settings_path, 'r') as fp:
    settings = json.load(fp)

print(settings)
rulreg = RULRegressionSession(settings)
rulreg.run()
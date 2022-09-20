from requests import session
from POFAutoMLSession import POFAutoMLSession
import argparse
import json
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

""" settings = {
    "assetName": asset_name, "type": type, "fields": fields,
    "minDataPoints": min_data_points, "customMetricEquation": custom_metric_equation, "customMetricDirection": custom_metric_direction,
    "timeout": timeout, "numberOfEpochs": number_of_epochs, "sessionID": session_id, "experimentName": experiment_name, "creator": creator,
    "tunerType": tuner_type, "optimizer": optimizer, "windowLength": window_length, "productID": product_id, "token": token
} """

print(settings)
pof = POFAutoMLSession(settings)
pof.run()
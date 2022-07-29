from requests import session
from RULAutoMLSession import RULAutoMLSession
import argparse
import json

ap = argparse.ArgumentParser()
ap.add_argument("-an", "--assetName", required=True, type=str, help="asset name for getting failure records")
ap.add_argument("-t", "--type", required=True, type=str, help="one of them: sensor/component/machine")
ap.add_argument("-db", "--database", required=True, type=str, help="database/machine mapping")
ap.add_argument("-m", "--measurement", required=True, type=str, help="measurement/component mapping")
ap.add_argument("-f", "--field", required=True, type=str, help="field mapping")
ap.add_argument("-mdp", "--minDataPoints", required=True, type=str, help="minimum data points required to start the experiment")
ap.add_argument("-cme", "--customMetricEquation", required=True, type=str, help="custom metric equation to optimize")
ap.add_argument("-cmd", "--customMetricDirection", required=True, type=str, help="minimize or maximize the custom metric?")
ap.add_argument("-to", "--timeout", required=True, type=str, help="timeout of experiment")
ap.add_argument("-noe", "--numberOfEpochs", required=True, type=str, help="number of epochs to train the model")
ap.add_argument("-sid", "--sessionID", required=True, type=str, help="sessionID")
ap.add_argument("-en", "--experimentName", required=True, type=str, help="experiment name")
ap.add_argument("-c", "--creator", required=True, type=str, help="username of the creator of the experiment")
ap.add_argument("-tt", "--tunerType", required=True, type=str, help="tuner type of keras tuner")
ap.add_argument("-o", "--optimizer", required=True, type=str, help="optimizer function")
ap.add_argument("-wl", "--windowLength", required=True, type=str, help="window length of sequence")
ap.add_argument("-pid", "--productID", required=True, type=str, help="related product")
ap.add_argument("-tk", "--token", required=True, type=str, help="token for api calls")

args, unknown = ap.parse_known_args()
asset_name = args.assetName
type = args.type
database = args.database
measurement = args.measurement
field = args.field
min_data_points = args.minDataPoints
custom_metric_equation = args.customMetricEquation
custom_metric_direction = args.customMetricDirection
timeout = args.timeout
number_of_epochs = args.numberOfEpochs
session_id = args.sessionID
experiment_name = args.experimentName
creator = args.creator
tuner_type = args.tunerType
optimizer = args.optimizer
window_length = args.windowLength
product_id = args.productID
token = args.token

settings = {
    "assetName": asset_name, "type": type, "database": database, "measurement": measurement, "field": field,
    "minDataPoints": min_data_points, "customMetricEquation": custom_metric_equation, "customMetricDirection": custom_metric_direction,
    "timeout": timeout, "numberOfEpochs": number_of_epochs, "sessionID": session_id, "experimentName": experiment_name, "creator": creator,
    "tunerType": tuner_type, "optimizer": optimizer, "windowLength": window_length, "productID": product_id, "token": token
}

print(settings)
rul = RULAutoMLSession(settings)
rul.run()
from ml_config import AUTOML_SETTINGS_DIR
import json

experiment_name = "manual_test_from_controller_backend"
session_id = "987654"

settings_path = AUTOML_SETTINGS_DIR + experiment_name + "-" + session_id + ".json"

with open(settings_path, 'r') as fp:
    settings = json.load(fp)

print("------------------------------")
print(settings)
print("------------------")
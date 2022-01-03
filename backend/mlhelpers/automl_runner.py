from mlhelpers.mlwrappers import RULAutoMLSession, ADAutoMLSession
from config import AUTOSETTINGSDIR
import argparse
import json

ap = argparse.ArgumentParser()
ap.add_argument("-e", "--experiment", required=True, type=str,
        help="experiment name")
ap.add_argument("-u", "--username", required=True, type=str,
        help="user that started the experiment")
ap.add_argument("-t", "--task", required=True, type=str,
        help="machine learning task to be performed")
        
args = vars(ap.parse_args())
experiment_name = args["experiment"]
username = args["username"]
task = args["task"]

t_dir = AUTOSETTINGSDIR + experiment_name + "-" + username + ".json"
with open(t_dir, 'r') as fp:
    settings = json.load(fp)

if task == "rul":
    sess = RULAutoMLSession(settings)
elif task == "anomaly":
    sess = ADAutoMLSession(settings)
sess.run()
# sess.test()
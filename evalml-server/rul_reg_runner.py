import argparse
from mlregressors import RULRegressionSession
from datetime import datetime

ap = argparse.ArgumentParser()
ap.add_argument("-n", "--name", required=True, type=str, help="sensor/component/machine name")
ap.add_argument("-t", "--type", required=True, type=str, help="one of them: sensor/component/machine")
ap.add_argument("-db", "--database", required=True, type=str, help="database/machine mapping")
ap.add_argument("-u", "--username", required=True, type=str, help="user that started the process")
ap.add_argument("-mn", "--modelName", required=True, type=str, help="model name given by user")
ap.add_argument("-m", "--measurement", required=False, type=str, help="measurement/component mapping")
ap.add_argument("-f", "--field", required=False, type=str, help="field/sensor mapping")
ap.add_argument("-o", "--objective", required=True, type=str,
        help="objective metric")
ap.add_argument("-to", "--timeout", required=True, type=str,
        help="timeout of experiment")
ap.add_argument("-pid", "--productID", required=False, type=str,
        help="related product")
ap.add_argument("-mdp", "--minDataPoints", required=True, type=str,
        help="related product")
ap.add_argument("-mi", "--maxIterations", required=True, type=str,
        help="maximum number of iterations to search")
ap.add_argument("-egp", "--earlyGuessPunishment", required=True, type=str,
        help="punishment value for early predictions")
ap.add_argument("-lgp", "--lateGuessPunishment", required=True, type=str,
        help="punishment value for late predictions")

# args = vars(ap.parse_args())
args, unknown = ap.parse_known_args()
part_name = args.name 
type = args.type
database = args.database
measurement = args.measurement 
field = args.field
username = args.username
model_name = args.modelName
timeout = args.timeout
objective = args.objective
productID = args.productID
minDataPoints = args.minDataPoints
maxIterations = args.maxIterations
earlyGuessPunishment = args.earlyGuessPunishment
lateGuessPunishment = args.lateGuessPunishment
now = datetime.now().timestamp()

settings = {"partName": part_name, "type": type, "username": username, "database": database, 
        "measurement": measurement, "field": field, "startTime": now, "modelName": model_name, "maxIterations": maxIterations,
        "objective": objective, "timeout": timeout, "productID": productID, "minDataPoints": minDataPoints, 
        "earlyGuessPunishment": earlyGuessPunishment, "lateGuessPunishment": lateGuessPunishment}
print(settings)
rul_reg = RULRegressionSession(settings)
rul_reg.run()
print("---------- THE END ----------")
import requests
import uuid


flaskserver = "localhost" # "flaskserver"
flask_port = "9632/api/v1.0/metadata"
mid = uuid.uuid4().hex
requests.post(url= "http://{}:{}/postBasicModel".format(flaskserver, flask_port), json={"modelID": mid})

obj = {
    "modelID": mid,
    "trainingDone": True
}
requests.put(url="http://{}:{}/updateBasicModel".format(flaskserver, flask_port), json=obj)
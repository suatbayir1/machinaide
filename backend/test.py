import requests

BASE = "http://127.0.0.1:9632/api/"

# payload = {
#     "component_id": "component a",
#     "machine_id": "machine a",
#     "name": "component a name"
# }

# response = requests.post(BASE + "dt/add", payload)
# response = requests.get(BASE + "dt")
# response = requests.post(BASE + "dt/addAll")
response = requests.post(BASE + "dt/updateAll")
# response = requests.get(BASE + "dt/getGeneralInfo")
# response = requests.get(BASE + "dt/getFileInfo")
# response = requests.get(BASE + "factory/getFactories")

print(response.json())
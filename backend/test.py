import requests

BASE = "http://127.0.0.1:9632/api/"

response = requests.post(BASE + "dt/updateAll")

print(response.json())
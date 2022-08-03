import requests
import json

headers = {
  'token': 'geyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6Im1hY2hpbmFpZGUiLCJyb2xlIjoiYWRtaW4iLCJleHBpcnlfdGltZSI6MTY1OTY4MTA3MS4wfQ.v-_zvSuV_Z4aqhX7jh8rRdtezaqQexP5OHs9bHhAcm4',
  'Content-Type': 'application/json'
}

failure_res = requests.post(url="https://vmi474601.contaboserver.net/api/v1.0/failure/getFailures", headers=headers, json={"sourceName": "Press031"}).json()

print(failure_res["data"]["data"])
fails = json.loads(failure_res["data"]["data"])
for failure in fails:
  print(failure)
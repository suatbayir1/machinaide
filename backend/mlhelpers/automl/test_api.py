import requests

headers = {
  'token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6Im1hY2hpbmFpZGUiLCJyb2xlIjoiYWRtaW4iLCJleHBpcnlfdGltZSI6MTY1NTM2Njk2NS4wfQ.Zh_IfRV_i6v3RcIpqU33xAHYI9D3UYo50fVzwPL2oy8',
  'Content-Type': 'application/json'
}

failure_res = requests.post(url="https://vmi474601.contaboserver.net/api/v1.0/failure/getFailures", headers=headers, json={"sourceName": "Press031"}).json()

print(failure_res)
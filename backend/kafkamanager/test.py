import requests
import ldap
import time
import random

BASE = "http://127.0.0.1:9999/"

topicList = ["Press030ToPress031", "Press031ToPress032", "Press032ToPress033", "Press033ToPress034"]

while True:
    payload = {
        "material": "Material 1",
        "temperature": random.randint(1,100),
        "vibration": random.randint(1,100)
    }

    topic = topicList[random.randint(0,3)]

    print(topic)

    response = requests.post(BASE + f"sendMessage/{topic}", json = payload)
    print(response.json())
    time.sleep(1)


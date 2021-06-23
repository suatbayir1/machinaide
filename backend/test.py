import requests
import ldap

BASE = "http://127.0.0.1:9632/api/"

response = requests.post(BASE + "dt/updateAll")

# response = requests.post(BASE + "auth/loginWithLDAP")


print(response.json())
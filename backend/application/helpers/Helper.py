from bson.json_util import loads, dumps
from flask import jsonify
import json
from functools import wraps
import functools
from flask import request, jsonify
import jwt
import config
import time
import datetime
from core.logger.MongoLogger import MongoLogger
import email, smtplib, ssl
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from twilio.rest import Client
from email.message import EmailMessage

logger = MongoLogger()

def request_validation(payload, required_keys):
    confirm = True
    missed_keys = ""

    for key in required_keys:
        if key not in payload or str(payload[key]).strip() == "":
            confirm = False
            missed_keys += f"{key}, "
    
    return missed_keys[:-2], confirm

def return_response(data = [], success = True, message = "success", total_count = 0, code = 0):
    return {
        "data": {
            "data": dumps(data),
            "success": success,
            "message": {
                "text": message
            },
            "summary": {
                "total_count": total_count,
                "code": code
            }
        }
    }

def cursor_to_json(data):
    return json.loads(dumps(list(data), indent = 2))

def token_required(f=None, roles=None):
    if not f:
        return functools.partial(token_required, roles=roles)
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('token')

        if not token:
            message = "Token is missing"
            logger.add_log("ERROR", request.remote_addr, '', request.method, request.url, '', message,  403)
            return return_response(data = [], success = False, message = message, code = 403), 403

        try:
            data = jwt.decode(token, config.authentication["SECRET_KEY"])
            current_time = time.mktime((datetime.datetime.now()).timetuple())

            if data["expiry_time"] > current_time:
                if data["role"] in roles:
                    return f(data)
                else:
                    message = "This user cannot access this method"
                    logger.add_log("ERROR", request.remote_addr, data["username"], request.method, request.url, '', message,  401)
                    return return_response(data = [], success = False, message = "This user cannot access this method", code = 401), 401
            else:
                message = "Token expired"
                logger.add_log("ERROR", request.remote_addr, data["username"], request.method, request.url, '', message,  401)
                return return_response(data = [], success = False, message = message, code = 401), 401
        except Exception as e:
            print("---------------------> STOP: ", e)
            message = "Token is invalid"
            logger.add_log("ERROR", request.remote_addr, '', request.method, request.url, '', message,  401)
            return return_response(data = [], success = False, message = message), 401

        return f(*args, **kwargs)
    return decorated

def send_sms(body, to):
    try: 
        print("sms not working right now")

        # client = Client(config.SMS_SENDER["account_sid"], config.SMS_SENDER["auth_token"])

        # message = client.messages.create(
        #     body=body,
        #     from_ = config.SMS_SENDER["from_"],
        #     to=to
        # )

        # print(message.sid)

    except Exception as e:
        print(e)
        return return_response(data = [], success = False, message = "An error occurred while sending a smss"), 404

def getLevelUpperCase(level):
    temp = ""
    if level == "crit":
        temp = "CRIT"
    elif level == "warn":
        temp = "WARN"
    elif level == "info":
        temp = "INFO"
    elif level == "ok":
        temp = "OK"
    else:
        temp = "default"
    return temp

def getThresholdHTML(thresholds, level):
    temp = ""
    for threshold in thresholds:
        print(threshold)
        if threshold["level"] == level:
            if threshold["type"] == "greater":
                temp = f'''
                    <tr>
                        <td>Eşik Türü</td>
                        <td>Greater</td>
                    </tr>
                    <tr>
                        <td>Max Değer</td>
                        <td>{threshold["value"]}</td>
                    </tr>
                '''
            elif threshold["type"] == "lesser":
                temp = f'''
                    <tr>
                        <td>Eşik Türü</td>
                        <td>Lesser</td>
                    </tr>
                    <tr>
                        <td>Min Değer</td>
                        <td>{threshold["value"]}</td>
                    </tr>
                '''
            elif threshold["type"] == "range" and threshold["within"] == True:
                print("threshold")
                print(threshold)
                if "min" not in threshold:
                    min_value = 0
                else:
                    min_value = threshold["min"]

                if "max" not in threshold:
                    max_value = 0
                else:
                    max_value = threshold["max"]

                temp = f'''
                    <tr>
                        <td>Eşik Türü</td>
                        <td>Inside Range</td>
                    </tr>
                    <tr>
                        <td>Min Değer</td>
                        <td>{min_value}</td>
                    </tr>
                    <tr>
                        <td>Max Değer</td>
                        <td>{max_value}</td>
                    </tr>
                '''
            elif threshold["type"] == "range" and threshold["within"] == False:
                if "min" not in threshold:
                    min_value = 0
                else:
                    min_value = threshold["min"]

                if "max" not in threshold:
                    max_value = 0
                else:
                    max_value = threshold["max"]

                temp = f'''
                    <tr>
                        <td>Eşik Türü</td>
                        <td>Outside Range</td>
                    </tr>
                    <tr>
                        <td>Min Değer</td>
                        <td>{min_value}</td>
                    </tr>
                    <tr>
                        <td>Max Değer</td>
                        <td>{max_value}</td>
                    </tr>
                '''
            else:
                temp = ""
    return temp

def send_mail(to, subject, title, value, thresholds, level):
    try:
        level = getLevelUpperCase(level)
        thresholdHTML = getThresholdHTML(thresholds, level)
        current_date = datetime.datetime.today().strftime('%m/%d/%Y %H:%M')
        html = f'''
        <html>
        <head>
        <style></style>
        </head>
        <body>
            <table>
                <tr>
                    <td colspan="2">{title}</td>
                </tr>
                <tr>
                    <td>Gerçekleşen Değer</td>
                    <td>{value}</td>
                </tr>
                <threshold></threshold>
                <tr>
                    <td>{current_date.split(" ")[0]}</td>
                    <td>{current_date.split(" ")[1]}</td>
                </tr>
            </table>
        </body>
        </html>
        '''
        css = """<style>
        table, th, td {
            border: 1px solid black;
            border-collapse: collapse;
        }
        </style>"""
        html_with_style = html.replace('<style></style>', css)
        html_with_style = html_with_style.replace('<threshold></threshold>', thresholdHTML)
        em = EmailMessage()

        em['From'] = config.EMAIL_SENDER["from_"]
        em['To'] = to
        em['Subject'] = subject
        # em.set_content(content)
        em.add_alternative(html_with_style, subtype='html')

        context = ssl.create_default_context()

        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(config.EMAIL_SENDER["from_"], config.EMAIL_SENDER["password"])
            smtp.sendmail(config.EMAIL_SENDER["from_"], to, em.as_string())
            print("mail gonderildi")

    except Exception as e:
        print(e)
        return return_response(data = [], success = False, message = "An error occurred while sending a email"), 404
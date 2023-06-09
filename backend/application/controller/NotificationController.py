from flask import Blueprint, request, jsonify
from application.helpers.Helper import return_response, token_required, send_sms, send_mail
from core.logger.MongoLogger import MongoLogger
import config
import datetime 
from application.model.UserModel import UserModel
from application.classes.InfluxManager import InfluxManager

notification = Blueprint("notification", __name__)
logger = MongoLogger()

alarm_times = {}
alarm_histories = {}
userModel = UserModel()
influxManager = InfluxManager()

@notification.route("/send", methods = ["POST"])
def alert():
    emails = userModel.get_emails()
    email_list = [email['email'] for email in emails]
    to_email_address = [email['email'] for email in emails]
    # to_email_address = "bakim.ermetal@gmail.com"
    to_phone_number = "+905433723769"
    print("send request")

    running = influxManager.isMachineRunning()

    if running == False:
        print("makine calismiyor")
        return {"message": "Machine is not working"}

    thresholds = influxManager.getCheckById(request.json['_check_id'])
    try:
        if list(request.json)[0] in alarm_times:
            difference = datetime.datetime.now() - alarm_times[list(request.json)[0]]
            if difference.total_seconds() > 172800:
                print("2 gun gecti ve ilk kez alarm olusmus gibi mail atilip history silindi")
                del alarm_histories[list(request.json)[0]]
                alarm_times[list(request.json)[0]] = datetime.datetime.now()
                message = f"{request.json['_message']}. Value: {request.json[list(request.json)[0]]}"
                send_sms(
                    body=message,
                    to=to_phone_number
                )
                send_mail(
                    to = to_email_address,
                    subject = "Machinaide InfluxDB Alarm",
                    title = request.json["_check_name"],
                    value = round(request.json[list(request.json)[0]], 2),
                    thresholds = thresholds,
                    level = request.json["_level"]
                )
            elif difference.total_seconds() > 86400:
                print("1 gun gecti ve alarm atilip history silindi")
                message = f"Alarm: {list(request.json)[0]} has {alarm_histories[list(request.json)[0]]['count']} alarms. Min: {alarm_histories[list(request.json)[0]]['min']} Max: {alarm_histories[list(request.json)[0]]['max']} Current: {request.json[list(request.json)[0]]}"
                send_sms(
                    body=message,
                    to=to_phone_number
                )
                send_mail(
                    to = to_email_address,
                    subject = "Machinaide InfluxDB Alarm",
                    title = request.json["_check_name"],
                    value = round(request.json[list(request.json)[0]], 2),
                    thresholds = thresholds,
                    level = request.json["_level"]
                )
                alarm_times[list(request.json)[0]] = datetime.datetime.now()
                del alarm_histories[list(request.json)[0]]
            elif difference.total_seconds() > 3600:
                # en son alarm gönderildikten sonra 1 saat geçti
                if list(request.json)[0] in alarm_histories:
                    alarm_histories[list(request.json)[0]] = {
                        "min": request.json[list(request.json)[0]] if request.json[list(request.json)[0]] < alarm_histories[list(request.json)[0]]["min"] else alarm_histories[list(request.json)[0]]["min"],
                        "max": request.json[list(request.json)[0]] if request.json[list(request.json)[0]] > alarm_histories[list(request.json)[0]]["max"] else alarm_histories[list(request.json)[0]]["max"],
                        "current": request.json[list(request.json)[0]],
                        "count": alarm_histories[list(request.json)[0]]["count"] + 1
                    }
                else:
                    alarm_histories[list(request.json)[0]] = {
                        "min": request.json[list(request.json)[0]],
                        "max": request.json[list(request.json)[0]],
                        "current": request.json[list(request.json)[0]],
                        "count": 1
                    }
                print("history'de tutuldu mail atilmadi", alarm_histories[list(request.json)[0]]["count"])

                if list(request.json)[0] in alarm_histories and alarm_histories[list(request.json)[0]]['count'] >= 5:
                    print(alarm_histories[list(request.json)[0]]['count'])
                    message = f"Alarm: {list(request.json)[0]} has {alarm_histories[list(request.json)[0]]['count']} alarms. Min: {alarm_histories[list(request.json)[0]]['min']} Max: {alarm_histories[list(request.json)[0]]['max']} Current: {request.json[list(request.json)[0]]}"
                    send_sms(
                        body=message,
                        to=to_phone_number
                    )
                    send_mail(
                        to = to_email_address,
                        subject = "Machinaide InfluxDB Alarm",
                        title = request.json["_check_name"],
                        value = round(request.json[list(request.json)[0]], 2),
                        thresholds = thresholds,
                        level = request.json["_level"]
                    )
                    alarm_times[list(request.json)[0]] = datetime.datetime.now()
                    del alarm_histories[list(request.json)[0]]
        else:
            # if it is not in the alarm list, send an email because the alarm occurred for the first time
            print("ilk kez alarm olustu ve mail atıldi")
            message = f"{request.json['_message']}. Value: {request.json[list(request.json)[0]]}"
            alarm_times[list(request.json)[0]] = datetime.datetime.now()
            send_sms(
                body=message,
                to=to_phone_number
            )
            send_mail(
                to = to_email_address,
                subject = "Machinaide InfluxDB Alarm",
                title = request.json["_check_name"],
                value = round(request.json[list(request.json)[0]], 2),
                thresholds = thresholds,
                level = request.json["_level"]
            )

        return {"res": "Email and sms sent successfully"}
    except:
        return return_response(data = [], success = False, message = "An error occurred while sending a email"), 404


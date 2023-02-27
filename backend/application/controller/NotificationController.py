from flask import Blueprint, request, jsonify
from application.helpers.Helper import return_response, token_required, send_mail
from core.logger.MongoLogger import MongoLogger
import config

notification = Blueprint("notification", __name__)
logger = MongoLogger()

@notification.route("/send", methods = ["POST"])
def alert():
    try:
        print("alert run")
        print(request.json)
        send_mail(
            sender = config.authentication["EMAIL_SENDER"],
            receivers = request.json["to"],
            subject = request.json["subject"],
            body = request.json["content"],
            password = config.authentication["USER_PASSWORD"],
        )
        return {"text": "Email send successfully"}
    except:
        return return_response(data = [], success = False, message = "An error occurred while sending a email"), 404


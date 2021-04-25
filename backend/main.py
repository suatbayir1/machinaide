import datetime
import logging
from flask import Flask, request, Response, send_from_directory, jsonify
from flask_cors import CORS, cross_origin
from flask_swagger_ui import get_swaggerui_blueprint
from pykafka import KafkaClient
from pykafka.common import OffsetType
from application.helpers.Helper import return_response
from application.controller.DigitalTwinController import dt
from application.controller.ObjectController import obj
from application.controller.AuthenticationController import auth
from application.controller.FactoryController import factory
from application.controller.FailureController import failure
from application.controller.PredictionController import prediction
from application.controller.LogController import log
from application.controller.MaintenanceController import maintenance
from application.controller.UserController import user
import time

today = datetime.date.today()
logging.basicConfig(filename=f'/home/machinaide/backend/logs/current.log', level=logging.DEBUG, format='%(asctime)s %(levelname)s %(name)s %(funcName)s %(module)s : %(message)s')

UPLOAD_FOLDER =  "/home/machinaide/influxdb/ui/assets/images"

app = Flask(__name__)
app_prefix = "/api"
app.register_blueprint(auth, url_prefix = f"{app_prefix}/auth")
app.register_blueprint(dt, url_prefix = f"{app_prefix}/dt")
app.register_blueprint(obj, url_prefix = f"{app_prefix}/object")
app.register_blueprint(factory, url_prefix = f"{app_prefix}/factory")
app.register_blueprint(failure, url_prefix = f"{app_prefix}/failure")
app.register_blueprint(prediction, url_prefix = f"{app_prefix}/prediction")
app.register_blueprint(log, url_prefix = f"{app_prefix}/log")
app.register_blueprint(maintenance, url_prefix = f"{app_prefix}/maintenance")
app.register_blueprint(user, url_prefix = f"{app_prefix}/user")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(dt)
CORS(app, supports_credentials = True, resources={r"*": {"origins": "*"}})


### swagger specific ###
SWAGGER_URL = '/docs/api'
API_URL = '/static/swagger.json'
SWAGGERUI_BLUEPRINT = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "Machinaide REST API Documentation"
    }
)
app.register_blueprint(SWAGGERUI_BLUEPRINT, url_prefix = SWAGGER_URL)
### end swagger specific ###

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route(f"{app_prefix}/")
def index():
    return {"text": "Server is running"}

@app.route(f"{app_prefix}/topic/<topicname>")
def get_messages(topicname):
    client = KafkaClient(hosts = "localhost:9092")
    def events():
        for i in client.topics[topicname].get_simple_consumer(
            auto_offset_reset=OffsetType.LATEST,
            reset_offset_on_start=True
        ):
            print(f"consumer: {i.value.decode()}")
            yield 'data:{0}\n\n'.format(i.value.decode())
    return Response(events(), mimetype = "text/event-stream")


if __name__ == "__main__":
    app.run(debug = True, port = 9632)
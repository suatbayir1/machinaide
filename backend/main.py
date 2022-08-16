import datetime
import logging
import time
import config
from flask import Flask, request, Response, send_from_directory, jsonify
from flask_cors import CORS, cross_origin
from flask_swagger_ui import get_swaggerui_blueprint
from pykafka import KafkaClient
import json
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
from application.controller.GeneralController import general
from application.controller.BrandController import brand
from application.controller.MetaDataController import metadataserver
from application.controller.HealthAssessmentController import health_assessment
#from application.controller.MLController import mlserver
#from application.controller.NLPController import nlpserver
from application.controller.NotificationController import notification
from application.controller.InfluxController import influx


today = datetime.date.today()
logging.basicConfig(filename=f'{config.PROJECT_URL}/backend/logs/current.log', level=logging.DEBUG, format='%(asctime)s %(levelname)s %(name)s %(funcName)s %(module)s : %(message)s')

UPLOAD_FOLDER =  f"{config.PROJECT_URL}/influxdb/ui/assets/images"

app = Flask(__name__)
app_prefix = "/api/v1.0"
app.register_blueprint(auth, url_prefix = f"{app_prefix}/auth")
app.register_blueprint(dt, url_prefix = f"{app_prefix}/dt")
app.register_blueprint(obj, url_prefix = f"{app_prefix}/object")
app.register_blueprint(factory, url_prefix = f"{app_prefix}/factory")
app.register_blueprint(failure, url_prefix = f"{app_prefix}/failure")
app.register_blueprint(prediction, url_prefix = f"{app_prefix}/prediction")
app.register_blueprint(log, url_prefix = f"{app_prefix}/log")
app.register_blueprint(maintenance, url_prefix = f"{app_prefix}/maintenance")
app.register_blueprint(user, url_prefix = f"{app_prefix}/user")
app.register_blueprint(general, url_prefix = f"{app_prefix}/general")
app.register_blueprint(brand, url_prefix = f"{app_prefix}/brand")
app.register_blueprint(metadataserver, url_prefix = f"{app_prefix}/metadata")
#app.register_blueprint(mlserver, url_prefix = f"{app_prefix}/ml")
#app.register_blueprint(nlpserver, url_prefix = f"{app_prefix}/nlp")
app.register_blueprint(notification, url_prefix = f"{app_prefix}/notification")
app.register_blueprint(influx, url_prefix = f"{app_prefix}/influx")
app.register_blueprint(health_assessment, url_prefix = f"{app_prefix}/health")

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

CORS(dt)
CORS(app, supports_credentials = True, resources={r"*": {"origins": "*"}})


### swagger specific ###
SWAGGER_URL = f'{app_prefix}/docs'
API_URL = f'{app_prefix}/static/swagger.json'
SWAGGERUI_BLUEPRINT = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "Machinaide REST API Documentation"
    }
)
app.register_blueprint(SWAGGERUI_BLUEPRINT, url_prefix = SWAGGER_URL)
### end swagger specific ###

@app.route(f'{app_prefix}/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route(f"{app_prefix}/")
def index():
    print("request arrived")
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

FROM python:3.6.9

WORKDIR usr/src/flask_app_ml
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt
COPY . .
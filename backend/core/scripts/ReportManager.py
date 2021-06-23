import sys
import os
import json
import pandas as pd
import jinja2
import time
import hashlib
import datetime
import email, smtplib, ssl
import plotly.express as px
import base64
sys.path.insert(1, '/home/machinaide/backend')
from application.model.GeneralModel import GeneralModel
from application.model.FailureModel import FailureModel
from application.model.MaintenanceModel import MaintenanceModel
from application.helpers.Helper import cursor_to_json
from weasyprint import HTML, CSS
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

general_model = GeneralModel()
failure_model = FailureModel()
maintenance_model = MaintenanceModel()

def main():
    reports = cursor_to_json(general_model.get_reports())
    report_dir = "/home/machinaide/influxdb/ui/assets/reports"
    report_view_dir = "/home/machinaide/backend/application/view/reports/"

    for report in reports:
        if report["enabled"]:
            machineID = report['Machine']
            componentID = report['Component']

            dir_path = os.path.join(report_dir, report['ReportConfig']['title'])
            if(os.path.isdir(dir_path) == False):
                os.mkdir(dir_path)
                os.mkdir(os.path.join(dir_path, "figures"))


            sourceName = componentID
            if(componentID == 'ALL'):
                sourceName = machineID

            columns = {
                "_id": False,
                "sid": False,
                "factoryID": False,
                "description": False,
            }

            failures = cursor_to_json(failure_model.get_failures_by_condition({"sourceName": sourceName}, columns))

            # Failures Table
            df = pd.DataFrame(list(failures))
            df_html = df.to_html()\
                .replace('<table border="1" class="dataframe">','<table class="table table-striped">')

            maintenance_columns = {
                "_id": False,
                "sid": False,
                "factoryID": False,
                "faultType": False,
                "jobDescription": False,
                "reason": False,
                "request": False,
            }

            # Maintenance Table
            maintenances = cursor_to_json(maintenance_model.get_maintenance_by_condition({"asset": sourceName}, maintenance_columns))

            df_maintenance = pd.DataFrame(list(maintenances))
            df_maintenance_html = df_maintenance.to_html()\
                .replace('<table border="1" class="dataframe">','<table class="table table-striped">')

            # Maintenanace Records fig
            if not df_maintenance.empty:
                unique_maintenance_occs = df_maintenance['maintenanceType'].value_counts()

                labels = []
                values = []

                for index, value in unique_maintenance_occs.items():
                    labels.append(index)
                    values.append(value)

                maintenance_fig = px.pie(df_maintenance, values=values, names=labels)
                maintenance_fig.update_traces(textposition='outside', textfont_size=17)
                maintenance_fig.update_layout(legend=dict(
                    orientation="h",
                    yanchor="bottom",
                    y=-0.4,
                    xanchor="right",
                    x=1,
                    font=dict(
                        family="Courier", size=12, color="black"
                    ),
                ), margin=dict(l=50, r=50, t=100, b=100))
                maintenance_fig.write_image(os.path.join(dir_path, "figures/maintenance_fig_" + str(datetime.datetime.now().date()) + ".jpeg"))
                maintenance_data_uri = base64.b64encode(open(os.path.join(dir_path, "figures/maintenance_fig_" + str(datetime.datetime.now().date()) + ".jpeg"), 'rb').read()).decode('utf-8')
            else:
                maintenance_data_uri = ""

            # Send data to html template
            env = jinja2.Environment(loader = jinja2.FileSystemLoader(searchpath = report_view_dir))


            # check is it time to create the report
            if report["ReportConfig"]["time"] < int(time.time() * 1000):
                willCreateReport = True

                # if report schedule configuration equal to not repeat
                if report["ReportConfig"]["schedule"] == "Not Repeat":
                    if report["isCreatedBefore"] == True:
                        willCreateReport = False


                if willCreateReport:
                    update_report_config_from_mongo(report)

                    template = env.get_template('template_pdf.html')
                    
                    html = template.render(
                        author = f'{report["Author"]}',
                        date = datetime.datetime.now().date(), 
                        compFail_table = df_html, 
                        maintenance_table = df_maintenance_html,
                        alerts_table = "",
                        factory = report['Factory'], 
                        machine = machineID, 
                        component = componentID, 
                        report_title = report['ReportConfig']['title'],
                        description = report['ReportConfig']['description'],
                        # alerts_pie_chart='<img src="data:image/jpeg;base64,{0}">'.format(alerts_data_uri),
                        maint_pie_chart='<img src="data:image/jpeg;base64,{0}">'.format(maintenance_data_uri),
                        # imgList=imgList
                    )

                    # Write html file
                    filename = f'{machineID}_{componentID}_{report["Author"]}_{int(time.time() * 1000)}'
                    title = 'htmltemplate.html'
                    f = open(title, 'w')
                    f.write(html)
                    f.close()

                    reportTitle = f'{filename}.pdf'
                    # reportTitle = f'{hashlib.sha256(filename.encode("utf-8")).hexdigest()}_{int(time.time()*1000)}.pdf'
                    HTML(filename = title).write_pdf(target = os.path.join(dir_path, reportTitle), stylesheets = [CSS(filename = os.path.join(report_view_dir, 'invoice.css'))])

                    if (report["CheckBox"]["sendEmail"]):
                        send_mail(
                            sender = "email.machinaide@gmail.com",
                            receivers = report["Receivers"],
                            subject = report["ReportConfig"]["title"],
                            body = report["ReportConfig"]["description"],
                            filename = reportTitle,
                            password = "erste2020",
                            dir_path = dir_path,
                    )


def update_report_config_from_mongo(report):
    hours = 0
    if report["ReportConfig"]["schedule"] == "Hourly":
        hours = 1
    elif report["ReportConfig"]["schedule"] == "Daily":
        hours = 1 * 24
    elif report["ReportConfig"]["schedule"] == "Weekly":
        hours = 1 * 24 * 7
    elif report["ReportConfig"]["schedule"] == "Monthly":
        hours = 1 * 24 * 7 * 30


    next_time = report["ReportConfig"]["time"] + int(datetime.timedelta(hours = hours).total_seconds() * 1000)

    payload = {
        "recordId": report["_id"]["$oid"],
        "isCreatedBefore": True,
        "ReportConfig.time": next_time
    }

    general_model.update_report(payload)



def send_mail(sender, receivers, subject, body, filename, password, dir_path):
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
       
    # Email Headers
    message = MIMEMultipart()
    message["From"] = sender
    message["To"] = ", ".join(receivers)
    message["Subject"] = subject
    
    # # Message Body
    message.attach(MIMEText(body, "plain"))

    with open(os.path.join(dir_path, filename), "rb") as attachment:
        part = MIMEBase("application", "pdf", Name = filename)
        part.set_payload(attachment.read())
    
    encoders.encode_base64(part)

    # Add header as key/value pair to attachment part
    part.add_header(
        subject,
        "Content-Disposition: attachment; filename = {filename}.pdf".format(filename=filename),
    )

    message.attach(part)
    text = message.as_string()

    # Log in to server using secure context and send email
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(sender, password)
        server.sendmail(sender, receivers, text)

if __name__ == '__main__':
    main()













































































# import sys
# import os
# import json
# import pandas as pd
# import jinja2
# import time
# import hashlib
# import datetime
# import email, smtplib, ssl
# import plotly.express as px
# import base64
# sys.path.insert(1, '/home/machinaide/backend')
# from application.model.GeneralModel import GeneralModel
# from application.model.FailureModel import FailureModel
# from application.model.MaintenanceModel import MaintenanceModel
# from application.helpers.Helper import cursor_to_json
# from weasyprint import HTML, CSS
# from email import encoders
# from email.mime.base import MIMEBase
# from email.mime.multipart import MIMEMultipart
# from email.mime.text import MIMEText

# general_model = GeneralModel()
# failure_model = FailureModel()
# maintenance_model = MaintenanceModel()

# def main():
#     reports = cursor_to_json(general_model.get_reports())
#     report_dir = "/home/machinaide/backend/reports"
#     report_view_dir = "/home/machinaide/backend/application/view/reports/"

#     for report in reports:
#         machineID = report['Machine']
#         componentID = report['Component']

#         dir_path = os.path.join(report_dir, report['ReportConfig']['title'])
#         if(os.path.isdir(dir_path) == False):
#             os.mkdir(dir_path)
#             os.mkdir(os.path.join(dir_path, "figures"))


#         sourceName = componentID
#         if(componentID == 'ALL'):
#             sourceName = machineID

#         columns = {
#             "_id": False,
#             "sid": False,
#             "factoryID": False,
#             "description": False,
#         }

#         failures = cursor_to_json(failure_model.get_failures_by_condition({"sourceName": sourceName}, columns))

#         # Failures Table
#         df = pd.DataFrame(list(failures))
#         df_html = df.to_html()\
#             .replace('<table border="1" class="dataframe">','<table class="table table-striped">')

#         maintenance_columns = {
#             "_id": False,
#             "sid": False,
#             "factoryID": False,
#             "faultType": False,
#             "jobDescription": False,
#             "reason": False,
#             "request": False,
#         }

#         # Maintenance Table
#         maintenances = cursor_to_json(maintenance_model.get_maintenance_by_condition({"asset": sourceName}, maintenance_columns))

#         df_maintenance = pd.DataFrame(list(maintenances))
#         df_maintenance_html = df_maintenance.to_html()\
#             .replace('<table border="1" class="dataframe">','<table class="table table-striped">')

#         # Maintenanace Records fig
#         if not df_maintenance.empty:
#             unique_maintenance_occs = df_maintenance['maintenanceType'].value_counts()

#             labels = []
#             values = []

#             for index, value in unique_maintenance_occs.items():
#                 labels.append(index)
#                 values.append(value)

#             maintenance_fig = px.pie(df_maintenance, values=values, names=labels)
#             maintenance_fig.update_traces(textposition='outside', textfont_size=17)
#             maintenance_fig.update_layout(legend=dict(
#                 orientation="h",
#                 yanchor="bottom",
#                 y=-0.4,
#                 xanchor="right",
#                 x=1,
#                 font=dict(
#                     family="Courier", size=12, color="black"
#                 ),
#             ), margin=dict(l=50, r=50, t=100, b=100))
#             maintenance_fig.write_image(os.path.join(dir_path, "figures/maintenance_fig_" + str(datetime.datetime.now().date()) + ".jpeg"))
#             maintenance_data_uri = base64.b64encode(open(os.path.join(dir_path, "figures/maintenance_fig_" + str(datetime.datetime.now().date()) + ".jpeg"), 'rb').read()).decode('utf-8')
#         else:
#             maintenance_data_uri = ""

#         # Send data to html template
#         env = jinja2.Environment(loader = jinja2.FileSystemLoader(searchpath = report_view_dir))


#         # check is it time to create the report
#         if report["ReportConfig"]["time"] < int(time.time() * 1000):
#             willCreateReport = True

#             # if report schedule configuration equal to not repeat
#             if report["ReportConfig"]["schedule"] == "Not Repeat":
#                 if report["isCreatedBefore"] == True:
#                     willCreateReport = False


#             if willCreateReport:
#                 update_report_config_from_mongo(report)

#                 template = env.get_template('template_pdf.html')
                
#                 html = template.render(
#                     author = f'{report["Author"]}',
#                     date = datetime.datetime.now().date(), 
#                     compFail_table = df_html, 
#                     maintenance_table = df_maintenance_html,
#                     alerts_table = "",
#                     factory = report['Factory'], 
#                     machine = machineID, 
#                     component = componentID, 
#                     report_title = report['ReportConfig']['title'],
#                     description = report['ReportConfig']['description'],
#                     # alerts_pie_chart='<img src="data:image/jpeg;base64,{0}">'.format(alerts_data_uri),
#                     maint_pie_chart='<img src="data:image/jpeg;base64,{0}">'.format(maintenance_data_uri),
#                     # imgList=imgList
#                 )

#                 # Write html file
#                 filename = f'{machineID}_{componentID}_{report["Author"]}_{int(time.time() * 1000)}'
#                 title = 'htmltemplate.html'
#                 f = open(title, 'w')
#                 f.write(html)
#                 f.close()

#                 reportTitle = f'{filename}.pdf'
#                 # reportTitle = f'{hashlib.sha256(filename.encode("utf-8")).hexdigest()}_{int(time.time()*1000)}.pdf'
#                 HTML(filename = title).write_pdf(target = os.path.join(dir_path, reportTitle), stylesheets = [CSS(filename = os.path.join(report_view_dir, 'invoice.css'))])

#                 if (report["CheckBox"]["sendEmail"]):
#                     send_mail(
#                         sender = "email.machinaide@gmail.com",
#                         receivers = report["Receivers"],
#                         subject = report["ReportConfig"]["title"],
#                         body = report["ReportConfig"]["description"],
#                         filename = reportTitle,
#                         password = "erste2020",
#                         dir_path = dir_path,
#                 )


# def update_report_config_from_mongo(report):
#     hours = 0
#     if report["ReportConfig"]["schedule"] == "Hourly":
#         hours = 1
#     elif report["ReportConfig"]["schedule"] == "Daily":
#         hours = 1 * 24
#     elif report["ReportConfig"]["schedule"] == "Weekly":
#         hours = 1 * 24 * 7
#     elif report["ReportConfig"]["schedule"] == "Monthly":
#         hours = 1 * 24 * 7 * 30


#     next_time = report["ReportConfig"]["time"] + int(datetime.timedelta(hours = hours).total_seconds() * 1000)

#     payload = {
#         "recordId": report["_id"]["$oid"],
#         "isCreatedBefore": True,
#         "ReportConfig.time": next_time
#     }

#     general_model.update_report(payload)



# def send_mail(sender, receivers, subject, body, filename, password, dir_path):
#     server = smtplib.SMTP('smtp.gmail.com', 587)
#     server.starttls()
       
#     # Email Headers
#     message = MIMEMultipart()
#     message["From"] = sender
#     message["To"] = ", ".join(receivers)
#     message["Subject"] = subject
    
#     # # Message Body
#     message.attach(MIMEText(body, "plain"))

#     with open(os.path.join(dir_path, filename), "rb") as attachment:
#         part = MIMEBase("application", "pdf", Name = filename)
#         part.set_payload(attachment.read())
    
#     encoders.encode_base64(part)

#     # Add header as key/value pair to attachment part
#     part.add_header(
#         subject,
#         "Content-Disposition: attachment; filename = {filename}.pdf".format(filename=filename),
#     )

#     message.attach(part)
#     text = message.as_string()

#     # Log in to server using secure context and send email
#     context = ssl.create_default_context()
#     with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
#         server.login(sender, password)
#         server.sendmail(sender, receivers, text)

# if __name__ == '__main__':
#     main()

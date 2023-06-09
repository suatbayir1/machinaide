from application.helpers.Helper import return_response, token_required, request_validation
from application.model.SummaryReportModel import SummaryReportModel
from core.logger.MongoLogger import MongoLogger
from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from datetime import datetime, timedelta
from bson import ObjectId, json_util
from bson.json_util import dumps
import json

summary_report = Blueprint("summaryreport", __name__)

model = SummaryReportModel()
logger = MongoLogger()

def return_uptime_and_downtime(type, records):
    start_time_string = "startTime"
    end_time_string = "endTime"
    if(type=="maintenance"):
        start_time_string = "maintenanceTime"
        end_time_string = "maintenanceEndTime"

    recorded_downtime_minutes = 0
    duration_time = 0
    for record in records:
        if("DURUSSURE" in record and int(record["DURUSSURE"])!=0):
            recorded_downtime_minutes += int(record["DURUSSURE"])
        start_time = datetime.strptime(record[start_time_string], '%Y-%m-%dT%H:%M:%S.000Z') # 2020-01-02T04:30:00.000Z
        if(len(record[end_time_string])):
            end_time = datetime.strptime(record[end_time_string], '%Y-%m-%dT%H:%M:%S.000Z') 
        else:
            end_time = datetime.strptime(datetime.now().strftime("%Y-%m-%dT%H:%M:%S.000Z"), '%Y-%m-%dT%H:%M:%S.000Z') 
        record_time = end_time - start_time
        record_time_minutes = record_time.total_seconds()/60.0
        duration_time += record_time_minutes
    
    return {"count": len(records), "recordedDowntimeMinutes": recorded_downtime_minutes, "durationTime": duration_time}

@summary_report.route("/getUptimeAndDownTime", methods=["GET"])
# token_required(roles = ["admin", "member", "editor"])
def get_uptime_and_downtime():
    machines = ["Press030", "Press031", "Press032", "Press033", "Press034"]
    results = {}
    for machine in machines:
        failures = model.get_failures({"sid": machine})
        maintenance_records = model.get_maintenance_records({"sid": machine})

        now = datetime.now()
        last_24h = now - timedelta(days=1)
        last_week = now - timedelta(days=7)
        last_month = now - timedelta(days=30)

        last_day_failures = []
        last_week_failures = []
        last_month_failures = []
        all_failures = []
        for failure in failures:
            start_time = datetime.strptime(failure["startTime"], '%Y-%m-%dT%H:%M:%S.000Z')
            if(start_time<=now and start_time>=last_24h):
                last_day_failures.append(failure)
                last_week_failures.append(failure)
                last_month_failures.append(failure)
                all_failures.append(failure)
            elif(start_time<=now and start_time>=last_week):
                last_week_failures.append(failure)
                last_month_failures.append(failure)
                all_failures.append(failure)
            elif(start_time<=now and start_time>=last_month):
                last_month_failures.append(failure)
                all_failures.append(failure)
            else:
                all_failures.append(failure)

        last_day_failure_result = return_uptime_and_downtime("failure", last_day_failures)
        last_week_failure_result = return_uptime_and_downtime("failure", last_week_failures)
        last_month_failure_result = return_uptime_and_downtime("failure", last_month_failures)
        all_failure_result = return_uptime_and_downtime("failure", all_failures)

        last_day_maintenance_records = []
        last_week_maintenance_records = []
        last_month_maintenance_records = []
        all_maintenance_records = []
        for maintenance in maintenance_records:
            start_time = datetime.strptime(maintenance["maintenanceTime"], '%Y-%m-%dT%H:%M:%S.000Z')
            if(start_time<=now and start_time>=last_24h):
                last_day_maintenance_records.append(maintenance)
                last_week_maintenance_records.append(maintenance)
                last_month_maintenance_records.append(maintenance)
                all_maintenance_records.append(maintenance)
            elif(start_time<=now and start_time>=last_week):
                last_week_maintenance_records.append(maintenance)
                last_month_maintenance_records.append(maintenance)
                all_maintenance_records.append(maintenance)
            elif(start_time<=now and start_time>=last_month):
                last_month_maintenance_records.append(maintenance)
                all_maintenance_records.append(maintenance)
            else:
                all_maintenance_records.append(maintenance)

        last_day_maintenance_result = return_uptime_and_downtime("maintenance", last_day_maintenance_records)
        last_week_maintenance_result = return_uptime_and_downtime("maintenance", last_week_maintenance_records)
        last_month_maintenance_result = return_uptime_and_downtime("maintenance", last_month_maintenance_records)
        all_maintenance_result = return_uptime_and_downtime("maintenance", all_maintenance_records)

        last_failure_time = ""
        if(len(all_failures)):
            last_record_of_failure = sorted(all_failures, key=lambda x: datetime.strptime(x["startTime"], '%Y-%m-%dT%H:%M:%S.000Z'))
            last_failure_time = last_record_of_failure[-1]["startTime"]

        result = {"last_day_failure_result": last_day_failure_result, "last_week_failure_result": last_week_failure_result,
            "last_month_failure_result": last_month_failure_result, "all_failure_result": all_failure_result, "last_day_maintenance_records": last_day_maintenance_result,
            "last_week_maintenance_records": last_week_maintenance_result, "last_month_maintenance_records": last_month_maintenance_result, 
            "all_maintenance_result": all_maintenance_result, "last_record_of_failure": last_failure_time}
        print(result)
        results[machine] = result
    return results

    """ failure_count = 0
    total_failure_downtime_minutes = 0
    total_failure_duration_time = 0
    for failure in failures:
        if("DURUSSURE" in failure and int(failure["DURUSSURE"])!=0):
            failure_count += 1
            total_failure_downtime_minutes += int(failure["DURUSSURE"])
        start_time = datetime.strptime(failure["startTime"], '%Y-%m-%dT%H:%M:%S.000Z') # 2020-01-02T04:30:00.000Z
        end_time = datetime.strptime(failure["endTime"], '%Y-%m-%dT%H:%M:%S.000Z') 
        failure_time = end_time - start_time
        failure_time_minutes = failure_time.total_seconds()/60.0
        total_failure_duration_time += failure_time_minutes
    
    maintenance_count = 0
    total_maintenance_downtime_minutes = 0
    total_maintenance_duration_time = 0
    for maintenance in maintenance_records:
        if("DURUSSURE" in maintenance and int(maintenance["DURUSSURE"])!=0):
            maintenance_count += 1
            total_maintenance_downtime_minutes += int(maintenance["DURUSSURE"])
        start_time = datetime.strptime(maintenance["maintenanceTime"], '%Y-%m-%dT%H:%M:%S.000Z') 
        end_time = datetime.strptime(maintenance["maintenanceEndTime"], '%Y-%m-%dT%H:%M:%S.000Z') 
        maintenance_time = end_time - start_time
        maintenance_time_minutes = maintenance_time.total_seconds()/60.0
        total_maintenance_duration_time += maintenance_time_minutes
    
    return {"failure_count": failure_count, "allFailureCount": failures.count(), "failureDurationTime": total_failure_duration_time,
        "maintenance_count": maintenance_count, "allMaintenanceCount": maintenance_records.count(), "maintenanceDurationTime": total_maintenance_duration_time} """

    

@summary_report.route("/getIsemriCount", methods=["GET"])
# token_required(roles = ["admin", "member", "editor"])
def get_isemri_count():
    now = datetime.now()
    last_7_days = now - timedelta(days=7)
    next_7_days = now + timedelta(days=7)

    last_7_days_records = model.get_isemri_records({'duedate': {'$lt': now, '$gte': last_7_days}})
    next_7_days_records = model.get_isemri_records({'duedate': {'$lt': next_7_days, '$gte': now}})
    # json_util.dumps(), json_util.dumps(list(next_7_days_records))
    result = {"last7": len(list(last_7_days_records)), "next7": len(list(next_7_days_records))}
    print(result)
    return result

@summary_report.route("/getIsemriDistribution", methods=["GET"])
# token_required(roles = ["admin", "member", "editor"])
def get_isemri_distribution():
    records = model.get_isemri_records()
    kalite = {}
    kalinlik = {}

    for record in records:
        if(record["kalinlik"] in kalinlik):
            kalinlik[record["kalinlik"]] += 1
        else:
            if(len(record["kalinlik"]) == 0):
                if("none" in kalinlik):
                    kalinlik["none"] += 1
                else:
                    kalinlik["none"] = 1
            else:
                kalinlik[record["kalinlik"]] = 1
        if(record["kalite"] in kalite):
            kalite[record["kalite"]] += 1
        else:
            if(len(record["kalite"]) == 0):
                if("none" in kalite):
                    kalite["none"] += 1
                else:
                    kalite["none"] = 1
            else:
                kalite[record["kalite"]] = 1
    
    return {"kalite": kalite, "kalinlik": kalinlik}

@summary_report.route("/getJobsInADay", methods=["POST"])
def get_jobs_in_a_day():
    settings = request.json
    selected_date = settings["date"]
    start_date = datetime.strptime(selected_date,"%Y-%m-%d")
    end_date = start_date + timedelta(days=1)
    records = model.get_isemri_records({"duedate": {"$gte":start_date, "$lt": end_date}})
    return {"jobs": dumps(records)}
    
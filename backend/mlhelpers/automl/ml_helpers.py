import requests
import pandas as pd
from dateutil import parser, relativedelta
from ml_config import TICK_SETTINGS
from query_templates import get_measurements_query, get_fields_query, get_sensor_data_query, get_sensor_missing_data_query

def check_in_ranges(ranges, point):
    for r in ranges:
        start = r["start"] # parser.parse(r["start"])
        end = r["end"] # parser.parse(r["end"])
        pdate = pd.to_datetime(point["time"], infer_datetime_format=True) # datetime.datetime.strptime(point["time"], '%Y-%m-%dT%H:%M:%SZ') # parser.parse(point["time"])
        if(pdate>=start and pdate<=end):
            return True
    return False

def get_time_ranges(data_points):
    start_end_points = []
    for i in range(len(data_points)-1):
        if(data_points[i]["on_value"] != data_points[i+1]["on_value"]):
            if(data_points[i+1]["on_value"] == 1):
                start_end_points.append({"point": "start", "time": pd.to_datetime(data_points[i+1]["time"], infer_datetime_format=True)})
            elif(data_points[i+1]["on_value"] == 0):
                start_end_points.append({"point": "end", "time": pd.to_datetime(data_points[i+1]["time"], infer_datetime_format=True)})
    
    ranges = []
    if(len(start_end_points)):
        if(len(start_end_points)%2 == 0):
            if(start_end_points[0]["point"] == "start"):
                for i in range(0, len(start_end_points), 2):
                    ranges.append({"start": start_end_points[i]["time"], "end": start_end_points[i+1]["time"]})
            elif(start_end_points[0]["point"] == "end"):
                # like the length is odd
                if(data_points[0]["on_value"] == 1):
                    ranges.append({"start": pd.to_datetime(data_points[0]["time"], infer_datetime_format=True), "end": start_end_points[0]["time"]})
                for i in range(1, len(start_end_points)-1, 2):
                    ranges.append({"start": start_end_points[i]["time"], "end": start_end_points[i+1]["time"]})
                ranges.append({"start": start_end_points[-1]["time"], "end": pd.to_datetime(data_points[-1]["time"], infer_datetime_format=True)})
        else:
            if(start_end_points[0]["point"] == "start"):
                # if(len(start_end_points)>1):
                for i in range(0, len(start_end_points)-1, 2):
                    ranges.append({"start": start_end_points[i]["time"], "end": start_end_points[i+1]["time"]})
                # ranges.append({"start": start_end_points[-1]["time"], "end": end_date})
                ranges.append({"start": start_end_points[-1]["time"], "end": pd.to_datetime(data_points[-1]["time"], infer_datetime_format=True)})
            elif(start_end_points[0]["point"] == "end"):

                if(data_points[0]["on_value"] == 1):
                    ranges.append({"start": pd.to_datetime(data_points[0]["time"], infer_datetime_format=True), "end": start_end_points[0]["time"]})
                # like the length is even
                for i in range(1, len(start_end_points), 2):
                    ranges.append({"start": start_end_points[i]["time"], "end": start_end_points[i+1]["time"]})
    return ranges
    
def get_query_results(query_helper, type, bucket, measurement="", field="", start_time="", stop_time=""):
    if(type == "measurement"):
        query = get_measurements_query(bucket)

        result = query_helper.query_db(query)
        results = []
        for table in result:
            for record in table.records:
                results.append(record.get_value())
        
        return results
    
    elif(type == "field"):
        query = get_fields_query(bucket, measurement)

        result = query_helper.query_db(query)
        results = []
        for table in result:
            for record in table.records:
                results.append(record.get_value())
        
        return results
    
    elif(type == "sensor"):
        query = get_sensor_data_query(bucket, measurement, field, start_time, stop_time)

        result = query_helper.query_db(query)
        results = []
        for table in result:
            for record in table.records:
                data_point = {}
                data_point["time"] = record.get_time()
                data_point[f"{measurement}.{record.get_field()}"] = record.get_value()
                results.append(data_point)
        
        return results

    elif(type == "sensor-missing"):
        query = get_sensor_missing_data_query(bucket, measurement, field, start_time, stop_time, True)

        result = query_helper.query_db(query)
        results = []
        for table in result:
            for record in table.records:
                data_point = {}
                data_point["time"] = record.get_time()
                data_point[f"{measurement}.{record.get_field()}"] = record.get_value()
                results.append(data_point)
        
        return results
    
    elif(type == "sensor-missing-2"):
        query = get_sensor_missing_data_query(bucket, measurement, field, start_time, stop_time, False)

        result = query_helper.query_db(query)
        results = []
        for table in result:
            for record in table.records:
                data_point = {}
                data_point["time"] = record.get_time()
                data_point[f"{measurement}.{record.get_field()}"] = record.get_value()
                results.append(data_point)
        
        return results
    
    else:
        return []

def get_on_off_dates(start_date, end_date):
        ranges = [{"start":start_date, "end": end_date}]
        return ranges

def data_status(type, failures, experiment_name,  selected_database, selected_measurement, selected_field, query_helper, product_id, exp_start_time, creator, min_data_points, task):
    # not used sensors part
    # TODO: take sensors which will not used in ml theough API
    # not_used_sensors_objects = requests.get(url=GETNOTUSEDSENSORSURL).json()
    not_used_sensors_objects = [{"mapping": "test", "dontUseInML": True}, {"dontUseInML": True}]
    not_used_sensors = ["cycle"]
    for sensor in not_used_sensors_objects:
        if("mapping" in sensor and sensor["mapping"] != "undefined"):
            not_used_sensors.append("mean" + sensor["mapping"])    

    missing_data_points_number = 0

    all_failure_data = []
    
    for failure in failures:
        one_fail_data = []
        ten_days = failure["startTime"] - relativedelta.relativedelta(days=10)
        before_ten_days = []
        for failure2 in failures:
            if(failure2["startTime"]>ten_days and failure2["startTime"]<failure["startTime"]):
                before_ten_days.append(failure2)
        if(len(before_ten_days)):
            ten_days = before_ten_days[-1]["startTime"]
        
        # USE TEN DAYS
        duration_start_date = ten_days.isoformat()[:19] + "Z"
        duration_end_date = failure["startTime"].isoformat()[:19] + "Z"
        print("start", duration_start_date)
        print("end", duration_end_date)

        # TODO: get on off points
        # may take the database 
        on_off_ranges = get_on_off_dates(duration_start_date, duration_end_date)

        if(type == "machine"):
            # machine == database
            not_used_sensors = ["cycle"]
            # (machine == db) so get (component == measurement) names
            measurements = get_query_results(query_helper, "measurement", selected_database)
            all_data = []
            measurements = ["Press030", "Press031"]

            # TODO
            """IF ON-OFF DATA WILL BE ON INFLUX"""
            """ # remove on off data:
            if(ON_OFF_DATA_MEASUREMENT_NAME in measurements):
                measurements.remove(ON_OFF_DATA_MEASUREMENT_NAME) """

            for measurement in measurements:
                print(measurement)
                # get fields of the measurement
                fields = get_query_results(query_helper, "field", selected_database, measurement)

                for not_used_sensor in not_used_sensors:
                    if(not_used_sensor in fields):
                        fields.remove(not_used_sensor)
                
                used_data_points_missing_data_check = []
                for field in fields:
                    data = get_query_results(query_helper, "sensor-missing", selected_database, measurement, field, duration_start_date, duration_end_date)
                    # print(data)
                    df = pd.DataFrame(data)
                    data_points = []
                    if(not df.empty):
                        # convert dtype=datetime64[ns, tzutc()] to pd.Timestamp to comparision
                        df['time'] = df['time'].apply(lambda x: pd.Timestamp(x))
                        # print(df.dtypes)
                        for on_off_range in on_off_ranges:
                            # print(on_off_range["start"], on_off_range["end"])
                            df_in_range = df.loc[(df['time'] >= pd.Timestamp(on_off_range["start"])) & (df['time'] <= pd.Timestamp(on_off_range["end"]))]
                            data_points += df_in_range.to_dict("records")
                    
                    # print("---data point")
                    if(len(data_points)):
                        # all_data.append(data_points)
                        used_data_points_missing_data_check.append(data_points)

                df_missing_data_check = pd.DataFrame()
                if(len(used_data_points_missing_data_check)):
                    # merge data on time
                    df_missing_data_check = pd.DataFrame(used_data_points_missing_data_check[0])
                    for i in range(1,len(used_data_points_missing_data_check)):
                        if(len(used_data_points_missing_data_check[i])):
                            df_missing_data_check = pd.merge(df_missing_data_check, pd.DataFrame(used_data_points_missing_data_check[i]), on=["time"])

                # add null point numbers 
                missing_data_points_number += len(df_missing_data_check[df_missing_data_check.isna().any(axis=1)])

                # drop nulls get valid points
                all_data.append(df_missing_data_check.dropna().to_dict("records"))
                # df_missing_data_check.dropna().to_csv("./alldata.csv") 
            
            one_merged = pd.DataFrame()
            if(len(all_data)):
                one_merged = pd.DataFrame(all_data[0])
                print(one_merged)
                for i in range(1, len(all_data)):
                    if(len(all_data[i])):
                        one_merged = pd.merge(one_merged, pd.DataFrame(all_data[i]), on=["time"])
            all_data = one_merged.to_dict("records")
            print(len(all_data))
            print("----------")
            print(pd.DataFrame(all_data))
            
            # add all measurement data to one_failure_data
            one_fail_data = one_fail_data + all_data
        
        elif(type == "component"):
            # component == measurement
            # TODO: get not used sensors
            not_used_sensors = ["cycle"]
            all_data = []

            # get fields of the measurement
            fields = get_query_results(query_helper, "field", selected_database, selected_measurement)
            for not_used_sensor in not_used_sensors:
                if(not_used_sensor in fields):
                    fields.remove(not_used_sensor)
            
            used_data_points_missing_data_check = []
            for field in fields:
                data = get_query_results(query_helper, "sensor-missing", selected_database, selected_measurement, field, duration_start_date, duration_end_date)

                df = pd.DataFrame(data)
                data_points = []
                if(not df.empty):
                    # convert dtype=datetime64[ns, tzutc()] to pd.Timestamp to comparision
                    df['time'] = df['time'].apply(lambda x: pd.Timestamp(x))

                    for on_off_range in on_off_ranges:
                        # print(on_off_range["start"], on_off_range["end"])
                        df_in_range = df.loc[(df['time'] >= pd.Timestamp(on_off_range["start"])) & (df['time'] <= pd.Timestamp(on_off_range["end"]))]
                        data_points += df_in_range.to_dict("records")
                
                if(len(data_points)):
                    # all_data.append(data_points)
                    used_data_points_missing_data_check.append(data_points)
            
            df_missing_data_check = pd.DataFrame()
            if(len(used_data_points_missing_data_check)):
                # merge data on time
                df_missing_data_check = pd.DataFrame(used_data_points_missing_data_check[0])
                for i in range(1,len(used_data_points_missing_data_check)):
                    if(len(used_data_points_missing_data_check[i])):
                        df_missing_data_check = pd.merge(df_missing_data_check, pd.DataFrame(used_data_points_missing_data_check[i]), on=["time"])
            
            # add null point numbers 
            missing_data_points_number += len(df_missing_data_check[df_missing_data_check.isna().any(axis=1)])

            # drop nulls get valid points
            # print(df_missing_data_check.dropna())
            all_data += df_missing_data_check.dropna().to_dict("records")
            print(len(all_data))
            print("----------")
            print(pd.DataFrame(all_data))
            # df_missing_data_check.dropna().to_csv("./alldata.csv") 

            # add all measurement data to one_failure_data
            one_fail_data = one_fail_data + all_data
        
        elif(type == "sensor"):
            all_data = []

            used_data_points_missing_data_check = []

            data = get_query_results(query_helper, "sensor-missing", selected_database, selected_measurement, selected_field, duration_start_date, duration_end_date)

            df = pd.DataFrame(data)
            data_points = []
            if(not df.empty):
                # convert dtype=datetime64[ns, tzutc()] to pd.Timestamp to comparision
                df['time'] = df['time'].apply(lambda x: pd.Timestamp(x))

                for on_off_range in on_off_ranges:
                    # print(on_off_range["start"], on_off_range["end"])
                    df_in_range = df.loc[(df['time'] >= pd.Timestamp(on_off_range["start"])) & (df['time'] <= pd.Timestamp(on_off_range["end"]))]
                    data_points += df_in_range.to_dict("records")
            if(len(data_points)):
                # all_data.append(data_points)
                used_data_points_missing_data_check.append(data_points)
            
            df_missing_data_check = pd.DataFrame()
            if(len(used_data_points_missing_data_check)):
                df_missing_data_check = pd.DataFrame(used_data_points_missing_data_check[0])
            
            # add null point numbers 
            missing_data_points_number += len(df_missing_data_check[df_missing_data_check.isna().any(axis=1)])

            # drop nulls get valid points
            # print(df_missing_data_check.dropna())
            all_data += df_missing_data_check.dropna().to_dict("records")

            print(len(all_data))
            print("----------")
            print(pd.DataFrame(all_data))

            one_fail_data = one_fail_data + all_data
        else:
            one_fail_data = []
        
        if(len(one_fail_data)):
            all_failure_data.append(one_fail_data)

    # comment
    # remove empty stuff
    all_failure_data = [x for x in all_failure_data if x]
    all_failure_data = [item for sublist in all_failure_data for item in sublist]
    """ one_merged = pd.DataFrame()
    if(len(all_failure_data)):
        one_merged = pd.DataFrame(all_failure_data[0])
        print(one_merged)
        for i in range(1, len(all_failure_data)):
            if(len(all_failure_data[i])):
                print(pd.DataFrame(all_failure_data[i]))
                one_merged = pd.merge(one_merged, pd.DataFrame(all_failure_data[i]), on=["time"]) """
    # print(all_failure_data)
    print("result")
    print(pd.DataFrame(all_failure_data))
    print(len(all_failure_data))
    # print(pd.DataFrame(all_failure_data))
    if(len(all_failure_data) == 0):
        print('DataFrame is empty!')
        log_pkg = {"experimentName": experiment_name, 
                    "uploadTime": exp_start_time, 
                    "owner": creator, "taks": task, 
                    "dataPointsCount": 0, "minDataPoints": min_data_points, "missingDataPoints": missing_data_points_number}
        print(log_pkg)
        # TODO: send data status
        # requests.post(url=AUTOML_POST_NO_DATA_LOG_URL, json=log_pkg)
        return False
    
    else:
        try:
            mindpoints = int(min_data_points)
        except ValueError:
            print("Not an integer")
            mindpoints = 500

        """ points_len = 0
        for d in all_failure_data:
            points_len += len(d) """
        points_len = len(all_failure_data)

        if(points_len < mindpoints):
            print('not enough data!')
            log_pkg = {"experimentName": experiment_name, 
                "uploadTime": exp_start_time, 
                "owner": creator, "task": task, 
                "dataPointsCount": points_len, "minDataPoints": min_data_points, "missingDataPoints": missing_data_points_number}
            print(log_pkg)
            # TODO: send data status
            # requests.post(url=AUTOML_POST_NOT_ENOUGH_DATA_LOG_URL, json=log_pkg)
            return False
        else:
            log_pkg = {"experimentName": experiment_name, 
                "uploadTime": exp_start_time, 
                "owner": creator, "taks": task, 
                "dataPointsCount": points_len, "minDataPoints": min_data_points, "missingDataPoints": missing_data_points_number}
            print(log_pkg)
            # TODO: send data status
            # requests.post(url=AUTOML_POST_SUCCESS_DATA_LOG_URL, json=log_pkg)
            return True


def return_operator_info(operator, operator_value):
    return operator, operator_value

def return_default_value(val):
    if(val == TICK_SETTINGS["LAST"]):
        return (True, False, "previous")
    elif(val == TICK_SETTINGS["AVG"]):
        return (True, False, "avg")
    elif(val == TICK_SETTINGS["MAX"]):
        return (True, False, "max")
    elif(val == TICK_SETTINGS["MIN"]):
        return (True, False, "min")
    elif(val == TICK_SETTINGS["DAVG"]):
        return (True, False, "difference_avg")
    elif(val == TICK_SETTINGS["DMAX"]):
        return (True, False, "difference_max")
    elif(val == TICK_SETTINGS["DMIN"]):
        return (True, False, "difference_min")
    elif(val == "undefined"):
        return (False, True, 0)
    else:
        try:
            n = float(val)
        except ValueError:
            print("value is not numeric")
            n = 0
        return (True, True, n)
import featuretools as ft
import requests
import pandas as pd
from dateutil import parser, relativedelta
import numpy as np
import composeml as cp
import evalml
import uuid
import datetime
import time
import os
import json

from config import (
    EVALML_OBJECTIVES,
    GETFAILURESURL,
    GETNOTUSEDSENSORSURL,
    ON_OFF_DATA_MEASUREMENT_NAME,
    GETSENSORFROMMAPPING,
    BASICURL,
    PUTBASICURL,
    defaultProductID,
    host_ip,
    influx_port,
    evalml_timeout,
    POST_REG_EXP,
    MODELDIR
)

from helpers import (
    data_status,
    return_default_value,
    return_operator_info,
    check_in_ranges,
    check_in_action_ranges,
    FillNanValues,
    get_on_off_dates_data,
    get_machine_actions_data,
    POFQueryHelper
)

from customMetrics import (
    CustomExpVariance,
    CustomMAE,
    CustomMaxError,
    CustomMeanSquaredLogError,
    CustomMedianAE,
    CustomMSE,
    CustomR2,
    CustomRootMeanSquaredError,
    CustomRootMeanSquaredLogError
)

evalMLObjectives = ["ExpVariance", "MAE", "MaxError", "Mean Squared Log Error", 
    "MedianAE", "MSE", "R2", "Root Mean Squared Error", "Root Mean Squared Log Error"]

custom_metric_names = ["Custom ExpVariance", "Custom MAE", "Custom MaxError", "Custom Mean Squared Log Error", 
    "Custom MedianAE", "Custom MSE", "Custom R2", "Custom Root Mean Squared Error", "Custom Root Mean Squared Log Error"]

def isJSONSerializable(obj):
    try:
        json.dumps(obj)
        return True
    except (TypeError, OverflowError):
        return False

def numpy_converter(o):
    if isinstance(o, np.int64):
        return int(o)
    elif isinstance(o, np.float32):
        return float(o)
"""
    "Custom ExpVariance", "Custom MAE", "Custom MaxError", "Custom Mean Squared Log Error", 
    "Custom MedianAE", "Custom MSE", "Custom R2", "Custom Root Mean Squared Error", "Custom Root Mean Squared Log Error"
"""
def select_custom_metric(metric, early_guess_punishment, late_guess_punishment):
    if(metric == "Custom ExpVariance"):
        return CustomExpVariance(early_guess_punishment, late_guess_punishment)
    elif(metric == "Custom MAE"):
        return CustomMAE(early_guess_punishment, late_guess_punishment)
    elif(metric == "Custom MaxError"):
        return CustomMaxError(early_guess_punishment, late_guess_punishment)
    elif(metric == "Custom Mean Squared Log Error"):
        return CustomMeanSquaredLogError(early_guess_punishment, late_guess_punishment)
    elif(metric == "Custom MedianAE"):
        return CustomMedianAE(early_guess_punishment, late_guess_punishment)
    elif(metric == "Custom MSE"):
        return CustomMSE(early_guess_punishment, late_guess_punishment)
    elif(metric == "Custom R2"):
        return CustomR2(early_guess_punishment, late_guess_punishment)
    elif(metric == "Custom Root Mean Squared Error"):
        return CustomRootMeanSquaredError(early_guess_punishment, late_guess_punishment)
    elif(metric == "Custom Root Mean Squared Log Error"):
        return CustomRootMeanSquaredLogError(early_guess_punishment, late_guess_punishment)
    else:
        # default is custom mse
        return CustomMSE(early_guess_punishment, late_guess_punishment)

class RULRegressionSession:
    def __init__(self, settings) -> None:
        super().__init__()
        self.timeout = settings["timeout"] + " h"# evalml_timeout
        try:
            max_iterations = int(settings["maxIterations"])
            self.max_iterations = max_iterations
        except ValueError:
            print("Not an integer")
            self.max_iterations = 20
        # self.max_batches = settings["maxBatches"]
        self.creator = settings['username']
        self.experiment_name = settings['modelName']
        self.model_name = settings["modelName"]
        # self.db_settings = settings['dbSettings']
        self.start_time = settings['startTime']
        self.end_time = ""
        self.part_name = settings["partName"]
        self.type = settings["type"]
        self.database = settings["database"]
        self.measurement = settings["measurement"]
        self.field = settings["field"]
        self.min_data_points = settings["minDataPoints"]

        early_guess_punishment = settings["earlyGuessPunishment"]
        try: 
            egp = int(early_guess_punishment)
            self.early_guess_punishment = egp
        except ValueError:
            # default no punishment
            self.early_guess_punishment = 1

        late_guess_punishment = settings["lateGuessPunishment"]
        try: 
            lgp = int(late_guess_punishment)
            self.late_guess_punishment = lgp
        except ValueError:
            # default no punishment
            self.late_guess_punishment = 1

        if("productID" in settings and len(settings["productID"])):
            try:
                pid = int(settings["productID"])
                self.productID = pid
            except ValueError:
                # Handle the exception
                self.productID = defaultProductID
        else:
            self.productID = defaultProductID


        self.problem_type = "regression"
        # evalml için birkaç tane farklı fonksiyon olabilir
        # for regression: mse
        objective = settings["objective"]
        objective = objective.replace("-", " ")
        print("******************", objective)
        if(objective in EVALML_OBJECTIVES):
            self.additional_objectives = EVALML_OBJECTIVES[objective]
        else:
            self.additional_objectives = EVALML_OBJECTIVES["default"]

        # check if metric is custom
        if(objective in custom_metric_names):
            self.objective = select_custom_metric(objective, self.early_guess_punishment, self.late_guess_punishment)
            self.objective_name = objective
        else:
            self.objective = objective
            self.objective_name = objective

        
        self.influx_helper = None
        self.queryHelper = POFQueryHelper({"host": host_ip, "port": influx_port, "database": self.database})
        self.preprocess_helper = None
        self.model_ID = uuid.uuid4().hex
        self.session_ID = str(datetime.datetime.now().timestamp())[:-7]
        self.dir_name = MODELDIR + self.model_ID + "/"
        self.duration_start = {}
        self.duration_end = {}

        print("settings:  ", self.timeout, "-", self.max_iterations, "-", self.objective)
        # self.input_columns = []
        # self.output_columns = []

    def rul(self, df):
        return len(df) - 1

    def  make_entityset(self, data):
        # creating and entity set 'es'
        es = ft.EntitySet(id = 'rul')
        es.add_dataframe(dataframe_name="sensor_data",
                        index="index",
                        time_index="time",
                        dataframe=data.reset_index())
        es.normalize_dataframe(
            base_dataframe_name='sensor_data',
            new_dataframe_name ='failures',
            index='id',
        )
        es.normalize_dataframe(
            base_dataframe_name='sensor_data',
            new_dataframe_name='cycles',
            index='cycle',
        )
        return es
    
    ## start_iteration_callback example function
    def start_iteration_callback_example(self, pipeline, pipeline_params):
        print("***Training pipeline with the following parameters:", pipeline_params)
        name = pipeline.name
        if(name in self.duration_start):
            self.duration_start[name].append(time.time())
        else:
            self.duration_start[name] = [time.time()]
        # TODO: write pipelime_params to mongodb
        """ self.trial_durations[pipeline_name] = {"startTime": time.time()}
        print("-- pipeline class", pipeline_name) """
    
    ## add_result_callback example function
    def add_result_callback_example(self, pipeline_results_dict, pipeline, automl_obj):
        print("---Results for trained pipeline with the following parameters:", pipeline_results_dict)
        name = pipeline.name
        if(name in self.duration_end):
            self.duration_end[name].append(time.time())
        else:
            self.duration_end[name] = [time.time()]
        # TODO: write pipeline_result_dict to mongodb
        """ self.trial_durations[pipeline_name]["endTime"] = time.time()
        self.trial_durations[pipeline_name]["duration"] = self.trial_durations[pipeline_name]["endTime"] - self.trial_durations[pipeline_name]["startTime"]
        print("-*-* untrained_pipeline ", pipeline_name) """
        print("----- automl_obj ", automl_obj)
    
    def calculate_durations(self, startTimes, endTimes):
        durations = {}
        pipelines = list(startTimes)
        for pipeline in pipelines:
            if(pipeline in endTimes):
                durations[pipeline] = {
                        "startTime": startTimes[pipeline][0],
                        "endTime": endTimes[pipeline][0],
                        "duration": endTimes[pipeline][0]-startTimes[pipeline][0]
                    }
        return durations

    def start_tuning(self, train_df):
        start_time = datetime.datetime.now().timestamp()

        lm = cp.LabelMaker(
            target_dataframe_name="id",
            time_index="time",
            labeling_function=self.rul
        )

        labels = lm.search(
            train_df.sort_values('cycle'),
            num_examples_per_instance=20,
            minimum_data=5,
            gap=20,
            verbose=True
        )

        es = self.make_entityset(train_df)

        feature_matrix, features = ft.dfs(
            entityset=es,
            target_dataframe_name='failures',
            agg_primitives=['last', 'max', 'min', 'sum', "mean", "std"],
            trans_primitives=[],
            cutoff_time=labels,
            cutoff_time_in_index=True,
            include_cutoff_time=False,
            verbose=True,
        )

        features_names = list(feature_matrix.columns)
        if("rul" in features_names):
            features_names.remove("rul")

        fm_copy = feature_matrix.copy()
        fm_copy.reset_index(drop=True, inplace=True)
        fm_copy.ww.init()

        y = fm_copy.ww.pop('rul')
        splits = evalml.preprocessing.split_data(
                    X=fm_copy,
                    y=y,
                    test_size=0.2,
                    random_seed=2,
                    problem_type='time series regression' # 'regression',
                )

        X_train, X_holdout, y_train, y_holdout = splits

        automl = evalml.AutoMLSearch(
            X_train=X_train,
            y_train=y_train,
            problem_type='regression',            
            # allowed_model_families=['catboost', 'random_forest'],
            objective=self.objective,
            additional_objectives=self.additional_objectives,
            # max_batches=10,
            max_iterations=self.max_iterations,
            max_time=self.timeout,
            start_iteration_callback=self.start_iteration_callback_example,
            add_result_callback =self.add_result_callback_example,
            train_best_pipeline=False,
            verbose=False
        )

        automl.search(show_iteration_plot=False)

        # get all pipelines ids and make them list-sort
        pids = automl.rankings["id"].unique().tolist()
        pids.sort()

        all_parameters = []
        for id in pids:
            pipeline = automl.get_pipeline(id)
            isJSON = isJSONSerializable(pipeline.parameters)
            if(isJSON):
                all_parameters.append({"id": id, "name": pipeline.name, "parameters": pipeline.parameters})
            else:
                all_parameters.append({"id": id, "name": pipeline.name, "parameters": {}})
        

        # get the best 3 pipelines
        id_rank = automl.rankings.to_dict("list")["id"]
        best_three_ids = id_rank[:3]
        trained_pipelines = automl.train_pipelines([automl.get_pipeline(i) for i in best_three_ids])
        """ print("RESULTS: ----------------------------------------------------------------------------------------------")
        print(id_rank)
        print("start durations -------------------------------------------------------------------------------------")
        print(self.duration_start)
        print("end durations -------------------------------------------------------------------------------------")
        print(self.duration_end) """
        # print("3 pipelines: ", trained_pipelines)

        ranking_results = automl.rankings.to_dict('records')

        pipeline_holdout_scores = automl.score_pipelines([trained_pipelines[name] for name in trained_pipelines.keys()],
                                                X_holdout,
                                                y_holdout,
                                                ["MaxError", "MSE", "MAE", "Root Mean Squared Error"])
        pipeline_holdout_scores = dict(pipeline_holdout_scores)

        best_three_pipeline = []
        order = 1
        if not os.path.isdir(self.dir_name):
            os.mkdir(self.dir_name)
        ft.save_features(features, self.dir_name + "feature_definitions.json")

        for pid in best_three_ids:
            pipeline = automl.get_pipeline(pid)
            try:
                feature_importance = trained_pipelines[pipeline.name].feature_importance
                feature_importance = feature_importance.set_index('feature')['importance']
                top_k = feature_importance.abs().sort_values().tail(20).index
                top_k = list(top_k)
            except NotImplementedError:
                top_k = []

            isJSON = isJSONSerializable(pipeline.parameters)
            if(isJSON):
                best_three_pipeline.append({"id": pid, 
                        "name": pipeline.name, 
                        "parameters": pipeline.parameters,
                        "topFeatures": top_k
                        })
            else:
                best_three_pipeline.append({"id": pid, 
                        "name": pipeline.name, 
                        "parameters": {},
                        "topFeatures": top_k
                        })
            # saving the best pipeline using .save()
            trained_pipelines[pipeline.name].save(self.dir_name + "pipeline" + str(order) + ".cloudpickle")
            # write the model data to the mongodb

            features_obj = ft.save_features(features)

            model_info = {
                "Algorithm": pipeline.name,
                "task": "rulreg",
                "enabled": False,
                "modelName": self.model_name + "-pipeline" + str(order),
                "username": self.creator,
                "hardware": self.part_name,
                "modelID": self.model_ID,
                "pipelineID": self.model_ID + str(order),
                "sessionID": self.session_ID,
                "Directory": self.dir_name,
                "Settings": {
                    "timeout": self.timeout,
                    "productID": self.productID,
                    "minDataPoints": self.min_data_points,
                    "maxIterations": self.max_iterations,
                    "objective": self.objective_name,
                    "startTime": self.start_time,
                    "earlyGuessPunishment": self.early_guess_punishment,
                    "lateGuessPunishment": self.late_guess_punishment
                },
                "trainingDone": True,
                "dataInfo": {
                    "database": self.database,
                    "measurement": self.measurement,
                    "field": self.field,
                    "type": self.type,
                    "asset": self.part_name
                },
                "Optional": {
                    "cols": features_names,
                    "features": features_obj
                }
            }

            # put model when it has enough data
            # TODO: TEST
            requests.post(url=BASICURL, json=model_info)
            order += 1

        exp_results = {
            "modelID": self.model_ID,
            "experimentName": self.model_name,
            "experimentStatus": "COMPLETED",
            "experimentJob": "rulreg",
            "trainingDone": True,
            "startTime": start_time,
            "endTime": datetime.datetime.now().timestamp(),
            "durations": self.calculate_durations(self.duration_start, self.duration_end),
            "allParameters": all_parameters,
            "rankingResults": ranking_results,
            "pipelineScores": pipeline_holdout_scores,
            "bestThreePipeline": best_three_pipeline,
            "featureNames": features_names,
            "optimizer": self.objective_name,
            "earlyGuessPunishment": self.early_guess_punishment,
            "lateGuessPunishment": self.late_guess_punishment
        }

        print("-exp_results-", exp_results)
        # TODO: TEST
        requests.post(url=POST_REG_EXP, json=json.dumps(exp_results, default=numpy_converter))


    
    def prepare_data(self):
        res = requests.get(url=GETFAILURESURL + self.part_name).json()
        failures = []
        for failure in res:
            failure["failureStartTime"] = parser.parse(failure["failureStartTime"][0:16])
            failures.append(failure)
        # print("failures", failures)
        failures.sort(key=lambda r: r["failureStartTime"]) 
        continue_process = data_status(self.type, failures, self.experiment_name, self.database, self.measurement, self.field, self.queryHelper, self.productID, self.start_time, self.creator, self.min_data_points, "rul")

        if(continue_process):
            pd_data = []
            for fail in failures:
                one_fail_data = []
                ten_days = fail["failureStartTime"] - relativedelta.relativedelta(days=10)
                before_ten_days = []
                for failure in failures:
                    if(failure["failureStartTime"]>ten_days and failure["failureStartTime"]<fail["failureStartTime"]):
                        before_ten_days.append(failure)
                if(len(before_ten_days)):
                    ten_days = before_ten_days[-1]["failureStartTime"]

                # USE TEN DAYS
                duration_start_date = ten_days
                duration_end_date = fail["failureStartTime"]

                ##### GET ON OFF POINTS
                on_off_ranges = get_on_off_dates_data(duration_start_date, duration_end_date, self.database, self.queryHelper)
                """ with open('/root/BackUp_Pianism/pianism/backend/mlhelpers/rul_on-off-ranges-2.txt', 'a') as writefile:
                    json.dump(on_off_ranges, writefile, default=json_date_serial) """

                machine_actions_ranges = get_machine_actions_data(self.database)

                if(self.type == "machine"):
                    # get sensors that are selected as not to use in ml
                    not_used_sensors_objects = requests.get(url=GETNOTUSEDSENSORSURL).json()
                    not_used_sensors = []
                    for sensor in not_used_sensors_objects:
                        if(sensor["mapping"] and sensor["mapping"] != "undefined"):
                            not_used_sensors.append(sensor["mapping"])

                    # machine = db so get component = measurement names
                    measurements = []
                    measurements_query = 'SHOW MEASUREMENTS ON "{}"'.format(self.database)
                    measurements_results = self.queryHelper.queryDB(measurements_query)

                    for point in measurements_results.get_points():
                        measurements.append(point["name"])

                    # remove on off data:
                    if(ON_OFF_DATA_MEASUREMENT_NAME in measurements):
                        measurements.remove(ON_OFF_DATA_MEASUREMENT_NAME)

                    all_data = []
                    for name in measurements:
                        fields = []
                        fields_query = 'SHOW FIELD KEYS ON "{}" FROM "{}"'.format(self.database, name)
                        fields_results = self.queryHelper.queryDB(fields_query)
                        for point in fields_results.get_points():
                            if(point["fieldType"] == "integer" or point["fieldType"] == "float"):
                                fields.append(point["fieldKey"])
                        # print(fields)

                        # remove sensor that are selected as not used in ml from fields
                        for not_used_sensor in not_used_sensors:
                            if(not_used_sensor in fields):
                                fields.remove(not_used_sensor)

                        for field in fields:
                            sensor_info = requests.get(url=GETSENSORFROMMAPPING + field).json()
                            operator, operator_value = (None, None)
                            if(sensor_info):
                                if("defval" in sensor_info):
                                    influx, dval = return_default_value(sensor_info["defval"])
                                else:
                                    influx, dval = (True, 0) 
                                if("operator" and "operatorValue" in sensor_info):
                                    operator, operator_value = return_operator_info(sensor_info["operator"], sensor_info["operatorValue"])
                                else:
                                    operator, operator_value = (None, None)
                            else:
                                influx, dval = (True, 0)

                            
                            if(influx):
                                data_points = []                         
                                query = 'SELECT mean("{}") AS "mean_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(30m) fill({})'.format( 
                                    field, field, self.database, name, duration_start_date, duration_end_date, dval)
                                
                                results = self.queryHelper.queryDB(query)

                                for point in results.get_points():
                                    if(check_in_ranges(on_off_ranges, point) and check_in_action_ranges(machine_actions_ranges, point, self.productID)):
                                        data_point = {}
                                        for i,key in enumerate(point.keys()):
                                            if(key=="time"):
                                                data_point["time"] = point["time"]
                                            else:
                                                # component name + mean_sensor name
                                                key_pd = name + "." + key
                                                data_point[key_pd] = point[key]
                                        # productID = check_in_action_ranges(machine_actions_ranges, point)
                                        # data_point["productID"] = productID
                                        data_points.append(data_point)
                                
                                field_name = "mean_" + name + "." + field
                                df = pd.DataFrame(data_points)
                                if(df.empty):
                                    data_points = []
                                else:
                                    filler = FillNanValues(operator, operator_value)
                                    data_points = filler.do_operation(df, field_name).to_dict("records")
                                
                            
                            else:
                                data_points = []
                                query = 'SELECT mean("{}") AS "mean_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(30m)'.format( 
                                    field, field, self.database, name, duration_start_date, duration_end_date)

                                results = self.queryHelper.queryDB(query)

                                # field_name = name
                                for point in results.get_points():
                                    if(check_in_ranges(on_off_ranges, point) and check_in_action_ranges(machine_actions_ranges, point, self.productID)):
                                        data_point = {}
                                        for i,key in enumerate(point.keys()):
                                            if(key=="time"):
                                                data_point["time"] = point["time"]
                                            else:
                                                # component name + mean_sensor name
                                                key_pd = name + "." + key
                                                # field_name = key_pd
                                                data_point[key_pd] = point[key]
                                        # productID = check_in_action_ranges(machine_actions_ranges, point)
                                        # data_point["productID"] = productID
                                        data_points.append(data_point)
                                
                                # print(field_name)
                                field_name = "mean_" + name + "." + field
                                df = pd.DataFrame(data_points)
                                if(df.empty):
                                    data_points = []
                                else:
                                    filler = FillNanValues(operator, operator_value)
                                    data_points = filler.get_df_with_values(df, field_name, dval).to_dict("records")                            

                            if(len(data_points)):
                                all_data.append(data_points)

                    # remove empty stuff
                    all_data = [x for x in all_data if x]

                    if(len(all_data)):
                        one_merged = pd.DataFrame(all_data[0])
                        for i in range(1,len(all_data)):
                            if(len(all_data[i])):
                                one_merged = pd.merge(one_merged, pd.DataFrame(all_data[i]), on=["time"])
                        
                        if("time" in one_merged):
                            one_merged["cycle"] = 1
                            cycle = 1
                            for i in range(len(one_merged["time"])):
                                one_merged.loc[i, "cycle"] = cycle
                                cycle += 1

                            one_fail_data = one_fail_data + one_merged.to_dict("records")
                    else:
                        one_fail_data = []
                
                elif(self.type == "component"):
                    # get sensors that are selected as not to use in ml
                    not_used_sensors_objects = requests.get(url=GETNOTUSEDSENSORSURL).json()
                    not_used_sensors = []
                    for sensor in not_used_sensors_objects:
                        if(sensor["mapping"] and sensor["mapping"] != "undefined"):
                            not_used_sensors.append(sensor["mapping"])

                    # get component = measurement's all sensors = fields
                    fields = []
                    fields_query = 'SHOW FIELD KEYS ON "{}" FROM "{}"'.format(self.database, self.measurement)
                    fields_results = self.queryHelper.queryDB(fields_query)

                    for point in fields_results.get_points():
                        fields.append(point["fieldKey"])
                    
                    # remove sensor that are selected as not used in ml from fields
                    for not_used_sensor in not_used_sensors:
                        if(not_used_sensor in fields):
                            fields.remove(not_used_sensor)
                    
                    all_data = []
                    for field in fields:
                        sensor_info = requests.get(url=GETSENSORFROMMAPPING + field).json()
                        operator, operator_value = (None, None)
                        if(sensor_info):
                            if("defval" in sensor_info):
                                influx, dval = return_default_value(sensor_info["defval"])
                            else:
                                influx, dval = (True, 0) 
                            if("operator" and "operatorValue" in sensor_info):
                                operator, operator_value = return_operator_info(sensor_info["operator"], sensor_info["operatorValue"])
                            else:
                                operator, operator_value = (None, None)
                        else:
                            influx, dval = (True, 0)

                        
                        if(influx):
                            data_points = []                         
                            query = 'SELECT mean("{}") AS "mean_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(30m) fill({})'.format( 
                                field, field, self.database, self.measurement, duration_start_date, duration_end_date, dval)
                            
                            results = self.queryHelper.queryDB(query)

                            for point in results.get_points():
                                if(check_in_ranges(on_off_ranges, point) and check_in_action_ranges(machine_actions_ranges, point, self.productID)):
                                    # productID = check_in_action_ranges(machine_actions_ranges, point)
                                    # point["productID"] = productID
                                    data_points.append(point)

                            field_name = "mean" + "_" + field
                            df = pd.DataFrame(data_points)                        
                            if(df.empty):
                                data_points = []
                            else:
                                filler = FillNanValues(operator, operator_value)
                                data_points = filler.do_operation(df, field_name).to_dict("records")
                        
                        else:
                            data_points = []
                            query = 'SELECT mean("{}") AS "mean_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(30m)'.format( 
                                field, field, self.database, self.measurement, duration_start_date, duration_end_date)

                            results = self.queryHelper.queryDB(query)

                            field_name = "mean" + "_" + field
                            for point in results.get_points():
                                if(check_in_ranges(on_off_ranges, point) and check_in_action_ranges(machine_actions_ranges, point, self.productID)):
                                    # productID = check_in_action_ranges(machine_actions_ranges, point)
                                    # point["productID"] = productID
                                    data_points.append(point)
                            
                            # print(field_name)
                            df = pd.DataFrame(data_points)
                            if(df.empty):
                                data_points = []
                            else:
                                filler = FillNanValues(operator, operator_value)
                                data_points = filler.get_df_with_values(df, field_name, dval).to_dict("records")
                            

                        if(len(data_points)):
                            all_data.append(data_points)

                    # remove empty stuff
                    all_data = [x for x in all_data if x]

                    if(len(all_data)):
                        one_merged = pd.DataFrame(all_data[0])
                        for i in range(1,len(all_data)):
                            if(len(all_data[i])):
                                one_merged = pd.merge(one_merged, pd.DataFrame(all_data[i]), on=["time"])
                        
                        if("time" in one_merged):
                            one_merged["cycle"] = 1
                            cycle = 1
                            for i in range(len(one_merged["time"])):
                                one_merged.loc[i, "cycle"] = cycle
                                cycle += 1

                            one_fail_data = one_fail_data + one_merged.to_dict("records")
                    else:
                        one_fail_data = []
                
                elif(self.type == "sensor"):
                    sensor_info = requests.get(url=GETSENSORFROMMAPPING + self.field).json()
                    operator, operator_value = (None, None)
                    if(sensor_info):
                        if("defval" in sensor_info):
                            influx, dval = return_default_value(sensor_info["defval"])
                        else:
                            influx, dval = (True, 0) 
                        if("operator" and "operatorValue" in sensor_info):
                            operator, operator_value = return_operator_info(sensor_info["operator"], sensor_info["operatorValue"])
                        else:
                            operator, operator_value = (None, None)
                    else:
                        influx, dval = (True, 0)
                    
                    if(influx):
                        data_points = []                         
                        query = 'SELECT mean("{}") AS "mean_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(30m) fill({})'.format( 
                            self.field, self.field, self.database, self.measurement, duration_start_date, duration_end_date, dval)
                        
                        results = self.queryHelper.queryDB(query)

                        cycle = 1
                        for point in results.get_points():
                            if(check_in_ranges(on_off_ranges, point) and check_in_action_ranges(machine_actions_ranges, point, self.productID)):                        
                                data_point = {}
                                for i,key in enumerate(point.keys()):
                                    if(key=="time"):
                                        data_point["time"] = point["time"]
                                        data_point["cycle"] = cycle
                                        cycle += 1
                                    else:
                                        data_point[key] = point[key]
                                # productID = check_in_action_ranges(machine_actions_ranges, point)
                                # data_point["productID"] = productID                        
                                data_points.append(data_point)
                        
                        field_name = "mean_" + self.field
                        df = pd.DataFrame(data_points)
                        if(df.empty):
                            data_points = []
                        else:
                            filler = FillNanValues(operator, operator_value)
                            data_points = filler.do_operation(df, field_name).to_dict("records")
                                        
                    
                    else:
                        data_points = []
                        query = 'SELECT mean("{}") AS "mean_{}" FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(30m)'.format(
                            self.field, self.field, self.database, self.measurement, duration_start_date, duration_end_date)

                        results = self.queryHelper.queryDB(query)

                        field_name = "mean_" + self.field
                        cycle = 1
                        for point in results.get_points():
                            if(check_in_ranges(on_off_ranges, point) and check_in_action_ranges(machine_actions_ranges, point, self.productID)):
                                data_point = {}
                                for i,key in enumerate(point.keys()):
                                    if(key=="time"):
                                        data_point["time"] = point["time"]
                                        data_point["cycle"] = cycle
                                        cycle += 1
                                    else:
                                        data_point[key] = point[key]
                                # productID = check_in_action_ranges(machine_actions_ranges, point)
                                # data_point["productID"] = productID                        
                                data_points.append(data_point)
                        
                        # print(field_name)
                        df = pd.DataFrame(data_points)
                        if(df.empty):
                            data_points = []
                        else:
                            filler = FillNanValues(operator, operator_value)
                            data_points = filler.get_df_with_values(df, field_name, dval).to_dict("records")                    

                    one_fail_data = one_fail_data + data_points

                else:
                    # query = 'SELECT {}("{}") FROM "{}"."autogen"."{}" WHERE time > \'{}\' AND time < \'{}\' GROUP BY time(30m)'.format(self.groupwith, self.field, self.database, self.measurement, duration_start_date, duration_end_date)
                    no_query = "Please select type as 'machine','component' or 'sensor'"
                    print(no_query)

                pd_data.append(one_fail_data)
            

            print(self.type)
            frames = []
            fid = 1
            for d in pd_data:
                pidf = pd.DataFrame(d)
                
                if pidf.empty:
                    print('DataFrame is empty!')

                else:
                    max_time = pidf['time'].max()

                    print(max_time, pidf['time'])
                    # pidf['RUL'] = max_time - pidf['time']

                    pidf["id"] = fid
                    fid += 1
                    frames.append(pidf)
                    # print(pidf)

            if(len(frames)):
                result = pd.concat(frames).reset_index() 
                result.drop('index', axis=1, inplace=True)
                # print(result.tail(195))
                print(result.shape)
            else:
                result = pd.DataFrame()

            if result.empty:
                print('DataFrame is empty!')
                """ log_pkg = {"experimentName": self.experiment_name, "uploadTime": self.start_time, "owner": self.creator, "taks": "rul"}
                requests.post(url=AUTOML_POST_NO_DATA_LOG_URL, json=log_pkg) """
            else:
                # print("-----------------------------")
                # print(result.shape[0], self.min_data_points, type(self.min_data_points))
                try:
                    mindpoints = int(self.min_data_points)
                except ValueError:
                    print("Not an integer")
                    mindpoints = 500

                if(result.shape[0] < mindpoints):
                    print('not enough data!')

                else:
                    # pick the feature columns 
                    sensor_cols = result.columns.values.tolist()
                    print(sensor_cols)                    

                    """ obj = {
                        "Algorithm": "LSTM",
                        "task": "rul",
                        "enabled": False,
                        "modelID": self.model_ID,
                        "sessionID": "auto" + str(self.session_ID),
                        # "Settings": self.db_settings,
                        "username": self.creator,
                        "modelName": self.model_name,
                        "hardware": self.part_name,
                        "dataInfo": {
                            "database": self.database,
                            "measurement": self.measurement,
                            "field": self.field,
                            "type": self.type,
                            "asset": self.part_name,
                            "features": sensor_cols
                        },
                    }
                    print(obj) """
                    # TODO:
                    # requests.post(url=BASICURL, json=obj)
                    self.start_tuning(train_df=result) # features=sensor_cols, 
    
    def run(self):
        self.prepare_data()
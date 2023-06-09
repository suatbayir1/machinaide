import featuretools as ft
import requests
import uuid
import pandas as pd
import datetime
from dateutil import parser, relativedelta
from query_templates import get_sensor_data_query
import numpy as np
import composeml as cp
import evalml
import uuid
import datetime
import time
import os
import json

from FillNanValues import FillNanValues

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

from helpers import (
    QueryHelper,
    data_status,
    return_default_value,
    return_operator_info
)

from ml_config import (
    INFLUX,
    DEFAULT_PRODUCT_ID,
    EVALML_OBJECTIVES,
    GET_FAILURES_URL,
    MODELS_DIR,
    POST_MODEL_URL,
    AUTOML_POST_REG_EXPERIMENT_URL,
    TICK_SETTINGS,
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

        # asset settings for failure records
        self.asset_name = settings["assetName"]

        # sensor data
        self.fields = settings["fields"]

        # helpers
        self.query_helper = QueryHelper({"url": INFLUX["host"], "token": INFLUX["dbtoken"], "org": INFLUX["orgID"]})

        # admin settings
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

        try:
            max_iterations = int(settings["maxIterations"])
            self.max_iterations = max_iterations
        except ValueError:
            print("Not an integer")
            self.max_iterations = 20
        
        # evalml_timeout
        self.timeout = settings["timeout"] + " h"

        # api token
        self.token = settings["token"]

        # experiment settings
        self.model_ID = uuid.uuid4().hex
        self.session_ID = settings['sessionID']
        self.experiment_name = settings["experimentName"] # model name == experiment name
        self.creator = settings["creator"]

        self.start_time = time.time()

        if("productID" in settings and len(settings["productID"])):
            self.product_id = settings["productID"]
        else:
            self.product_id = DEFAULT_PRODUCT_ID
        
        # to calculate duration
        self.duration_start = {}
        self.duration_end = {}

        # evalml için birkaç tane farklı fonksiyon olabilir
        # for regression: mse
        objective = settings["objective"]
        objective = objective.replace("-", " ")

        # directory name for feature and model write
        self.dir_name = MODELS_DIR + self.model_ID + "/"

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
        
    def get_on_off_dates(self, start_date, end_date):
        ranges = [{"start":start_date, "end": end_date}]
        return ranges

    def rul(self, df):
        return len(df) - 1
    
    def get_query_results(self, bucket, measurement="", field="", start_time="", stop_time=""):
        query = get_sensor_data_query(bucket, measurement, field, start_time, stop_time)

        result = self.query_helper.query_db(query)
        results = []
        for table in result:
            for record in table.records:
                data_point = {}
                data_point["time"] = record.get_time()
                data_point[f"{measurement}.{record.get_field()}"] = record.get_value()
                results.append(data_point)
        
        return results
        
    def prepare_data(self):
        # TODO: get failures 
        failure_res = requests.post(url=GET_FAILURES_URL, json={"sourceName": self.asset_name}, headers={'token': self.token, 'Content-Type': 'application/json'}).json()
        print("first", failure_res)
        failure_res = json.loads(failure_res["data"]["data"])
        """ failure_res = [
            {
                "failureStartTime": '2022-05-30T10:16'
            },
            {
                "failureStartTime": '2022-06-02T11:30'
            },] """
        print("fail res", failure_res)
        failures = []
        for failure in failure_res:
            failure["startTime"] = parser.parse(failure["startTime"][0:16])
            data_start = datetime.datetime(2022, 4, 1)
            print("--", failure, data_start)
            if(failure["startTime"] >= data_start):
                failures.append(failure)
        
        failures.sort(key=lambda r: r["startTime"])
        print("failures: ", failures)
        # check if data has enough data points
        continue_process = data_status(failures, self.experiment_name, self.fields, self.query_helper, self.product_id, self.start_time, self.creator, self.min_data_points, "pof")
        print("real result: ", continue_process)
        # continue_process = False
        if(continue_process):
            all_failure_data = []
            
            for failure in failures:
                one_fail_data = []
                ten_days = failure["startTime"] - relativedelta.relativedelta(days=10) # days=10
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

                ##### GET ON OFF POINTS
                on_off_ranges = self.get_on_off_dates(duration_start_date, duration_end_date)

                # TODO: add not used sensors
                not_used_sensors = ["cycle"]

                # remove sensor that are selected as not used in ml from fields
                fields = [field for field in self.fields if not field["dataSource"] in not_used_sensors]

                all_data = []
                for field in fields:
                    # TODO
                    # sensor_info = requests.get(url=GETSENSORFROMMAPPING + field).json()

                    # sensor_info = {"defaultValue": "-666", "operator": "*", "operatorValue": "2"}

                    sensor_info = {}
                    if("isFillNullActive" in field and field["isFillNullActive"]):
                        if("defaultValue" in field):
                            sensor_info["defaultValue"] = field["defaultValue"]
                        else:
                            sensor_info["defaultValue"] = TICK_SETTINGS["LAST"]
                    if("isOperationActive" in field and field["isOperationActive"]):
                        if("operation" and "operationValue" in field):
                            sensor_info["operation"] = field["operation"]
                            sensor_info["operationValue"] = field["operationValue"]

                    # prepare fillnan configurations
                    do_fill_nan = False
                    is_numeric = True
                    default_value = 0
                    operator, operator_value = (None, None)
                    if(sensor_info):
                        if("defaultValue" in sensor_info):
                            do_fill_nan, is_numeric, default_value = return_default_value(sensor_info["defaultValue"])
                        else:
                            do_fill_nan, is_numeric, default_value = (False, True, 0)
                        if("operation" and "operationValue" in sensor_info):
                            operator, operator_value = return_operator_info(sensor_info["operation"], sensor_info["operationValue"])
                        else:
                            operator, operator_value = (None, None)
                    
                    boolean_vals = ["Pres-Counter_Reset", "AnaMotor-Counter_Reset", "RegMotor-Counter_Reset", "YagMotor-Counter_Reset", "KaMotor-Counter_Reset"]
                    if(field["measurement"] != "Pres31-AlarmlarDB" and (not (field["measurement"] == "Pres31-Energy_DB" and (field["dataSource"] in boolean_vals)))):
                        data = self.get_query_results(field["database"], field["measurement"], field["dataSource"], duration_start_date, duration_end_date)
                    else:
                        data = []
                    df = pd.DataFrame(data)
                    data_points = []
                    if(not df.empty):
                        filler = FillNanValues(operator, operator_value, is_numeric, default_value)
                        measurement = field["measurement"]
                        field_source = field["dataSource"]
                        # do fillnan operation if user selected a default value for field
                        if(do_fill_nan):
                            field_name = f"{measurement}.{field_source}"
                            df = filler.get_df_with_values(df, field_name, default_value).dropna()
                        
                        # do operation if user selected a operation for field
                        if(operator and operator_value):
                            field_name = f"{measurement}.{field_source}"
                            df = filler.do_operation(df, field_name).dropna()

                        # convert dtype=datetime64[ns, tzutc()] to pd.Timestamp to comparision
                        df['time'] = df['time'].apply(lambda x: pd.Timestamp(x))

                        for on_off_range in on_off_ranges:
                            # print(on_off_range["start"], on_off_range["end"])
                            df_in_range = df.loc[(df['time'] >= pd.Timestamp(on_off_range["start"])) & (df['time'] <= pd.Timestamp(on_off_range["end"]))]
                            data_points += df_in_range.to_dict("records")
                    
                    if(len(data_points)):
                        all_data.append(data_points)
                

                """ if(len(all_data)):
                    one_merged = pd.DataFrame(all_data[0])
                    for i in range(1,len(all_data)):
                        if(len(all_data[i])):
                            one_merged = pd.merge(one_merged, pd.DataFrame(all_data[i]), on=["time"])
                    
                    if("time" in one_merged):
                        cycle = 0
                        for i in range(len(one_merged["time"])):
                            one_merged.loc[i, "cycle"] = cycle
                            cycle += 1

                        one_fail_data = one_fail_data + one_merged.to_dict("records")
                    # print(one_merged)
                else:
                    one_fail_data = [] """

                # make time as key and add ather sensors to the time keys dict value
                all_data_in_one = {}
                if(len(all_data)):
                    print("here1", len(all_data[0]))
                    print(all_data[0])
                    for record in all_data[0]:
                        for key in record:
                            if(key != "time"):
                                all_data_in_one[record["time"]] = {key: record[key]}
                    for i in range(1,len(all_data)):
                        print("start", i)
                        for record in all_data[i]:
                            for key in record:
                                if(key != "time"):
                                    all_data_in_one[record["time"]][key] = record[key]
                        print("end", i)

                adjusted_data = []
                for key in all_data_in_one.keys():
                    new_row = {"time": key}
                    new_row.update(all_data_in_one[key])
                    adjusted_data.append(new_row)

                cycle = 0
                for adata in adjusted_data:
                    adata["cycle"] = cycle
                    cycle += 1

                one_fail_data = adjusted_data                 
                                
                # print(one_fail_data)
                all_failure_data.append(one_fail_data)
            
            frames = []
            fid = 1
            for d in all_failure_data:
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
            
            else:
                result = result.fillna(method="ffill")
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
                    print("rul reg data:")
                    print(result)

                    self.start_tuning(train_df=result)

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
    
    
    def start_tuning(self, train_df):
        start_time = time.time() # datetime.datetime.now().timestamp()

        lm = cp.LabelMaker(
            target_dataframe_name="id",
            time_index="time",
            labeling_function=self.rul
        )

        labels = lm.search(
            train_df.sort_values('time'),
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
        print("RESULTS: ----------------------------------------------------------------------------------------------")
        print(id_rank)
        print("start durations -------------------------------------------------------------------------------------")
        print(self.duration_start)
        print("end durations -------------------------------------------------------------------------------------")
        print(self.duration_end)

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
                "algorithm": pipeline.name,
                "task": "rulreg",
                "enabled": False,
                "modelName": self.experiment_name + "-pipeline" + str(order),
                "creator": self.creator,
                "assetName": self.asset_name,
                "modelID": self.model_ID,
                "pipelineID": self.model_ID + str(order),
                "sessionID": self.session_ID,
                "startTime": self.start_time,
                "endTime": time.time(),
                # "Directory": self.dir_name,
                "settings": {
                    "timeout": self.timeout,
                    "productID": self.product_id,
                    "minDataPoints": self.min_data_points,
                    "maxIterations": self.max_iterations,
                    "objective": self.objective_name,
                    "startTime": self.start_time,
                    "earlyGuessPunishment": self.early_guess_punishment,
                    "lateGuessPunishment": self.late_guess_punishment
                },
                "trainingDone": True,
                "dataInfo": {
                    "fields": self.fields,
                    "assetName": self.asset_name
                },
                "optional": {
                    "cols": features_names,
                    "features": features_obj
                }
            }

            # put model when it has enough data
            # TODO: TEST
            requests.post(url=POST_MODEL_URL, json=model_info)
            order += 1

        exp_results = {
            "modelID": self.model_ID,
            "experimentName": self.experiment_name,
            "experimentStatus": "COMPLETED",
            "experimentJob": "rulreg",
            "trainingDone": True,
            "startTime": start_time,
            "endTime": time.time(), # datetime.datetime.now().timestamp(),
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
        requests.post(url=AUTOML_POST_REG_EXPERIMENT_URL, json=json.dumps(exp_results, default=numpy_converter))

        json_file_path = F"{os.getcwd()}/experiment_settings/{self.experiment_name}-{self.session_ID}.json"
        if(os.path.exists(json_file_path)):
            os.remove(json_file_path)
    
    def run(self):
        self.prepare_data()
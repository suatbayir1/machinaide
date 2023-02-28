import os
import uuid
import time
import json
import requests
import tensorflow as tf
import keras_tuner as kt
import datetime
from dateutil import parser, relativedelta
import numpy as np
from sklearn import preprocessing
import pandas as pd
from ml_helpers_ver2 import data_status, return_default_value, return_operator_info
from ml_config import (
    DEFAULT_PRODUCT_ID,
    HOST_IP,
    INFLUX_PORT,
    AUTOML_OPTIMIZERS,
    GETFAILURESURL,
    RUL_SEQUENCE_LENGTH,
    MAX_EPOCHS,
    MAX_TRIALS,
    EXECUTIONS_PER_TRIAL,
    EXPERIMENT_PATH,
    MODEL_DIR,
    influx,
    GET_FAILURES_URL,
    AUTOML_POST_EXPERIMENT_URL,
    AUTOML_CHANGE_STATUS_URL,
    AUTOML_UPDATE_EXPERIMENT_URL,
    UPDATE_MODEL_URL,
    POST_MODEL_URL,
    TICK_SETTINGS
)
from sklearn.metrics import confusion_matrix, recall_score, precision_score
from query_templates import get_measurements_query, get_fields_query, get_sensor_data_query
from FillNanValues import FillNanValues
from QueryHelper import QueryHelper
from CustomMetric import CustomMetric
from RULModelComponents import (
    RULModelBuilder, 
    RULHyperband, 
    RULRandomSearch, 
    RULBayesianOptimization,
    RULReportIntermediates, 
    start_rul_automl_experiment,
    numpy_converter
)

class RULAutoMLSession:
    def __init__(self, settings) -> None:
        super().__init__()
        # asset/data settings
        self.asset_name = settings["assetName"]
        # self.type = settings["type"]
        # self.database = settings["database"]
        # self.measurement = settings["measurement"]
        # self.field = settings["field"]
        self.fields = settings["fields"]

        # helpers
        self.query_helper = QueryHelper({"url": influx["host"], "token": influx["dbtoken"], "org": influx["orgID"]})

        # admin settings
        self.min_data_points = settings["minDataPoints"]
        self.custom_metric_equation = settings["customMetricEquation"]
        self.custom_metric_direction = settings["customMetricDirection"]
        self.timeout = settings["timeout"]
        # self.number_of_features = settings["numberOfFeatures"]
        self.number_of_epochs = settings["numberOfEpochs"]
        
        # experiment settings
        self.model_ID = uuid.uuid4().hex
        self.session_ID = settings['sessionID']
        self.experiment_name = settings["experimentName"] # model name == experiment name
        self.creator = settings["creator"]
        # self.db_settings = settings["dbSettings"]
        self.start_time = time.time()# settings["startTime"]

        # api token
        self.token = settings["token"]

        # automl settings
        tuner_type = settings["tunerType"]
        tuner = "hyperband"
        if tuner_type == "Hyperband":
            tuner = 'hyperband'
        elif tuner_type == "Random Search":
            tuner = 'random'
        elif tuner_type == "Bayesian Optimization":
            tuner = 'bayesian'
        else:
            tuner = 'hyperband'
        self.tuner_type = tuner
        # delete this
        # settings["optimizer"] = "recall"
        print("settings", settings)
        self.optimizer = settings["optimizer"]

        if(("windowLength" in settings) and (isinstance(settings["windowLength"], int) or len(settings["windowLength"]))):
            self.window_length = settings["windowLength"]
        else:
            self.window_length = 30

        if("productID" in settings and len(settings["productID"])):
            self.product_id = settings["productID"]
        else:
            self.product_id = DEFAULT_PRODUCT_ID


        if(settings["optimizer"] in AUTOML_OPTIMIZERS): # check if db has valid optimizer name
            self.optimizer_settings = AUTOML_OPTIMIZERS[settings["optimizer"]]
            self.optimizer_name = settings["optimizer"]
            if(self.optimizer_settings["objective"] == "custom_metric"):
                # check if equation is valid
                tp = 1
                fp = 1
                tn = 1
                fn = 1
                try:
                    print(eval(settings["customMetricEquation"]))
                    self.optimizer_settings["compile"] = ["acc", "Precision", "Recall", CustomMetric(settings["customMetricEquation"])]
                    self.optimizer_settings["objective"] = kt.Objective("custom_metric", direction=settings["customMetricDirection"])
                except (SyntaxError, NameError, TypeError):
                    # if equation is not valid then use default one
                    self.optimizer_settings = AUTOML_OPTIMIZERS["default"]
                    self.optimizer_name = "val_accuracy"
                except (ZeroDivisionError):
                    print("zero division error")
                    self.optimizer_settings["compile"] = ["acc", "Precision", "Recall", CustomMetric(settings["customMetricEquation"])]
                    self.optimizer_settings["objective"] = kt.Objective("custom_metric", direction=settings["customMetricDirection"])
                
        else:
            self.optimizer_settings = AUTOML_OPTIMIZERS["default"]
            self.optimizer_name = "val_accuracy"
        
        print(self)

    def start_tuning(self, seq_array, label_array, seq_len, features, train_df):
        start_rul_automl_experiment(self.experiment_name)
        settings = {
            "tunerType": self.tuner_type,
            "numberOfFeatures": len(features),
            "numberOfEpochs": self.number_of_epochs, 
            "optimizer": self.optimizer_name,
            "minDataPoints": self.min_data_points
        }
        experiment = {
            "experimentName": self.experiment_name, 
            'experimentStatus': "RUNNING", 
            "experimentJob": "rul",
            "creator": self.creator, 
            "timeout": self.timeout, 
            "settings": settings,
            "features": features, 
            "uploadTime": self.start_time,
            "windowLength": self.window_length,
            "optimizer": self.optimizer_name,
            "customMetricEquation": self.custom_metric_equation,
            "customMetricDirection": self.custom_metric_direction,
            "startTime": time.time(),
            "trials": [],
        }
        print(experiment)
        # TODO: post experiment -108-
        requests.post(url=AUTOML_POST_EXPERIMENT_URL , json=experiment)

        model_builder = RULModelBuilder(sequence_length=seq_len, seq_array=seq_array, label_array=label_array, optimizers=self.optimizer_settings["compile"])

        if self.tuner_type == "hyperband":
            tuner =  RULHyperband(
                        seq_array=seq_array,
                        train_df=train_df,
                        seq_len=seq_len,
                        hypermodel=model_builder,  
                        objective=self.optimizer_settings["objective"],
                        max_epochs=MAX_EPOCHS, 
                        factor=3,
                        directory=EXPERIMENT_PATH,# 'mlhelpers/experiments',
                        project_name=self.experiment_name,
                        overwrite=True)
            print("hyperband", tuner)
        elif self.tuner_type == "random":
            tuner = RULRandomSearch(
                        seq_array=seq_array,
                        train_df=train_df,
                        seq_len=seq_len,
                        hypermodel=model_builder,
                        objective=self.optimizer_settings["objective"],
                        seed=1,
                        max_trials=MAX_TRIALS,
                        executions_per_trial=EXECUTIONS_PER_TRIAL,
                        directory=EXPERIMENT_PATH,# 'mlhelpers/experiments',
                        project_name=self.experiment_name,
                        overwrite=True)
            print("random", tuner)
        elif self.tuner_type == "bayesian":
            tuner = RULBayesianOptimization(
                            seq_array=seq_array,
                            train_df=train_df,
                            seq_len=seq_len,
                            hypermodel=model_builder,
                            objective=self.optimizer_settings["objective"],
                            max_trials=MAX_TRIALS,
                            executions_per_trial=EXECUTIONS_PER_TRIAL,
                            directory=EXPERIMENT_PATH,# 'mlhelpers/experiments',
                            project_name=self.experiment_name,
                            overwrite=True)
            print("bayesian", tuner)
        
        stop_early = tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=5)

        int_callback = RULReportIntermediates(self.experiment_name) 

        tuner.search(seq_array, label_array, epochs=self.number_of_epochs, validation_split=0.2, callbacks=[stop_early, int_callback])

        # TODO: change experiment status from "running" to "completed" -108-
        requests.put(url=AUTOML_CHANGE_STATUS_URL , json={'experiment_name': self.experiment_name})

        best_hps=tuner.get_best_hyperparameters(num_trials=1)[0]
        model = tuner.hypermodel.build(best_hps)

        model = tuner.hypermodel.build(best_hps)
        history = model.fit(seq_array, label_array, epochs=best_hps.get('epochs'), batch_size=50, validation_split=0.2, verbose=1)

        # val_acc_per_epoch = history.history['val_acc']
        val_recall_per_epoch = history.history['val_recall']
        best_epoch = val_recall_per_epoch.index(max(val_recall_per_epoch)) + 1
        print('Best epoch: ',best_epoch)
        hypermodel = tuner.hypermodel.build(best_hps)

        # TODO: do logging callback
        # Retrain the model
        # log_file = log_path + self.model_name + "-" + self.creator + ".txt"

        hypermodel.fit(seq_array, label_array, epochs=best_epoch, batch_size=50, validation_split=0.2, verbose=1)

        # test on train data
        eval_result = hypermodel.evaluate(seq_array, label_array)
        print(hypermodel.metrics_names, "--", eval_result)
        """ if(np.isnan(eval_result).any()):
            eval_result = None """

        y_pred = hypermodel.predict(seq_array,verbose=1, batch_size=100)
        y_pred = (y_pred > 0.5).astype("int32")
        y_true = label_array

        precision = precision_score(y_true, y_pred)
        recall = recall_score(y_true, y_pred)

        if not os.path.isdir(MODEL_DIR):
            os.mkdir(MODEL_DIR)

        t_dir = MODEL_DIR + self.model_ID + "/"
        print(precision, recall)
        if not os.path.isdir(t_dir):
            os.mkdir(t_dir)

        hypermodel.save(MODEL_DIR + self.model_ID + "/model.h5", save_format='h5') 

        pkg =  {"experiment_name": self.experiment_name, "metric_name": hypermodel.metrics_names, "metric_value": eval_result, "end_time": time.time(),
            "accuracy": eval_result[1], "precision": precision, "recall": recall, "windowLength": self.window_length}
        
        # TODO: update experiment results -108-
        requests.put(url=AUTOML_UPDATE_EXPERIMENT_URL, json=json.dumps(pkg, default=numpy_converter))

        obj = {
            # "directory": t_dir,
            "optional": {
                "vectorLength": seq_len,
            }
        }

        print(pkg, obj)

        # TODO update trained model info -108-
        requests.put(url=UPDATE_MODEL_URL + self.model_ID, json=obj)

        # TODO delete json settings
        json_file_path = F"{os.getcwd()}/experiment_settings/{self.experiment_name}-{self.session_ID}.json"
        if(os.path.exists(json_file_path)):
            os.remove(json_file_path)
        """ if os.path.exists(log_file):
            time.sleep(5)
            os.remove(log_file) """


    def get_query_results(self, type, bucket, measurement="", field="", start_time="", stop_time=""):
        if(type == "measurement"):
            query = get_measurements_query(bucket)

            result = self.query_helper.query_db(query)
            results = []
            for table in result:
                for record in table.records:
                    results.append(record.get_value())
            
            return results
        
        elif(type == "field"):
            query = get_fields_query(bucket, measurement)

            result = self.query_helper.query_db(query)
            results = []
            for table in result:
                for record in table.records:
                    results.append(record.get_value())
            
            return results
        
        elif(type == "sensor"):
            if(measurement != "Pres31-AlarmlarDB"):
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
            else:
                return []
        
        else:
            return []

    
    def gen_sequence(self, all_df, seq_length, seq_cols):
        """ Only sequences that meet the window-length are considered, no padding is used. This means for testing
        we need to drop those which are below the window-length. An alternative would be to pad sequences so that
        we can use shorter ones """
        data_array = all_df[seq_cols].values
        num_elements = data_array.shape[0]
        for start, stop in zip(range(0, num_elements-seq_length), range(seq_length, num_elements)):
            yield data_array[start:stop, :]
    
    # function to generate labels
    def gen_labels(self, all_df, seq_length, label):
        data_array = all_df[label].values
        num_elements = data_array.shape[0]
        return data_array[seq_length:num_elements, :]
    
    def get_on_off_dates(self, start_date, end_date):
        """ name = "main_component"
        data_points = []   

        # get one point before
        query_before = 'SELECT "{}" FROM "{}"."autogen"."{}" WHERE time < \'{}\' ORDER BY time DESC LIMIT 1'.format("on_value", 
            self.database, name, start_date)
        
        results_before = self.queryHelper.queryDB(query_before)

        for point in results_before.get_points():
            data_points.append(point)

        query = 'SELECT "{}" FROM "{}"."autogen"."{}" WHERE time >= \'{}\' AND time <= \'{}\' fill({})'.format("on_value", 
            self.database, name, start_date, end_date, "previous")
        
        results = self.queryHelper.queryDB(query)

        for point in results.get_points():      # data nasıl? eğer on ise o tarihte 1 değilse 0
            data_points.append(point)

        # get one point after
        query_after = 'SELECT "{}" FROM "{}"."autogen"."{}" WHERE time >  \'{}\' LIMIT 1'.format("on_value", 
            self.database, name, end_date)
        
        results_after = self.queryHelper.queryDB(query_after)

        for point in results_after.get_points():
            data_points.append(point)
        with open('/root/BackUp_Pianism/pianism/backend/mlhelpers/rul_on-off-points.txt', 'a') as writefile:
            json.dump(data_points, writefile, default=json_date_serial)
        if(len(data_points)>1):
            # if machine has on-off data
            ranges = get_time_ranges(data_points)
        else:
            # if there is no on off data, then use failure start and end points
            ranges = [{"start":start_date, "end": end_date}]
        return ranges """
        ranges = [{"start":start_date, "end": end_date}]
        return ranges
        
    
    def prepare_data(self):
        # TODO: get failures 
        failure_res = requests.post(url=GET_FAILURES_URL, json={"sourceName": self.asset_name}, headers={'token': self.token, 'Content-Type': 'application/json'}).json()
        failure_res = json.loads(failure_res["data"]["data"])
        """ failure_res = [
            {
                "failureStartTime": '2022-05-30T10:16'
            },
            {
                "failureStartTime": '2022-06-02T11:30'
            },] """
        print("failure res", failure_res)
        failures = []
        for failure in failure_res:
            failure["startTime"] = parser.parse(failure["startTime"][0:16])
            data_start = datetime.datetime(2022, 4, 1)
            if(failure["startTime"] >= data_start):
                failures.append(failure)
        
        failures.sort(key=lambda r: r["startTime"])
        print("failures: ", failures)
        # check if data has enough data points
        continue_process = data_status(failures, self.experiment_name, self.fields, self.query_helper, self.product_id, self.start_time, self.creator, self.min_data_points, "rul")
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

                    # sensor_info = {"defaultValue": "-666", "operation": "*", "operationValue": "2"}

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
                        data = self.get_query_results("sensor", field["database"], field["measurement"], field["dataSource"], duration_start_date, duration_end_date)
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
                        cycle = 1
                        for i in range(len(one_merged["time"])):
                            one_merged.loc[i, "time"] = cycle
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

                cycle = 1
                for adata in adjusted_data:
                    adata["time"] = cycle
                    cycle += 1

                one_fail_data = adjusted_data                
                # print(one_fail_data)
                all_failure_data.append(one_fail_data)
                
                
            print("--545--")
            frames = []
            fid = 1
            seq_len = RUL_SEQUENCE_LENGTH
            for d in all_failure_data:
                pidf = pd.DataFrame(d)
                
                if pidf.empty:
                    print('DataFrame is empty!')

                else:
                    max_time = pidf['time'].max()

                    print(max_time, pidf['time'])
                    pidf['RUL'] = max_time - pidf['time']

                    try:
                        window_length = int(self.window_length)
                        if(window_length<7):
                            window_length = 7
                    except ValueError:
                        print("value is not numeric")
                        window_length = 30

                    w1 = window_length

                    pidf['label1'] = np.where(pidf['RUL'] <= w1, 1, 0 )

                    # MinMax normalization
                    pidf['time_norm'] = pidf['time']
                    pidf["id"] = fid
                    fid += 1
                    cols_normalize = pidf.columns.difference(['id', 'time','RUL','label1']) 
                    min_max_scaler = preprocessing.MinMaxScaler()
                    norm_pidf = pd.DataFrame(min_max_scaler.fit_transform(pidf[cols_normalize]), 
                                                columns=cols_normalize)
                    join_df = pidf[pidf.columns.difference(cols_normalize)].join(norm_pidf)
                    pidf = join_df.reindex(columns = pidf.columns)

                    seq_len = min(seq_len, pidf.shape[0])
                    frames.append(pidf)
            if(len(frames)):
                result = pd.concat(frames).reset_index() 
                result.drop('index', axis=1, inplace=True)
                # print(result.tail(195))
                print(result.shape)
            else:
                result = pd.DataFrame()
            
            print(result)
            # TODO: 29.07.2022
            result = result.fillna(method="ffill")
            # result.to_csv("./18-2_flux_df_out_sensor-fill.csv")  

            if result.empty:
                print('DataFrame is empty!')
                """ log_pkg = {"experimentName": self.experiment_name, "uploadTime": self.start_time, "owner": self.creator, "taks": "rul"}
                requests.post(url=AUTOML_POST_NO_DATA_LOG_URL, json=log_pkg) """
            else:
                try:
                    mindpoints = int(self.min_data_points)
                except ValueError:
                    print("Not an integer")
                    mindpoints = 500

                if(result.shape[0] < mindpoints):
                    print('not enough data!')
                    """ log_pkg = {"experimentName": self.experiment_name, "uploadTime": self.start_time, "owner": self.creator, "task": "pof"}
                    requests.post(url=AUTOML_POST_NOT_ENOUGH_DATA_LOG_URL, json=log_pkg) """
                else:
                    # pick the feature columns 
                    sensor_cols = result.columns.values.tolist()
                    sensor_cols.remove("time")
                    sensor_cols.remove("RUL")
                    sensor_cols.remove("label1")
                    sensor_cols.remove("id")
                    print(sensor_cols)

                    seq_len = seq_len - 1

                    seq_gen = (list(self.gen_sequence(result[result['id']==fid], seq_len, sensor_cols)) 
                        for fid in result['id'].unique())

                    # generate sequences and convert to numpy array
                    seq_array = np.concatenate(list(seq_gen)).astype(np.float32)

                    # generate labels
                    label_gen = [self.gen_labels(result[result['id']==id], seq_len, ['label1']) 
                        for id in result['id'].unique()]
                    label_array = np.concatenate(label_gen).astype(np.float32)

                    print(label_array.shape)
                    print(len(seq_array), len(seq_array[0]))

                    obj = {
                        "algorithm": "LSTM",
                        "task": "rul",
                        "enabled": False,
                        "modelID": self.model_ID,
                        "sessionID": "auto" + str(self.session_ID),
                        "startTime": self.start_time,
                        # "Settings": self.db_settings,
                        "creator": self.creator,
                        "modelName": self.experiment_name,
                        "assetName": self.asset_name,
                        "dataInfo": {
                            "fields": self.fields,
                            "asset": self.asset_name,
                            "sequenceLength" : seq_len,
                            "windowLength": self.window_length,
                            "optimizer": self.optimizer_name,
                            "customMetricEquation": self.custom_metric_equation,
                            "customMetricDirection": self.custom_metric_direction
                        },
                    }
                    print(obj)

                    # TODO: post model info -108-
                    requests.post(url=POST_MODEL_URL, json=obj)

                    self.start_tuning(seq_array=seq_array, label_array=label_array, seq_len=seq_len, features=sensor_cols, train_df=result)
    def run(self):
        self.prepare_data()
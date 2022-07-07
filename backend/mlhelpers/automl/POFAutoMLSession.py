from POFModelComponents import start_pof_automl_experiment
from QueryHelper import QueryHelper
import os
import json
import time
import uuid
import requests
import numpy as np
import pandas as pd
from FillNanValues import FillNanValues
from tensorflow.keras import backend as k
from dateutil import parser, relativedelta
from sklearn.preprocessing import normalize
from query_templates import get_sensor_data_query
from tensorflow.keras.callbacks import History
from ml_helpers_ver2 import data_status, return_default_value, return_operator_info
from ml_config import (
    influx,
    DEFAULT_PRODUCT_ID,
    GET_FAILURES_URL,
    POST_MODEL_URL,
    AUTOML_POST_EXPERIMENT_URL,
    EXPERIMENT_PATH,
    AUTOML_CHANGE_STATUS_URL,
    MODEL_DIR,
    AUTOML_UPDATE_EXPERIMENT_URL,
    UPDATE_MODEL_URL
)
from POFModelComponents import (
    POFModelBuilder,
    POFHyperband,
    POFRandomSearch,
    POFBayesianOptimization,
    POF_EXECUTIONS_PER_TRIAL,
    POF_MAX_EPOCHS,
    POF_MAX_TRIALS,
    POFReportIntermediates,
    numpy_converter
)

class POFAutoMLSession:
    def __init__(self, settings) -> None:
        super().__init__()
        # assets/data settings
        self.asset_name = settings["assetName"]
        self.fields = settings["fields"]

        # helpers
        self.query_helper = QueryHelper({"url": influx["host"], "token": influx["dbtoken"], "org": influx["orgID"]})

        # admin settings
        self.min_data_points = settings["minDataPoints"]
        self.custom_metric_equation = settings["customMetricEquation"]
        self.custom_metric_direction = settings["customMetricDirection"]
        self.timeout = settings["timeout"]
        self.number_of_epochs = settings["numberOfEpochs"]
        self.max_time = 100

        # experiment settings
        self.model_ID = uuid.uuid4().hex
        self.session_ID = settings['sessionID']
        self.experiment_name = settings["experimentName"] # model name == experiment name
        self.creator = settings["creator"]
        # self.db_settings = settings["dbSettings"]
        self.start_time = time.time()# settings["startTime"]
        self.end_time = ""

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
        # self.optimizer = settings["optimizer"]

        if("productID" in settings and len(settings["productID"])):
            self.product_id = settings["productID"]
        else:
            self.product_id = DEFAULT_PRODUCT_ID

    def get_on_off_dates(self, start_date, end_date):
        ranges = [{"start":start_date, "end": end_date}]
        return ranges
    
    def build_data(self, failure_id, time,  x, max_time, sensor_count, cols):
        # y[0] will be days remaining, y[1] will be event indicator, always 1 for this data
        out_y = np.empty((0, 2), dtype=np.float32)
        out_y_windowed = np.empty((0, 2), dtype=np.float32)

        # A full history of sensor readings to date for each x
        out_x = np.empty((0, max_time, sensor_count), dtype=np.float32)

        failure_indices = [0]
        for i in range(time.shape[0]-1):
            if(time[i] > time[i+1]):
                failure_indices.append(i+1)
        failure_indices.append(time.shape[0]) 

        # if ever need to use test data we will set different start for it
        # start = 0

        this_x = np.empty((0, max_time, sensor_count), dtype=np.float32)

        for i in range(len(failure_indices)-1):
            max_engine_time = time[failure_indices[i+1]-1] + 1

            for j in range(failure_indices[i], failure_indices[i+1]):
                sub = j-failure_indices[i]
                out_y = np.append(out_y, np.array((max_engine_time - sub , 1), ndmin=2), axis=0)

                # label last 30 days
                if((max_engine_time - j)<30):
                    out_y_windowed = np.append(out_y_windowed, np.array((max_engine_time - sub, 1), ndmin=2), axis=0)
                else:
                    out_y_windowed = np.append(out_y_windowed, np.array((max_engine_time - sub, 0), ndmin=2), axis=0)

                # treat every failure data separately
                engine_x = x[failure_indices[i]: failure_indices[i+1]]

                xtemp = np.zeros((1, max_time, sensor_count))
                xtemp[:, max_time-min(sub, max_time-1)-1:max_time, :] = engine_x[max(0, sub-max_time+1):sub+1, :]
                this_x = np.concatenate((this_x, xtemp))

        out_x = np.concatenate((out_x, this_x))

        # write the model data to the mongodb
        obj = {
            "algorithm": "LSTM",
            "task": "pof",
            "enabled": False,
            "modelID": self.model_ID,
            "sessionID": "auto" + str(self.session_ID),
            # "Settings": self.db_settings,
            "creator": self.creator,
            "modelName": self.experiment_name,
            "assetName": self.asset_name,
            "dataInfo": {
                "fields": self.fields,
                "asset": self.asset_name,
                "optimizer": "val_loss",
                "customMetricEquation": self.custom_metric_equation,
                "customMetricDirection": self.custom_metric_direction
            },
        }
        print(obj)
        
        requests.post(url=POST_MODEL_URL, json=obj)

        return out_x, out_y, out_y_windowed
    
    def weibull_loglik_discrete(self, y_true, ab_pred, name=None):
        """
            Discrete log-likelihood for Weibull hazard function on censored survival data
            y_true is a (samples, 2) tensor containing time-to-event (y), and an event indicator (u)
            ab_pred is a (samples, 2) tensor containing predicted Weibull alpha (a) and beta (b) parameters
            For math, see https://ragulpr.github.io/assets/draft_master_thesis_martinsson_egil_wtte_rnn_2016.pdf (Page 35)
        """
        y_ = y_true[:, 0]
        u_ = y_true[:, 1]
        a_ = ab_pred[:, 0]
        b_ = ab_pred[:, 1]

        hazard0 = k.pow((y_ + 1e-35) / a_, b_)
        hazard1 = k.pow((y_ + 1) / a_, b_)

        return -1 * k.mean(u_ * k.log(k.exp(hazard1 - hazard0) - 1.0) - hazard1)
    
    def activate(self, ab):
        """
            Custom Keras activation function, outputs alpha neuron using exponentiation and beta using softplus
        """
        a = k.exp(ab[:, 0])
        b = k.softplus(ab[:, 1])

        a = k.reshape(a, (k.shape(a)[0], 1))
        b = k.reshape(b, (k.shape(b)[0], 1))

        return k.concatenate((a, b), axis=1)
    
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
    
    def start_training(self, df, cols):
        start_pof_automl_experiment(self.experiment_name)

        _, sensor_count = df.shape
        sensor_count = sensor_count - 2 # remove time and id column

        num_data = df.to_numpy()
        # normalize sensor data
        num_data[:, 2:] = normalize(num_data[:, 2:], axis=0)

        # Configurable observation look-back period for each engine/seconds
        max_time = 100

        train_x, train_y, windowed_y = self.build_data(num_data[:, 0], num_data[:, 1], num_data[:, 2:], max_time, sensor_count, cols)
        
        print("----train x----")
        print(train_x)
        print("----train y----")
        print(train_y)
        print("----windowed y----")
        print(windowed_y)

        settings = {
            "tunerType": self.tuner_type, 
            "numberOfFeatures": len(cols), 
            "numberOfEpochs": self.number_of_epochs, 
            "optimizer": "val_loss", 
            "minDataPoints": self.min_data_points
        }
        experiment = {
            "experimentName": self.experiment_name, 
            'experimentStatus': "RUNNING", 
            "experimentJob": "pof", 
            "creator": self.creator, 
            "timeout": self.timeout, 
            "settings": settings, 
            "uploadTime": self.start_time, 
            "features": cols,
            "optimizer": "val_loss",
            "customMetricEquation": self.custom_metric_equation,
            "customMetricDirection": self.custom_metric_direction,  
            "trials": []
        }

        # TODO: 
        requests.post(url=AUTOML_POST_EXPERIMENT_URL , json=experiment)

        # Store some history
        history = History()

        model_builder = POFModelBuilder(max_time, sensor_count, self.activate, [20, 30, 40, 50, 60])

        if self.tuner_type == "hyperband":
            tuner =  POFHyperband(
                        train_x=train_x,
                        train_y=train_y,
                        windowed_y=windowed_y,
                        hypermodel=model_builder, 
                        objective="val_loss", 
                        max_epochs=POF_MAX_EPOCHS, 
                        factor=3,
                        directory=EXPERIMENT_PATH,# 'mlhelpers/experiments',
                        project_name=self.experiment_name,
                        overwrite=True)
            print("hyperband", tuner)

        elif self.tuner_type == "random":
            tuner = POFRandomSearch(
                        train_x=train_x,
                        train_y=train_y,
                        windowed_y=windowed_y,
                        hypermodel=model_builder,
                        objective="val_loss",
                        seed=1,
                        max_trials=POF_MAX_TRIALS,
                        executions_per_trial=POF_EXECUTIONS_PER_TRIAL,
                        directory=EXPERIMENT_PATH,# 'mlhelpers/experiments',
                        project_name=self.experiment_name,
                        overwrite=True)
            print("random", tuner)

        elif self.tuner_type == "bayesian":
            tuner = POFBayesianOptimization(
                        train_x=train_x,
                        train_y=train_y,
                        windowed_y=windowed_y,
                        hypermodel=model_builder,
                        objective="val_loss",
                        max_trials=POF_MAX_TRIALS,
                        executions_per_trial=POF_EXECUTIONS_PER_TRIAL,
                        directory=EXPERIMENT_PATH,# 'mlhelpers/experiments',
                        project_name=self.experiment_name,
                        overwrite=True)
            print("bayesian", tuner)
        
        int_callback = POFReportIntermediates(self.experiment_name)

        tuner.search(train_x, train_y,  epochs=self.number_of_epochs, batch_size=2000, validation_split=0.2, callbacks=[history, int_callback]) # , ReportIntermediates(tuner)
        
        requests.put(url=AUTOML_CHANGE_STATUS_URL , json={'experiment_name': self.experiment_name})

        best_hps=tuner.get_best_hyperparameters(num_trials=1)[0]
        # Build the model with the optimal hyperparameters and train it on the data for 50 epochs
        model = tuner.hypermodel.build(best_hps)
        history = model.fit(train_x, train_y, epochs=best_hps.get('epochs'), batch_size=2000, validation_split=0.2, verbose=1)

        val_loss_per_epoch = history.history['val_loss']
        best_epoch = val_loss_per_epoch.index(min(val_loss_per_epoch)) + 1
        print('Best epoch: ',best_epoch, best_hps.values)
        hypermodel = tuner.hypermodel.build(best_hps)

        # Retrain the model
        hypermodel.fit(train_x, train_y, epochs=best_epoch, batch_size=2000, validation_split=0.2, verbose=1)

        eval_result = hypermodel.evaluate(train_x, train_y)
        print(hypermodel.metrics_names, "--", eval_result)

        if not os.path.isdir(MODEL_DIR):
            os.mkdir(MODEL_DIR)

        t_dir = MODEL_DIR + self.model_ID + "/"
        if not os.path.isdir(t_dir):
            os.mkdir(t_dir)
        
        hypermodel.save(MODEL_DIR + self.model_ID + "/model.h5", save_format='h5') 

        pkg =  {"experiment_name": self.experiment_name, "metric_name": hypermodel.metrics_names, "metric_value": eval_result, "end_time": time.time()  }  # "job": {"job": "", "jobOn": "", "pfDays": ""}

        requests.put(url=AUTOML_UPDATE_EXPERIMENT_URL, json=json.dumps(pkg, default=numpy_converter))

        input_cols = list(df.columns.values)
        output_cols = ["alpha", "beta"]
        updated_pkg = {            
            "inputColumns": input_cols,
            "outputColumns": output_cols,
        }
        requests.put(url=UPDATE_MODEL_URL + self.model_ID, json=updated_pkg)
    
    def prepare_data(self):
        # TODO: get failures 
        failure_res = requests.post(url=GET_FAILURES_URL, json={"sourceName": self.asset_name}, headers={'token': self.token, 'Content-Type': 'application/json'}).json()
        """ failure_res = [
            {
                "failureStartTime": '2022-05-30T10:16'
            },
            {
                "failureStartTime": '2022-06-02T11:30'
            },] """
        failures = []
        for failure in failure_res:
            failure["startTime"] = parser.parse(failure["startTime"][0:16])
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

                    sensor_info = {"defaultValue": "-666", "operator": "*", "operatorValue": "2"}

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
                        if("operator" and "operatorValue" in sensor_info):
                            operator, operator_value = return_operator_info(sensor_info["operator"], sensor_info["operatorValue"])
                        else:
                            operator, operator_value = (None, None)
                    data = self.get_query_results(field["database"], field["measurement"], field["dataSource"], duration_start_date, duration_end_date)

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
                

                if(len(all_data)):
                    one_merged = pd.DataFrame(all_data[0])
                    for i in range(1,len(all_data)):
                        if(len(all_data[i])):
                            one_merged = pd.merge(one_merged, pd.DataFrame(all_data[i]), on=["time"])
                    
                    if("time" in one_merged):
                        cycle = 0
                        for i in range(len(one_merged["time"])):
                            one_merged.loc[i, "time"] = cycle
                            cycle += 1

                        one_fail_data = one_fail_data + one_merged.to_dict("records")
                    # print(one_merged)
                else:
                    one_fail_data = []
                
                                
                # print(one_fail_data)
                all_failure_data.append(one_fail_data)
                
                
            # change from here
            frames = []
            fid = 0
            for d in all_failure_data:
                pidf = pd.DataFrame(d)
                
                if pidf.empty:
                    print('DataFrame is empty!')

                else:
                    """ with open('/root/BackUp_Pianism/pianism/backend/mlhelpers/rul-key-err.txt', 'w') as writefile:
                        writefile.write(pidf.to_string()) """
                    
                    pidf["id"] = fid
                    fid += 1
                    p_cols = pidf.columns.difference(['id', "time"]).to_list() 
                    pidf = pidf[["id", "time"] + p_cols]
                    frames.append(pidf)
            
            if(len(frames)):
                df = pd.concat(frames).reset_index() 
                df.drop('index', axis=1, inplace=True)
                print(df)
            else:
                df = pd.DataFrame()  
            
            if df.empty:
                print('DataFrame is empty!')
            
            try:
                mindpoints = int(self.min_data_points)
            except ValueError:
                print("Not an integer")
                mindpoints = 500

            if(df.shape[0] < mindpoints):
                print('not enough data!')
                # log_pkg = {"experimentName": self.experiment_name, "uploadTime": self.start_time, "owner": self.username, "task": "pof"}
                # requests.post(url=AUTOML_POST_NOT_ENOUGH_DATA_LOG_URL, json=log_pkg)
            else:
                """ log_pkg = {"experimentName": self.experiment_name, "uploadTime": self.start_time, "owner": self.username, "task": "pof"}
                requests.post(url=AUTOML_POST_SUCCESS_DATA_LOG_URL, json=log_pkg) """

                # df = df.fillna(0)
                print("nan", df.isnull().sum(), df.shape)
                print("inf", np.isinf(df).values.sum())
                df.to_csv("./pof_flux_df_out_sensor-fill.csv") 
                # print(df)
                sequence_cols = list(df.columns.values)
                """ with open('/root/BackUp_Pianism/pianism/backend/mlhelpers/pof_output_colnames2.txt', 'w') as writefile:
                    writefile.write(' '.join(original_cols))  """
                
                print(sequence_cols)
                
                self.start_training(df[sequence_cols], sequence_cols)
    
    def run(self):
        self.prepare_data()
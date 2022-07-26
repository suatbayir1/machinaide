import math
import json
import datetime
import requests
import numpy as np
import pandas as pd
import featuretools as ft
from sklearn import preprocessing
from influxdb_client import InfluxDBClient
from sklearn.preprocessing import normalize
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import backend as k
from tensorflow.python.ops import init_ops
from tensorflow.python.keras import backend
from tensorflow.python.keras.utils import metrics_utils
from tensorflow.python.keras.utils.generic_utils import to_list

from model_runner_config import (
    TICK_SETTINGS,
    POST_MODEL_LOG,
    UPDATE_LAST_DATA_POINT,
    INFLUX,
    OPERATIONS
)

""" from config import (
    host_ip,
    influx_port,
    GETSENSORFROMMAPPING,
    GETCOMPFROMMAPPING,
    TICK_SETTINGS,
    OPERATIONS,
    ON_OFF_DATA_MEASUREMENT_NAME,
    POSTMODELLOG,
    UPDATELASTDATAPOINT,
) """

class CustomMetric(keras.metrics.Metric):
    def __init__(self, equation, **kwargs):
        super(CustomMetric, self).__init__(**kwargs) # name='custom_metric',
        tf.config.run_functions_eagerly(True)
        self.equation = equation
        self.thresholds = metrics_utils.parse_init_thresholds(
            None, default_threshold=0.5)
        self.tp = self.add_weight('tp', shape=(len(self.thresholds),), initializer=init_ops.zeros_initializer)
        self.fp = self.add_weight('fp', shape=(len(self.thresholds),), initializer=init_ops.zeros_initializer)
        self.tn = self.add_weight('tn', shape=(len(self.thresholds),), initializer=init_ops.zeros_initializer)
        self.fn = self.add_weight('fn', shape=(len(self.thresholds),), initializer=init_ops.zeros_initializer)
    
    def get_config(self):
        base_config = super(CustomMetric, self).get_config()
        return {**base_config, "equation": self.equation, "name":'custom_metric'}
    
    def reset_state(self):
        # self.tp.assign(0)
        # self.fp.assign(0)
        # self.tn.assign(0)
        # self.fn.assign(0)
        num_thresholds = len(to_list(self.thresholds))
        backend.batch_set_value(
            [(v, np.zeros((num_thresholds,))) for v in self.variables])

    def update_state(self, y_true, y_pred, sample_weight=None):
        return metrics_utils.update_confusion_matrix_variables(
        {
            metrics_utils.ConfusionMatrix.TRUE_POSITIVES: self.tp,
            metrics_utils.ConfusionMatrix.FALSE_POSITIVES: self.fp,
            metrics_utils.ConfusionMatrix.TRUE_NEGATIVES: self.tn,
            metrics_utils.ConfusionMatrix.FALSE_NEGATIVES: self.fn,
        },
        y_true,
        y_pred,
        thresholds=self.thresholds,
        top_k=None,
        class_id=None,
        sample_weight=sample_weight)

    def result(self):
        tp = self.tp
        fp = self.fp
        tn = self.tn
        fn = self.fn
        try:
            return eval(self.equation)
        except:
            # recall is tp/(tp+fn)
            # default return precision
            print("default equation is precision")
            return tp/(tp + fp)


class QueryHelper:
    def __init__(self, settings):
        self.url = settings['url']
        self.token = settings['token']
        self.org = settings["org"]
        self.client = InfluxDBClient(url=self.url, token=self.token, org=self.org, verify_ssl = False) 
        self.query_api = self.client.query_api()
    
    def query_db(self, query):
        res = self.query_api.query(org=self.org, query=query)
        return res

def check_both_not_none(x, y):
    if(x != None and y != None):
        return True
    return False

class FillNanValues:
    def __init__(self, operator=None, operator_value=None, is_numeric=False, default_value=0):
        self.operator = operator
        self.operator_value = operator_value
        self.is_numeric = is_numeric
        self.default_value = default_value
    
    # do mathematical operation
    def do_operation(self, df, col_name):
        if(self.operator == OPERATIONS["SUBSTRACTION"]):
            try:
                val = float(self.operator_value)
                df[col_name] = df[col_name] - val
                return df
            except ValueError:
                print("value is not numeric")
                return df
        elif(self.operator == OPERATIONS["ADDITION"]):
            try:
                val = float(self.operator_value)
                df[col_name] = df[col_name] + val
                return df
            except ValueError:
                print("value is not numeric")
                return df
        elif(self.operator == OPERATIONS["MULTIPLICATION"]):
            try:
                val = float(self.operator_value)
                df[col_name] = df[col_name] * val
                return df
            except ValueError:
                print("value is not numeric")
                return df
        elif(self.operator == OPERATIONS["DIVISION"]):
            try:
                val = float(self.operator_value)
                df[col_name] = df[col_name] / val
                return df
            except ValueError:
                print("value is not numeric")
                return df
        else: 
            return df

    def get_df_with_values(self, df, col_name, operation):
        if(self.is_numeric):
            return self.fill_with_value(df, col_name)
        elif(operation == "avg"):
            return self.avg_last_five(df, col_name)
        elif(operation == "min"):
            return self.min_last_five(df, col_name)
        elif(operation == "max"):
            return self.max_last_five(df, col_name)
        elif(operation == "davg" or operation == "dmin" or operation == "dmax"):
            return self.last_five_diff(df, col_name, operation)
        else:
            return df.interpolate()
    
    def fill_with_value(self, df, col_name):
        # if first row is nan, change it to 0
        df[col_name] = df[col_name].fillna(self.default_value)
        return df

    def avg_last_five(self, df, col_name):
        # if first row is nan, change it to 0
        if(np.isnan(df[col_name][0])):
            df.loc[0, col_name] = 0

        new_col = df[col_name].fillna(df[col_name].rolling(5, min_periods=0).mean().shift())
        df[col_name] = new_col
        # just in case if any nan left
        df = df.fillna(0)
        if(check_both_not_none(self.operator, self.operator_value)):
            return self.do_operation(df, col_name)
        return df
    
    def max_last_five(self, df, col_name):
        # if first row is nan, change it to 0
        if(np.isnan(df[col_name][0])):
            df.loc[0, col_name] = 0

        new_col = df[col_name].fillna(df[col_name].rolling(5, min_periods=0).max().shift())
        df[col_name] = new_col
        # just in case if any nan left
        df = df.fillna(0)
        if(check_both_not_none(self.operator, self.operator_value)):
            return self.do_operation(df, col_name)
        return df

    def min_last_five(self, df, col_name):
        # if first row is nan, change it to 0
        if(np.isnan(df[col_name][0])):
            df.loc[0, col_name] = 0

        new_col = df[col_name].fillna(df[col_name].rolling(5, min_periods=0).min().shift())
        df[col_name] = new_col
        # just in case if any nan left
        df = df.fillna(0)
        if(check_both_not_none(self.operator, self.operator_value)):
            return self.do_operation(df, col_name)
        return df
    
    def last_five_diff(self, df, col_name, operation):
        # check first row
        if(np.isnan(df[col_name][0])):
            print("diff_avg")
            df.loc[0, col_name] = 0
        # print(df[col_name].isna().tolist())
        rows_with_nan = [index for index, val in enumerate(df[col_name].isna().tolist()) if val]
        # print(rows_with_nan)
        for index in rows_with_nan:
            prevs = df.loc[index-5:index-1, col_name].tolist()
            # print(prevs)
            if(len(prevs)):
                diffs = []
                for i in range(0, len(prevs)-1):
                    diffs.append(abs(prevs[i+1] - prevs[i]))
                # print(diffs)
                if(operation == "davg"):
                    if(len(diffs)):
                        diff = sum(diffs)/(len(diffs))
                    else:
                        diff = -2
                    df.loc[index, col_name] = diff
                elif(operation == "dmin"):
                    if(len(diffs)):
                        min_val = min(diffs)
                    else:
                        min_val = -3
                    df.loc[index, col_name] = min_val
                elif(operation == "dmax"):
                    if(len(diffs)):
                        max_val = max(diffs)
                    else:
                        max_val = -4
                    df.loc[index, col_name] = max_val
            else:
                df.loc[index, col_name] = -1
            # print(operation)
        if(check_both_not_none(self.operator, self.operator_value)):
            return self.do_operation(df, col_name)
        return df


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

def check_last_data_point(last_stored_point, last_data_point, modelID):
    print("---------------------")
    print(last_stored_point, last_data_point)
    if(last_stored_point == last_data_point):
        # if data point has not changed
        now = datetime.datetime.now().isoformat()
        log = {"modelID":modelID, "log": {"time": now, "prediction": None}}
        requests.post(url=POST_MODEL_LOG, json=log)
        return True
    else:
        # update last data point
        log = {"modelID": modelID, "lastDataPoint": last_data_point}
        requests.put(url=UPDATE_LAST_DATA_POINT + modelID, json=log)
        return False

def compare_last_data_point(last_stored_point, last_data_point, modelID):
    print("---------------------")
    print(last_stored_point, last_data_point)
    if(last_stored_point == last_data_point):
        # if data point has not changed
        now = datetime.datetime.now().isoformat()
        log = {"modelID":modelID, "log": {"time": now, "prediction": None}}
        requests.post(url=POST_MODEL_LOG, json=log)
        return True
    else:
        # update last data point
        log = {"modelID": modelID, "lastDataPoint": last_data_point}
        requests.put(url=UPDATE_LAST_DATA_POINT + modelID, json=log)
        return False

def get_sensor_data_query(bucket, measurement, field):
    query = f'from(bucket: "{bucket}")\
  |> range(start: -30d)\
  |> filter(fn: (r) => r["_measurement"] == "{measurement}")\
  |> filter(fn: (r) => r["_field"] == "{field}")\
  |> aggregateWindow(every: 30m, fn: mean, createEmpty: true)'
    # print(query)
    return query

def get_query_results(query_helper, bucket, measurement="", field=""):
    query = get_sensor_data_query(bucket, measurement, field)
    # print(query)

    result = query_helper.query_db(query)
    results = []
    for table in result:
        for record in table.records:
            data_point = {}
            data_point["time"] = record.get_time()
            data_point[f"{measurement}.{record.get_field()}"] = record.get_value()
            results.append(data_point)
    
    return results

class RULRegModelRunner:
    def __init__(self, settings) -> None:
        self.asset = settings["asset"]
        self.fields = settings["fields"]
        self.pipelineID = settings["pipelineID"]
        self.model = settings["loadedModel"]
        if(len(settings["features"])):            
            self.features = ft.load_features(settings["features"])
        else:
            self.features = None
        self.last_data_point = settings["lastDataPoint"]
        self.query_helper = QueryHelper({"url": INFLUX["host"], "token": INFLUX["dbtoken"], "org": INFLUX["orgID"]})
    
    def prepare_data(self):
        print("prepare data for prediction then return it to predictor")
        # new version
        one_log_data = []
        all_data = []
        for field in self.fields:
            # TODO
            # sensor_info = requests.get(url=GETSENSORFROMMAPPING + field).json()

            # sensor_info = {"defaultValue": "-666", "operator": "*", "operatorValue": "2"}
            sensor_info = None
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
            data = get_query_results(self.query_helper, field["database"], field["measurement"], field["dataSource"])

            df = pd.DataFrame(data)
            data_points = []
            if(not df.empty):
                print("here")
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
                data_points += df.to_dict("records")
            print("len data points", len(data_points))
            if(len(data_points)):
                all_data.append(data_points)
        print("<--", len(all_data))
        if(len(all_data)):
            print("--", len(all_data))
            one_merged = pd.DataFrame(all_data[0])
            for i in range(1,len(all_data)):
                if(len(all_data[i])):
                    one_merged = pd.merge(one_merged, pd.DataFrame(all_data[i]), on=["time"])
            
            if("time" in one_merged):
                cycle = 0
                for i in range(len(one_merged["time"])):
                    one_merged.loc[i, "cycle"] = cycle
                    cycle += 1
                one_log_data = one_log_data + one_merged.to_dict("records")
        else:
            one_log_data = []
        
        if(len(one_log_data)):
            df = pd.DataFrame(one_log_data)
            # print("sensor df: ---------------------")
            df["id"] = 1
            # print(df.head())
            # print(df.shape)
            print("nans: ", df.isnull().sum())
            df = df.dropna(axis=0)
            return df
        else:
            empty_df = pd.DataFrame([])
            return empty_df

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

    def predict(self, predict_data):
        if(self.features):
            es = self.make_entityset(predict_data)
            print(predict_data)
            print(self.features)

            fm = ft.calculate_feature_matrix(
                entityset=es,
                features=self.features,
                verbose=True,
            )

            X = fm.copy().fillna(0)
            predictions = self.model.predict(X)
            print(predictions)
            if(len(predictions) and predictions.iloc[0]):
                now = datetime.datetime.now().isoformat()
                log = {"modelID": self.pipelineID, "log": {"time": now, "prediction": round(predictions.iloc[0])}}
                print("log: ", log)
                requests.post(url=POST_MODEL_LOG, json=log)
    
    
    def run(self):
        print("run stuff is here")
        print(self.model.describe())
        data = self.prepare_data()
        # data.to_csv("./log_rulreg_data.csv")  
        print("-->",data.shape)
        if(not data.empty):
            self.predict(data)
    

class RULModelRunner:
    def __init__(self, settings):
        self.asset = settings["asset"]
        self.fields = settings["fields"]
        self.modelID = settings["modelID"]
        self.model = settings["loadedModel"]
        self.sequence_length = settings["sequenceLength"]
        self.last_data_point = settings["lastDataPoint"]
        self.query_helper = QueryHelper({"url": INFLUX["host"], "token": INFLUX["dbtoken"], "org": INFLUX["orgID"]})
    
    def build_data(self, data):
        if(not data.empty):
            # MinMax normalization
            data['time_norm'] = data['time']

            cols_normalize = data.columns.difference(['id', 'time']) 
            min_max_scaler = preprocessing.MinMaxScaler()
            norm_data = pd.DataFrame(min_max_scaler.fit_transform(data[cols_normalize]), 
                                        columns=cols_normalize)
            join_df = data[data.columns.difference(cols_normalize)].join(norm_data)
            data = join_df.reindex(columns = data.columns)

            sequence_cols = data.columns.values.tolist()
            sequence_cols.remove("time")
            sequence_cols.remove("id")

            sequence_length = self.sequence_length
            # print(sequence_length, sequence_cols)

            seq_array_last = [data[data['id']==id][sequence_cols].values[-sequence_length:] 
                        for id in data['id'].unique() if len(data[data['id']==id]) >= sequence_length]

            seq_array_last = np.asarray(seq_array_last).astype(np.float32)

            return seq_array_last
        
        else:
            return []


    def prepare_data(self):
        print("prepare data for prediction then return it to predictor")

        # new version
        one_log_data = []
        all_data = []
        for field in self.fields:
            # TODO
            # sensor_info = requests.get(url=GETSENSORFROMMAPPING + field).json()

            #sensor_info = {"defaultValue": "-666", "operator": "*", "operatorValue": "2"}
            sensor_info = None
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
            data = get_query_results(self.query_helper, field["database"], field["measurement"], field["dataSource"])

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
                data_points += df.to_dict("records")
            
            if(len(data_points)):
                all_data.append(data_points)
        
        if(len(all_data)):
            one_merged = pd.DataFrame(all_data[0])
            for i in range(1,len(all_data)):
                if(len(all_data[i])):
                    one_merged = pd.merge(one_merged, pd.DataFrame(all_data[i]), on=["time"])
            
            if("time" in one_merged):
                cycle = 1
                for i in range(len(one_merged["time"])):
                    one_merged.loc[i, "time"] = cycle
                    cycle += 1

                one_log_data = one_log_data + one_merged.to_dict("records")
            # print(one_merged)
        else:
            one_log_data = []
        
        if(len(one_log_data)):
            df = pd.DataFrame(one_log_data)
            # print("sensor df: ---------------------")
            df["id"] = 1
            # print(df.head())
            # print(df.shape)
            print("nans: ", df.isnull().sum())
            # df.to_csv("./rul_log_test1.csv")
            # df = df.dropna(axis=0)
            return df
        else:
            empty_df = pd.DataFrame([])
            return empty_df

    def predict(self, seq):
        y_pred = self.model.predict(seq)
        print("****************RUL RESULT****************")
        print(y_pred)
        y_pred = (y_pred > 0.5).astype("int32")
        print(y_pred)
        if(len(y_pred) and len(y_pred[0])):
            now = datetime.datetime.now().isoformat()
            log = {"modelID": self.modelID, "log": {"time": now, "prediction": json.dumps(y_pred[0][0].item())}}
            print("log: ", log)
            requests.post(url=POST_MODEL_LOG, json=log)
    
    def run(self):
        print("run stuff is here")
        print(self.model.summary())
        data = self.prepare_data()
        seq = self.build_data(data)
        print(seq)
        if(len(seq) != 0):
            self.predict(seq)

class POFModelRunner:
    def __init__(self, settings):
        self.max_time = 100
        self.asset = settings["asset"]
        self.fields = settings["fields"]
        self.modelID = settings["modelID"]
        self.model = settings["loadedModel"]
        self.last_data_point = settings["lastDataPoint"]
        self.query_helper = QueryHelper({"url": INFLUX["host"], "token": INFLUX["dbtoken"], "org": INFLUX["orgID"]})

    def weibull_loglik_discrete(self, y_true, ab_pred, name=None):
        y_ = y_true[:, 0]
        u_ = y_true[:, 1]
        a_ = ab_pred[:, 0]
        b_ = ab_pred[:, 1]

        print(y_, u_, a_, b_)
        hazard0 = k.pow((y_ + 1e-35) / a_, b_)
        hazard1 = k.pow((y_ + 1) / a_, b_)

        return -1 * k.mean(u_ * k.log(k.exp(hazard1 - hazard0) - 1.0) - hazard1)

    def activate(self, ab):
        a = k.exp(ab[:, 0])
        b = k.softplus(ab[:, 1])

        a = k.reshape(a, (k.shape(a)[0], 1))
        b = k.reshape(b, (k.shape(b)[0], 1))

        return k.concatenate((a, b), axis=1)
    
    def find_probability(self, alpha, beta, days):
        if(alpha != 0):
            prob = 1 - math.exp(-(days/alpha)**beta)
        else:
            prob = 0
        return prob
    
    def build_data(self, engine, time, x, max_time, is_test, sensor_count):
        # y[0] will be days remaining, y[1] will be event indicator, always 1 for this data
        out_y = np.empty((0, 2), dtype=np.float32)

        # A full history of sensor readings to date for each x
        out_x = np.empty((0, max_time, sensor_count), dtype=np.float32)
        # When did the engine fail? (Last day + 1 for train data, irrelevant for test.)
        max_engine_time = int(np.max(time[engine == 0])) + 1

        if is_test:
            start = max_engine_time - 1
        else:
            start = 0

        this_x = np.empty((0, max_time, sensor_count), dtype=np.float32)

        for j in range(start, max_engine_time):
            engine_x = x[engine == 0]

            out_y = np.append(out_y, np.array((max_engine_time - j, 1), ndmin=2), axis=0)

            xtemp = np.zeros((1, max_time, sensor_count))
            xtemp[:, max_time-min(j, max_time-1)-1:max_time, :] = engine_x[max(0, j-max_time+1):j+1, :]
            this_x = np.concatenate((this_x, xtemp))

        out_x = np.concatenate((out_x, this_x))

        return out_x, out_y
    
    def create_seqs(self, data):
        if(not data.empty):
            # reorder columns
            cols = ["id" , "time"]
            features = data.columns.difference(['id','time']).to_list()
            # print(cols, features)
            cols = cols + features
            data = data[cols]

            _, sensor_count = data.shape
            sensor_count = sensor_count - 2 # remove time and id column

            num_data = data.to_numpy()

            # normalize sensor data
            num_data[:, 2:] = normalize(num_data[:, 2:], axis=0)
            # Configurable observation look-back period for each engine/seconds
            max_time = self.max_time

            # get last sequence
            test_x = self.build_data(num_data[:, 0], num_data[:, 1], num_data[:, 2:], max_time, True, sensor_count)[0]
            return test_x
        
        else:
            return []

    def prepare_data(self):        
        # new version
        one_log_data = []
        all_data = []
        for field in self.fields:
            # TODO
            # sensor_info = requests.get(url=GETSENSORFROMMAPPING + field).json()

            # sensor_info = {"defaultValue": "-666", "operator": "*", "operatorValue": "2"}
            sensor_info = None
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

            data = get_query_results(self.query_helper, field["database"], field["measurement"], field["dataSource"])

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
                data_points += df.to_dict("records")
            
            if(len(data_points)):
                all_data.append(data_points)
            
        if(len(all_data)):
            one_merged = pd.DataFrame(all_data[0])
            for i in range(1,len(all_data)):
                if(len(all_data[i])):
                    one_merged = pd.merge(one_merged, pd.DataFrame(all_data[i]), on=["time"])
            
            if("time" in one_merged):
                print("YES")
                cycle = 0
                for i in range(len(one_merged["time"])):
                    one_merged.loc[i, "time"] = cycle
                    cycle += 1

                one_log_data = one_log_data + one_merged.to_dict("records")
            # print(one_merged)
        else:
            one_log_data = []
        
        if(len(one_log_data)):
            df = pd.DataFrame(one_log_data)
            # print("sensor df: ---------------------")
            df["id"] = 0
            print("nans: ", df.isnull().sum())
            # print(df.head())
            # print(df.shape)
            # df.to_csv("./pof_log_test1.csv")
            # df = df.dropna(axis=0)
            # df.to_csv("./pof_log_test2.csv")
            df = df.fillna(0)
            return df
        else:
            empty_df = pd.DataFrame([])
            return empty_df
                    



    def predict(self, seq):
        prediction = self.model.predict(seq)
        # Alpha, Beta
        print("----------POF PREDICTION------")
        print(prediction)
        print(list(prediction[0]))
        if(len(prediction) and len(prediction[0])):
            sent_prediction = [json.dumps(prediction[0][0].item()), json.dumps(prediction[0][1].item())]
            now = datetime.datetime.now().isoformat()
            log = {"modelID": self.modelID, "log": {"time": now, "prediction": sent_prediction}}
            print("log: ", log)
            requests.post(url=POST_MODEL_LOG, json=log)
    
    def run(self):
        print("pof run stuff is here")
        print(self.model.summary())
        data = self.prepare_data()
        seq = self.create_seqs(data)
        print(seq)
        if(len(seq) != 0):
            self.predict(seq)


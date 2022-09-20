from datetime import datetime, timedelta
from influxdb import InfluxDBClient
# from influxdb_client.client.write_api import SYNCHRONOUS
from sklearn.preprocessing import MinMaxScaler
import pandas as pd
import numpy as np
import requests
from scipy import stats
from tensorflow.keras import backend as K
from config import celldataurl, ANOMALYURL, INFLUXDB_CLIENT
from influxdb_client import InfluxDBClient as idbc



def min_max_scale(train, test, s_min, s_max):
    scaler = MinMaxScaler(feature_range=(s_min, s_max))
    scaler = scaler.fit(train)
    # transform train
    train = train.reshape(train.shape[0], train.shape[1])
    train_scaled = scaler.transform(train)
    # transform test
    test = test.reshape(test.shape[0], test.shape[1])
    test_scaled = scaler.transform(test)

    return scaler, train_scaled, test_scaled

def _transform_sample(sample, columns, means, stds):
    for i, col in enumerate(columns):
        sample[col] = (sample[col] - means[i]) / stds[i]

def transform_value(val, mean, std):
    new_val = (val - mean) / std
    return new_val

def inverse_transform_output(output, means, stds):
    for i, out in enumerate(output):
        output[i] = (out * stds[i]) + means[i]

def to_sequences(dataset, columns, input_dim, output_dim, in_seq_size, out_seq_size, means, stds):
    x = []
    y = []

    for i in range(len(dataset.values)):
        t = i + in_seq_size
        window = dataset[columns][i:t]
        after_window = dataset[columns][t:(t + out_seq_size)]
        _transform_sample(window, columns, means, stds)
        _transform_sample(after_window, columns, means, stds)
        if len(window) != in_seq_size or len(after_window) != out_seq_size:
            break
        # window = [[x] for x in window]
        #print("{} - {}".format(window,after_window))
        x.append(window)
        y.append(after_window)
    print("in_seq_size", type(in_seq_size))
    print("x", type(x))
    print("y", type(y))
    print("in_seq_size", type(in_seq_size))
    print("input_dim", type(input_dim), input_dim)
    print(np.asarray(x).shape)
    print(np.asarray(y).shape)
    return np.asarray(x), np.asarray(y)
    # return np.array(x).reshape(
    #     len(x), 
    #     in_seq_size, 
    #     input_dim),np.array(y).reshape(
    #         len(y), 
    #         output_dim)


def root_mean_squared_error(sequence_length):
    def loss(original, output):
        reconstruction = K.sqrt(K.mean(K.square(original - output))) * sequence_length
        return reconstruction

    return loss

class POFQueryHelper:
    def __init__(self, settings):
        self.host = settings['host']
        self.port = settings['port']
        self.database = settings['database']
        self._influxdb = None
        # self.client = InfluxDBClient(host= self.host, port=self.port, database=self.database) 
    
    def queryDB(self, query):
        res = self.client.query(query)
        return res

    @property
    def client(self):
        if self._influxdb is None:
            org = "machinaide"
            token = "-Y8yuCS19k6ZD0FLiVvpY-zcEK4VhbBe6HC7WPKR7Z5X2bkm-Ag2iMJUSDSBOugpG6klF2XEddhCMkHRuJPbsQ=="

            url = "http://" + self.host + ":" + str(self.port)

            self._influxdb = idbc(url=url, token=token, org=org)
        return self._influxdb.query_api()


class QueryHelper:
    def __init__(self, settings):
        self.host = settings['host']
        self.port = settings['port']
        self.db_name = settings['db']
        #self.create_database = settings['create_database']
        #self.dbuser = settings['dbuser']
        #self.dbuser_password = settings['dbuser_password']
        self.retention_policy = settings['rp']
        
        if 'use_ssl' in settings.keys():
            self.use_ssl = settings['use_ssl']
        else:
            self.use_ssl = False
        
        if 'verify_ssl' in settings.keys():
            self.verify_ssl = settings['verify_ssl']
        else:
            self.verify_ssl = False
        
        self._influxdb = None
        self._alertClient = None
        self._alertURL = ANOMALYURL


    def _build_influx_queries_now(
        self,
        measurement_to_sensors,
        query_time
    ):
        queries = ''
        for measurement, sensors in measurement_to_sensors.items():
            for sensor in sensors:
                query = 'select \"{}\" from \"{}\".\"{}\".\"{}\" where time > {};'.format(
                    sensor,
                    self.db_name,
                    self.retention_policy,                
                    measurement,
                    query_time,
                )
                queries += query
        return queries


    def _build_influx_queries(
        self,
        measurement_to_sensors,
        startTime,
        endTime
    ):
        queries = ''
        for measurement, sensors in measurement_to_sensors.items():
            for sensor in sensors:
                query = 'select \"{}\" from \"{}\".\"{}\".\"{}\" where time > {}  AND time <= {};'.format(
                    sensor,
                    self.db_name,
                    self.retention_policy,                
                    measurement,
                    startTime,
                    endTime
                )
                queries += query
        # print(queries)
        return queries


    def query(self, measurement_to_sensors, startTime=None, endTime=None):
        if startTime is not None and endTime is not None:
            queries = self._build_influx_queries(measurement_to_sensors, startTime, endTime)
        else:
            queries = self._build_influx_queries(measurement_to_sensors, "now() - 1h", "now()")
            print(queries)
        try:
            results = self.influxdb.query(queries)
        except:
            exit()
        if not isinstance(results, list):
            results = [results]

        sensor_names = []
        for measurement, sensors in measurement_to_sensors.items():
            for sensor in sensors:
                sensor_names.append(sensor)

        final_results = []
        for k, field_result in enumerate(results):
            for result in field_result:                
                for j, point in enumerate(result):
                    val = point.get(sensor_names[k])
                    timeval = point['time']

                    if j < len(final_results):
                        final = final_results[j]
                    else:
                        final = {
                            'time': timeval,
                            #'mod': int(str_to_ts(timeval)) % group_by,
                            'values': {},
                        }
                        final_results.append(final)

                    final['values'][sensor_names[k]] = val

        # print(final_results)
        return final_results, sensor_names


    def query_now(self, measurement_to_sensors, query_time):
        queries = self._build_influx_queries_now(measurement_to_sensors, query_time)
        try:
            results = self.influxdb.query(queries)
        except:
            exit()
        if not isinstance(results, list):
            results = [results]

        sensor_names = []
        for measurement, sensors in measurement_to_sensors.items():
            for sensor in sensors:
                sensor_names.append(sensor)

        final_results = []
        for k, field_result in enumerate(results):
            for result in field_result:                
                for j, point in enumerate(result):
                    val = point.get(sensor_names[k])
                    timeval = point['time']

                    if j < len(final_results):
                        final = final_results[j]
                    else:
                        final = {
                            'time': timeval,
                            #'mod': int(str_to_ts(timeval)) % group_by,
                            'values': {},
                        }
                        final_results.append(final)

                    final['values'][sensor_names[k]] = val

        return final_results, sensor_names
        
    def write(self, json_body):
        #points = "{0}".format(json_body)
        self.alertClient.write_points(json_body)

    def write_mongo(self, obj):
        r = requests.post(url=self._alertURL, json=obj)

    @property
    def influxdb(self):
        if self._influxdb is None:
            self._influxdb = InfluxDBClient(
                host=self.host,
                port=self.port,
                database=self.db_name,
                #username=self.dbuser,
                #password=self.dbuser_password,
                #ssl=self.use_ssl,
                #verify_ssl = self.verify_ssl
            )

        return self._influxdb

    @property
    def alertClient(self):
        if self._alertClient is None:

            self._alertClient = InfluxDBClient(
                host=self.host,
                port=self.port,
                database="chronograf",
                #username=self.dbuser,
                #password=self.dbuser_password,
                #ssl=self.use_ssl,
                #verify_ssl = self.verify_ssl
            )

        return self._alertClient


class Influx2QueryHelper:
    def __init__(self, settings):
        self.host = settings['host']
        self.port = settings['port']
        self.db_name = settings['db']
        #self.create_database = settings['create_database']
        #self.dbuser = settings['dbuser']
        #self.dbuser_password = settings['dbuser_password']
        self.retention_policy = settings['rp']

        if 'use_ssl' in settings.keys():
            self.use_ssl = settings['use_ssl']
        else:
            self.use_ssl = False
        
        if 'verify_ssl' in settings.keys():
            self.verify_ssl = settings['verify_ssl']
        else:
            self.verify_ssl = False
        
        self._influxdb = None
        self._alertClient = None


    def _build_influx_weibull_queries(
        self,
        measurement_to_sensor,
        startTime,
        endTime,
        groupWith
    ):
        query_list = list()
        for measurement, sensors in measurement_to_sensor.items():
            query = 'from(bucket: "{}")\
                |> range(start:{}, stop:{})\
                |> filter(fn: (r) => r._measurement == "{}")\
                |> filter(fn: (r) => '.format(
                    self.db_name,
                    startTime,
                    endTime,
                    measurement
                )
            for i, sensor in enumerate(sensors):
                if i != len(sensors) - 1:
                    query += 'r._field == "{}" or '.format(sensor)
                else:
                    query += 'r._field == "{}")'.format(sensor)
            query += '|> aggregateWindow(every: 1h, fn: {})'.format(
                groupWith
            )
            query_list.append(query)

        return query_list

    def _build_influx_queries(
        self,
        measurement_to_sensors,
        startTime,
        endTime
    ):
        query_list = list()
        for measurement, sensors in measurement_to_sensors.items():
            query = 'from(bucket: "{}")\
                |> range(start:{}, stop:{})\
                |> filter(fn: (r) => r._measurement == "{}")\
                |> filter(fn: (r) => '.format(
                    self.db_name,
                    startTime,
                    endTime,
                    measurement
                )
            for i, sensor in enumerate(sensors):
                if i != len(sensors) - 1:
                    query += 'r._field == "{}" or '.format(sensor)
                else:
                    query += 'r._field == "{}")'.format(sensor)
            
            query_list.append(query)

        return query_list


    def query_weibull(self, measurement_to_sensor, startTime, endTime, groupWith):
        query_list = self._build_influx_weibull_queries(measurement_to_sensor, startTime, endTime, groupWith)
        final_results = list()
        for query in query_list:
            # results = self.influxdb.query(query=query)
            try:
                results = self.influxdb.query(query)
            except Exception as e:
                print(e, "aaaa")
                exit()
            for table in results:
                for j, record in enumerate(table.records):
                    timeval = record.get_time()
                    val = record.get_value()
                    if j < len(final_results):
                        final = final_results[j]
                    else:
                        final = {
                            'time': timeval,
                            #'mod': int(str_to_ts(timeval)) % group_by,
                            'values': {},
                        }
                        final_results.append(final)

                    final['values'][record.get_field()] = val

        return final_results

    def query(self, measurement_to_sensor, startTime, endTime):
        query_list = self._build_influx_queries(measurement_to_sensor, startTime, endTime)
        # print(query_list)
        final_results = list()
        for query in query_list:
            print("hi")
            # results = self.influxdb.query(query=query)
            try:
                results = self.influxdb.query(query)
            except Exception as e:
                print(e, "aaaa")
                exit()
            for table in results:
                for j, record in enumerate(table.records):
                    timeval = record.get_time()
                    val = record.get_value()
                    if j < len(final_results):
                        final = final_results[j]
                    else:
                        final = {
                            'time': timeval,
                            #'mod': int(str_to_ts(timeval)) % group_by,
                            'values': {},
                        }
                        final_results.append(final)

                    final['values'][record.get_field()] = val

        sensor_names = []
        for measurement, sensors in measurement_to_sensor.items():
            for sensor in sensors:
                sensor_names.append(sensor)

        print(final_results[0])
        return final_results, sensor_names

    
    def get_measurements_on_db(self):
        query = 'import "influxdata/influxdb/schema"\n\nschema.measurements(bucket: "{}")'.format(self.db_name)
        tables = self.influxdb.query(query=query)
        measurements = list()
        for table in tables:
            for record in table.records:
                for measurement in record.values:
                    measurements.append(measurement)

        return measurements

    
    def get_fields_on_measurement(self, measurement):
        query = 'import "influxdata/influxdb/schema"\n\nschema.measurementFieldKeys(bucket: "{}", measurement: "{}")'.format(
            self.db_name,
            measurement
        )
        tables = self.influxdb.query(query=query)
        fields = list()
        for table in tables:
            for record in table.records:
                for field in record.values:
                    fields.append(field)

        return fields

    
    def query_measurement_values(self, measurement, startTime, endTime):
        query = 'from(bucket: "{}")\
                |> range(start:{}, stop:{})\
                |> filter(fn: (r) => r._measurement == "{}")'.format(
                    self.db_name,
                    startTime,
                    endTime,
                    measurement
                )
        results = self.influxdb.query(query=query)
        final_results = list()
        try:
            results = self.influxdb.query(query)
        except Exception as e:
            print(e, "aaaa")
            exit()
        for table in results:
            for j, record in enumerate(table.records):
                timeval = record.get_time()
                val = record.get_value()
                if j < len(final_results):
                    final = final_results[j]
                else:
                    final = {
                        'time': timeval,
                        #'mod': int(str_to_ts(timeval)) % group_by,
                        'values': {},
                    }
                    final_results.append(final)

                final['values'][record.get_field()] = val

        return final_results



    @property
    def influxdb(self):
        if self._influxdb is None:
            org = "machinaide"
            token = "-Y8yuCS19k6ZD0FLiVvpY-zcEK4VhbBe6HC7WPKR7Z5X2bkm-Ag2iMJUSDSBOugpG6klF2XEddhCMkHRuJPbsQ=="
            print(INFLUXDB_CLIENT)
            self._influxdb = idbc(url=INFLUXDB_CLIENT["URL"], token=INFLUXDB_CLIENT["TOKEN"], org=INFLUXDB_CLIENT["ORG"], verify_ssl=False)


        return self._influxdb.query_api()



class MLPreprocessor:
    def __init__(self, raw_data):
        self.raw_data = raw_data


    def _convert_to_df(self, cols):
        df = pd.DataFrame(columns=cols)
        for _, point in enumerate(self.raw_data):
            row = {"time": point['time']}
            if "cycle" in cols:
                row["cycle"] = _ + 1
            for val in point['values']:
                row[val] = point['values'][val]
            df = df.append(row, ignore_index=True)

        df.set_index("time", inplace=True)
        df.sort_index(inplace=True)

        return df


    def _fill_missing_df(self, df):
        df = df.fillna(method ='pad')
        return df

    
    def _iqr(self, df):
        for col in df:
            if col == "time":
                continue

            Q1 = np.quantile(df[col], 0.25)
            Q3 = np.quantile(df[col], 0.75)
            IQR = Q3 - Q1
            indices = []

            for i, val in enumerate(df[col]):
                if val > (Q3 + 1.5*IQR) or val < (Q1 - 1.5*IQR):
                    indices.append(i)

        df.drop(df.index[indices], inplace=True)

        return df


    def _z_score(self, df):
        for col in df:
            if col == "time":
                continue

            z_scores = stats.zscore(df[col])
            indices = []

            for i, _ in enumerate(df[col]):
                if abs(z_scores[i]) > 3:
                    indices.append(i)

        df.drop(df.index[indices], inplace=True)

        return df


    def preproc(self, return_type, columns=None):
        if return_type == "df":
            if "time" not in columns:
                columns.insert(0, "time")
            df = self._convert_to_df(columns)
            df_filled = self._fill_missing_df(df)
            # print("DF:", df_filled.shape)
            #df_iqr = self._iqr(df_filled)
            #print("DF_IQR:", df_iqr.shape)
            # df_z = self._z_score(df_filled)
            # print("DF_Z:", df_z.shape)
            return df_filled
        elif return_type == "cycledf":
            if "time" not in columns:
                columns.insert(0, "time")
                columns.insert(1, "cycle")
            df = self._convert_to_df(columns)
            df_filled = self._fill_missing_df(df)
            return df_filled


class WindowSeperator:
    def __init__(self, data, anomalies):
        self.X = data
        self.A = anomalies

    def seperate_once(self, time_range=300):
        windows = []
        df = pd.DataFrame(columns=self.X.columns, index=["time"])

        for i in range((len(self.X.values) // time_range) + 1):
            if -1 in list(self.X[i*time_range:(i+1)*time_range]['anomaly2']):
                df = df.append(self.X[i*time_range:(i+1)*time_range])
            else:
                windows.append(df.dropna())
                df = pd.DataFrame(columns=self.X.columns, index=["time"])

        windows.append(df.dropna())
        return windows
                






            
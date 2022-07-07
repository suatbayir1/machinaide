# import pandas as pd
import numpy as np
from ml_config import OPERATIONS

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
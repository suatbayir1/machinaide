from evalml.objectives.regression_objective import RegressionObjective
from evalml.utils import classproperty
import math
import statistics

"""
    ["ExpVariance", "MAE", "MaxError", "Mean Squared Log Error", 
    "MedianAE", "MSE", "R2", "Root Mean Squared Error", "Root Mean Squared Log Error"]
"""

def variance(data):
    # Number of observations
    n = len(data)
    # Mean of the data
    mean = sum(data) / n
    # Square deviations
    deviations = [(x - mean) ** 2 for x in data]
    # Variance
    variance = sum(deviations) / n
    return variance


class CustomExpVariance(RegressionObjective):
    """Explained variance score for regression.

    Example:
        >>> y_true = pd.Series([1.5, 2, 3, 1, 0.5, 1, 2.5, 2.5, 1, 0.5, 2])
        >>> y_pred = pd.Series([1.5, 2.5, 2, 1, 0.5, 1, 3, 2.25, 0.75, 0.25, 1.75])
        >>> np.testing.assert_almost_equal(ExpVariance().objective_function(y_true, y_pred), 0.7760736)
    """

    name = "Custom ExpVariance"
    greater_is_better = True
    score_needs_proba = False
    perfect_score = 1.0
    is_bounded_like_percentage = False  # Range (-Inf, 1]
    expected_range = [float("-inf"), 1]

    def __init__(self, early_guess_punishment, late_guess_punishment):
        self.early_guess_punishment = early_guess_punishment
        self.late_guess_punishment = late_guess_punishment

    def objective_function(self, y_true, y_predicted, X=None, sample_weight=None):
        """Objective function for explained variance score for regression."""
        y_true_list = y_true.values.tolist()
        # print("*************")
        # print(y_true)
        # print(y_true_list)
        # print("*************")

        y_pred_list = y_predicted.values.tolist()

        true_pred_list = []

        for i in range(len(y_true_list)):
            # early prediction
            if(y_true_list[i] > y_pred_list[i]):
                res = self.early_guess_punishment * (y_true_list[i]-y_pred_list[i])
                true_pred_list.append(res)
            # late prediction
            elif(y_true_list[i] > y_pred_list[i]):
                res = self.late_guess_punishment * (y_true_list[i]-y_pred_list[i])
                true_pred_list.append(res)
            # exact prediction
            else:
                res = y_true_list[i]-y_pred_list[i]
                true_pred_list.append(res)

        expvar = 1-(variance(true_pred_list)/variance(y_true_list))
        return expvar

class CustomMAE(RegressionObjective):
    """Mean absolute error for regression.

    Example:
        >>> y_true = pd.Series([1.5, 2, 3, 1, 0.5, 1, 2.5, 2.5, 1, 0.5, 2])
        >>> y_pred = pd.Series([1.5, 2.5, 2, 1, 0.5, 1, 3, 2.25, 0.75, 0.25, 1.75])
        >>> np.testing.assert_almost_equal(MAE().objective_function(y_true, y_pred), 0.2727272)
    """

    name = "Custom MAE"
    greater_is_better = False
    score_needs_proba = False
    perfect_score = 0.0
    is_bounded_like_percentage = True  # Range [0, Inf)
    expected_range = [0, float("inf")]

    def __init__(self, early_guess_punishment, late_guess_punishment):
        self.early_guess_punishment = early_guess_punishment
        self.late_guess_punishment = late_guess_punishment

    def objective_function(self, y_true, y_predicted, X=None, sample_weight=None):
        """Objective function for mean absolute error for regression."""
        mae = 0
        for i in range(y_true.shape[0]):
            # early prediction
            if(y_true.iloc[i] > y_predicted.iloc[i]):
                res = self.early_guess_punishment * abs(y_true.iloc[i] - y_predicted.iloc[i])
                print("early prediction", res)
                mae += res
            # late prediction
            elif(y_true.iloc[i] < y_predicted.iloc[i]):
                res = self.late_guess_punishment * abs(y_true.iloc[i] - y_predicted.iloc[i])
                print("late prediction", res)
                mae += res
            # exact prediction
            else:
                res = abs(y_true.iloc[i] - y_predicted.iloc[i])
                print("exact prediction", res)
                mae += res

        mae = mae / y_true.shape[0]

        return mae


class CustomMaxError(RegressionObjective):
    """Maximum residual error for regression.

    Example:
        >>> y_true = pd.Series([1.5, 2, 3, 1, 0.5, 1, 2.5, 2.5, 1, 0.5, 2])
        >>> y_pred = pd.Series([1.5, 2.5, 2, 1, 0.5, 1, 3, 2.25, 0.75, 0.25, 1.75])
        >>> np.testing.assert_almost_equal(MaxError().objective_function(y_true, y_pred), 1.0)
    """

    name = "Custom MaxError"
    greater_is_better = False
    score_needs_proba = False
    perfect_score = 0.0
    is_bounded_like_percentage = False  # Range [0, Inf)
    expected_range = [0, float("inf")]

    def __init__(self, early_guess_punishment, late_guess_punishment):
        self.early_guess_punishment = early_guess_punishment
        self.late_guess_punishment = late_guess_punishment

    def objective_function(self, y_true, y_predicted, X=None, sample_weight=None):
        """Objective function for maximum residual error for regression."""
        y_true_list = y_true.values.tolist()
        y_pred_list = y_predicted.values.tolist()

        difference_list = []

        for i in range(len(y_true_list)):
            # early prediction
            if(y_true_list[i] > y_pred_list[i]):
                res = self.early_guess_punishment * abs(y_true_list[i]-y_pred_list[i])
                difference_list.append(res)
            # late prediction
            elif(y_true_list[i] > y_pred_list[i]):
                res = self.late_guess_punishment * abs(y_true_list[i]-y_pred_list[i])
                difference_list.append(res)
            # exact prediction
            else:
                res = abs(y_true_list[i]-y_pred_list[i])
                difference_list.append(res)
        
        return max(difference_list)

class CustomMeanSquaredLogError(RegressionObjective):
    """Mean squared log error for regression.

    Only valid for nonnegative inputs. Otherwise, will throw a ValueError.

    Example:
        >>> y_true = pd.Series([1.5, 2, 3, 1, 0.5, 1, 2.5, 2.5, 1, 0.5, 2])
        >>> y_pred = pd.Series([1.5, 2.5, 2, 1, 0.5, 1, 3, 2.25, 0.75, 0.25, 1.75])
        >>> np.testing.assert_almost_equal(MeanSquaredLogError().objective_function(y_true, y_pred), 0.0171353)
    """

    name = "Custom Mean Squared Log Error"
    greater_is_better = False
    score_needs_proba = False
    perfect_score = 0.0
    is_bounded_like_percentage = False  # Range [0, Inf)
    expected_range = [0, float("inf")]

    def __init__(self, early_guess_punishment, late_guess_punishment):
        self.early_guess_punishment = early_guess_punishment
        self.late_guess_punishment = late_guess_punishment

    def objective_function(self, y_true, y_predicted, X=None, sample_weight=None):
        """Objective function for mean squared log error for regression."""
        y_true_list = y_true.values.tolist()
        y_pred_list = y_predicted.values.tolist()

        total = 0
        for i in range(len(y_true_list)):
            # early prediction
            if(y_true_list[i] > y_pred_list[i]):
                total += self.early_guess_punishment * ((math.log(1 + y_true_list[i]) - math.log(1 + y_pred_list[i])) ** 2)
            # late prediction
            elif(y_true_list[i] < y_pred_list[i]):
                total += self.late_guess_punishment * ((math.log(1 + y_true_list[i]) - math.log(1 + y_pred_list[i])) ** 2)
            # exact match
            else:
                total += (math.log(1 + y_true_list[i]) - math.log(1 + y_pred_list[i])) ** 2

        return total/len(y_true_list)

    @classproperty
    def positive_only(self):
        """If True, this objective is only valid for positive data."""
        return True

class CustomMedianAE(RegressionObjective):
    """Median absolute error for regression.

    Example:
        >>> y_true = pd.Series([1.5, 2, 3, 1, 0.5, 1, 2.5, 2.5, 1, 0.5, 2])
        >>> y_pred = pd.Series([1.5, 2.5, 2, 1, 0.5, 1, 3, 2.25, 0.75, 0.25, 1.75])
        >>> np.testing.assert_almost_equal(MedianAE().objective_function(y_true, y_pred), 0.25)
    """

    name = "Custom MedianAE"
    greater_is_better = False
    score_needs_proba = False
    perfect_score = 0.0
    is_bounded_like_percentage = False  # Range [0, Inf)
    expected_range = [0, float("inf")]

    def __init__(self, early_guess_punishment, late_guess_punishment):
        self.early_guess_punishment = early_guess_punishment
        self.late_guess_punishment = late_guess_punishment

    def objective_function(self, y_true, y_predicted, X=None, sample_weight=None):
        """Objective function for median absolute error for regression."""
        y_true_list = y_true.values.tolist()
        y_pred_list = y_predicted.values.tolist()

        difference_list = []

        for i in range(len(y_true_list)):
            # early prediction
            if(y_true_list[i] > y_pred_list[i]):
                res = self.early_guess_punishment * abs(y_true_list[i]-y_pred_list[i])
                difference_list.append(res)
            # late prediction
            elif(y_true_list[i] > y_pred_list[i]):
                res = self.late_guess_punishment * abs(y_true_list[i]-y_pred_list[i])
                difference_list.append(res)
            # exact prediction
            else:
                res = abs(y_true_list[i]-y_pred_list[i])
                difference_list.append(res)
        
        return statistics.median(difference_list)

class CustomMSE(RegressionObjective):
    """Mean squared error for regression.

    Example:
        >>> y_true = pd.Series([1.5, 2, 3, 1, 0.5, 1, 2.5, 2.5, 1, 0.5, 2])
        >>> y_pred = pd.Series([1.5, 2.5, 2, 1, 0.5, 1, 3, 2.25, 0.75, 0.25, 1.75])
        >>> np.testing.assert_almost_equal(MSE().objective_function(y_true, y_pred), 0.1590909)
    """

    name = "Custom MSE"
    greater_is_better = False
    score_needs_proba = False
    perfect_score = 0.0
    is_bounded_like_percentage = False  # Range [0, Inf)
    expected_range = [0, float("inf")]

    def __init__(self, early_guess_punishment, late_guess_punishment):
        self.early_guess_punishment = early_guess_punishment
        self.late_guess_punishment = late_guess_punishment

    def objective_function(self, y_true, y_predicted, X=None, sample_weight=None):
        """Objective function for mean squared error for regression."""
        # print("-----------------------mse")
        # print("true", len(y_true), y_true.shape, y_true.iloc[0], y_true)
        # print("pred", len(y_predicted), y_predicted.shape, y_predicted.iloc[0], y_predicted)
        mse = 0
        for i in range(y_true.shape[0]):
            # early prediction
            if(y_true.iloc[i] > y_predicted.iloc[i]):
                res = self.early_guess_punishment * ((y_true.iloc[i] - y_predicted.iloc[i]) ** 2)
                print("early prediction", res)
                mse += res
            # late prediction
            elif(y_true.iloc[i] < y_predicted.iloc[i]):
                res = self.late_guess_punishment * ((y_true.iloc[i] - y_predicted.iloc[i]) ** 2)
                print("late prediction", res)
                mse += res
            # exact prediction
            else:
                res = (y_true.iloc[i] - y_predicted.iloc[i]) ** 2
                print("exact prediction", res)
                mse += res

        mse = mse / y_true.shape[0]

        return mse


class CustomR2(RegressionObjective):
    """Coefficient of determination for regression.

    Example:
        >>> y_true = pd.Series([1.5, 2, 3, 1, 0.5, 1, 2.5, 2.5, 1, 0.5, 2])
        >>> y_pred = pd.Series([1.5, 2.5, 2, 1, 0.5, 1, 3, 2.25, 0.75, 0.25, 1.75])
        >>> np.testing.assert_almost_equal(R2().objective_function(y_true, y_pred), 0.7638036)
    """

    name = "Custom R2"
    greater_is_better = True
    score_needs_proba = False
    perfect_score = 1
    is_bounded_like_percentage = False  # Range (-Inf, 1]
    expected_range = [-1, 1]

    def __init__(self, early_guess_punishment, late_guess_punishment):
        self.early_guess_punishment = early_guess_punishment
        self.late_guess_punishment = late_guess_punishment

    def objective_function(self, y_true, y_predicted, X=None, sample_weight=None):
        """Objective function for coefficient of determination for regression."""
        y_true_list = y_true.values.tolist()
        y_pred_list = y_predicted.values.tolist()

        y_mean = sum(y_true_list)/len(y_true_list)

        diff_square_sum = 0 

        for i in range(len(y_true)):
            # early prediction
            if(y_true_list[i] > y_pred_list[i]):
                diff_square_sum += self.early_guess_punishment * ((y_true_list[i] - y_pred_list[i]) ** 2)
            # late prediction
            if(y_true_list[i] < y_pred_list[i]):
                diff_square_sum += self.late_guess_punishment * ((y_true_list[i] - y_pred_list[i]) ** 2)
            # exact prediction
            else:
                diff_square_sum += ((y_true_list[i] - y_pred_list[i]) ** 2)

        diff_mean_square_sum = 0

        for i in range(len(y_true_list)):
            diff_mean_square_sum += (y_true_list[i] - y_mean) ** 2
        
        r2 = 1-(diff_square_sum/diff_mean_square_sum)

        return r2

class CustomRootMeanSquaredError(RegressionObjective):
    """Root mean squared error for regression.

    Example:
        >>> y_true = pd.Series([1.5, 2, 3, 1, 0.5, 1, 2.5, 2.5, 1, 0.5, 2])
        >>> y_pred = pd.Series([1.5, 2.5, 2, 1, 0.5, 1, 3, 2.25, 0.75, 0.25, 1.75])
        >>> np.testing.assert_almost_equal(RootMeanSquaredError().objective_function(y_true, y_pred), 0.3988620)
    """

    name = "Custom Root Mean Squared Error"
    greater_is_better = False
    score_needs_proba = False
    perfect_score = 0.0
    is_bounded_like_percentage = False  # Range [0, Inf)
    expected_range = [0, float("inf")]

    def __init__(self, early_guess_punishment, late_guess_punishment):
        self.early_guess_punishment = early_guess_punishment
        self.late_guess_punishment = late_guess_punishment

    def objective_function(self, y_true, y_predicted, X=None, sample_weight=None):
        """Objective function for root mean squared error for regression."""
        mse = 0
        for i in range(y_true.shape[0]):
            # early prediction
            if(y_true.iloc[i] > y_predicted.iloc[i]):
                res = self.early_guess_punishment * ((y_true.iloc[i] - y_predicted.iloc[i]) ** 2)
                print("early prediction", res)
                mse += res
            # late prediction
            elif(y_true.iloc[i] < y_predicted.iloc[i]):
                res = self.late_guess_punishment * ((y_true.iloc[i] - y_predicted.iloc[i]) ** 2)
                print("late prediction", res)
                mse += res
            # exact prediction
            else:
                res = (y_true.iloc[i] - y_predicted.iloc[i]) ** 2
                print("exact prediction", res)
                mse += res

        mse = mse / y_true.shape[0]
        mse = math.sqrt(mse)

        return mse
    
class CustomRootMeanSquaredLogError(RegressionObjective):
    """Root mean squared log error for regression.

    Only valid for nonnegative inputs. Otherwise, will throw a ValueError.

    Example:
        >>> y_true = pd.Series([1.5, 2, 3, 1, 0.5, 1, 2.5, 2.5, 1, 0.5, 2])
        >>> y_pred = pd.Series([1.5, 2.5, 2, 1, 0.5, 1, 3, 2.25, 0.75, 0.25, 1.75])
        >>> np.testing.assert_almost_equal(RootMeanSquaredLogError().objective_function(y_true, y_pred), 0.13090204)
    """

    name = "Custom Root Mean Squared Log Error"
    greater_is_better = False
    score_needs_proba = False
    perfect_score = 0.0
    is_bounded_like_percentage = False  # Range [0, Inf)
    expected_range = [0, float("inf")]

    def __init__(self, early_guess_punishment, late_guess_punishment):
        self.early_guess_punishment = early_guess_punishment
        self.late_guess_punishment = late_guess_punishment

    def objective_function(self, y_true, y_predicted, X=None, sample_weight=None):
        """Objective function for root mean squared log error for regression."""
        y_true_list = y_true.values.tolist()
        y_pred_list = y_predicted.values.tolist()

        total = 0
        for i in range(len(y_true_list)):
            # early prediction
            if(y_true_list[i] > y_pred_list[i]):
                total += self.early_guess_punishment * ((math.log(1 + y_true_list[i]) - math.log(1 + y_pred_list[i])) ** 2)
            # late prediction
            elif(y_true_list[i] < y_pred_list[i]):
                total += self.late_guess_punishment * ((math.log(1 + y_true_list[i]) - math.log(1 + y_pred_list[i])) ** 2)
            # exact match
            else:
                total += (math.log(1 + y_true_list[i]) - math.log(1 + y_pred_list[i])) ** 2

        res = math.sqrt(total/len(y_true_list))

        return res


    @classproperty
    def positive_only(self):
        """If True, this objective is only valid for positive data."""
        return True
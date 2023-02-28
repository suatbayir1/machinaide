import tensorflow as tf
from tensorflow import keras
from tensorflow.python.keras.utils import metrics_utils
from tensorflow.python.ops import init_ops
from tensorflow.python.keras import backend
from tensorflow.python.keras.utils.generic_utils import to_list

class CustomMetric(keras.metrics.Metric):
    def __init__(self, equation, **kwargs):
        super(CustomMetric, self).__init__(name='custom_metric',**kwargs)
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
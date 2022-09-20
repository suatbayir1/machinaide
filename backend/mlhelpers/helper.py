import math
import tensorflow as tf
import keras_tuner as kt

def get_feature_number(given_features, setting):
    if(setting == "n"):
        return given_features
    elif(setting == "1.5n"):
        return math.ceil(given_features * 1.5)
    elif(setting == "2n"):
        return given_features * 2
    else:
        return given_features

#  ‘val_loss’, ‘val_acc’, ‘accuracy’, ‘loss’, ‘mse’
# ['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
optimizers = {
    "default": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall()], "objective": "val_acc"},
    "auc": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(), tf.keras.metrics.AUC(name="auc")], "objective": kt.Objective("auc", direction="max")},
    "tp": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(), tf.keras.metrics.TruePositives(name='tp')], "objective": kt.Objective("tp", direction="max")},
    "fp": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(), tf.keras.metrics.FalsePositives(name='fp')], "objective": kt.Objective("fp", direction="min")},
    "fn": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(), tf.keras.metrics.FalseNegatives(name='fn')], "objective": kt.Objective("fn", direction="min")},
    "tn": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(), tf.keras.metrics.TrueNegatives(name='tn')], "objective": kt.Objective("tn", direction="max")},
    "precision": {"compile": ["accuracy", tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall()], "objective": kt.Objective("precision", direction="max")},
    "recall": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(name='recall')], "objective": kt.Objective("recall", direction="max")},
    "val_loss": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall()], "objective": "val_loss"},
    "val_accuracy": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall()], "objective": "val_acc"},
    "accuracy": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall()], "objective": "accuracy"},
    "loss": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall()], "objective": "loss"},
    "mse": {"compile": ["accuracy", tf.keras.metrics.Precision(), tf.keras.metrics.Recall(), "mse"], "objective": "mse"},    
}

optimizers2 = {
    "default": {"compile": ["accuracy"], "objective": "val_acc"},
    "auc": {"compile": ["accuracy", tf.keras.metrics.AUC(name="auc")], "objective": kt.Objective("auc", direction="max")},
    "tp": {"compile": ["accuracy", tf.keras.metrics.TruePositives(name='tp')], "objective": kt.Objective("tp", direction="max")},
    "fp": {"compile": ["accuracy", tf.keras.metrics.FalsePositives(name='fp')], "objective": kt.Objective("fp", direction="min")},
    "fn": {"compile": ["accuracy", tf.keras.metrics.FalseNegatives(name='fn')], "objective": kt.Objective("fn", direction="min")},
    "tn": {"compile": ["accuracy", tf.keras.metrics.TrueNegatives(name='tn')], "objective": kt.Objective("tn", direction="max")},
    "precision": {"compile": ["accuracy"], "objective": kt.Objective("precision", direction="max")},
    "recall": {"compile": ["accuracy"], "objective": kt.Objective("recall", direction="max")},
    "val_loss": {"compile": ["accuracy"], "objective": "val_loss"},
    "val_accuracy": {"compile": ["accuracy"], "objective": "val_acc"},
    "accuracy": {"compile": ["accuracy"], "objective": "accuracy"},
    "loss": {"compile": ["accuracy"], "objective": "loss"},
    "mse": {"compile": ["accuracy", "mse"], "objective": "mse"},    
}
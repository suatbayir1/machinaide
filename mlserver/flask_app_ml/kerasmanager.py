import os
from multiprocessing import Lock
from multiprocessing.managers import BaseManager
from tensorflow.keras.models import load_model
from tensorflow.keras.callbacks import EarlyStopping
import tensorflow as tf
#from mlauto import MyBayesianOptimization, MyHyperband, MyModelBuilder, MyRandomSearch, ReportIntermediates, AUTOML_OPTIMIZERS
#from mlconstants import AUTOML_VECTOR_LENGTH

# tf.compat.v1.disable_v2_tensorshape()


class KerasModel:
    def __init__(self):
        self.mutex = Lock()
        self.model = None

    def initialize(self, path):
        # print(path)
        self.model = load_model(path, compile=False)

    def predict_once(self, arr):
        with self.mutex:
            return self.model.predict(arr)


#class KerasModelBuilder:
#    def __init__(self):
#        self.mutex = Lock()
#        self.tuner = None
#        self.stop_early = None
#        self.X_train = None
#        self.y_train = None
    
#    def initialize(self, X_train, y_train, tuner_type, experiment_name):
#        optimizer = AUTOML_OPTIMIZERS["default"]
#        model_builder = MyModelBuilder(AUTOML_VECTOR_LENGTH, X_train, y_train, optimizer["compile"])
#        self.X_train = X_train
#        self.y_train = y_train
#        if tuner_type == "hyperband":
#            self.tuner =  MyHyperband(model_builder,
#                        objective=optimizer["objective"], # val_accuracy
#                        max_epochs=5, #3
#                        factor=3,
#                        directory='experiments',
#                        project_name=experiment_name)
#        elif tuner_type == "random":
#            self.tuner = MyRandomSearch(model_builder,
#                        objective=optimizer["objective"],
#                        seed=1,
#                        max_trials=10,
#                        executions_per_trial=2,
#                        directory='experiments',
#                        project_name=experiment_name)
#        elif tuner_type == "bayesian":
#            self.tuner = MyBayesianOptimization(model_builder,
#                            objective=optimizer["objective"],
#                            max_trials=10,
#                            executions_per_trial=1,
#                            directory='experiments',
#                            project_name=experiment_name,
#                            overwrite=True)
#        self.stop_early = EarlyStopping(monitor='val_loss', patience=5)

#    def search_hyper(self):
#        try:
#            self.tuner.search(self.X_train, self.y_train, epochs=1,validation_split=0.05, callbacks=[self.stop_early], verbose=1) # , ReportIntermediates(tuner)
#        except Exception as e:
#            print(e, "tnr")
#        print("tunerend")
#        best_hps=self.tuner.get_best_hyperparameters(num_trials=1)[0]
#        model = self.tuner.hypermodel.build(best_hps)

#        return model


class KerasManager(BaseManager):
    pass

KerasManager.register('KerasModel', KerasModel)

class KerasHyperManager(BaseManager):
    pass

KerasManager.register('KerasModel', KerasModel)
#KerasHyperManager.register('KerasModelBuilder', KerasModelBuilder)

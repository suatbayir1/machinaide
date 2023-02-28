import datetime
import pickle
import time
import os
from mlconstants import MODELDIR
from mlutils import MongoHelper
import numpy as np
from pebble import concurrent
from requests.sessions import session
from sklearn.preprocessing import normalize
from tensorflow.keras.callbacks import History, Callback
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Masking, LSTM, Dense, Activation
from tensorflow.keras.optimizers import RMSprop
from tensorflow.keras import backend as K



class MLWeibull:
    def __init__(self, dataset, input_columns, output_columns, settings, session_id, model_id, group_with):
        self.dataset = dataset
        self.input_columns = input_columns
        self.output_columns = output_columns
        self.settings = settings
        self.sesion_id = session_id
        self.model_id = model_id
        self.group_with = group_with

    
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

        hazard0 = K.pow((y_ + 1e-35) / a_, b_)
        hazard1 = K.pow((y_ + 1) / a_, b_)

        return -1 * K.mean(u_ * K.log(K.exp(hazard1 - hazard0) - 1.0) - hazard1)

    
    def build_data(self, time, x, max_time, sensor_count, is_test):
        # y[0] will be days remaining, y[1] will be event indicator, always 1 for this data
        out_y = np.empty((0, 2), dtype=np.float32)
        # A full history of sensor readings to date for each x
        out_x = np.empty((0, max_time, sensor_count), dtype=np.float32)
        max_engine_time = int(np.max(time)) 
        # print(max_engine_time)

        if is_test:
            start = max_engine_time - 1
        else:
            start = 0

        this_x = np.empty((0, max_time, sensor_count), dtype=np.float32)

        for j in range(start, max_engine_time):
            engine_x = x

            out_y = np.append(out_y, np.array((max_engine_time - j, 1), ndmin=2), axis=0)

            xtemp = np.zeros((1, max_time, sensor_count))
            xtemp[:, max_time-min(j, max_time-1)-1:max_time, :] = engine_x[max(0, j-max_time+1):j+1, :]
            this_x = np.concatenate((this_x, xtemp))

        out_x = np.concatenate((out_x, this_x))
        return out_x, out_y


    def train(self):
        num_data = self.dataset.to_numpy()

        # normalize sensor data
        num_data[:, 1:] = normalize(num_data[:, 1:], axis=0)

        # Configurable observation look-back period for each engine/seconds
        max_time = 200

        train_x, train_y = self.build_data(num_data[:, 0], num_data[:, 1:], max_time, len(self.input_columns), False)

        # Store some history
        history = History()

        # Start building our model
        model = Sequential()

        # Mask parts of the lookback period that are all zeros (i.e., unobserved) so they don't skew the model
        model.add(Masking(mask_value=0., input_shape=(max_time, len(self.input_columns))))

        # LSTM is just a common type of RNN. You could also try anything else (e.g., GRU).
        #model.add(LSTM(100, input_dim=2))
        # LSTM is just a common type of RNN. You could also try anything else (e.g., GRU).
        model.add(LSTM(20, input_dim=len(self.input_columns)))

        # We need 2 neurons to output Alpha and Beta parameters for our Weibull distribution
        model.add(Dense(2))

        # Apply the custom activation function mentioned above
        model.add(Activation(self.activate))

        # Use the discrete log-likelihood for Weibull survival data as our loss function
        model.compile(loss=self.weibull_loglik_discrete, optimizer=RMSprop(learning_rate=0.01))

        n_epochs = 50
        log_file = "progress-logs/" + self.model_name + "-" + self.username + ".txt"
        # Fit!
        model.fit(train_x, train_y, epochs=n_epochs, batch_size=2000, verbose=0, callbacks=[history, LoggingCallback(log_file, n_epochs)])

        if not os.path.isdir(MODELDIR):
            os.mkdir(MODELDIR)

        t_dir = MODELDIR + self.model_id + "/"
        os.mkdir(t_dir)
        file_name = t_dir + self.model_id + ".trained"
        print(t_dir, "tdir")
        model.save(t_dir + "model.h5")

        input_cols = self.input_columns
        output_cols = ["alpha", "beta"]
        obj = {
            "Algorithm": "Weibull",
            "modelID": self.model_id,
            "sessionID": str(self.session_id),
            "Directory": t_dir,
            "Settings": self.settings,
            "InputColumns": input_cols,
            "OutputColumns": output_cols,
            "Optional": {
                "Group With": self.group_with
            }
        }
        self.mongo_client.post_training_data(obj)
        with open(file_name, 'ab') as train_file:
            pickle.dump(obj, train_file)

        if os.path.exists(log_file):
            time.sleep(5)
            os.remove(log_file)


    @property
    def mongo_client(self):
        return MongoHelper()


    @concurrent.process
    def run(self):
        self.train()


class LoggingCallback(Callback):
    """Callback that logs message at end of epoch.
    """

    def __init__(self, file_path, epoch_size):
        Callback.__init__(self)
        self.file_path = file_path
        self.epoch_size = epoch_size

    def on_epoch_end(self, epoch, logs={}):
      with open(self.file_path, 'a') as f: 
        msg = "Epoch %i/%i\n%s" % (epoch, self.epoch_size, ", ".join("%s: %f" % (k, v) for k, v in logs.items()))
        f.write(msg)
        f.write("\n")
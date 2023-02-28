import argparse
import json

from numpy import False_
from config import MLSESSIONDIR, models_path
from pandas import read_csv
from mlhelpers.mllstm import MLLSTM, LSTMRunner
from mlhelpers.mlwrappers import ADClustererSession
from mlhelpers.mlhdbscan import HDBSCANRunner
# from mlhelpers.semisupervised import SemiSupervisedVAE


class MLSetup:
    def __init__(self, session_id, model_id, algorithm):
        self.session_id = session_id
        self.model_id = model_id
        self.algorithm = algorithm

        self.df = None
        self.settings = None


    def setup_phase(self):
        s_dir = MLSESSIONDIR + self.session_id + "/"
        self.df = read_csv(s_dir + "data.csv")

        m_dir = s_dir + model_id
        with open(m_dir + "/sessioninfo.json", 'r') as fp:
            self.settings = json.load(fp)

    
    def start_training(self):
        if self.algorithm == "LSTM":
            lstm_model = MLLSTM(self.df, self.settings["columns"], self.session_id, self.model_id, self.settings["params"], self.settings["dbsettings"])
            lstm_model.run()
        # elif self.algorithm == "SemiSupervisedVAE":
        #     s_dir = MLSESSIONDIR + self.session_id + "/"
        #     with open(s_dir + "/semisupervised.json", 'r') as fp:
        #         semisupervised_data = json.load(fp)
        #     ss_model = SemiSupervisedVAE(self.df, semisupervised_data, self.settings["input"], self.settings["output"], self.session_id, self.model_id, self.settings["params"], self.settings["dbsettings"])
        #     ss_model.run()
 

    def run(self):
        self.setup_phase()
        self.start_training()


class MLRunner:
    def __init__(self, session_id, model_id, algorithm):
        self.session_id = session_id
        self.model_id = model_id
        self.algorithm = algorithm

        self.settings = None


    def setup_phase(self):
        s_dir = MLSESSIONDIR + self.session_id + "/"
        m_dir = s_dir + model_id
        with open(m_dir + "/posttrain.json", 'r') as fp:
            self.settings = json.load(fp)

    
    def start_running(self):
        if self.algorithm == "LSTM":
            lstm_runner = LSTMRunner(self.settings)
            lstm_runner.run()

    
    def run(self):
        self.setup_phase()
        self.start_running()


class ClusterSetup:
    def __init__(self, session_id):
        self.session_id = session_id

        self.settings = None

    def run(self):
        with open(models_path + str(self.session_id) + "/sessioninfo.json", 'r') as fp:
            self.settings = json.load(fp)
        
        print("session done")
        clusterer = ADClustererSession(self.settings)
        clusterer.run()

# class ClusterRunner:
#     def __init__(self, session_id):
#         self.session_id = session_id

#     def run(self)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument("-t", "--task", required=True, type=str,
            help="train or run or cluster")
    ap.add_argument("-s", "--session", required=True, type=str,
            help="session id")
    ap.add_argument("-m", "--model", required=False, type=str,
            help="model id")
    ap.add_argument("-a", "--algorithm", required=False, type=str,
            help="algorithm to be used")
        
    args = vars(ap.parse_args())
    task = args["task"]
    session_id = args["session"]
    if task != "cluster":
        model_id = args["model"]
        algorithm = args["algorithm"]

    if task == "train":
        setupobj = MLSetup(session_id, model_id ,algorithm)
        setupobj.run()
    elif task == "run":
        runnerobj = MLRunner(session_id, model_id, algorithm)
        runnerobj.run()
    elif task == "cluster":
        clusterobj = ClusterSetup(session_id)
        clusterobj.run()
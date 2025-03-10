import { BACKEND } from 'src/config';
import axios from "axios";

class HealthAssessmentService {
    getMachineAnomalies = async (machineID) => {
        const url = `${BACKEND.API_URL}health/getMachineAnomalies/${machineID}`;

        const request = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            }
        })

        try {
            const response = await request;
            const res = await response.json();

            if (res.data.success !== true) return;
            const result = JSON.parse(res.data.data)
            return result;
        } catch (err) {
            console.error(err);
        }
    }

    getRootCauseAnalysis = async(failureIDD) => {
        const url = `${BACKEND.API_URL}health/getRootCauseAnalysis/${failureIDD}`;

        const request = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            }
        })

        try {
            const response = await request;
            const res = await response.json();
            console.log(res, "res")
            // if (res.data.success !== true) return;
            // const result = JSON.parse(res.data.data)
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    addMachineAnomaly = async (machineID, modelID, anomaly) => {
        const url = `${BACKEND.API_URL}health/addAnomalyToMachine/${machineID}/${modelID}`;

        const request = fetch(url, {
            method: 'PUT',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(anomaly),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }

            if (res.data.success !== true) return;
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    deleteMachineAnomaly = async (machineID, modelID, anomaly) => {
        const url = `${BACKEND.API_URL}health/deleteAnomalyFromMachine/${machineID}/${modelID}`;

        const request = fetch(url, {
            method: 'PUT',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(anomaly),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }

            if (res.data.success !== true) return;
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    updateAnomalyFeedback = async (machineID, modelID, anomaly) => {
        const url = `${BACKEND.API_URL}health/changeFeedback/${machineID}/${modelID}`;

        const request = fetch(url, {
            method: 'PUT',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(anomaly),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }

            if (res.data.success !== true) return;
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    updateManualAnomaly = async (machineID, modelID, anomaly) => {
        const url = `${BACKEND.API_URL}health/updateAnomaly/${machineID}/${modelID}`;

        const request = fetch(url, {
            method: 'PUT',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(anomaly),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }

            if (res.data.success !== true) return;
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    testToken = async () => {
        const url = `${BACKEND.API_URL}failure/getTokenTest`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify({ "token": window.localStorage.getItem("token") }),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    startRULAutoMLSession = async (settings) => {
        const url = `${BACKEND.API_URL}ml/startRULModelTraining`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(settings),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    startPOFAutoMLSession = async (settings) => {
        const url = `${BACKEND.API_URL}ml/startPOFModelTraining`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(settings),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    startRULRegAutoMLSession = async (settings) => {
        const url = `${BACKEND.EVALML_URL}/startRULRegModelTraining`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(settings),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    startClusteringSession = async(settings) => {
        const url = `${BACKEND.API_URL}ml/createClusterer`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(settings)
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 201) {
                throw new Error(res.data.message.text);
            }
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    getMLModels = async (settings) => {
        const url = `${BACKEND.API_URL}ml/getMLModels`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(settings),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    getMLModelsWithID = async (settings) => {
        const url = `${BACKEND.API_URL}ml/getMLModelsWithID`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(settings),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    startStopModel = async (settings) => {
        const url = `${BACKEND.API_URL}ml/startStopModel`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(settings),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }
    
    getEvidentlyReport = async (modelID) => {
        const url = `${BACKEND.API_URL}health/getEvidentlyReport/${modelID}`;

        const request = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            }
        })

        try {
            const response = await request;
            const res = await response.json();

            if (res.data.success !== true) return;
            const result = JSON.parse(res.data.data)
            return result;
        } catch (err) {
            console.error(err);
        }
    }

    createRULEvidentlyReport = async (modelID, settings) => {
        const url = `${BACKEND.EVIDENTLY_URL}/createRULEvidentlyReport/${modelID}`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(settings),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    createRULRegEvidentlyReport = async (modelID, settings) => {
        const url = `${BACKEND.EVIDENTLY_URL}/createRULRegEvidentlyReport/${modelID}`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(settings),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    getMLModel = async (settings) => {
        const url = `${BACKEND.API_URL}ml/getMLModel`;
        console.log(settings)
        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(settings),
        })

        try {
            const response = await request;
            console.log(response)
            const res = await response.json();
            console.log("-", res)
            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    startRootCauseAnalysis = async(settings) => {
        const url = `${BACKEND.API_URL}ml/rootCauseAnalysis`;
        console.log(settings)
        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(settings),
        })

        try {
            const response = await request;
            console.log(response)
            const res = await response.json();
            console.log("-", res)
            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    updateModelLogFeedback = async (settings) => {
        const url = `${BACKEND.API_URL}ml/updateModelLogFeedback`;
        console.log(settings)
        const request = fetch(url, {
            method: 'PUT',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(settings),
        })

        try {
            const response = await request;
            console.log(response)
            const res = await response.json();
            console.log("-", res)
            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

}

export default new HealthAssessmentService();
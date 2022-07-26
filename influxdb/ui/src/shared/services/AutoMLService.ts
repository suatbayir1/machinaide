// Constants
import { BACKEND } from 'src/config';

class AutoMLService {
    async getAutoMLSettings(): Promise<any> {
        let url = `${BACKEND.API_URL}ml/getAutoMLSettings`;

        const fetchPromise = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            credentials: 'include'
        })

        try {
            const response = await fetchPromise;
            const res = await response.json();
            return res
        }
        catch (err) {
            console.log("Error while getting automl settings with msg: ", err);
        }
    };

    async updateAutoMLSettings(settings): Promise<any> {
        let url = `${BACKEND.API_URL}ml/updateAutoMLSettings`;

        const fetchPromise = fetch(url, {
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
            const response = await fetchPromise;
            const res = await response.json();

            if (res.data.success !== true) return;
            console.log(res)
            return res.data;
        }
        catch (err) {
            console.log("Error while updating automl settings with msg: ", err);
        }
    };

    async getTrialDetails(experimentName): Promise<any> {
        let url = `${BACKEND.API_URL}ml/getTrialDetails/${experimentName}`;

        const fetchPromise = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        })
        try {
            const response = await fetchPromise;
            const res = await response.json();
            return res
        }
        catch (err) {
            console.log("Error while getting trials with msg: ", err);
        }
    };

    async getTrialIntermediates(experimentName): Promise<any> {
        let url = `${BACKEND.API_URL}ml/getTrialIntermediates/${experimentName}`;

        const fetchPromise = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        })
        try {
            const response = await fetchPromise;
            const res = await response.json();
            return res
        }
        catch (err) {
            console.log("Error while getting trial intermediates with msg: ", err);
        }
    };

    async getMLReport(path): Promise<any> {
        let url = `${BACKEND.API_URL}ml/getMLReport/${path}`;

        const fetchPromise = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            credentials: 'include'
        })

        try {
            const response = await fetchPromise;
            const res = await response.json();
            return res
        }
        catch (err) {
            console.log("Error while getting ml report with msg: ", err);
        }
    };

    getExperiment = async (settings) => {
        const url = `${BACKEND.API_URL}ml/getExperiment`;
        
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
            console.log(res)
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    getTrialsFromDB = async (settings) => {
        const url = `${BACKEND.API_URL}ml/getTrialsFromDB`;
        
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
            console.log(res)
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    getTrialsFromDirectory = async (settings) => {
        const url = `${BACKEND.API_URL}ml/getTrialsFromDirectory`;
        
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
            console.log(res)
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    async getModelLogs(modelID): Promise<any> {
        let url = `${BACKEND.API_URL}ml/getModelLogs/${modelID}`;

        const fetchPromise = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            credentials: 'include'
        })

        try {
            const response = await fetchPromise;
            const res = await response.json();
            return res
        }
        catch (err) {
            console.log("Error while getting automl settings with msg: ", err);
        }
    };
}

export default new AutoMLService();

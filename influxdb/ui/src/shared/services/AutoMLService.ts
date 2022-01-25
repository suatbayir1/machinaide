// Constants
import { BACKEND } from 'src/config';

class AutoMLService {
    async getAutomlSettings(): Promise<any> {
        let url = `${BACKEND.API_URL}ml/getAutomlSettings`;

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

    async updateAutomlSettings(settings): Promise<any> {
        let url = `${BACKEND.API_URL}ml/updateAutomlSettings`;

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
            console.log(response);

            const res = await response.json();
            return { message: res.msg, status: response.status };
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
}

export default new AutoMLService();

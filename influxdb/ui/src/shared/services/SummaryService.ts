import { BACKEND } from 'src/config';
import axios from "axios";

class SummaryService {
    getUptimeAndDowntime = async () => {
        const url = `${BACKEND.API_URL}summaryreport/getUptimeAndDownTime`

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
            console.log("result: ", res)
            // if (res.data.success !== true) return;
            // const result = JSON.parse(res.data.data)
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    getIsemriCount = async () => {
        const url = `${BACKEND.API_URL}summaryreport/getIsemriCount`

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
            console.log("result: ", res)
            // if (res.data.success !== true) return;
            // const result = JSON.parse(res.data.data)
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    getIsemriDistribution = async () => {
        const url = `${BACKEND.API_URL}summaryreport/getIsemriDistribution`

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
            console.log("result: ", res)
            // if (res.data.success !== true) return;
            // const result = JSON.parse(res.data.data)
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    getJobsInADay = async (payload) => {
        const url = `${BACKEND.API_URL}summaryreport/getJobsInADay`
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
            body: JSON.stringify(payload),
        })

        try {
	    const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }
            return JSON.parse(res["jobs"]);
        } catch (err) {
            console.error(err);
        }
    }
}

export default new SummaryService()
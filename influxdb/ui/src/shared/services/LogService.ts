import { BACKEND } from 'src/config';

class LogService {
    getLogs = async (payload) => {
        const url = `${BACKEND.API_URL}log/getLogs`;

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

            if (res.data.success !== true) return;
            const result = JSON.parse(res.data.data);
            const total_count = res.data.summary.total_count;
            return { result, total_count };
        } catch (err) {
            console.log(err);
        }
    }
}

export default new LogService();
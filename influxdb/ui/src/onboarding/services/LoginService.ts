import { BACKEND } from 'src/config';

class LoginService {
    loginWithInflux = async () => {
        const url = `${BACKEND.API_URL}auth/loginWithInflux`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE'
            }
        })

        try {
            const response = await request;
            const res = await response.json();
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    loginWithLDAP = async (payload) => {
        const url = `${BACKEND.API_URL}auth/loginWithLDAP`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE'
            },
            body: JSON.stringify(payload),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (res.data.success !== true) return;
            const result = JSON.parse(res.data.data);
            return result;
        } catch (err) {
            console.error(err);
        }
    }
}

export default new LoginService();

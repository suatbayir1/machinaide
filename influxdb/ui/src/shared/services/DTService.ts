import { BACKEND } from 'src/config';
import axios from "axios";

class DTService {
    async getAllDT() {
        const url = `${BACKEND.API_URL}dt/`;

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

    getGeneralInfo = async () => {
        const url = `${BACKEND.API_URL}dt/getGeneralInfo`;

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

    async removeRelationship(payload) {
        const url = `${BACKEND.API_URL}dt/removeRelationship`;

        const request = fetch(url, {
            method: 'DELETE',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(payload)
        })

        try {
            const response = await request;
            const res = await response.json();
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    async deleteDT(payload) {
        const url = `${BACKEND.API_URL}dt/delete`;

        const request = fetch(url, {
            method: 'DELETE',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(payload)
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

    updateSensor = async (payload) => {
        const url = `${BACKEND.API_URL}dt/updateSensor`;

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
            body: JSON.stringify(payload)
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

    addRelationship = async (payload) => {
        const url = `${BACKEND.API_URL}dt/addRelationship`;

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
            body: JSON.stringify(payload)
        })

        try {
            const response = await request;
            const res = await response.json();
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    update = async (payload) => {
        let url = `${BACKEND.API_URL}dt/update`;

        return await axios
            .put(url, payload, { headers: { 'token': window.localStorage.getItem("token") } })
            .then(response => {
                if (response.status === 200) {
                    return response.data.data;
                }
            })
            .catch(err => {
                return err.response.data.data;
            })
    }

    retire = async (payload) => {
        let url = `${BACKEND.API_URL}dt/retire`;

        return await axios
            .post(url, payload, { headers: { 'token': window.localStorage.getItem("token") } })
            .then(response => {
                if (response.status === 200) {
                    return response.data.data;
                }
            })
            .catch(err => {
                return err.response.data.data;
            })
    }

    getRetired = async (payload) => {
        let url = `${BACKEND.API_URL}dt/getRetired`;

        return await axios
            .post(url, payload, { headers: { 'token': window.localStorage.getItem("token") } })
            .then(response => {
                console.log(response);
                if (response.status === 200) {
                    return JSON.parse(response.data.data.data);
                }
            })
            .catch(err => {
                return err.response.data.data;
            })
    }
}

export default new DTService();
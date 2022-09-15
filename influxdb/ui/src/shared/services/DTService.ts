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

    getObjectList = async () => {
        const url = `${BACKEND.API_URL}object/getObjectPool`;

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
            const result = JSON.parse(res.data.data);
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
                if (response.status === 200) {
                    return JSON.parse(response.data.data.data);
                }
            })
            .catch(err => {
                return err.response.data.data;
            })
    }

    insertFactory = async (payload) => {
        let url = `${BACKEND.API_URL}dt/insertFactory`;

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

    updateFactory = async (payload) => {
        let url = `${BACKEND.API_URL}dt/updateFactory`;

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

    deleteFactory = async (payload) => {
        let url = `${BACKEND.API_URL}dt/deleteFactory`;

        return await axios
            .delete(url, { headers: { 'token': window.localStorage.getItem("token") }, data: payload })
            .then(response => {
                if (response.status === 200) {
                    return response.data.data;
                }
            })
            .catch(err => {
                return err.response.data.data;
            })
    }

    insertProductionLine = async (payload) => {
        let url = `${BACKEND.API_URL}dt/insertProductionLine`;

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

    updateProductionLine = async (payload) => {
        let url = `${BACKEND.API_URL}dt/updateProductionLine`;

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

    deleteProductionLine = async (payload) => {
        let url = `${BACKEND.API_URL}dt/deleteProductionLine`;

        return await axios
            .delete(url, { headers: { 'token': window.localStorage.getItem("token") }, data: payload })
            .then(response => {
                if (response.status === 200) {
                    return response.data.data;
                }
            })
            .catch(err => {
                return err.response.data.data;
            })
    }

    insertMachine = async (payload) => {
        let url = `${BACKEND.API_URL}dt/insertMachine`;

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

    updateMachine = async (payload) => {
        let url = `${BACKEND.API_URL}dt/updateMachine`;

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

    deleteMachine = async (payload) => {
        let url = `${BACKEND.API_URL}dt/deleteMachine`;

        return await axios
            .delete(url, { headers: { 'token': window.localStorage.getItem("token") }, data: payload })
            .then(response => {
                if (response.status === 200) {
                    return response.data.data;
                }
            })
            .catch(err => {
                return err.response.data.data;
            })
    }

    insertComponent = async (payload) => {
        let url = `${BACKEND.API_URL}dt/insertComponent`;

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

    updateComponent = async (payload) => {
        let url = `${BACKEND.API_URL}dt/updateComponent`;

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

    deleteComponent = async (payload) => {
        let url = `${BACKEND.API_URL}dt/deleteComponent`;

        return await axios
            .delete(url, { headers: { 'token': window.localStorage.getItem("token") }, data: payload })
            .then(response => {
                if (response.status === 200) {
                    return response.data.data;
                }
            })
            .catch(err => {
                return err.response.data.data;
            })
    }

    insertSensor = async (payload) => {
        let url = `${BACKEND.API_URL}dt/insertSensor`;

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

    updateSensor = async (payload) => {
        let url = `${BACKEND.API_URL}dt/updateSensor`;

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

    deleteSensor = async (payload) => {
        let url = `${BACKEND.API_URL}dt/deleteSensor`;

        return await axios
            .delete(url, { headers: { 'token': window.localStorage.getItem("token") }, data: payload })
            .then(response => {
                if (response.status === 200) {
                    return response.data.data;
                }
            })
            .catch(err => {
                return err.response.data.data;
            })
    }

    insertField = async (payload) => {
        let url = `${BACKEND.API_URL}dt/insertField`;

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

    updateField = async (payload) => {
        let url = `${BACKEND.API_URL}dt/updateField`;

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

    deleteField = async (payload) => {
        let url = `${BACKEND.API_URL}dt/deleteField`;

        return await axios
            .delete(url, { headers: { 'token': window.localStorage.getItem("token") }, data: payload })
            .then(response => {
                if (response.status === 200) {
                    return response.data.data;
                }
            })
            .catch(err => {
                return err.response.data.data;
            })
    }

    saveMachineOrders = async (payload) => {
        let url = `${BACKEND.API_URL}dt/saveMachineOrders`;

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

    getMachineOrders = async (payload) => {
        let url = `${BACKEND.API_URL}dt/getMachineOrders`;

        return await axios
            .post(url, payload, { headers: { 'token': window.localStorage.getItem("token") } })
            .then(response => {
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
import { BACKEND } from 'src/config';


class FactoryService {
    async getFactories() {
        const url = `${BACKEND.API_URL}factory/getFactories`;

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

    async getProductionLines(payload) {
        const url = `${BACKEND.API_URL}factory/getProductionLines`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(payload),
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

    async getMachines(payload) {
        const url = `${BACKEND.API_URL}factory/getMachines`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(payload),
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

    async getComponents(payload) {
        const url = `${BACKEND.API_URL}factory/getComponents`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(payload),
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

    async getSensors(payload) {
        const url = `${BACKEND.API_URL}factory/getSensors`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(payload),
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

    addMachineAction = async (payload) => {
        const url = `${BACKEND.API_URL}factory/addMachineAction`;

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

            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    getAllMachineActions = async (payload) => {
        const url = `${BACKEND.API_URL}factory/getAllMachineActions`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(payload),
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

            const result = JSON.parse(res.data.data)
            return result;
        } catch (err) {
            console.error(err);
        }
    }

    updateMachineAction = async (payload) => {
        const url = `${BACKEND.API_URL}factory/updateMachineAction`;

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
            body: JSON.stringify(payload),
        })

        try {
            const response = await request;
            const res = await response.json();
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    deleteMachineAction = async (payload) => {
        const url = `${BACKEND.API_URL}factory/deleteMachineAction`;

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
            body: JSON.stringify(payload),
        })

        try {
            const response = await request;
            const res = await response.json();
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    isMachineActionExists = async (payload) => {
        const url = `${BACKEND.API_URL}factory/isMachineActionExists`;

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
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    addMaterial = async (payload) => {
        const url = `${BACKEND.API_URL}factory/addMaterial`;

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
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    getMaterials = async () => {
        const url = `${BACKEND.API_URL}factory/getMaterials`;

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

            const result = JSON.parse(res.data.data)
            return result;
        } catch (err) {
            console.error(err);
        }
    }

    deleteMaterial = async (payload) => {
        const url = `${BACKEND.API_URL}factory/deleteMaterial`;

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
            body: JSON.stringify(payload),
        })

        try {
            const response = await request;
            const res = await response.json();
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    updateMaterial = async (payload) => {
        const url = `${BACKEND.API_URL}factory/updateMaterial`;

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
            body: JSON.stringify(payload),
        })

        try {
            const response = await request;
            const res = await response.json();
            return res;
        } catch (err) {
            console.error(err);
        }
    }

    isMaterialExists = async (payload) => {
        const url = `${BACKEND.API_URL}factory/isMaterialExists`;

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
            return res;
        } catch (err) {
            console.error(err);
        }
    }
}

export default new FactoryService();
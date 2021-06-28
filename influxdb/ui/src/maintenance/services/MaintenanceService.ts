import { BACKEND } from 'src/config';

class MaintenanceService {
    getAllMaintenance = async () => {
        const url = `${BACKEND.API_URL}maintenance/getAllMaintenance`;

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

    addMaintenance = async (payload) => {
        const url = `${BACKEND.API_URL}maintenance/addMaintenance`;

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

            if (res.data.success !== true) return;
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    updateMaintenance = async (payload) => {
        const url = `${BACKEND.API_URL}maintenance/updateMaintenance`;

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

            if (res.data.success !== true) return;
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    removeMaintenance = async (payload) => {
        const url = `${BACKEND.API_URL}maintenance/removeMaintenance`;

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

            if (res.data.success !== true) return;
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    isMaintenanceExist = async (payload) => {
        const url = `${BACKEND.API_URL}maintenance/isMaintenanceExist`;

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

            if (res.data.success !== true) return;
            return res;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

}

export default new MaintenanceService();
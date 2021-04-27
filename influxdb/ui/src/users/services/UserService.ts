import { INFLUX, BACKEND } from 'src/config';

class UserService {
    getUsers = async () => {
        const url = `${INFLUX.CHRONOGRAF_URL}api/v2/users`;

        const request = fetch(url);

        try {
            const response = await request;
            const res = await response.json();
            return res;
        } catch (err) {
            console.log(err);
        }
    }

    getUsersFromMongo = async () => {
        const url = `${BACKEND.API_URL}user/getAll`;

        const request = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
        })

        try {
            const response = await request;
            const res = await response.json();

            if (res.data.success !== true) return;
            const result = JSON.parse(res.data.data);
            return result;
        } catch (err) {
            console.log(err);
        }
    }

    addUser = async (payload) => {
        const url = `${INFLUX.CHRONOGRAF_URL}api/v2/users`;

        const request = fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        try {
            const response = await request;
            const res = await response.json();
            return res;
        } catch (err) {
            console.log(err);
        }
    }

    updatePassword = async (payload, userID) => {
        const url = `${INFLUX.CHRONOGRAF_URL}api/v2/users/${userID}/password`;

        const request = fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        try {
            const response = await request;
            return response.status;
        } catch (err) {
            console.log(err);
        }
    }

    addUserToMongo = async (payload) => {
        const url = `${BACKEND.API_URL}auth/signup`;
        console.log(window.localStorage.getItem("token"));

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

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }

            if (res.data.success !== true) return;
            return res;
        } catch (err) {
            alert(err);
            console.log(err);
        }
    }

    deleteUser = async (userId) => {
        const url = `${INFLUX.CHRONOGRAF_URL}api/v2/users/${userId}`;

        const request = fetch(url, {
            method: 'DELETE',
        });

        try {
            const response = await request;
            // const res = await response.json();
            return response;
        } catch (err) {
            console.log(err);
        }
    }

    deleteUserFromMongo = async (payload) => {
        const url = `${BACKEND.API_URL}user/delete`;

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
            console.log(err);
        }
    }

    isUserAlreadyExist = async (payload) => {
        const url = `${BACKEND.API_URL}user/isUserAlreadyExist`;

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

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }

            return res;
        } catch (err) {
            alert(err);
            console.log(err);
        }
    }

    updateUserFromMongo = async (payload) => {
        const url = `${BACKEND.API_URL}user/update`;

        const request = fetch(url, {
            method: 'PATCH',
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
            console.log(err);
        }
    }

    updateUser = async (payload, userId) => {
        const url = `${INFLUX.CHRONOGRAF_URL}api/v2/users/${userId}`;

        const request = fetch(url, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        try {
            const response = await request;
            return response;
        } catch (err) {
            console.log(err);
        }
    }
}

export default new UserService();
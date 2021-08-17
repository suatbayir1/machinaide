import { INFLUX, BACKEND } from 'src/config';
import axios from "axios";

class BrandService {
    add = async (payload) => {
        const url = `${BACKEND.API_URL}brand/add`;

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

    get = async (payload) => {
        const url = `${BACKEND.API_URL}brand/get`;

        return await axios
            .post(url, payload, { headers: { 'token': window.localStorage.getItem("token") } })
            .then(response => {
                if (response.status === 200) {
                    const result = JSON.parse(response.data.data.data);
                    return result;
                }
            })
            .catch(err => {
                return err.response.data.data;
            })
    }

    delete = async (payload) => {
        const url = `${BACKEND.API_URL}brand/delete`;

        return await axios
            .delete(url, {
                headers: {
                    'token': window.localStorage.getItem("token")
                },
                data: payload
            })
            .then(response => {
                if (response.status === 200) {
                    return response.data.data;
                }
            })
            .catch(err => {
                return err.response.data.data;
            })
    }

}

export default new BrandService();
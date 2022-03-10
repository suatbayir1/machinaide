import { BACKEND } from 'src/config';
import axios from "axios";

class ObjectService {
    public getTextureFiles = async () => {
        let url = `${BACKEND.API_URL}dt/getFileInfo`;

        return await axios
            .get(url, { headers: { 'token': window.localStorage.getItem("token") } })
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

    public getModelFiles = async () => {
        let url = `${BACKEND.API_URL}dt/getModelFiles`;

        return await axios
            .get(url, { headers: { 'token': window.localStorage.getItem("token") } })
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

    public getObjectList = async () => {
        let url = `${BACKEND.API_URL}object/getObjectPool`;

        return await axios
            .get(url, { headers: { 'token': window.localStorage.getItem("token") } })
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

    public saveComponentObject = async (payload) => {
        let url = `${BACKEND.API_URL}object/saveComponentObject`;

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

    public saveAsComponentObject = async (payload) => {
        let url = `${BACKEND.API_URL}object/saveAsComponentObject`;

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

    public getDigitalTwinObjects = async () => {
        let url = `${BACKEND.API_URL}dt/`;

        return await axios
            .get(url, { headers: { 'token': window.localStorage.getItem("token") } })
            .then(response => {
                if (response.status === 200) {
                    return JSON.parse(response.data.data.data)[0];
                }
            })
            .catch(err => {
                return err.response.data.data;
            })
    }

    public fileUpload = async (payload) => {
        let url = `${BACKEND.API_URL}dt/fileUpload`;

        console.log("payload", payload)

        return await axios
            .post(url, payload, {
                headers: {
                    'token': window.localStorage.getItem("token")
                }
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

    public modelFileUpload = async (payload) => {
        let url = `${BACKEND.API_URL}dt/modelFileUpload`;

        return await axios
            .post(url, payload, {
                headers: {
                    'token': window.localStorage.getItem("token")
                }
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

    public deleteModelFile = async (payload) => {
        let url = `${BACKEND.API_URL}dt/deleteModelFile`;

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

    public deleteComponentModel = async (payload) => {
        let url = `${BACKEND.API_URL}object/deleteComponentModel`;

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

    public deleteTexture = async (payload) => {
        let url = `${BACKEND.API_URL}dt/deleteTexture`;

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
}

export default new ObjectService();
import { INFLUX, BACKEND } from 'src/config';

class OrganizationService {
    getOrg = async (orgID) => {
        const url = `${INFLUX.CHRONOGRAF_URL}api/v2/orgs/${orgID}`;

        const request = fetch(url, {
            method: 'GET',
        });

        try {
            const response = await request;
            const res = await response.json();
            return res;
        } catch (err) {
            console.log(err);
        }
    }

    deleteOrganizationFromUsers = async (payload) => {
        const url = `${BACKEND.API_URL}user/removeOrganizationFromAllUsers`;

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
            console.log(err);
        }
    }
}

export default new OrganizationService();
import { INFLUX, BACKEND } from 'src/config';

class MemberService {
    addMemberToOrganization = async (payload, orgID) => {
        const url = `${INFLUX.CHRONOGRAF_URL}api/v2/orgs/${orgID}/members`;

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

    addMemberToOrganizationMongo = async (payload) => {
        const url = `${BACKEND.API_URL}user/addUserToOrganization`;

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
            console.log(err);
        }
    }

    removeMemberFromOrganization = async (orgID, userID) => {
        const url = `${INFLUX.CHRONOGRAF_URL}api/v2/orgs/${orgID}/members/${userID}`;

        const request = fetch(url, {
            method: 'DELETE'
        });

        try {
            const response = await request;
            return response;
        } catch (err) {
            console.log(err);
        }
    }

    removeMemberFromOrganizationMongo = async (payload) => {
        const url = `${BACKEND.API_URL}user/removeUserFromOrganization`;

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

export default new MemberService();
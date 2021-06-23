import { INFLUX, BACKEND } from 'src/config';

class DashboardService {
    getDashboards = async (): Promise<any> => {
        let url = `${INFLUX.CHRONOGRAF_URL}api/v2/dashboards`;

        const fetchPromise = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        try {
            const response = await fetchPromise;
            const res = await response.json();
            return res;
        }
        catch (err) {
            console.log("Error while executing query: ", err);
        }
    }

    createDashboard = async (payload): Promise<any> => {
        let url = `${INFLUX.CHRONOGRAF_URL}api/v2/dashboards`;

        const fetchPromise = fetch(url, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            }
        })

        try {
            const response = await fetchPromise;
            const res = await response.json();
            return res;
        }
        catch (err) {
            console.log("Error while executing query: ", err);
        }
    }

    createCellOfDashboard = async (payload, dashboardID): Promise<any> => {
        let url = `${INFLUX.CHRONOGRAF_URL}api/v2/dashboards/${dashboardID}/cells`;

        const fetchPromise = fetch(url, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            }
        })

        try {
            const response = await fetchPromise;
            const res = await response.json();
            return res;
        }
        catch (err) {
            console.log("Error while executing query: ", err);
        }
    }

    getCell = async (dashboardID, cellID): Promise<any> => {
        let url = `${INFLUX.CHRONOGRAF_URL}api/v2/dashboards/${dashboardID}/cells/${cellID}/view`;

        const fetchPromise = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        try {
            const response = await fetchPromise;
            const res = await response.json();
            return res;
        }
        catch (err) {
            console.log("Error while executing query: ", err);
        }
    }

    updateViewOfCell = async (payload, dashboardID, cellID): Promise<any> => {
        let url = `${INFLUX.CHRONOGRAF_URL}api/v2/dashboards/${dashboardID}/cells/${cellID}/view`;

        const fetchPromise = fetch(url, {
            method: 'PATCH',
            mode: 'cors',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            }
        })

        try {
            const response = await fetchPromise;
            const res = await response.json();
            return res;
        }
        catch (err) {
            console.log("Error while executing query: ", err);
        }
    }

    createDTDashboard = async (payload) => {
        const url = `${BACKEND.API_URL}factory/createDashboard`;

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
            console.log(err);
        }
    }

    deleteDTDashboard = async (payload) => {
        const url = `${BACKEND.API_URL}factory/deleteDashboard`;

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
            alert(err);
            console.log(err);
        }
    }

    getDTDashboards = async () => {
        const url = `${BACKEND.API_URL}factory/getDashboards`;

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
            console.log(err);
        }
    }

    isDashboardExists = async (payload) => {
        const url = `${BACKEND.API_URL}factory/isDashboardExists`;

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
            console.log(err);
        }
    }

}

export default new DashboardService();
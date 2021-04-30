import { INFLUX } from 'src/config';

class FactoryDashboardService {
    fluxQuery = async (orgID, query: string): Promise<any> => {
        let url = `${INFLUX.CHRONOGRAF_URL}api/v2/query?orgID=${orgID}`;

        const fetchPromise = fetch(url, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                'query': query,
            }),
            headers: {
                'Content-Type': 'application/json',
            }
        })

        try {
            const response = await fetchPromise;
            const res = await response.text();
            return res;
        }
        catch (err) {
            console.log("Error while executing query: ", err);
        }
    }
}

export default new FactoryDashboardService();
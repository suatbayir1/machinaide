import { BACKEND } from 'src/config';

class NLPService {
    getWordFrequency = async () => {
        const url = `${BACKEND.NLP_MODULE_URL}/wordFrequency`;

        const request = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            }
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

export default new NLPService();
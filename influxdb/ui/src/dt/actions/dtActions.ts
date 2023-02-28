import { SET_OVERLAY_STATUS, SET_DT } from "./dtTypes";
import { BACKEND } from 'src/config';
import axios from "axios";

export const setOverlayStatus = (overlayID) =>
({
    type: SET_OVERLAY_STATUS,
    payload: {
        overlayID,
    },
} as const)

export const setDT = (payload) =>
({
    type: SET_DT,
    payload
} as const)


export const getDTThunk = () => async dispatch => {
    try {
        console.log("action run");
        const url = `${BACKEND.API_URL}dt/`;

        axios
            .get(url, { headers: { 'token': window.localStorage.getItem("token") } })
            .then(response => {
                console.log(response);
                if (response.status === 200) {
                    const result = JSON.parse(response.data.data.data);
                    console.log(result[0]);
                    dispatch(setDT(result[0]))
                }
            })
            .catch(err => {
                console.log(err);
            })

    } catch (error) {
        console.error(error)
    }
}

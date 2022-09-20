import { SET_OVERLAY_STATUS, SET_DT } from "./dtTypes"

export interface DTState {
    overlayID: string
    dt: object
}

const defaultState: DTState = {
    overlayID: "",
    dt: {}
}

export default (state = defaultState, action) => {
    switch (action.type) {
        case SET_OVERLAY_STATUS:
            return {
                ...state,
                overlayID: action.payload.overlayID,
            }
        case SET_DT:
            return {
                ...state,
                dt: action.payload
            }
        default:
            return state
    }
}

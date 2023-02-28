import { ActionTypes } from 'src/userSettings/actions'

export interface UserSettingsState {
  showVariablesControls: boolean
}

export const initialState = (): UserSettingsState => ({
  showVariablesControls: false,
})

export const userSettingsReducer = (
  state = initialState(),
  action: ActionTypes
): UserSettingsState => {
  switch (action.type) {
    case 'TOGGLE_SHOW_VARIABLES_CONTROLS':
      return { ...state, showVariablesControls: !state.showVariablesControls }
    default:
      return state
  }
}

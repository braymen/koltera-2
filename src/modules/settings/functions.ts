import { State } from '@engine/types'
import { Settings } from '@engine/settings'

export interface UpdateSettingsPayload {
    settings: Partial<Settings>
}

export const updateSettings = (state: State, payload: UpdateSettingsPayload): State => {
    state.settings = {
        ...state.settings,
        ...payload.settings,
    }
    return state
}

export const resetSettings = (state: State): State => {
    const { DEFAULT_SETTINGS } = require('@engine/settings')
    state.settings = { ...DEFAULT_SETTINGS }
    return state
}


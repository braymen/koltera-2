import { State } from '@engine/types'

export type TabPayload = {
    tab: string
}

export const tab = (state: State, payload: TabPayload): State => {
    state.tab = payload.tab

    // Mark tab as visited if it hasn't been visited yet
    if (!state.visitedTabs) {
        state.visitedTabs = []
    }
    if (!state.visitedTabs.includes(payload.tab)) {
        state.visitedTabs.push(payload.tab)
    }

    return state
}

export type SubtabPayload = {
    subtab: string
}

export const subtab = (state: State, payload: { subtab: string }): State => {
    state.subtab = payload.subtab
    return state
}

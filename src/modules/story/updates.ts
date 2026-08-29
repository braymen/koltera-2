import { FixedUpdate, State, Update } from '@engine/types'
import { ensureStoryState } from './helpers'

export const onUpdate = (state: State, _update: Update) => {
    ensureStoryState(state)
    return state
}

export const onFixedUpdate = (state: State, _update: FixedUpdate) => {
    return state
}

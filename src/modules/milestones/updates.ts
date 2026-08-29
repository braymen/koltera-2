import { FixedUpdate, State, Update } from '@engine/types'

export const onUpdate = (state: State, { deltaTime }: Update) => {
    return state
}

export const onFixedUpdate = (state: State, { deltaTime }: FixedUpdate) => {
    return state
}

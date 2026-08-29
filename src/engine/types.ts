import { DEFAULT_SAVE_TYPE } from './saves'
export type State = DEFAULT_SAVE_TYPE

export type StateProps = {
    state: State
    dispatch: any
}

export type Update = {
    deltaTime: number
}

export type FixedUpdate = {
    deltaTime: number
}

export type Action<T> = {
    action: Function
    payload: T
}

export type Module = {
    onUpdate: Function
    onFixedUpdate: Function
}

export interface Instance<T> {
    id: T
    instance: string
}

export interface BaseContent {
    id: string
    name: string
    description: string
    image: string
}

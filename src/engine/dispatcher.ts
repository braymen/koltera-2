import { Action, FixedUpdate, Module, State, Update } from './types'

const modulesContext = require.context('../modules', true, /updates\.ts$/)
const Modules: { [key: string]: any } = {}
modulesContext.keys().forEach((key: string) => {
    const moduleName = key.replace('./', '').replace('/updates.ts', '')
    Modules[moduleName] = modulesContext(key)
})
const ModuleKeys = Object.keys(Modules)

export const reducer = (state: State, action: Action<any>): State => {
    if (!action.action) return state
    return action.action(structuredClone(state), action.payload)
}

const runModulePhase = <T extends Update | FixedUpdate>(state: State, payload: T, phase: keyof Module) => {
    ModuleKeys.forEach((Module) => {
        const handler = ((Modules as any)[Module] as Module)[phase]
        if (typeof handler === 'function') {
            state = handler(state, payload)
        }
    })
    return state
}

const handleUpdatePhase = (state: State, payload: Update) => runModulePhase(state, payload, 'onUpdate')
const handleFixedUpdatePhase = (state: State, payload: FixedUpdate) => runModulePhase(state, payload, 'onFixedUpdate')

export const update = (dispatch: any, deltaTime: number, trackPlaytime: boolean = false) => {
    dispatch({
        action: (state: State, payload: Update & { trackPlaytime: boolean }) => {
            if (payload.trackPlaytime) {
                ;(state as any).onlinePlaytime += payload.deltaTime
                state.totalPlaytime = (state as any).onlinePlaytime + (state as any).offlinePlaytime
            }
            return handleUpdatePhase(state, payload)
        },
        payload: { deltaTime, trackPlaytime },
    })
}

export const fixedUpdate = (dispatch: any, deltaTime: number) => {
    dispatch({ action: handleFixedUpdatePhase, payload: { deltaTime } })
}

/**
 * Batched game tick — runs all pending fixed updates + one update in a single dispatch
 * (single structuredClone) to reduce memory pressure.
 */
export const gameTick = (
    dispatch: any,
    deltaTime: number,
    fixedDeltaTime: number,
    fixedUpdateCount: number,
    trackPlaytime: boolean
) => {
    dispatch({
        action: (state: State, payload: { deltaTime: number; fixedDeltaTime: number; fixedUpdateCount: number; trackPlaytime: boolean }) => {
            for (let i = 0; i < payload.fixedUpdateCount; i++) {
                state = handleFixedUpdatePhase(state, { deltaTime: payload.fixedDeltaTime })
            }
            if (payload.trackPlaytime) {
                ;(state as any).onlinePlaytime += payload.deltaTime
                state.totalPlaytime = (state as any).onlinePlaytime + (state as any).offlinePlaytime
            }
            return handleUpdatePhase(state, { deltaTime: payload.deltaTime })
        },
        payload: { deltaTime, fixedDeltaTime, fixedUpdateCount, trackPlaytime },
    })
}

const Dispatcher = {
    reducer,
    update,
    fixedUpdate,
    gameTick,
}

export default Dispatcher

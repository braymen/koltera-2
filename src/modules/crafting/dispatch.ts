import {
    StartCraftingPayload,
    UpdateCraftingPayload,
    StopCraftingPayload,
    CancelQueuedItemPayload,
    ReorderQueuePayload,
    RemoveQueuedJobPayload,
    SetWorkstationSpeedModePayload,
} from './types'
import * as Functions from './functions'

export const startCrafting = (dispatch: any, payload: StartCraftingPayload) => {
    dispatch({
        action: Functions.startCrafting,
        payload,
    })
}

export const updateCrafting = (dispatch: any, payload: UpdateCraftingPayload) => {
    dispatch({
        action: Functions.updateCrafting,
        payload,
    })
}

export const stopCrafting = (dispatch: any, payload: StopCraftingPayload) => {
    dispatch({
        action: Functions.stopCrafting,
        payload,
    })
}

export const cancelQueuedItem = (dispatch: any, payload: CancelQueuedItemPayload) => {
    dispatch({
        action: Functions.cancelQueuedItem,
        payload,
    })
}

export const reorderQueue = (dispatch: any, payload: ReorderQueuePayload) => {
    dispatch({
        action: Functions.reorderQueue,
        payload,
    })
}

export const removeQueuedJob = (dispatch: any, payload: RemoveQueuedJobPayload) => {
    dispatch({
        action: Functions.removeQueuedJob,
        payload,
    })
}

export const setWorkstationSpeedMode = (dispatch: any, payload: SetWorkstationSpeedModePayload) => {
    dispatch({
        action: Functions.setWorkstationSpeedMode,
        payload,
    })
}

const CraftingActions = {
    startCrafting,
    updateCrafting,
    stopCrafting,
    cancelQueuedItem,
    reorderQueue,
    removeQueuedJob,
    setWorkstationSpeedMode,
}

export default CraftingActions

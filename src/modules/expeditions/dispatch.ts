import * as Functions from './functions'

export const startExpedition = (dispatch: any, payload: Functions.StartExpeditionPayload) => {
    dispatch({
        action: Functions.startExpedition,
        payload,
    })
}

export const collectExpeditionRewards = (dispatch: any, payload: Functions.CollectExpeditionRewardsPayload) => {
    dispatch({
        action: Functions.collectExpeditionRewards,
        payload,
    })
}

export const updateExpeditionTier = (dispatch: any, payload: Functions.UpdateExpeditionTierPayload) => {
    dispatch({
        action: Functions.updateExpeditionTier,
        payload,
    })
}

export const cancelAllExpeditions = (dispatch: any) => {
    dispatch({
        action: Functions.cancelAllExpeditions,
        payload: {},
    })
}

export const cancelExpedition = (dispatch: any, payload: Functions.CancelExpeditionPayload) => {
    dispatch({
        action: Functions.cancelExpedition,
        payload,
    })
}

export const toggleRepeatExpedition = (dispatch: any, payload: Functions.ToggleRepeatExpeditionPayload) => {
    dispatch({
        action: Functions.toggleRepeatExpedition,
        payload,
    })
}

export const repeatExpedition = (dispatch: any, payload: Functions.RepeatExpeditionPayload) => {
    dispatch({
        action: Functions.repeatExpedition,
        payload,
    })
}

const ExpeditionsActions = {
    startExpedition,
    collectExpeditionRewards,
    updateExpeditionTier,
    cancelAllExpeditions,
    cancelExpedition,
    toggleRepeatExpedition,
    repeatExpedition,
}

export default ExpeditionsActions

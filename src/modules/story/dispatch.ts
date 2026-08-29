import { Dispatch } from 'react'
import { Action } from '@engine/types'
import * as Functions from './functions'

export const turnInTask = (dispatch: Dispatch<Action<Functions.TurnInTaskPayload>>, taskId: string) => {
    dispatch({
        action: Functions.turnInTask,
        payload: { taskId },
    })
}

export const setLockOverride = (dispatch: Dispatch<Action<Functions.SetLockOverridePayload>>, enabled: boolean) => {
    dispatch({
        action: Functions.setLockOverride,
        payload: { enabled },
    })
}

export const resetStory = (dispatch: Dispatch<Action<undefined>>) => {
    dispatch({
        action: Functions.resetStory,
        payload: undefined,
    })
}

export const skipTutorial = (dispatch: Dispatch<Action<Functions.SkipTutorialPayload>>) => {
    dispatch({
        action: Functions.skipTutorial,
        payload: undefined,
    })
}

const StoryActions = {
    turnInTask,
    setLockOverride,
    resetStory,
    skipTutorial,
}

export default StoryActions

import { Action } from '@engine/types'
import * as Functions from './functions'

export const setSkill = (dispatch: React.Dispatch<Action<Functions.SetSkillPayload>>, skillId: string, activity: string) => {
    dispatch({
        action: Functions.setSkill,
        payload: {
            skillId,
            activity,
        },
    })
}

export const addExperience = (dispatch: React.Dispatch<Action<Functions.AddExperiencePayload>>, skillId: string, xp: number) => {
    dispatch({
        action: Functions.addExperience,
        payload: {
            skillId,
            xp,
        },
    })
}

export const addHelper = (dispatch: any, creatureId: string, skillId: string, activityId: string) => {
    dispatch({
        action: Functions.addHelper,
        payload: {
            creatureId,
            skillId,
            activityId,
        },
    })
}

export const removeHelper = (dispatch: any, creatureId: string) => {
    dispatch({
        action: Functions.removeHelper,
        payload: {
            creatureId,
        },
    })
}

export const changeHelperActivity = (dispatch: any, creatureId: string, activityId: string) => {
    dispatch({
        action: Functions.changeHelperActivity,
        payload: {
            creatureId,
            activityId,
        },
    })
}

const Skilling = {
    setSkill,
    addExperience,
    addHelper,
    removeHelper,
    changeHelperActivity,
}

export default Skilling

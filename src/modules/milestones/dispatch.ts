import * as Functions from './functions'

export const claimMilestone = (dispatch: any, milestoneId: string) => {
    dispatch({
        action: Functions.claimMilestone,
        payload: { milestoneId },
    })
}

export const claimAllMilestones = (dispatch: any) => {
    dispatch({
        action: Functions.claimAllMilestones,
        payload: {},
    })
}

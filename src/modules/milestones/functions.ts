import { State } from '@engine/types'
import { ClaimMilestonePayload } from './types'
import MilestonesConfig from '@configs/milestones'
import { isMilestoneClaimable } from './helpers'
import ResourceNotification from '@utils/notification'

export const claimMilestone = (state: State, payload: ClaimMilestonePayload): State => {
    const { milestoneId } = payload

    const milestone = MilestonesConfig.getById(milestoneId)
    if (!milestone) return state

    // Check if claimable (reached threshold and not already claimed)
    if (!isMilestoneClaimable(state, milestone)) return state

    // Mark as claimed
    state.milestones.push(milestoneId)

    // Grant rewards
    for (const reward of milestone.rewards) {
        const existing = state.inventory.find((i) => i.id === reward.itemId)
        if (existing) {
            existing.amount += reward.amount
        } else {
            state.inventory.push({ id: reward.itemId, amount: reward.amount })
        }
        ResourceNotification(reward.itemId, reward.amount)
    }

    return state
}

export const claimAllMilestones = (state: State): State => {
    const trackIds = ['creatures', 'items', 'skills'] as const
    for (const trackId of trackIds) {
        const milestones = MilestonesConfig.getByTrack(trackId)
        for (const milestone of milestones) {
            if (isMilestoneClaimable(state, milestone)) {
                state = claimMilestone(state, { milestoneId: milestone.id })
            }
        }
    }
    return state
}

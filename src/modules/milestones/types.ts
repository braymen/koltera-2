export type MilestoneTrackId = 'creatures' | 'items' | 'skills'

export interface MilestoneReward {
    itemId: string
    amount: number
}

export interface MilestoneDefinition {
    id: string
    trackId: MilestoneTrackId
    threshold: number // The value the player needs to reach
    title: string
    description: string
    rewards: MilestoneReward[]
}

export interface MilestoneTrack {
    id: MilestoneTrackId
    name: string
    description: string
    image: string
    getCurrent: 'creatures' | 'items' | 'skills' // resolved at runtime
}

// State: which milestones have been claimed
export type MilestoneState = string[] // Array of claimed milestone IDs

export interface ClaimMilestonePayload {
    milestoneId: string
}

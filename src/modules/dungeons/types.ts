import { ItemInstance } from '@modules/inventory/types'

export type DungeonFocus = 'combat' | 'gathering'

export type GatheringSubFocus = 'Chopping' | 'Mining' | 'Digging' | 'Farming' | 'Fishing' | 'Exploring'

export type DungeonTier = 1 | 2 | 3 | 4 | 5

export type DungeonGrade = 'S' | 'A' | 'B' | 'C' | 'F'

export type DungeonReward = {
    itemId: string
    amount: number
}

export type DungeonRewards = {
    items: ItemInstance[]
    creatureExperience: number
    grade: DungeonGrade
}

export type DungeonRun = {
    id: string
    tier: DungeonTier
    focus: DungeonFocus
    gatheringSkill: GatheringSubFocus | null // required when focus is 'gathering'
    creatures: string[] // creature instance IDs
    startTime: number // unix seconds
    duration: number // seconds (always 900)
    completed: boolean
    rewards: DungeonRewards | null
    loop: boolean
    loopCount: number
    partyScore: number
    grade: DungeonGrade
}

export type DungeonsState = {
    activeDungeons: DungeonRun[]
    completions: Record<number, number> // tier -> count
}

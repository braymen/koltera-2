import { ItemInstance } from '@modules/inventory/types'

export type ExpeditionTypeContent = {
    id: string
    name: string
    description: string
    image: string
    maxPartySize: number
    baseXP: number
    baseDuration: number
    baseRating: number
    statWeights: ExpeditionStatWeights
    rewards: ExpeditionReward[]
    trait: string // Single trait ID that provides bonus
    biome: string // Single biome ID that this expedition occurs in
    requiredExpeditionCompletions: number // Total expeditions (across all types) needed to unlock this expedition type
}

export type ExpeditionTraitContent = {
    id: string
    name: string
    description: string
    image: string
}

export type ExpeditionBiomeContent = {
    id: string
    name: string
    description: string
    image: string
    advantage?: string[] // Array of creature type IDs that get advantage
    disadvantage?: string[] // Array of creature type IDs that get disadvantage
}

export type ExpeditionState = {
    instance: ExpeditionInstance
    creatures: string[]
    items: string[]
    startTime: number
    duration: number
    completed: boolean
    success: boolean | null
    rewards: ExpeditionRewards | null
    repeatExpedition?: boolean // Whether this expedition should automatically repeat
    loopCount: number // How many times this expedition has looped (starts at 1)
}[]

export type ExpeditionInstance = {
    id: string
    expeditionTypeId: string
    tier: number
    difficultyRating: number
    biomeId: string
}

export type ExpeditionStatWeights = {
    power: number
    grit: number
    agility: number
    smarts: number
    looting: number
    luck: number
    [key: string]: number
}

export type ExpeditionReward = {
    itemId: string
    amount: number
}

export type MinMaxType = {
    min: number
    max: number
}

export type ExpeditionRewards = {
    items: ItemInstance[]
    creatureExperience: number
}

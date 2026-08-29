import CreaturesContent from '@data/creatures'
import { State } from '@engine/types'
import { changeInventory } from '@modules/inventory/functions'
import { createCreature, getCreatureLevel, getCreatureMaxXp } from './helpers'
import { markCreatureAsSeen } from '@modules/collections/helpers'
import { triggerAchievement } from '@modules/collections/functions'
import CreatureConfig from '@configs/creatures'

const CREATURE_MILESTONES: { count: number; achievementId: string }[] = [
    { count: 1, achievementId: 'collect-1-creature' },
    { count: 10, achievementId: 'collect-10-creatures' },
    { count: 20, achievementId: 'collect-20-creatures' },
    { count: 40, achievementId: 'collect-40-creatures' },
    { count: 80, achievementId: 'collect-80-creatures' },
    { count: 120, achievementId: 'collect-120-creatures' },
]

const checkCreatureAchievements = (state: State): void => {
    const count = state.creatures.length
    for (const milestone of CREATURE_MILESTONES) {
        if (count >= milestone.count) {
            triggerAchievement(state, { achievementId: milestone.achievementId })
        }
    }
}

export type SummonCreaturePayload = {
    species: string
}
export const summonCreature = (state: State, payload: SummonCreaturePayload): State => {
    const { species } = payload
    const creatureContent = CreaturesContent.getById(species)

    // Remove resources from inventory
    const itemsToRemove = creatureContent.summoningCost.map((item) => ({
        ...item,
        amount: -item.amount,
    }))
    state = changeInventory(state, { resources: itemsToRemove })

    // Add creature
    const creature = createCreature(species, 1)

    state.creatures.push(creature)
    checkCreatureAchievements(state)

    // Remove from unseenSummons if it was there
    markCreatureAsSeen(state, species)

    return state
}

export type SummonAllCreaturesPayload = {}
export const summonAllCreatures = (state: State, payload: SummonAllCreaturesPayload): State => {
    const allCreatureSpecies = CreaturesContent.get.map((creature) => creature.id)

    // Get species that the player already has
    const ownedSpecies = new Set(state.creatures.map((creature) => creature.species))

    // Summon all creatures that the player doesn't have yet
    allCreatureSpecies.forEach((species) => {
        if (!ownedSpecies.has(species)) {
            const creature = createCreature(species, 1)
            state.creatures.push(creature)
        }
    })

    checkCreatureAchievements(state)

    return state
}

export type AwakenCreaturePayload = {
    creatureId: string
}
export const awakenCreature = (state: State, payload: AwakenCreaturePayload): State => {
    const { creatureId } = payload

    // Find the creature
    const creature = state.creatures.find((c) => c.id === creatureId)
    if (!creature) {
        return state
    }

    // Check if creature meets the minimum level to awaken
    const creatureLevel = getCreatureLevel(creature)
    if (creatureLevel < CreatureConfig.LEVELING.AWAKEN_LEVEL_REQUIREMENT) {
        return state
    }

    // Check if creature has already been awakened
    if (creature.awakened) {
        return state
    }

    // Reset creature experience to 0 (level 1)
    creature.experience = 0

    // Mark creature as awakened
    creature.awakened = true

    // Give 1 awaken point as reward
    state = changeInventory(state, {
        resources: [{ id: 'awaken-points', amount: 1 }],
    })

    return state
}

export type PrestigeCreaturePayload = {
    creatureId: string
}
export const prestigeCreature = (state: State, payload: PrestigeCreaturePayload): State => {
    const { creatureId } = payload

    // Find the creature
    const creature = state.creatures.find((c) => c.id === creatureId)
    if (!creature) {
        return state
    }

    // Check if creature is awakened
    if (!creature.awakened) {
        return state
    }

    // Check if creature meets the minimum level to prestige
    const creatureLevel = getCreatureLevel(creature)
    if (creatureLevel < CreatureConfig.LEVELING.MAX_LEVEL_AWAKENED) {
        return state
    }

    // Reset creature experience to 0 (level 1)
    creature.experience = 0

    // Increment prestige count
    creature.prestigeCount = (creature.prestigeCount ?? 0) + 1

    // Give 1 prestige point as reward
    state = changeInventory(state, {
        resources: [{ id: 'prestige-points', amount: 1 }],
    })

    return state
}

export type GiveRandomCreatureLevel100Payload = {}
export const giveRandomCreatureLevel100 = (state: State, payload: GiveRandomCreatureLevel100Payload): State => {
    // Check if player has any creatures
    if (state.creatures.length === 0) {
        return state
    }

    // Get a random creature
    const randomIndex = Math.floor(Math.random() * state.creatures.length)
    const creature = state.creatures[randomIndex]

    // Set experience to max level (99 for unawakened, 120 for awakened)
    creature.experience = getCreatureMaxXp(creature)

    return state
}

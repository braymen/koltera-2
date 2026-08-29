import ItemsContent from '@data/items'
import { CollectionItem, CollectionTypes } from './types'
import CreaturesContent from '@data/creatures'
import AchievementsContent from '@data/achievements'
import { State } from '@engine/types'

export const getFullCollection = (collectionType: CollectionTypes) => {
    switch (collectionType) {
        case 'creatures':
            return CreaturesContent.get as CollectionItem[]
        case 'items':
            return ItemsContent.get as CollectionItem[]
        case 'achievements':
            return AchievementsContent.get as CollectionItem[]
    }
}

/**
 * Check if a creature is discoverable (all summoning cost items are in collections)
 */
export const isCreatureDiscoverable = (state: State, creatureId: string): boolean => {
    const creature = CreaturesContent.getById(creatureId)
    if (!creature) return false

    return creature.summoningCost.every((cost) => state.collections.items.includes(cost.id))
}

/**
 * Check for newly discoverable creatures and add them to unseenSummons
 */
export const checkForNewDiscoverableCreatures = (state: State): void => {
    if (!state.unseenSummons) {
        state.unseenSummons = []
    }
    if (!state.seenSummons) {
        state.seenSummons = []
    }

    // Get all creatures that aren't already summoned
    const unsummonedCreatures = CreaturesContent.get.filter((creature) => !state.creatures.some((c) => c.species === creature.id))

    // Check each unsummoned creature
    unsummonedCreatures.forEach((creature) => {
        // Skip if already in unseenSummons
        if (state.unseenSummons.includes(creature.id)) {
            return
        }

        // Skip if already seen (persistent tracking)
        if (state.seenSummons.includes(creature.id)) {
            return
        }

        // If creature is now discoverable, add it to unseenSummons
        if (isCreatureDiscoverable(state, creature.id)) {
            state.unseenSummons.push(creature.id)
        }
    })
}

/**
 * Mark a creature as seen (remove from unseenSummons and add to seenSummons)
 */
export const markCreatureAsSeen = (state: State, creatureId: string): void => {
    if (!state.unseenSummons) {
        state.unseenSummons = []
    }
    if (!state.seenSummons) {
        state.seenSummons = []
    }

    // Remove from unseenSummons
    const index = state.unseenSummons.indexOf(creatureId)
    if (index > -1) {
        state.unseenSummons.splice(index, 1)
    }

    // Add to seenSummons (persistent tracking)
    if (!state.seenSummons.includes(creatureId)) {
        state.seenSummons.push(creatureId)
    }
}

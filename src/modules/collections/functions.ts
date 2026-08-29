import { State } from '@engine/types'
import { CollectionTypes } from './types'
import { checkForNewDiscoverableCreatures, markCreatureAsSeen } from './helpers'

export type AddToCollectionPayload = {
    collectionType: CollectionTypes
    collectionItemId: string
}
export const addToCollection = (state: State, payload: AddToCollectionPayload): State => {
    const { collectionType, collectionItemId } = payload
    if (!state.collections[collectionType].includes(collectionItemId)) {
        state.collections[collectionType].push(collectionItemId)

        // If an item was added, check for newly discoverable creatures
        if (collectionType === 'items') {
            checkForNewDiscoverableCreatures(state)
        }
    }

    return state
}

export type MarkCreatureAsSeenPayload = {
    creatureId: string
}
export const markCreatureSeen = (state: State, payload: MarkCreatureAsSeenPayload): State => {
    markCreatureAsSeen(state, payload.creatureId)
    return state
}

export type TriggerAchievementPayload = {
    achievementId: string
}
export const triggerAchievement = (state: State, payload: TriggerAchievementPayload): State => {
    const { achievementId } = payload
    if (state.collections.achievements.includes(achievementId)) {
        return state
    }
    state.collections.achievements.push(achievementId)
    window.api.achievement(achievementId)
    return state
}

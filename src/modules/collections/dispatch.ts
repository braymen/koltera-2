import { Action } from '@engine/types'
import * as Functions from './functions'
import { CollectionTypes } from './types'

export const addToCollection = (
    dispatch: React.Dispatch<Action<Functions.AddToCollectionPayload>>,
    collectionType: CollectionTypes,
    collectionItemId: string
) => {
    dispatch({
        action: Functions.addToCollection,
        payload: {
            collectionType,
            collectionItemId,
        },
    })
}

export const triggerAchievement = (
    dispatch: React.Dispatch<Action<Functions.TriggerAchievementPayload>>,
    achievementId: string
) => {
    dispatch({
        action: Functions.triggerAchievement,
        payload: {
            achievementId,
        },
    })
}

export const markCreatureSeen = (dispatch: React.Dispatch<Action<Functions.MarkCreatureAsSeenPayload>>, creatureId: string) => {
    dispatch({
        action: Functions.markCreatureSeen,
        payload: {
            creatureId,
        },
    })
}

const CollectionActions = {
    addToCollection,
    triggerAchievement,
    markCreatureSeen,
}

export default CollectionActions

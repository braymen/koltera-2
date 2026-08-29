import { State } from '@engine/types'
import SanctuaryConfig from '@configs/sanctuary'

export type AddCreaturePayload = {
    creatureId: string
}
export const addCreature = (state: State, payload: AddCreaturePayload): State => {
    const { creatureId } = payload

    // Check if sanctuary is full
    if (state.sanctuary.length >= SanctuaryConfig.CAPACITY.MAX_SLOTS) {
        return state
    }

    // Check if creature is already in sanctuary
    if (state.sanctuary.includes(creatureId)) {
        return state
    }

    // Check if creature exists and is awakened
    const creature = state.creatures.find((c) => c.species === creatureId)
    if (!creature || !creature.awakened) {
        return state // Only awakened creatures can be in sanctuary
    }

    // Check if creature is already a helper
    if (state.helpers.find((helper) => helper.creatureId === creatureId)) {
        return state // Can't be both helper and in sanctuary
    }

    // Check if any creature of this species is on an expedition
    const activeExpeditions = state.activeExpeditions || []
    const creatureOnExpedition = activeExpeditions.some((expedition) => {
        return expedition.creatures.some((instanceId) => {
            const creatureInstance = state.creatures.find((c) => c.id === instanceId)
            return creatureInstance?.species === creatureId
        })
    })

    if (creatureOnExpedition) {
        return state // Don't add if creature is on expedition
    }

    // Check if any creature of this species is in an active dungeon
    const activeDungeons = state.dungeons?.activeDungeons || []
    const creatureInDungeon = activeDungeons.some((dungeon) =>
        dungeon.creatures.some((instanceId) => {
            const creatureInstance = state.creatures.find((c) => c.id === instanceId)
            return creatureInstance?.species === creatureId
        })
    )
    if (creatureInDungeon) {
        return state
    }

    state.sanctuary.push(creatureId)
    return state
}

export type RemoveCreaturePayload = {
    creatureId: string
}
export const removeCreature = (state: State, payload: RemoveCreaturePayload): State => {
    const { creatureId } = payload
    state.sanctuary = state.sanctuary.filter((id) => id !== creatureId)
    return state
}

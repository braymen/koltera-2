import { State } from '@engine/types'
import { ExpeditionState } from './types'
import {
    generatePartyScore,
    getCreatureIdsOnExpeditions,
    generateExpedition,
    generateDifficultyRating,
    isTierUnlocked,
    isExpeditionTypeUnlocked,
    calculateExpeditionDuration,
} from './helpers'
import ExpeditionsContent from '@data/expeditions'
import { triggerAchievement } from '@modules/collections/functions'
import { Creature } from '@modules/creatures/types'
import { getCreatureMaxXp } from '@modules/creatures/helpers'
import { combineInventoryWithDiscovery } from '@modules/inventory/helpers'
import ResourceNotification from '@utils/notification'
import { changeInventory } from '@modules/inventory/functions'
import BonusHelpers from '@modules/bonuses/helpers'
import { getCreatureIdsInDungeons } from '@modules/dungeons/helpers'

export type StartExpeditionPayload = {
    expeditionTypeId: string
    tier: number
    creatureIds: string[]
    itemIds: string[]
    repeatExpedition?: boolean // Whether this expedition should automatically repeat
}
export const startExpedition = (state: State, payload: StartExpeditionPayload): State => {
    const { expeditionTypeId, tier, creatureIds, itemIds, repeatExpedition } = payload

    // Generate expedition instance on-demand
    const expeditionInstance = generateExpedition(tier, expeditionTypeId)
    if (!expeditionInstance) {
        return state // Invalid expedition type
    }

    // Check if any creatures are already on an expedition
    const creaturesOnExpeditions = getCreatureIdsOnExpeditions(state.activeExpeditions)
    const hasOverlap = creatureIds.some((id) => creaturesOnExpeditions.includes(id))
    if (hasOverlap) {
        return state // Some creatures are already on an expedition
    }

    // Get the creatures from state
    const creatures: Creature[] = state.creatures.filter((creature) => creatureIds.includes(creature.id))
    if (creatures.length !== creatureIds.length) {
        return state // Some creatures don't exist
    }

    // Check if any creatures are helpers (by species ID)
    const helperSpeciesIds = new Set(state.helpers.map((helper) => helper.creatureId))
    const creaturesAreHelpers = creatures.some((creature) => helperSpeciesIds.has(creature.species))
    if (creaturesAreHelpers) {
        return state // Some creatures are helpers
    }

    // Check if any creatures are in sanctuary (by species ID)
    const sanctuarySpeciesIds = new Set(state.sanctuary)
    const creaturesInSanctuary = creatures.some((creature) => sanctuarySpeciesIds.has(creature.species))
    if (creaturesInSanctuary) {
        return state // Some creatures are in sanctuary
    }

    // Check if any creatures are assigned to machines (by instance ID)
    const machineCreatureIds = new Set(
        Object.values(state.machines?.machines || {})
            .filter((m) => m.assignedCreatureId)
            .map((m) => m.assignedCreatureId!)
    )
    const creaturesOnMachines = creatureIds.some((id) => machineCreatureIds.has(id))
    if (creaturesOnMachines) {
        return state // Some creatures are on machines
    }

    // Check if any creatures are in active dungeons (by instance ID)
    const creaturesInDungeons = new Set(getCreatureIdsInDungeons(state.dungeons?.activeDungeons || []))
    if (creatureIds.some((id) => creaturesInDungeons.has(id))) {
        return state // Some creatures are in dungeons
    }

    // Calculate party score
    const partyScore = generatePartyScore(creatures, expeditionInstance)

    // Calculate duration based on party score vs difficulty rating (clamped to 5min–2hr)
    const expeditionTypeContent = ExpeditionsContent.getById(expeditionInstance.expeditionTypeId)
    const duration = calculateExpeditionDuration(expeditionTypeContent, expeditionInstance, partyScore)

    // Create the active expedition
    const activeExpedition: ExpeditionState[0] = {
        instance: expeditionInstance,
        creatures: creatureIds,
        items: itemIds,
        startTime: Date.now() / 1000,
        duration: duration,
        completed: false,
        success: null,
        rewards: null,
        repeatExpedition: repeatExpedition || false,
        loopCount: 1,
    }

    // Add to active expeditions
    if (!state.activeExpeditions) {
        state.activeExpeditions = []
    }
    state.activeExpeditions.push(activeExpedition)

    return state
}

export type CollectExpeditionRewardsPayload = {
    expeditionInstanceId: string
}
export const collectExpeditionRewards = (state: State, payload: CollectExpeditionRewardsPayload): State => {
    const { expeditionInstanceId } = payload

    // Find the completed expedition
    const expedition = state.activeExpeditions.find((exp) => exp.instance.id === expeditionInstanceId && exp.completed)
    if (!expedition) {
        return state // Expedition not found or not completed
    }

    // Add item rewards
    if (expedition.rewards) {
        if (expedition.success && expedition.rewards.items.length > 0) {
            combineInventoryWithDiscovery(state, expedition.rewards.items)
            // Show resource notifications for items
            for (const item of expedition.rewards.items) {
                ResourceNotification(item.id, item.amount)
            }
        }
    }

    // Grant XP to creatures at completion (with Sword tool bonus)
    if (expedition.success && expedition.rewards && expedition.rewards.creatureExperience > 0) {
        const expeditionBonus = BonusHelpers.getExpeditionXpBonus(state)
        const perCreatureXP = Math.floor(expedition.rewards.creatureExperience * expeditionBonus.multiplier)
        let totalXpGiven = 0
        for (const creatureId of expedition.creatures) {
            const creature = state.creatures.find((c) => c.id === creatureId)
            if (creature) {
                const maxXp = getCreatureMaxXp(creature)
                const xpBefore = creature.experience
                creature.experience = Math.min(creature.experience + perCreatureXP, maxXp)
                totalXpGiven += creature.experience - xpBefore
            }
        }
        if (totalXpGiven > 0 && state.statistics) {
            if (typeof state.statistics.totalCreatureXP !== 'number') {
                state.statistics.totalCreatureXP = 0
            }
            state.statistics.totalCreatureXP += totalXpGiven
        }
    }

    // Track expedition completion (only if successful)
    if (expedition.success) {
        // Initialize expeditionCompletions if it doesn't exist
        if (!state.expeditionCompletions) {
            state.expeditionCompletions = {}
        }

        const expeditionTypeId = expedition.instance.expeditionTypeId
        const tier = expedition.instance.tier

        // Initialize expedition type tracking if it doesn't exist
        if (!state.expeditionCompletions[expeditionTypeId]) {
            state.expeditionCompletions[expeditionTypeId] = {}
        }

        // Increment completion count for this tier
        const currentCount = state.expeditionCompletions[expeditionTypeId][tier] || 0
        state.expeditionCompletions[expeditionTypeId][tier] = currentCount + 1
    }

    // Remove the expedition from active expeditions (whether successful or not)
    state.activeExpeditions = state.activeExpeditions.filter((exp) => exp.instance.id !== expeditionInstanceId)

    return state
}

export type ToggleRepeatExpeditionPayload = {
    expeditionInstanceId: string
}
export const toggleRepeatExpedition = (state: State, payload: ToggleRepeatExpeditionPayload): State => {
    const { expeditionInstanceId } = payload

    // Find the expedition (can be active or completed)
    const expedition = state.activeExpeditions.find((exp) => exp.instance.id === expeditionInstanceId)
    if (!expedition) {
        return state // Expedition not found
    }

    // Toggle repeat status
    expedition.repeatExpedition = !expedition.repeatExpedition

    return state
}

export type RepeatExpeditionPayload = {
    expeditionInstanceId: string
}
export const repeatExpedition = (state: State, payload: RepeatExpeditionPayload): State => {
    const { expeditionInstanceId } = payload

    // Find the completed expedition
    const expedition = state.activeExpeditions.find((exp) => exp.instance.id === expeditionInstanceId && exp.completed)
    if (!expedition) {
        return state // Expedition not found or not completed
    }

    // Only repeat if the expedition is marked as repeating
    if (!expedition.repeatExpedition) {
        return state
    }

    // Store expedition info for restarting
    const expeditionTypeId = expedition.instance.expeditionTypeId
    const tier = expedition.instance.tier
    const creatureIds = [...expedition.creatures]
    const itemIds = [...expedition.items]
    const previousLoopCount = expedition.loopCount || 1

    // Collect rewards first (always collect, ignoring settings)
    state = collectExpeditionRewards(state, {
        expeditionInstanceId,
    })

    // Start the expedition again with the same creatures
    state = startExpedition(state, {
        expeditionTypeId,
        tier,
        creatureIds,
        itemIds,
        repeatExpedition: true, // Mark as repeating
    })

    // Carry forward the loop count (find the newly created expedition)
    const newExpedition = state.activeExpeditions.find(
        (exp) => exp.instance.expeditionTypeId === expeditionTypeId && !exp.completed
    )
    if (newExpedition) {
        newExpedition.loopCount = previousLoopCount + 1
    }

    return state
}

export type UpdateExpeditionTierPayload = {
    expeditionTypeId: string
    tier: number
}
export const updateExpeditionTier = (state: State, payload: UpdateExpeditionTierPayload): State => {
    const { expeditionTypeId, tier } = payload

    // Check if expedition type exists
    const expeditionTypeContent = ExpeditionsContent.getById(expeditionTypeId)
    if (!expeditionTypeContent) {
        return state // Invalid expedition type
    }

    // Check if expedition is already active
    const isActive = (state.activeExpeditions || []).some(
        (exp) => exp.instance.expeditionTypeId === expeditionTypeId && !exp.completed
    )
    if (isActive) {
        return state // Can't change tier of active expedition
    }

    // Check if tier is unlocked
    if (!isTierUnlocked(tier, expeditionTypeId, state.expeditionCompletions)) {
        return state // Tier is not unlocked, can't select it
    }

    // Initialize expeditionTierSelections if it doesn't exist
    if (!state.expeditionTierSelections) {
        state.expeditionTierSelections = {}
    }

    // Update the tier selection for this expedition type
    state.expeditionTierSelections[expeditionTypeId] = tier

    return state
}

export const cancelAllExpeditions = (state: State): State => {
    state.activeExpeditions = []
    return state
}

export type CancelExpeditionPayload = {
    expeditionInstanceId: string
}
export const cancelExpedition = (state: State, payload: CancelExpeditionPayload): State => {
    const { expeditionInstanceId } = payload

    // Find the expedition (must be in progress, not completed)
    const expedition = state.activeExpeditions.find((exp) => exp.instance.id === expeditionInstanceId && !exp.completed)
    if (!expedition) {
        return state // Expedition not found or already completed
    }

    // Expedition cancelled — no XP or items are awarded on cancel
    // Remove the expedition from active expeditions
    state.activeExpeditions = state.activeExpeditions.filter((exp) => exp.instance.id !== expeditionInstanceId)

    return state
}

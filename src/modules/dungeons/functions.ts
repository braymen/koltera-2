import { State } from '@engine/types'
import { DungeonFocus, DungeonRun, DungeonTier, GatheringSubFocus } from './types'
import { calculateDungeonPartyScore, getCreatureIdsInDungeons, getDungeonGrade, getDungeonRewards } from './helpers'
import { changeInventory } from '@modules/inventory/functions'
import { combineInventoryWithDiscovery } from '@modules/inventory/helpers'
import { getCreatureIdsOnExpeditions } from '@modules/expeditions/helpers'
import { getCreatureMaxXp } from '@modules/creatures/helpers'
import { Creature } from '@modules/creatures/types'
import DungeonConfig from '@configs/dungeons'
import ResourceNotification from '@utils/notification'

export type StartDungeonPayload = {
    tier: DungeonTier
    focus: DungeonFocus
    creatureIds: string[]
    loop?: boolean
    gatheringSkill?: GatheringSubFocus
}

export const startDungeon = (state: State, payload: StartDungeonPayload): State => {
    const { tier, focus, creatureIds, loop, gatheringSkill } = payload

    if (creatureIds.length === 0 || creatureIds.length > DungeonConfig.MAX_CREATURES) return state

    // Gathering focus requires a gathering skill
    if (focus === 'gathering' && !gatheringSkill) return state

    // Get the creatures from state
    const creatures: Creature[] = state.creatures.filter((creature) => creatureIds.includes(creature.id))
    if (creatures.length !== creatureIds.length) return state

    // Check creatures aren't on expeditions
    const creaturesOnExpeditions = new Set(getCreatureIdsOnExpeditions(state.activeExpeditions))
    if (creatureIds.some((id) => creaturesOnExpeditions.has(id))) return state

    // Check creatures aren't in other dungeons
    const creaturesInDungeons = new Set(getCreatureIdsInDungeons(state.dungeons?.activeDungeons || []))
    if (creatureIds.some((id) => creaturesInDungeons.has(id))) return state

    // Check creatures aren't helpers
    const helperSpeciesIds = new Set(state.helpers.map((h) => h.creatureId))
    if (creatures.some((c) => helperSpeciesIds.has(c.species))) return state

    // Check creatures aren't in sanctuary
    const sanctuarySpeciesIds = new Set(state.sanctuary)
    if (creatures.some((c) => sanctuarySpeciesIds.has(c.species))) return state

    // Check creatures aren't assigned to machines
    const machineCreatureIds = new Set(
        Object.values(state.machines?.machines || {})
            .filter((m) => m.assignedCreatureId)
            .map((m) => m.assignedCreatureId!)
    )
    if (creatureIds.some((id) => machineCreatureIds.has(id))) return state

    // Check armor: need 1 per creature
    const armorItem = state.inventory.find((item) => item.id === DungeonConfig.ARMOR_ITEM_ID)
    if (!armorItem || armorItem.amount < creatureIds.length) return state

    // Consume armor
    state = changeInventory(state, {
        resources: [{ id: DungeonConfig.ARMOR_ITEM_ID, amount: -creatureIds.length }],
    })

    // Calculate party score and grade
    const partyScore = calculateDungeonPartyScore(creatures, focus)
    const grade = getDungeonGrade(partyScore, tier)

    // Create dungeon run
    const dungeonRun: DungeonRun = {
        id: crypto.randomUUID(),
        tier,
        focus,
        gatheringSkill: gatheringSkill || null,
        creatures: creatureIds,
        startTime: Date.now() / 1000,
        duration: DungeonConfig.DURATION,
        completed: false,
        rewards: null,
        loop: loop || false,
        loopCount: 1,
        partyScore,
        grade,
    }

    // Initialize dungeons state if needed
    if (!state.dungeons) {
        state.dungeons = { activeDungeons: [], completions: {} }
    }

    state.dungeons.activeDungeons.push(dungeonRun)
    return state
}

export type CollectDungeonRewardsPayload = {
    dungeonId: string
}

export const collectDungeonRewards = (state: State, payload: CollectDungeonRewardsPayload): State => {
    const { dungeonId } = payload

    if (!state.dungeons) return state

    const dungeon = state.dungeons.activeDungeons.find((d) => d.id === dungeonId && d.completed)
    if (!dungeon) return state

    // Grant item rewards
    if (dungeon.rewards && dungeon.rewards.items.length > 0) {
        combineInventoryWithDiscovery(state, dungeon.rewards.items)
        for (const item of dungeon.rewards.items) {
            ResourceNotification(item.id, item.amount)
        }
    }

    // Grant creature XP
    if (dungeon.rewards && dungeon.rewards.creatureExperience > 0) {
        let totalXpGiven = 0
        for (const creatureId of dungeon.creatures) {
            const creature = state.creatures.find((c) => c.id === creatureId)
            if (creature) {
                const maxXp = getCreatureMaxXp(creature)
                const xpBefore = creature.experience
                creature.experience = Math.min(creature.experience + dungeon.rewards.creatureExperience, maxXp)
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

    // Track completion
    if (!state.dungeons.completions) {
        state.dungeons.completions = {}
    }
    state.dungeons.completions[dungeon.tier] = (state.dungeons.completions[dungeon.tier] || 0) + 1

    // Remove from active dungeons
    state.dungeons.activeDungeons = state.dungeons.activeDungeons.filter((d) => d.id !== dungeonId)

    return state
}

export type CancelDungeonPayload = {
    dungeonId: string
}

export const cancelDungeon = (state: State, payload: CancelDungeonPayload): State => {
    if (!state.dungeons) return state

    const dungeon = state.dungeons.activeDungeons.find((d) => d.id === payload.dungeonId && !d.completed)
    if (!dungeon) return state

    // Refund armor
    state = changeInventory(state, {
        resources: [{ id: DungeonConfig.ARMOR_ITEM_ID, amount: dungeon.creatures.length }],
    })

    state.dungeons.activeDungeons = state.dungeons.activeDungeons.filter((d) => d.id !== payload.dungeonId)
    return state
}

export type RepeatDungeonPayload = {
    dungeonId: string
}

export const repeatDungeon = (state: State, payload: RepeatDungeonPayload): State => {
    if (!state.dungeons) return state

    const dungeon = state.dungeons.activeDungeons.find((d) => d.id === payload.dungeonId && d.completed)
    if (!dungeon || !dungeon.loop) return state

    // Store info for restart
    const { tier, focus, gatheringSkill, creatures: creatureIds, loopCount } = dungeon

    // Check armor for new run
    const armorItem = state.inventory.find((item) => item.id === DungeonConfig.ARMOR_ITEM_ID)
    if (!armorItem || armorItem.amount < creatureIds.length) {
        // Not enough armor — stop looping, just collect
        dungeon.loop = false
        return state
    }

    // Collect rewards first
    state = collectDungeonRewards(state, { dungeonId: payload.dungeonId })

    // Consume armor for new run
    state = changeInventory(state, {
        resources: [{ id: DungeonConfig.ARMOR_ITEM_ID, amount: -creatureIds.length }],
    })

    // Recalculate score (creatures may have leveled from XP)
    const creatures = state.creatures.filter((c) => creatureIds.includes(c.id))
    const partyScore = calculateDungeonPartyScore(creatures, focus)
    const grade = getDungeonGrade(partyScore, tier)

    // Create new dungeon run
    const newRun: DungeonRun = {
        id: crypto.randomUUID(),
        tier,
        focus,
        gatheringSkill,
        creatures: creatureIds,
        startTime: Date.now() / 1000,
        duration: DungeonConfig.DURATION,
        completed: false,
        rewards: null,
        loop: true,
        loopCount: loopCount + 1,
        partyScore,
        grade,
    }

    if (!state.dungeons) {
        state.dungeons = { activeDungeons: [], completions: {} }
    }
    state.dungeons.activeDungeons.push(newRun)

    return state
}

export type ToggleDungeonLoopPayload = {
    dungeonId: string
}

export const toggleDungeonLoop = (state: State, payload: ToggleDungeonLoopPayload): State => {
    if (!state.dungeons) return state

    const dungeon = state.dungeons.activeDungeons.find((d) => d.id === payload.dungeonId)
    if (!dungeon) return state

    dungeon.loop = !dungeon.loop
    return state
}

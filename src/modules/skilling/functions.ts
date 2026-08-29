import { State } from '@engine/types'
import SkillingHelpers from './helpers'
import { isTabUnlocked } from '@modules/story/helpers'
import { triggerAchievement } from '@modules/collections/functions'

const SKILL_99_ACHIEVEMENTS: Record<string, string> = {
    Chopping: 'skill-99-chopping',
    Mining: 'skill-99-mining',
    Exploring: 'skill-99-exploring',
    Digging: 'skill-99-digging',
    Fishing: 'skill-99-fishing',
    Farming: 'skill-99-farming',
    Furnace: 'skill-99-furnace',
    Workbench: 'skill-99-workbench',
    Stove: 'skill-99-stove',
}

export type SetSkillPayload = {
    skillId: string
    activity: string
}

export const setSkill = (state: State, payload: SetSkillPayload): State => {
    const { skillId, activity } = payload
    state.progress.skilling.items = []
    if (skillId === state.progress.skilling.id && activity === state.progress.skilling.activity) {
        // Stop current activity
        state.progress.skilling.id = ''
        state.progress.skilling.activity = ''
        state.progress.skilling.startTime = null
    } else {
        // Start new activity
        state.progress.skilling.id = skillId
        state.progress.skilling.activity = activity
        state.progress.skilling.progress = 0
        state.progress.skilling.startTime = Date.now() / 1000 // Current time in seconds
    }
    return state
}

export type AddExperiencePayload = {
    skillId: string
    xp: number
}

export const addExperience = (state: State, payload: AddExperiencePayload): State => {
    const { skillId, xp } = payload
    const existingSkill = state.skills.find((skill) => skill.id === skillId)

    if (existingSkill) {
        const oldLevel = SkillingHelpers.getLevel(existingSkill.xp)
        existingSkill.xp = existingSkill.xp + xp
        const newLevel = SkillingHelpers.getLevel(existingSkill.xp)
        if (oldLevel < 99 && newLevel >= 99) {
            const achievementId = SKILL_99_ACHIEVEMENTS[skillId]
            if (achievementId) {
                triggerAchievement(state, { achievementId })
            }
        }
    } else {
        state.skills.push({
            id: skillId,
            xp: xp,
        })
        if (SkillingHelpers.getLevel(xp) >= 99) {
            const achievementId = SKILL_99_ACHIEVEMENTS[skillId]
            if (achievementId) {
                triggerAchievement(state, { achievementId })
            }
        }
    }
    return state
}

export type AddHelperPayload = {
    creatureId: string
    skillId: string
    activityId: string
}

export const addHelper = (state: State, payload: AddHelperPayload): State => {
    const { creatureId, skillId, activityId } = payload

    // Check if the tab for this skill is unlocked
    if (!isTabUnlocked(state, skillId)) {
        return state // Can't place helper in locked tab
    }

    // Check if creature is already a helper
    if (state.helpers.find((helper) => helper.creatureId === creatureId)) {
        return state
    }

    // Check if creature is in sanctuary
    if (state.sanctuary.includes(creatureId)) {
        return state // Can't be both in sanctuary and a helper
    }

    // Check if any creature of this species is on an expedition (active or completed but not collected)
    // Note: creatureId here is a species ID, expeditions store instance IDs
    const activeExpeditions = state.activeExpeditions || []
    const creatureOnExpedition = activeExpeditions.some((expedition) => {
        // Check if any creature instance in this expedition matches the species
        return expedition.creatures.some((instanceId) => {
            const creature = state.creatures.find((c) => c.id === instanceId)
            return creature?.species === creatureId
        })
    })

    if (creatureOnExpedition) {
        return state // Don't add helper if creature is on expedition
    }

    // Check if any creature of this species is in a dungeon
    const activeDungeons = state.dungeons?.activeDungeons || []
    const creatureInDungeon = activeDungeons.some((dungeon) =>
        dungeon.creatures.some((instanceId) => {
            const creature = state.creatures.find((c) => c.id === instanceId)
            return creature?.species === creatureId
        })
    )
    if (creatureInDungeon) {
        return state
    }

    state.helpers.push({
        startTime: Date.now() / 1000,
        creatureId: creatureId,
        skillId: skillId,
        activityId: activityId,
        progress: 0,
    })
    return state
}

export type RemoveHelperPayload = {
    creatureId: string
}

export const removeHelper = (state: State, payload: RemoveHelperPayload): State => {
    const { creatureId } = payload
    state.helpers = state.helpers.filter((helper) => helper.creatureId !== creatureId)
    return state
}

export type ChangeHelperActivityPayload = {
    creatureId: string
    activityId: string
}

export const changeHelperActivity = (state: State, payload: ChangeHelperActivityPayload): State => {
    const { creatureId, activityId } = payload
    const helper = state.helpers.find((helper) => helper.creatureId === creatureId)
    if (helper) {
        helper.activityId = activityId
        helper.startTime = Date.now() / 1000
        helper.progress = 0
    }
    return state
}

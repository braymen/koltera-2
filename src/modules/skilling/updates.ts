import SkillContent from '@data/skills'
import { FixedUpdate, State, Update } from '@engine/types'
import { addExperience } from './functions'
import { changeInventory } from '@modules/inventory/functions'
import { combineInventory } from '@modules/inventory/helpers'
import ResourceNotification from '@utils/notification'
import CreaturesContent from '@data/creatures'
import SanctuaryHelpers from '@modules/sanctuary/helpers'
import SkillingConfig from '@configs/skilling'
import { getCreatureMaxXp } from '@modules/creatures/helpers'
import BonusHelpers from '@modules/bonuses/helpers'

export const onUpdate = (state: State, { deltaTime }: Update) => {
    // Computed once per frame — shared by active skill and all helpers
    const jobTiers = SanctuaryHelpers.calculateJobTiers(state)

    const skill = state.progress.skilling
    if (skill.id && skill.activity && skill.startTime) {
        const activity = SkillContent.getById(skill.id)?.activities?.find((a) => a.id === skill.activity)
        if (!activity) return state // No valid activity found

        const currentTime = Date.now() / 1000
        const elapsed = currentTime - skill.startTime

        // Apply duration reduction
        const durationReduction = BonusHelpers.getGatheringDurationReduction(state, skill.id, jobTiers)
        const adjustedDuration = Math.max(1, activity.duration * durationReduction.multiplier)

        skill.progress = Math.min(elapsed / adjustedDuration, 1)

        // Check if activity is complete
        if (skill.progress >= 1) {
            skill.progress = 0
            skill.startTime = Date.now() / 1000 // Restart timing for next cycle

            // Track skilling cycle completion for statistics
            const gatheringSkillIds = ['Chopping', 'Mining', 'Digging', 'Farming', 'Fishing', 'Exploring']
            if (gatheringSkillIds.includes(skill.id) && state.statistics?.skillingCycles) {
                const skillKey = skill.id as keyof typeof state.statistics.skillingCycles
                if (typeof state.statistics.skillingCycles[skillKey] === 'number') {
                    state.statistics.skillingCycles[skillKey]++
                }
            }

            // Build Loot and update inventory
            const loot = []
            const yieldBonus = BonusHelpers.getGatheringYieldBonus(state, skill.id, jobTiers)
            let caughtSomething = false

            // Default behavior: can get multiple items per trigger
            for (const item of activity.output) {
                if (Math.random() < item.chance) {
                    const baseAmount = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min
                    const finalAmount = baseAmount + yieldBonus.total

                    loot.push({ id: item.id, amount: finalAmount })
                    ResourceNotification(item.id, finalAmount)
                    caughtSomething = true
                }
            }

            // Add Experience with all bonuses
            const xpBonus = BonusHelpers.getGatheringXpBonus(state, skill.id, jobTiers)
            const finalXp = Math.round(activity.xpRate * xpBonus.multiplier * 100) / 100

            addExperience(state, { skillId: skill.id, xp: finalXp })
            changeInventory(state, { resources: loot })
            combineInventory(state.progress.skilling.items, loot)
        }
    }

    // Helper Logic
    state.helpers.forEach((helper) => {
        const skillMeta = SkillContent.getById(helper.skillId)
        const activityMeta = skillMeta.activities?.find((activity) => activity.id === helper.activityId)
        const creatureMeta = CreaturesContent.getById(helper.creatureId)
        const jobLevel = creatureMeta.jobs[helper.skillId.toLowerCase()]
        const currentTime = Date.now() / 1000
        const elapsed = currentTime - helper.startTime

        if (!activityMeta || !creatureMeta || !skillMeta) {
            throw Error("Something is wrong with the helpers... Can't find skill meta, activity meta, or creature meta.")
        }

        // Calculate Adjusted Duration of Activity
        const slowestMultiplier = SkillingConfig.HELPERS.HELPER_SLOWEST_MULTIPLIER
        let duration = activityMeta.duration * Math.pow(slowestMultiplier, (10 - jobLevel) / 9)

        const durationReduction = BonusHelpers.getGatheringDurationReduction(state, helper.skillId, jobTiers)
        duration = Math.max(1, duration * durationReduction.multiplier)

        helper.progress = Math.min(elapsed / duration, 1)

        // Grant creature XP every frame based on time elapsed
        const activityIndex = skillMeta.activities?.indexOf(activityMeta) ?? 0
        const baseXpPerSecond = 0.4 + 0.05 * activityIndex
        const helperXpBonus = BonusHelpers.getHelperXpBonus(state, helper.skillId, jobTiers)
        const xpPerSecond = baseXpPerSecond * helperXpBonus.multiplier

        const helperCreature = state.creatures.find((c) => c.species === helper.creatureId)
        if (helperCreature) {
            const maxXp = getCreatureMaxXp(helperCreature)
            helperCreature.experience = Math.min(helperCreature.experience + xpPerSecond * deltaTime, maxXp)
        }

        // If Task is Completed
        if (helper.progress >= 1) {
            helper.progress = 0
            helper.startTime = Date.now() / 1000

            // Track helper cycle completion for statistics
            const gatheringSkillIds = ['Chopping', 'Mining', 'Digging', 'Farming', 'Fishing', 'Exploring']
            if (gatheringSkillIds.includes(helper.skillId) && state.statistics?.helperCycles) {
                const skillKey = helper.skillId as keyof typeof state.statistics.helperCycles
                if (typeof state.statistics.helperCycles[skillKey] === 'number') {
                    state.statistics.helperCycles[skillKey]++
                }
            }

            // Build Loot and update inventory
            const loot = []
            const yieldBonus = BonusHelpers.getGatheringYieldBonus(state, helper.skillId, jobTiers)
            let caughtSomething = false

            // Default behavior: can get multiple items per trigger
            for (const item of activityMeta.output) {
                if (Math.random() < item.chance) {
                    const baseAmount = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min
                    const finalAmount = baseAmount + yieldBonus.total

                    loot.push({ id: item.id, amount: finalAmount })
                    ResourceNotification(item.id, finalAmount)
                    caughtSomething = true
                }
            }

            changeInventory(state, { resources: loot })
            combineInventory(state.progress.skilling.items, loot)
        }
    })

    return state
}

export const onFixedUpdate = (state: State, { deltaTime }: FixedUpdate) => {
    return state
}

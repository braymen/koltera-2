import DungeonConfig from '@configs/dungeons'
import { DungeonFocus, DungeonGrade, DungeonReward, DungeonRewards, DungeonRun, DungeonTier, GatheringSubFocus } from './types'
import { Creature } from '@modules/creatures/types'
import { calculateStatScore } from '@modules/expeditions/helpers'
import { getCreatureLevel, getCreatureMaxXp } from '@modules/creatures/helpers'
import CreaturesContent from '@data/creatures'
import { ItemInstance } from '@modules/inventory/types'

export const getDungeonStatWeights = (focus: DungeonFocus) => {
    return DungeonConfig.STAT_WEIGHTS[focus]
}

export const calculateDungeonPartyScore = (creatures: Creature[], focus: DungeonFocus): number => {
    const statWeights = getDungeonStatWeights(focus)
    let partyScore = 0
    for (const creature of creatures) {
        const creatureContent = CreaturesContent.getById(creature.species)
        if (!creatureContent) continue
        const creatureLevel = getCreatureLevel(creature)
        const statScore = calculateStatScore(creatureContent, creatureLevel, statWeights)
        partyScore += statScore
    }
    return Math.floor(partyScore)
}

export const getDungeonGrade = (partyScore: number, tier: DungeonTier): DungeonGrade => {
    const tierConfig = DungeonConfig.TIER_CONFIG[tier]
    if (!tierConfig) return 'F'

    const ratio = tierConfig.baseRating > 0 ? partyScore / tierConfig.baseRating : 0

    for (const threshold of DungeonConfig.GRADE_THRESHOLDS) {
        if (ratio >= threshold.minRatio) {
            return threshold.grade
        }
    }

    return 'F'
}

export const getDungeonGradeMultiplier = (grade: DungeonGrade): number => {
    const threshold = DungeonConfig.GRADE_THRESHOLDS.find((t) => t.grade === grade)
    return threshold?.multiplier ?? 0.25
}

export const getDungeonRewards = (tier: DungeonTier, focus: DungeonFocus, grade: DungeonGrade, gatheringSkill?: GatheringSubFocus | null): DungeonRewards => {
    let baseRewards: DungeonReward[]
    if (focus === 'combat') {
        baseRewards = DungeonConfig.COMBAT_REWARDS[tier] || []
    } else {
        const skillTable = DungeonConfig.GATHERING_REWARDS[gatheringSkill || 'Mining']
        baseRewards = skillTable?.[tier] || []
    }
    const multiplier = getDungeonGradeMultiplier(grade)

    const tierConfig = DungeonConfig.TIER_CONFIG[tier]
    const perCreatureXP = tierConfig?.xpReward || 0 // Flat XP per creature, not scaled by grade or party size

    const items: ItemInstance[] = baseRewards.map((reward) => ({
        id: reward.itemId,
        amount: Math.max(1, Math.floor(reward.amount * multiplier)),
    }))

    return {
        items,
        creatureExperience: perCreatureXP,
        grade,
    }
}

export const getCreatureIdsInDungeons = (activeDungeons: DungeonRun[]): string[] => {
    if (!activeDungeons || activeDungeons.length === 0) {
        return []
    }

    const creatureIds: string[] = []
    for (const dungeon of activeDungeons) {
        creatureIds.push(...dungeon.creatures)
    }
    return creatureIds
}

export const getDungeonDurationLeft = (dungeon: DungeonRun, currentTime: number): number => {
    if (dungeon.completed) return 0
    const elapsed = currentTime - dungeon.startTime
    return Math.max(0, dungeon.duration - elapsed)
}

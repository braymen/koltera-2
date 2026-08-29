import { UpgradeEffect, SkillName, WorkstationName } from './types'
import UpgradesContent from '@data/upgrades'

export const getEffectValue = (
    purchasedUpgradeIds: string[],
    effectType: UpgradeEffect['type'],
    filter?: { skill?: SkillName } | { workstation?: WorkstationName }
): number => {
    let total = 0

    purchasedUpgradeIds.forEach((upgradeId) => {
        const upgrade = UpgradesContent.getById(upgradeId)
        if (!upgrade) return

        const effect = upgrade.effectData

        // Check if effect type matches
        if (effect.type !== effectType) return

        // Handle QoL effects (no value)
        if (effect.type === 'qol_expedition_min_maxer' || effect.type === 'qol_auto_task_board') {
            return // These are flags, not values
        }

        // Apply filters if provided
        if (filter) {
            if ('skill' in filter && 'skill' in effect) {
                if (effect.skill !== filter.skill) return
            }
            if ('workstation' in filter && 'workstation' in effect) {
                if (effect.workstation !== filter.workstation) return
            }
        }

        // Sum the value
        if ('value' in effect) {
            total += effect.value
        }
    })

    return total
}

export const getSkillXpBonus = (purchasedUpgradeIds: string[], skill: SkillName): number => {
    return getEffectValue(purchasedUpgradeIds, 'skill_xp', { skill })
}

export const getSkillDurationReduction = (purchasedUpgradeIds: string[], skill: SkillName): number => {
    return getEffectValue(purchasedUpgradeIds, 'skill_duration', { skill })
}

export const getSkillYieldBonus = (purchasedUpgradeIds: string[], skill: SkillName): number => {
    const specificBonus = getEffectValue(purchasedUpgradeIds, 'skill_yield', { skill })
    const allSkillsBonus = getEffectValue(purchasedUpgradeIds, 'all_skill_yield')
    return specificBonus + allSkillsBonus
}

export const getWorkstationSpeedBonus = (purchasedUpgradeIds: string[], workstation: WorkstationName): number => {
    const specificBonus = getEffectValue(purchasedUpgradeIds, 'workstation_speed', { workstation })
    const allWorkstationsBonus = getEffectValue(purchasedUpgradeIds, 'all_workstation_speed')
    return specificBonus + allWorkstationsBonus
}

export const getWorkstationXpBonus = (purchasedUpgradeIds: string[], workstation: WorkstationName): number => {
    return getEffectValue(purchasedUpgradeIds, 'workstation_xp', { workstation })
}

export const getWorkstationRecoveryChance = (purchasedUpgradeIds: string[], workstation: WorkstationName): number => {
    const specificBonus = getEffectValue(purchasedUpgradeIds, 'workstation_recovery', { workstation })
    const allWorkstationsBonus = getEffectValue(purchasedUpgradeIds, 'all_workstation_recovery')
    return specificBonus + allWorkstationsBonus
}

export const getHelperSlots = (purchasedUpgradeIds: string[]): number => {
    return getEffectValue(purchasedUpgradeIds, 'helper_slot')
}

export const getMerchantDiscount = (purchasedUpgradeIds: string[]): number => {
    return getEffectValue(purchasedUpgradeIds, 'merchant_discount')
}

export const getSellableGoldBonus = (purchasedUpgradeIds: string[]): number => {
    return getEffectValue(purchasedUpgradeIds, 'sellable_gold_bonus')
}

export const getAwakenGoldBonus = (purchasedUpgradeIds: string[]): number => {
    return getEffectValue(purchasedUpgradeIds, 'awaken_gold')
}

export const hasQolUpgrade = (
    purchasedUpgradeIds: string[],
    qolType: 'qol_expedition_min_maxer' | 'qol_auto_task_board'
): boolean => {
    return purchasedUpgradeIds.some((upgradeId) => {
        const upgrade = UpgradesContent.getById(upgradeId)
        return upgrade?.effectData.type === qolType
    })
}

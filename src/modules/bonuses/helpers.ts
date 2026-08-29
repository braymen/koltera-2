import { State } from '@engine/types'
import SanctuaryHelpers from '@modules/sanctuary/helpers'
import * as UpgradeHelpers from '@modules/upgrades/helpers'
import SkillingHelpers from '@modules/skilling/helpers'
import ToolHelpers from '@modules/tools/helpers'
import ToolsConfig from '@configs/tools'
import { SkillName, WorkstationName } from '@modules/upgrades/types'
import { SanctuaryJobTiers } from '@modules/sanctuary/types'

// ─── Breakdown types for UI display ───

export interface BonusBreakdown {
    sanctuary: number
    upgrades: number
    playerLevel: number
    tool: number
    total: number
    multiplier: number // 1 + total/100
}

export interface DurationBreakdown {
    sanctuary: number
    upgrades: number
    total: number
    multiplier: number // clamped duration multiplier (e.g. 0.8 = 20% faster)
}

// ─── Gathering skill XP bonus (player active skilling) ───

export const getGatheringXpBonus = (state: State, skillId: string, jobTiers?: SanctuaryJobTiers): BonusBreakdown => {
    const tiers = jobTiers ?? SanctuaryHelpers.calculateJobTiers(state)
    const jobKey = skillId.toLowerCase() as keyof typeof tiers
    const jobBenefits = SanctuaryHelpers.getJobBenefits(tiers[jobKey])

    const sanctuary = jobBenefits.jobXpBonus
    const upgrades = UpgradeHelpers.getSkillXpBonus(state.purchasedUpgrades, skillId as SkillName)
    const playerLevel = SkillingHelpers.getPlayerLevelXpBonus(state.skills)
    const tool = ToolHelpers.getToolXpBonusBySkillId(state.tools, skillId)
    const total = sanctuary + upgrades + playerLevel + tool

    return {
        sanctuary,
        upgrades,
        playerLevel,
        tool,
        total,
        multiplier: 1 + total / 100,
    }
}

// ─── Helper creature XP bonus (per-second XP while helping) ───

export const getHelperXpBonus = (state: State, skillId: string, jobTiers?: SanctuaryJobTiers): BonusBreakdown => {
    const tiers = jobTiers ?? SanctuaryHelpers.calculateJobTiers(state)
    const jobKey = skillId.toLowerCase() as keyof typeof tiers
    const jobBenefits = SanctuaryHelpers.getJobBenefits(tiers[jobKey])

    const sanctuary = jobBenefits.jobXpBonus
    const upgrades = UpgradeHelpers.getSkillXpBonus(state.purchasedUpgrades, skillId as SkillName)
    const skillTool = ToolHelpers.getToolXpBonusBySkillId(state.tools, skillId)
    const staffTool = ToolHelpers.getToolXpBonusBySkillId(state.tools, 'Helpers')
    const tool = skillTool + staffTool
    const total = sanctuary + upgrades + tool

    return {
        sanctuary,
        upgrades,
        playerLevel: 0, // helpers don't get player level bonus
        tool,
        total,
        multiplier: 1 + total / 100,
    }
}

// ─── Workstation XP bonus (crafting at Furnace/Workbench/Stove) ───

export const getWorkstationXpBonus = (state: State, workstation: string): BonusBreakdown => {
    const upgrades = UpgradeHelpers.getWorkstationXpBonus(state.purchasedUpgrades, workstation as WorkstationName)
    const playerLevel = SkillingHelpers.getPlayerLevelXpBonus(state.skills)
    const workstationState = state[workstation.toLowerCase() as keyof State] as { speedMode?: boolean } | undefined
    const speedMode = workstationState?.speedMode === true
    // When speed mode is active, tool bonus applies to speed instead of XP
    const tool = speedMode ? 0 : ToolHelpers.getToolXpBonusBySkillId(state.tools, workstation)
    const total = upgrades + playerLevel + tool

    return {
        sanctuary: 0, // workstations don't get sanctuary bonus
        upgrades,
        playerLevel,
        tool,
        total,
        multiplier: 1 + total / 100,
    }
}

// ─── Workstation duration breakdown (Awaken Tree + Tool speed mode) ───

export interface WorkstationDurationBreakdown {
    upgrades: number // Awaken tree
    tool: number // From speed-mode tool
    total: number
    multiplier: number // 1 - total/100, clamped
}

export const getWorkstationDurationReduction = (state: State, workstation: string): WorkstationDurationBreakdown => {
    const upgrades = UpgradeHelpers.getWorkstationSpeedBonus(state.purchasedUpgrades, workstation as WorkstationName)
    const tool = getWorkstationToolSpeedBonus(state, workstation)
    const total = upgrades + tool
    const multiplier = Math.max(0.01, 1 - total / 100)
    return { upgrades, tool, total, multiplier }
}

// ─── Workstation tool speed bonus (when speed mode is active) ───

export const WORKSTATION_TOOL_SPEED_PER_LEVEL = 2

export const getWorkstationToolSpeedBonus = (state: State, workstation: string): number => {
    const workstationState = state[workstation.toLowerCase() as keyof State] as { speedMode?: boolean } | undefined
    if (!workstationState?.speedMode) return 0
    const toolDef = ToolsConfig.getBySkillId(workstation)
    if (!toolDef) return 0
    const level = ToolHelpers.getToolLevel(state.tools, toolDef.id)
    return level * WORKSTATION_TOOL_SPEED_PER_LEVEL
}

// ─── Expedition creature XP bonus ───

export const getExpeditionXpBonus = (state: State): BonusBreakdown => {
    const tool = ToolHelpers.getToolXpBonusBySkillId(state.tools, 'Expeditions')
    const total = tool

    return {
        sanctuary: 0,
        upgrades: 0,
        playerLevel: 0,
        tool,
        total,
        multiplier: 1 + total / 100,
    }
}

// ─── Gathering duration reduction ───

export const getGatheringDurationReduction = (state: State, skillId: string, jobTiers?: SanctuaryJobTiers): DurationBreakdown => {
    const tiers = jobTiers ?? SanctuaryHelpers.calculateJobTiers(state)
    const jobKey = skillId.toLowerCase() as keyof typeof tiers
    const jobBenefits = SanctuaryHelpers.getJobBenefits(tiers[jobKey])

    const sanctuary = jobBenefits.durationReduction
    const upgrades = Math.abs(UpgradeHelpers.getSkillDurationReduction(state.purchasedUpgrades, skillId as SkillName))
    const total = sanctuary + upgrades
    const multiplier = Math.max(0.01, 1 - total / 100)

    return { sanctuary, upgrades, total, multiplier }
}

// ─── Gathering yield bonus ───

export const getGatheringYieldBonus = (
    state: State,
    skillId: string,
    jobTiers?: SanctuaryJobTiers
): { sanctuary: number; upgrades: number; total: number } => {
    const tiers = jobTiers ?? SanctuaryHelpers.calculateJobTiers(state)
    const jobKey = skillId.toLowerCase() as keyof typeof tiers
    const jobBenefits = SanctuaryHelpers.getJobBenefits(tiers[jobKey])

    const sanctuary = jobBenefits.yieldBonus
    const upgrades = UpgradeHelpers.getSkillYieldBonus(state.purchasedUpgrades, skillId as SkillName)
    const total = sanctuary + upgrades

    return { sanctuary, upgrades, total }
}

const BonusHelpers = {
    getGatheringXpBonus,
    getHelperXpBonus,
    getWorkstationXpBonus,
    getWorkstationToolSpeedBonus,
    getWorkstationDurationReduction,
    getExpeditionXpBonus,
    getGatheringDurationReduction,
    getGatheringYieldBonus,
}

export default BonusHelpers

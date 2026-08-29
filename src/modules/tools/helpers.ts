import ToolsConfig from '@configs/tools'
import { ToolId, ToolState, ToolUpgradeCost } from './types'

/**
 * Get the current level of a tool (0–10).
 */
export const getToolLevel = (tools: ToolState, toolId: ToolId): number => {
    return tools[toolId] || 0
}

/**
 * Get the XP bonus percentage for a tool at its current level.
 * e.g. level 3 = 15% bonus
 */
export const getToolXpBonus = (tools: ToolState, toolId: ToolId): number => {
    return getToolLevel(tools, toolId) * ToolsConfig.XP_BONUS_PER_LEVEL
}

/**
 * Get the XP bonus for a given skill/system ID (e.g. 'Chopping', 'Furnace', 'Expeditions').
 * Returns the bonus percentage from the matching tool.
 */
export const getToolXpBonusBySkillId = (tools: ToolState, skillId: string): number => {
    const toolDef = ToolsConfig.getBySkillId(skillId)
    if (!toolDef) return 0
    return getToolXpBonus(tools, toolDef.id)
}

/**
 * Get the cost to upgrade a tool to its next level.
 * Returns null if the tool is already at max level.
 */
export const getUpgradeCost = (tools: ToolState, toolId: ToolId): ToolUpgradeCost | null => {
    const currentLevel = getToolLevel(tools, toolId)
    if (currentLevel >= ToolsConfig.MAX_TOOL_LEVEL) return null
    return ToolsConfig.UPGRADE_COSTS[currentLevel]
}

/**
 * Check if the player can afford to upgrade a specific tool.
 */
export const canAffordUpgrade = (
    tools: ToolState,
    toolId: ToolId,
    inventory: { id: string; amount: number }[]
): boolean => {
    const cost = getUpgradeCost(tools, toolId)
    if (!cost) return false
    const item = inventory.find((i) => i.id === cost.barId)
    return !!item && item.amount >= cost.amount
}

/**
 * Check if a tool is at max level.
 */
export const isMaxLevel = (tools: ToolState, toolId: ToolId): boolean => {
    return getToolLevel(tools, toolId) >= ToolsConfig.MAX_TOOL_LEVEL
}

const ToolHelpers = {
    getToolLevel,
    getToolXpBonus,
    getToolXpBonusBySkillId,
    getUpgradeCost,
    canAffordUpgrade,
    isMaxLevel,
}

export default ToolHelpers

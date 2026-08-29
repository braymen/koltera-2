import { State } from '@engine/types'
import { UpgradeToolPayload } from './types'
import ToolsConfig from '@configs/tools'
import { getToolLevel, canAffordUpgrade, getUpgradeCost } from './helpers'

export const upgradeTool = (state: State, payload: UpgradeToolPayload): State => {
    const { toolId } = payload

    // Validate tool exists
    const toolDef = ToolsConfig.getById(toolId)
    if (!toolDef) return state

    // Check if already at max level
    const currentLevel = getToolLevel(state.tools, toolId)
    if (currentLevel >= ToolsConfig.MAX_TOOL_LEVEL) return state

    // Check if player can afford the upgrade
    if (!canAffordUpgrade(state.tools, toolId, state.inventory)) return state

    // Get cost and deduct from inventory
    const cost = getUpgradeCost(state.tools, toolId)!
    const inventoryItem = state.inventory.find((i) => i.id === cost.barId)
    if (inventoryItem) {
        inventoryItem.amount -= cost.amount
        if (inventoryItem.amount <= 0) {
            state.inventory = state.inventory.filter((i) => i.amount > 0)
        }
    }

    // Upgrade the tool
    state.tools[toolId] = currentLevel + 1

    return state
}

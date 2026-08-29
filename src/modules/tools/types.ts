export type ToolId =
    | 'axe' // Chopping
    | 'pickaxe' // Mining
    | 'machete' // Exploring
    | 'shovel' // Digging
    | 'fishing-pole' // Fishing
    | 'pitchfork' // Farming
    | 'sword' // Expeditions
    | 'staff' // Helpers
    | 'hammer' // Furnace
    | 'saw' // Workbench
    | 'knife' // Stove

export type ToolState = Record<ToolId, number> // toolId -> level (0–10)

export interface ToolDefinition {
    id: ToolId
    name: string
    description: string
    image: string
    skillId: string // The skill/system this tool boosts
    category: 'gathering' | 'workstation' | 'other'
}

export interface ToolUpgradeCost {
    barId: string
    amount: number
}

export interface UpgradeToolPayload {
    toolId: ToolId
}

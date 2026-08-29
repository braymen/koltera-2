import { Types } from '@modules/creatures/types'

export type MachineId = 'stone-quarry' | 'stick-finder' | 'coal-miner' | 'smelter' | 'sawmill' | 'cooker' | 'greenhouse' | 'farm' | 'bakery' | 'refinery'

export type MachineType = 'generator' | 'processor'

export type MachineRecipe = {
    inputItemId: string
    inputAmount: number
    secondaryInputItemId?: string
    secondaryInputAmount?: number
    extraInputs?: { itemId: string; amount: number }[]
    outputItemId: string
    outputAmount: number
}

export type MachineDefinition = {
    id: MachineId
    name: string
    description: string
    cost: number // Gold cost to purchase
    machineType: MachineType
    outputItemId: string | null // Item produced (for generators only)
    baseInterval: number // Seconds per production cycle
    requiresCreature: boolean // Whether a creature must be assigned
    creatureTypeRequired: Types[] | null // null = any type, array = specific types required
    recipes: MachineRecipe[] // Available recipes (for processors only)
}

export type MachineInstance = {
    id: MachineId
    purchased: boolean
    level: number // Upgrade level (0 = base)
    assignedCreatureId: string | null // creature instance id (not species)
    lastGenerationTime: number | null
    selectedRecipeId: string | null // inputItemId of the selected recipe, or 'all' for Smelt All mode
    smeltAllReversed?: boolean // false = bottom-to-top (default), true = top-to-bottom
}

export type MachinesState = {
    machines: Record<string, MachineInstance>
}

import { State } from '@engine/types'
import { MachineId, MachineInstance, MachineRecipe } from './types'
import MachinesConfig from '@configs/machines'
import CreaturesContent from '@data/creatures'

export const getMachine = (state: State, machineId: MachineId): MachineInstance | undefined => {
    return state.machines?.machines[machineId]
}

export const isMachineOperating = (state: State, machineId: MachineId): boolean => {
    const machine = getMachine(state, machineId)
    if (!machine || !machine.purchased) return false

    const definition = MachinesConfig.getById(machineId)
    if (!definition) return false

    // If machine requires a creature, check one is assigned
    if (definition.requiresCreature && !machine.assignedCreatureId) return false

    // If a creature is assigned, verify it still exists
    if (machine.assignedCreatureId) {
        const creature = state.creatures.find((c) => c.id === machine.assignedCreatureId)
        if (!creature) return false
    }

    // Processors need a selected recipe and enough input materials
    if (definition.machineType === 'processor') {
        if (!machine.selectedRecipeId) return false

        // Smelt All mode: check if any recipe has enough materials
        if (machine.selectedRecipeId === 'all') {
            return !!getNextSmeltAllRecipe(state, machineId)
        }

        const recipe = MachinesConfig.getRecipe(machineId, machine.selectedRecipeId)
        if (!recipe) return false
        if (recipe.inputAmount > 0) {
            const input = state.inventory.find((item) => item.id === recipe.inputItemId)
            if (!input || input.amount < recipe.inputAmount) return false
        }
        if (recipe.secondaryInputItemId && recipe.secondaryInputAmount) {
            const secondaryInput = state.inventory.find((item) => item.id === recipe.secondaryInputItemId)
            if (!secondaryInput || secondaryInput.amount < recipe.secondaryInputAmount) return false
        }
        if (recipe.extraInputs) {
            for (const extra of recipe.extraInputs) {
                const extraInput = state.inventory.find((item) => item.id === extra.itemId)
                if (!extraInput || extraInput.amount < extra.amount) return false
            }
        }
    }

    return true
}

export const getCreatureTypeForMachine = (state: State, creatureId: string): string[] | null => {
    const creature = state.creatures.find((c) => c.id === creatureId)
    if (!creature) return null
    const content = CreaturesContent.getById(creature.species)
    if (!content) return null
    return content.types
}

export const getMachineInterval = (machineId: MachineId, level: number): number => {
    return MachinesConfig.getInterval(machineId, level)
}

/**
 * For "Smelt All" mode: finds the first recipe with enough materials.
 * Default (smeltAllReversed=false) iterates bottom-to-top (highest tier first).
 * When smeltAllReversed=true, iterates top-to-bottom (lowest tier first).
 */
export const getNextSmeltAllRecipe = (state: State, machineId: MachineId): MachineRecipe | undefined => {
    const machine = getMachine(state, machineId)
    if (!machine) return undefined

    const definition = MachinesConfig.getById(machineId)
    if (!definition) return undefined

    const recipes = machine.smeltAllReversed ? [...definition.recipes] : [...definition.recipes].reverse()

    for (const recipe of recipes) {
        let hasEnough = true
        if (recipe.inputAmount > 0) {
            const input = state.inventory.find((item) => item.id === recipe.inputItemId)
            if (!input || input.amount < recipe.inputAmount) hasEnough = false
        }
        if (hasEnough && recipe.secondaryInputItemId && recipe.secondaryInputAmount) {
            const secondaryInput = state.inventory.find((item) => item.id === recipe.secondaryInputItemId)
            if (!secondaryInput || secondaryInput.amount < recipe.secondaryInputAmount) hasEnough = false
        }
        if (hasEnough && recipe.extraInputs) {
            for (const extra of recipe.extraInputs) {
                const extraInput = state.inventory.find((item) => item.id === extra.itemId)
                if (!extraInput || extraInput.amount < extra.amount) { hasEnough = false; break }
            }
        }
        if (hasEnough) return recipe
    }

    return undefined
}

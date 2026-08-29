import { FixedUpdate, State, Update } from '@engine/types'
import { changeInventory } from '@modules/inventory/functions'
import ResourceNotification from '@utils/notification'
import MachinesConfig from '@configs/machines'
import { isMachineOperating, getMachineInterval, getNextSmeltAllRecipe } from './helpers'
import { MachineId } from './types'
import { getCreatureMaxXp } from '@modules/creatures/helpers'

// Per-machine counters (seconds elapsed since last generation)
const machineCounters: Record<string, number> = {}

export const resetMachineCounter = (machineId: string) => {
    machineCounters[machineId] = 0
}

export const onUpdate = (state: State, { deltaTime }: Update) => {
    return state
}

export const onFixedUpdate = (state: State, { deltaTime }: FixedUpdate) => {
    if (!state.machines?.machines) return state

    for (const [machineId, machine] of Object.entries(state.machines.machines)) {
        if (!machine.purchased) continue
        if (!isMachineOperating(state, machineId as MachineId)) continue

        const definition = MachinesConfig.getById(machineId as MachineId)
        if (!definition) continue

        // Initialize generation time if needed
        if (machine.lastGenerationTime === null) {
            machine.lastGenerationTime = Date.now() / 1000
        }

        // Initialize counter
        if (machineCounters[machineId] === undefined) {
            machineCounters[machineId] = 0
        }

        const interval = getMachineInterval(machineId as MachineId, machine.level)
        machineCounters[machineId]++

        if (machineCounters[machineId] >= interval) {
            machineCounters[machineId] = 0

            if (definition.machineType === 'generator') {
                // Generators produce items from nothing
                state = changeInventory(state, {
                    resources: [{ id: definition.outputItemId!, amount: 1 }],
                })
                ResourceNotification(definition.outputItemId!, 1)
            } else if (definition.machineType === 'processor') {
                // Processors consume input and produce output
                const recipe =
                    machine.selectedRecipeId === 'all'
                        ? getNextSmeltAllRecipe(state, machineId as MachineId)
                        : machine.selectedRecipeId
                          ? MachinesConfig.getRecipe(machineId as MachineId, machine.selectedRecipeId)
                          : undefined
                if (recipe) {
                    if (recipe.inputAmount === 0) {
                        // Zero-input processor (e.g. Greenhouse) — just produce output
                        state = changeInventory(state, {
                            resources: [{ id: recipe.outputItemId, amount: recipe.outputAmount }],
                        })
                        ResourceNotification(recipe.outputItemId, recipe.outputAmount)
                    } else {
                        // Verify we still have enough input
                        const input = state.inventory.find((item) => item.id === recipe.inputItemId)
                        const hasSecondary = recipe.secondaryInputItemId && recipe.secondaryInputAmount
                        const secondaryInput = hasSecondary
                            ? state.inventory.find((item) => item.id === recipe.secondaryInputItemId)
                            : undefined
                        const secondaryOk =
                            !hasSecondary || (secondaryInput && secondaryInput.amount >= recipe.secondaryInputAmount!)

                        if (input && input.amount >= recipe.inputAmount && secondaryOk) {
                            const resources = [
                                { id: recipe.inputItemId, amount: -recipe.inputAmount },
                                { id: recipe.outputItemId, amount: recipe.outputAmount },
                            ]
                            if (hasSecondary) {
                                resources.push({ id: recipe.secondaryInputItemId!, amount: -recipe.secondaryInputAmount! })
                            }
                            if (recipe.extraInputs) {
                                for (const extra of recipe.extraInputs) {
                                    resources.push({ id: extra.itemId, amount: -extra.amount })
                                }
                            }
                            state = changeInventory(state, { resources })
                            ResourceNotification(recipe.outputItemId, recipe.outputAmount)
                        }
                    }
                }
            }

            machine.lastGenerationTime = Date.now() / 1000
        }

        // Grant XP to assigned creature (0.5 XP per second)
        if (machine.assignedCreatureId) {
            const creature = state.creatures.find((c) => c.id === machine.assignedCreatureId)
            if (creature) {
                const maxXp = getCreatureMaxXp(creature)
                creature.experience = Math.min(creature.experience + 0.5, maxXp)
            }
        }
    }

    return state
}

import { Update, State } from '@engine/types'
import { changeInventory } from '@modules/inventory/functions'
import ResourceNotification from '@utils/notification'
import { GardenFlower } from './types'
import { FLOWER_TO_ITEM } from './helpers'

// Garden cycle interval in seconds
const GARDEN_CYCLE_INTERVAL = 60

export const onUpdate = (state: State, { deltaTime }: Update) => {
    const currentTime = Date.now() / 1000

    // Initialize garden state if it doesn't exist
    if (!state.garden) {
        state.garden = {
            flowers: [],
            lastCycleTime: null,
            rocks: [],
        }
    }

    // Initialize lastCycleTime if null
    if (state.garden.lastCycleTime === null) {
        state.garden.lastCycleTime = currentTime
        return state
    }

    // Calculate time since last cycle
    const timeSinceLastCycle = currentTime - state.garden.lastCycleTime

    // Process cycle every 60 seconds
    if (timeSinceLastCycle >= GARDEN_CYCLE_INTERVAL) {
        // Count flowers by type, accounting for level (each level = +1 yield)
        const essenceCounts: Record<string, number> = {}

        state.garden.flowers.forEach((flower: GardenFlower) => {
            // Map known flowers to specific essences; fall back to Natural Essence for any unmapped flowers
            const essenceId = FLOWER_TO_ITEM[flower.flowerId]

            // Yield equals the flower's level (level 1 = 1, level 2 = 2, etc.)
            const yieldAmount = flower.level || 1 // Default to 1 if level is missing (for backwards compatibility)
            essenceCounts[essenceId] = (essenceCounts[essenceId] || 0) + yieldAmount
        })

        // Add essence to inventory and show notifications
        const loot: Array<{ id: string; amount: number }> = []
        Object.entries(essenceCounts).forEach(([essenceId, amount]) => {
            if (amount > 0) {
                loot.push({ id: essenceId, amount })
                ResourceNotification(essenceId, amount)
            }
        })

        if (loot.length > 0) {
            changeInventory(state, { resources: loot })
        }

        // Update last cycle time
        state.garden.lastCycleTime = currentTime
    }

    return state
}

export const onFixedUpdate = (state: State, payload: any) => {
    return state
}

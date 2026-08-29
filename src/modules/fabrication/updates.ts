import { FixedUpdate, State, Update } from '@engine/types'
import { changeInventory } from '@modules/inventory/functions'
import ResourceNotification from '@utils/notification'
import { FABRICATION_INTERVAL_SECONDS } from './helpers'

let fabricationCounter = 0

export const onUpdate = (state: State, { deltaTime }: Update) => {
    return state
}

export const onFixedUpdate = (state: State, { deltaTime }: FixedUpdate) => {
    if (!state.fabrication) return state

    const allocations = state.fabrication.allocations
    const hasAllocations = Object.keys(allocations).length > 0
    if (!hasAllocations) return state

    // Initialize generation time if needed
    if (state.fabrication.lastGenerationTime === null) {
        state.fabrication.lastGenerationTime = Date.now() / 1000
    }

    // Increment counter (fixedUpdate runs every 1 second)
    fabricationCounter++

    if (fabricationCounter >= FABRICATION_INTERVAL_SECONDS) {
        fabricationCounter = 0

        // Generate 1 of each allocated resource per prestige point
        const resources: { id: string; amount: number }[] = []
        for (const [itemId, points] of Object.entries(allocations)) {
            if (points > 0) {
                resources.push({ id: itemId, amount: points })
                ResourceNotification(itemId, points)
            }
        }

        if (resources.length > 0) {
            state = changeInventory(state, { resources })
            state.fabrication.lastGenerationTime = Date.now() / 1000
        }
    }

    return state
}

import { State } from '@engine/types'
import { changeInventory } from '@modules/inventory/functions'
import { MAX_ALLOCATION_PER_ITEM } from './helpers'

export type AllocatePrestigePointPayload = {
    itemId: string
}
export const allocatePrestigePoint = (state: State, payload: AllocatePrestigePointPayload): State => {
    const { itemId } = payload

    // Check if player has prestige points available
    const prestigePoints = state.inventory.find((item) => item.id === 'prestige-points')
    if (!prestigePoints || prestigePoints.amount < 1) {
        return state
    }

    // Initialize fabrication state if needed
    if (!state.fabrication) {
        state.fabrication = { allocations: {}, lastGenerationTime: null }
    }

    // Check if item is already at max allocation
    const currentAllocation = state.fabrication.allocations[itemId] ?? 0
    if (currentAllocation >= MAX_ALLOCATION_PER_ITEM) {
        return state
    }

    // Consume 1 prestige point
    state = changeInventory(state, {
        resources: [{ id: 'prestige-points', amount: -1 }],
    })

    // Allocate to the item
    state.fabrication.allocations[itemId] = currentAllocation + 1

    // Set generation time if this is the first allocation
    if (state.fabrication.lastGenerationTime === null) {
        state.fabrication.lastGenerationTime = Date.now() / 1000
    }

    return state
}

export type DeallocatePrestigePointPayload = {
    itemId: string
}
export const deallocatePrestigePoint = (state: State, payload: DeallocatePrestigePointPayload): State => {
    const { itemId } = payload

    // Initialize fabrication state if needed
    if (!state.fabrication) {
        state.fabrication = { allocations: {}, lastGenerationTime: null }
    }

    // Check if there's an allocation to remove
    const currentAllocation = state.fabrication.allocations[itemId] ?? 0
    if (currentAllocation < 1) {
        return state
    }

    // Remove allocation
    state.fabrication.allocations[itemId] = currentAllocation - 1
    if (state.fabrication.allocations[itemId] === 0) {
        delete state.fabrication.allocations[itemId]
    }

    // Refund 1 prestige point
    state = changeInventory(state, {
        resources: [{ id: 'prestige-points', amount: 1 }],
    })

    // Clear generation time if no allocations remain
    const totalAllocations = Object.values(state.fabrication.allocations).reduce((sum, n) => sum + n, 0)
    if (totalAllocations === 0) {
        state.fabrication.lastGenerationTime = null
    }

    return state
}

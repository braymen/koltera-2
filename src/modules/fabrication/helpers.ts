import { FabricationState } from './types'

// How often fabrication generates resources (in seconds)
export const FABRICATION_INTERVAL_SECONDS = 180

// Max prestige points that can be allocated to a single item
export const MAX_ALLOCATION_PER_ITEM = 5

// Get total prestige points allocated across all items
export const getTotalAllocatedPoints = (fabrication: FabricationState): number => {
    return Object.values(fabrication.allocations).reduce((sum, n) => sum + n, 0)
}

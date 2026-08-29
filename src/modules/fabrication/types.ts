// Tracks how many prestige points are allocated to each item
// Key: item ID, Value: number of prestige points allocated
export type FabricationState = {
    allocations: Record<string, number>
    lastGenerationTime: number | null
}

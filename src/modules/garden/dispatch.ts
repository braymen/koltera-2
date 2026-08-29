import { State } from '@engine/types'
import { GardenFlower } from './types'
import { getFlowerLevelUpCost } from './helpers'

export type PlantFlowerPayload = {
    flowerId: string
    x: number
    y: number
}

export type LevelUpFlowerPayload = {
    x: number
    y: number
}

export type RemoveFlowerPayload = {
    x: number
    y: number
}

export type RemoveRockPayload = {
    x: number
    y: number
}

export type SwapCellsPayload = {
    fromX: number
    fromY: number
    toX: number
    toY: number
}

const GardenActions = {
    plantFlower: (state: State, payload: PlantFlowerPayload) => {
        const { flowerId, x, y } = payload

        // Validate grid bounds (5x5 grid: 0-4)
        if (x < 0 || x >= 5 || y < 0 || y >= 5) {
            return state // Invalid position
        }

        // Initialize garden state if it doesn't exist
        if (!state.garden) {
            state.garden = {
                flowers: [],
                lastCycleTime: null,
                rocks: [],
            }
        }

        // Check if position has a rock
        const hasRock = state.garden.rocks?.some((r) => r.x === x && r.y === y)
        if (hasRock) {
            return state // Position has a rock, must remove it first
        }

        // Check if position is already occupied
        const existingFlower = state.garden.flowers.find((f) => f.x === x && f.y === y)
        if (existingFlower) {
            return state // Position already occupied
        }

        // Remove flower from inventory
        const inventoryItem = state.inventory.find((item) => item.id === flowerId)
        if (!inventoryItem || inventoryItem.amount <= 0) {
            return state // No flower in inventory
        }

        inventoryItem.amount -= 1
        if (inventoryItem.amount === 0) {
            const index = state.inventory.indexOf(inventoryItem)
            state.inventory.splice(index, 1)
        }

        // Add flower to garden
        const newFlower: GardenFlower = {
            flowerId,
            x,
            y,
            level: 1, // Start at level 1
        }

        state.garden.flowers.push(newFlower)
        return state
    },
    levelUpFlower: (state: State, payload: { x: number; y: number }) => {
        const { x, y } = payload

        // Initialize garden state if it doesn't exist
        if (!state.garden) {
            state.garden = {
                flowers: [],
                lastCycleTime: null,
                rocks: [],
            }
        }

        // Find the flower at this position
        const flower = state.garden.flowers.find((f) => f.x === x && f.y === y)
        if (!flower) {
            return state // No flower at this position
        }

        // Check if already at max level
        if (flower.level >= 6) {
            return state // Already at max level
        }

        const { itemId: requiredItemId, amount: requiredAmount } = getFlowerLevelUpCost(flower.level)

        // Check if player has enough fertilizer
        const inventoryItem = state.inventory.find((item) => item.id === requiredItemId)
        if (!inventoryItem || inventoryItem.amount < requiredAmount) {
            return state // Not enough resources
        }

        // Remove the required items from inventory
        inventoryItem.amount -= requiredAmount
        if (inventoryItem.amount === 0) {
            const index = state.inventory.indexOf(inventoryItem)
            state.inventory.splice(index, 1)
        }

        // Level up the flower
        flower.level += 1

        return state
    },
    removeFlower: (state: State, payload: RemoveFlowerPayload) => {
        const { x, y } = payload

        // Initialize garden state if it doesn't exist
        if (!state.garden) {
            state.garden = {
                flowers: [],
                lastCycleTime: null,
                rocks: [],
            }
        }

        // Find the flower at this position
        const flowerIndex = state.garden.flowers.findIndex((f) => f.x === x && f.y === y)
        if (flowerIndex === -1) {
            return state // No flower at this position
        }

        const flower = state.garden.flowers[flowerIndex]

        // Add the flower back to inventory
        const inventoryItem = state.inventory.find((item) => item.id === flower.flowerId)
        if (inventoryItem) {
            inventoryItem.amount += 1
        } else {
            state.inventory.push({
                id: flower.flowerId,
                amount: 1,
            })
        }

        // Remove the flower from the garden
        state.garden.flowers.splice(flowerIndex, 1)

        return state
    },
    removeRock: (state: State, payload: RemoveRockPayload) => {
        const { x, y } = payload

        // Initialize garden state if it doesn't exist
        if (!state.garden) {
            state.garden = {
                flowers: [],
                lastCycleTime: null,
                rocks: [],
            }
        }

        // Check if there's a rock at this position
        const rockIndex = state.garden.rocks?.findIndex((r) => r.x === x && r.y === y) ?? -1
        if (rockIndex === -1) {
            return state // No rock at this position
        }

        // Calculate cost: first rock costs 1000, then exponential growth
        // Formula: 1000 * (1.5 ^ (rocksRemoved))
        const rocksRemoved = 25 - (state.garden.rocks?.length || 25)
        const cost = Math.floor(750 * Math.pow(1.191232, rocksRemoved))

        // Check if player has enough gold
        const goldItem = state.inventory.find((item) => item.id === 'gold')
        const currentGold = goldItem?.amount || 0
        if (currentGold < cost) {
            return state // Not enough gold
        }

        // Remove gold
        if (goldItem) {
            goldItem.amount -= cost
            if (goldItem.amount === 0) {
                const index = state.inventory.indexOf(goldItem)
                state.inventory.splice(index, 1)
            }
        }

        // Remove the rock
        state.garden.rocks.splice(rockIndex, 1)

        return state
    },
    swapCells: (state: State, payload: SwapCellsPayload) => {
        const { fromX, fromY, toX, toY } = payload

        if (fromX === toX && fromY === toY) return state

        // Validate grid bounds
        if (fromX < 0 || fromX >= 5 || fromY < 0 || fromY >= 5) return state
        if (toX < 0 || toX >= 5 || toY < 0 || toY >= 5) return state

        if (!state.garden) return state

        // Don't allow swapping with rocks
        const fromHasRock = state.garden.rocks?.some((r) => r.x === fromX && r.y === fromY)
        const toHasRock = state.garden.rocks?.some((r) => r.x === toX && r.y === toY)
        if (fromHasRock || toHasRock) return state

        const fromFlower = state.garden.flowers.find((f) => f.x === fromX && f.y === fromY)
        const toFlower = state.garden.flowers.find((f) => f.x === toX && f.y === toY)

        // Swap positions
        if (fromFlower) {
            fromFlower.x = toX
            fromFlower.y = toY
        }
        if (toFlower) {
            toFlower.x = fromX
            toFlower.y = fromY
        }

        return state
    },
}

export default GardenActions

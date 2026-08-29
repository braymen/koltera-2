import { ItemInstance, ItemLogEntry } from './types'
import { State } from '@engine/types'
import ItemsContent from '@data/items'
import { checkForNewDiscoverableCreatures } from '@modules/collections/helpers'

export const combineInventory = (destination: ItemInstance[], source: ItemInstance[]) => {
    // Iterate through the second inventory and combine items with the same id
    source.forEach((itemB) => {
        // Validate item exists before adding
        const itemExists = ItemsContent.getById(itemB.id)
        if (!itemExists) {
            console.warn(`Skipping invalid item when combining inventory: ${itemB.id} (amount: ${itemB.amount})`)
            return
        }

        // Skip items with invalid amounts
        if (!itemB.amount || itemB.amount <= 0) {
            return
        }

        const existingItem = destination.find((itemA) => itemA.id === itemB.id)
        if (existingItem) {
            existingItem.amount += itemB.amount
        } else {
            destination.push({ ...itemB })
        }
    })

    // Remove items with zero amount and validate all items exist
    return destination.filter((item) => {
        if (item.amount < 1) return false
        return true
    })
}

export const combineInventoryWithDiscovery = (state: State, source: ItemInstance[]) => {
    // Track discovered items
    let newItemsDiscovered = false
    source.forEach((item) => {
        if (!state.collections.items.includes(item.id)) {
            state.collections.items.push(item.id)
            newItemsDiscovered = true
        }
    })

    // If new items were discovered, check for newly discoverable creatures
    if (newItemsDiscovered) {
        checkForNewDiscoverableCreatures(state)
    }

    // Combine items as usual
    combineInventory(state.inventory, source)

    // Log item changes
    const now = Date.now() / 1000
    if (!state.itemLog) {
        state.itemLog = []
    }

    source.forEach((item) => {
        if (item.amount > 0) {
            const logEntry: ItemLogEntry = {
                itemId: item.id,
                amount: item.amount,
                timestamp: now,
            }
            state.itemLog.push(logEntry)

            // Track total items gained for statistics
            if (state.statistics) {
                if (typeof state.statistics.totalItemsGained !== 'number') {
                    state.statistics.totalItemsGained = 0
                }
                state.statistics.totalItemsGained += item.amount
            }
        }
    })

    // Keep only last 20 entries
    if (state.itemLog.length > 20) {
        state.itemLog = state.itemLog.slice(-20)
    }
}

export const canAffordInventoryCost = (inventory: ItemInstance[], cost: ItemInstance[]) => {
    return cost.every((costItem) => {
        const inventoryItem = inventory.find((item) => item.id === costItem.id)
        return inventoryItem ? inventoryItem.amount >= costItem.amount : false
    })
}

export const validateAndCleanInventory = (inventory: ItemInstance[]): ItemInstance[] => {
    return inventory.filter((item) => {
        const itemExists = ItemsContent.getById(item.id)
        if (!itemExists) {
            console.warn(`Removing invalid item from inventory: ${item.id} (amount: ${item.amount})`)
            return false
        }
        // Also remove items with invalid amounts
        if (!item.amount || item.amount <= 0) {
            return false
        }
        return true
    })
}

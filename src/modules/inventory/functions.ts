import { State } from '@engine/types'
import { ItemInstance, ItemLogEntry, ChestLootEntry } from './types'
import { combineInventoryWithDiscovery } from './helpers'
import ItemsContent from '@data/items'
import { checkForNewDiscoverableCreatures } from '@modules/collections/helpers'
import { triggerAchievement } from '@modules/collections/functions'
import { generateTasks } from '@modules/taskboard/functions'
import { calculateOfflineProgress } from '@utils/offline-progress'

export type ChangeInventoryPayload = {
    resources: ItemInstance[]
}
export const changeInventory = (state: State, payload: ChangeInventoryPayload): State => {
    const { resources } = payload

    let newItemsDiscovered = false

    resources.forEach((change) => {
        // Validate item exists in content
        const itemMeta = ItemsContent.getById(change.id)
        if (!itemMeta) {
            console.warn(`Skipping invalid inventory change for unknown item: ${change.id} (amount: ${change.amount})`)
            return
        }

        // Skip no-op changes
        if (!change.amount || change.amount === 0) {
            return
        }

        // Positive amounts: add to inventory and mark as discovered
        if (change.amount > 0) {
            // Track discovery
            if (!state.collections.items.includes(change.id)) {
                state.collections.items.push(change.id)
                newItemsDiscovered = true
            }

            // Track gold earned for statistics
            if (change.id === 'gold' && state.statistics) {
                if (typeof state.statistics.totalGoldEarned !== 'number') {
                    state.statistics.totalGoldEarned = 0
                }
                state.statistics.totalGoldEarned += change.amount
                const totalGold = state.statistics.totalGoldEarned
                if (totalGold >= 100_000) {
                    triggerAchievement(state, { achievementId: 'collect-100k-gold' })
                }
                if (totalGold >= 1_000_000) {
                    triggerAchievement(state, { achievementId: 'collect-1m-gold' })
                }
                if (totalGold >= 10_000_000) {
                    triggerAchievement(state, { achievementId: 'collect-10m-gold' })
                }
            }

            // Track total items gained for statistics
            if (state.statistics) {
                if (typeof state.statistics.totalItemsGained !== 'number') {
                    state.statistics.totalItemsGained = 0
                }
                state.statistics.totalItemsGained += change.amount
            }

            const existing = state.inventory.find((item) => item.id === change.id)
            if (existing) {
                existing.amount += change.amount
            } else {
                state.inventory.push({ id: change.id, amount: change.amount })
            }
        } else {
            // Negative amounts: remove from inventory
            const existing = state.inventory.find((item) => item.id === change.id)
            if (!existing) {
                // Nothing to remove
                return
            }

            existing.amount += change.amount // change.amount is negative

            // Remove items that drop to zero or below
            if (existing.amount <= 0) {
                state.inventory = state.inventory.filter((item) => item.id !== change.id)
            }
        }

        // Log the item change
        const logEntry: ItemLogEntry = {
            itemId: change.id,
            amount: change.amount,
            timestamp: Date.now() / 1000, // Unix timestamp in seconds
        }

        // Initialize itemLog if it doesn't exist
        if (!state.itemLog) {
            state.itemLog = []
        }

        // Add to log and keep only last 20 entries
        state.itemLog.push(logEntry)
        if (state.itemLog.length > 20) {
            state.itemLog = state.itemLog.slice(-20)
        }
    })

    // If new items were discovered, check for newly discoverable creatures
    if (newItemsDiscovered) {
        checkForNewDiscoverableCreatures(state)
    }

    return state
}

export type ToggleFavoritePayload = {
    itemId: string
}
export const toggleFavorite = (state: State, payload: ToggleFavoritePayload): State => {
    const { itemId } = payload
    const index = state.favoriteItems.indexOf(itemId)
    if (index === -1) {
        state.favoriteItems.push(itemId)
    } else {
        state.favoriteItems.splice(index, 1)
    }
    return state
}

export type OpenChestPayload = {
    itemId: string
    amount?: number // Amount of chests to open (default: 1)
    loot?: ItemInstance[] // Optional pre-calculated loot to use (ensures UI and inventory match)
}
export const openChest = (state: State, payload: OpenChestPayload): State => {
    const { itemId, amount = 1, loot: providedLoot } = payload

    // Get the chest item
    const chestItem = ItemsContent.getById(itemId)
    if (!chestItem || chestItem.type !== 'Container' || !chestItem.lootTable) {
        return state // Not a valid chest item
    }

    // Check if player has the chest in inventory
    const inventoryItem = state.inventory.find((item) => item.id === itemId)
    if (!inventoryItem || inventoryItem.amount < amount) {
        return state // Not enough chests
    }

    // Remove chests from inventory
    inventoryItem.amount -= amount
    if (inventoryItem.amount === 0) {
        const index = state.inventory.indexOf(inventoryItem)
        state.inventory.splice(index, 1)
    }

    // Process loot entries - separate items and collectibles
    const itemLoot: ItemInstance[] = []
    const collectibleIds: string[] = [] // Collectibles to add to collection
    const rolledCollectibleIds: string[] = [] // All collectibles that were rolled (including duplicates)

    // Check if this is a collectible chest (has collectibles in loot table)
    const isCollectibleChest = chestItem.lootTable?.some((entry) => {
        const lootType = entry.type || 'item'
        return lootType === 'collectible'
    })

    if (providedLoot && providedLoot.length > 0) {
        // Use the provided loot (items only for backwards compatibility)
        itemLoot.push(...providedLoot)
    } else {
        // Roll loot for each chest opened
        for (let i = 0; i < amount; i++) {
            if (isCollectibleChest && chestItem.lootTable) {
                // For collectible chests, randomly select ONE entry from the loot table
                const validEntries = chestItem.lootTable.filter((entry) => {
                    // Filter entries that pass their chance roll
                    return entry.chance === undefined || Math.random() < entry.chance
                })

                if (validEntries.length > 0) {
                    // Randomly select one entry
                    const selectedEntry = validEntries[Math.floor(Math.random() * validEntries.length)]
                    const lootType = selectedEntry.type || 'item'

                    if (lootType === 'item' && selectedEntry.id) {
                        // Add item to inventory
                        itemLoot.push({
                            id: selectedEntry.id,
                            amount: selectedEntry.amount,
                        })
                    }
                }
            } else {
                // For regular chests, roll all entries (existing behavior)
                chestItem.lootTable?.forEach((entry: ChestLootEntry) => {
                    // If chance is specified, roll for it. Otherwise, always include
                    if (entry.chance === undefined || Math.random() < entry.chance) {
                        const lootType = entry.type || 'item' // Default to 'item' for backwards compatibility

                        if (lootType === 'collectible' && entry.collectibleId) {
                            // Track what was rolled (even if already collected)
                            rolledCollectibleIds.push(entry.collectibleId)
                        } else if (lootType === 'item' && entry.id) {
                            // Add item to inventory
                            itemLoot.push({
                                id: entry.id,
                                amount: entry.amount,
                            })
                        }
                    }
                })
            }
        }

        // Combine item loot amounts for same items
        const combinedLoot = new Map<string, number>()
        itemLoot.forEach((item) => {
            const current = combinedLoot.get(item.id) || 0
            combinedLoot.set(item.id, current + item.amount)
        })

        // Convert to array
        itemLoot.length = 0
        combinedLoot.forEach((amount, id) => {
            itemLoot.push({ id, amount })
        })
    }

    // Add items to inventory
    if (itemLoot.length > 0) {
        combineInventoryWithDiscovery(state, itemLoot)
    }

    // Store rolled collectibles temporarily for UI display (even if already collected)
    // This allows the modal to show what was rolled even if it's a duplicate
    if (rolledCollectibleIds.length > 0) {
        if (!state.lastOpenedChestRolledCollectibles) {
            state.lastOpenedChestRolledCollectibles = []
        }
        state.lastOpenedChestRolledCollectibles = [...rolledCollectibleIds]
    }

    // Log chest removal
    const logEntry: ItemLogEntry = {
        itemId: itemId,
        amount: -amount,
        timestamp: Date.now() / 1000,
    }

    if (!state.itemLog) {
        state.itemLog = []
    }
    state.itemLog.push(logEntry)
    if (state.itemLog.length > 20) {
        state.itemLog = state.itemLog.slice(-20)
    }

    return state
}

export type ConsumeItemPayload = {
    itemId: string
}
export const consumeItem = (state: State, payload: ConsumeItemPayload): State => {
    const { itemId } = payload

    // Validate item is a consumable
    const itemMeta = ItemsContent.getById(itemId)
    if (!itemMeta || itemMeta.type !== 'Consumable') {
        return state
    }

    // Check if player has the item
    const inventoryItem = state.inventory.find((item) => item.id === itemId)
    if (!inventoryItem || inventoryItem.amount < 1) {
        return state
    }

    // Remove 1 from inventory
    inventoryItem.amount -= 1
    if (inventoryItem.amount <= 0) {
        state.inventory = state.inventory.filter((item) => item.id !== itemId)
    }

    // Handle consumable effects based on item ID
    switch (itemId) {
        case 'task-board-reset-potion': {
            const now = Date.now() / 1000
            const generatedTasks = generateTasks(state)
            if (generatedTasks.length > 0) {
                state.taskBoard.tasks = generatedTasks
                state.taskBoard.lastResetTime = now
            }
            break
        }
        case 'awaken-tree-reset-potion': {
            const refundAmount = state.purchasedUpgrades.length
            state.purchasedUpgrades = []
            if (refundAmount > 0) {
                const awakenItem = state.inventory.find((item) => item.id === 'awaken-points')
                if (awakenItem) {
                    awakenItem.amount += refundAmount
                } else {
                    state.inventory.push({ id: 'awaken-points', amount: refundAmount })
                }
            }
            break
        }
        case 'offline-progress-potion': {
            // Simulate 24 hours of offline progress
            const currentTime = Date.now() / 1000
            const originalLastSaveTime = state.lastSaveTime
            state.lastSaveTime = currentTime - 1 * 60 * 60 // Set to 1 hour ago
            const result = calculateOfflineProgress(state)
            if (result) {
                // Store result on state so GameWrapper can show the offline modal
                ;(state as any).pendingOfflinePotionResult = result
            } else {
                // Restore lastSaveTime if nothing happened
                state.lastSaveTime = originalLastSaveTime
            }
            break
        }
    }

    return state
}

export const calculateChestLoot = (itemId: string, amount: number = 1): ItemInstance[] => {
    const chestItem = ItemsContent.getById(itemId)
    if (!chestItem || chestItem.type !== 'Container' || !chestItem.lootTable) {
        return []
    }

    // Check if this is a collectible chest (has collectibles in loot table)
    const isCollectibleChest = chestItem.lootTable.some((entry) => {
        const lootType = entry.type || 'item'
        return lootType === 'collectible'
    })

    // Roll loot for each chest opened (only items for UI preview, collectibles are handled separately)
    const loot: ItemInstance[] = []
    for (let i = 0; i < amount; i++) {
        if (isCollectibleChest) {
            // For collectible chests, randomly select ONE entry from the loot table
            const validEntries = chestItem.lootTable.filter((entry) => {
                // Filter entries that pass their chance roll
                return entry.chance === undefined || Math.random() < entry.chance
            })

            if (validEntries.length > 0) {
                // Randomly select one entry
                const selectedEntry = validEntries[Math.floor(Math.random() * validEntries.length)]
                const lootType = selectedEntry.type || 'item'

                // Only include items in the preview (collectibles are added to collection, not inventory)
                if (lootType === 'item' && selectedEntry.id) {
                    loot.push({
                        id: selectedEntry.id,
                        amount: selectedEntry.amount,
                    })
                }
            }
        } else {
            // For regular chests, roll all entries (existing behavior)
            chestItem.lootTable.forEach((entry) => {
                // Only include items in the preview (collectibles are added to collection, not inventory)
                const lootType = entry.type || 'item' // Default to 'item' for backwards compatibility
                if (lootType === 'item' && entry.id) {
                    // If chance is specified, roll for it. Otherwise, always include
                    if (entry.chance === undefined || Math.random() < entry.chance) {
                        loot.push({
                            id: entry.id,
                            amount: entry.amount,
                        })
                    }
                }
            })
        }
    }

    // Combine loot amounts for same items
    const combinedLoot = new Map<string, number>()
    loot.forEach((item) => {
        const current = combinedLoot.get(item.id) || 0
        combinedLoot.set(item.id, current + item.amount)
    })

    // Convert to array
    return Array.from(combinedLoot.entries()).map(([id, amount]) => ({
        id,
        amount,
    }))
}

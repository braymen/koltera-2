import { ItemID } from '@data/items'
import { BaseContent } from '@engine/types'

export interface ChestLootEntry {
    id?: ItemID // Item ID (required if type is 'item')
    collectibleId?: string // Collectible ID (required if type is 'collectible')
    amount: number
    chance?: number // Optional chance (0-1) for this item to drop. If not specified, always drops
    type?: 'item' | 'collectible' // Type of loot entry (defaults to 'item' for backwards compatibility)
}

export interface Item extends BaseContent {
    type: ItemPrimaryType
    recipes: ItemRecipe[]
    sellValue?: number // If set, item can be sold for this amount (only sellables will have this)
    buyValue?: number // If set, item can be bought from merchant for this amount once discovered
    weeklyLimit?: number // If set, limits how many can be purchased per week from the merchant
    lootTable?: ChestLootEntry[] // Loot table for container items (only for type 'Container')
}

export interface ItemInstance {
    id: ItemID
    amount: number
}

export interface MerchantItem {
    id: ItemID
    value: number
}

export interface ItemRecipe {
    workstation: 'Workbench' | 'Furnace' | 'Stove' | 'Timbershop'
    levelRequirement: number
    ingredients: ItemInstance[]
    outputAmount: number
    craftTime: number
    experience: number
}

export type ItemPrimaryType =
    | 'Gathered' // Items that are gathered from the world
    | 'Refined' // Items that are refined from gathered items
    | 'Sellable' // Items that can be sold to the merchant
    | 'Currency' // Items that are used as currency
    | 'Container' // Items like bird nests, treasure chests, etc.
    | 'Consumable' // Items that are consumable

export interface ItemLogEntry {
    itemId: ItemID
    amount: number // Positive for gain, negative for loss
    timestamp: number // Unix timestamp in seconds
}

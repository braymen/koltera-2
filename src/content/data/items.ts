import { Item } from '@modules/inventory/types'
import { ChoppingItems } from './items/skilling/chopping'
import { MiningItems } from './items/skilling/mining'
import { DiggingItems } from './items/skilling/digging'
import { ExploringItems } from './items/skilling/exploring'
import { FishingItems } from './items/skilling/fishing'
import { FarmingItems } from './items/skilling/farming'
import { StoveItems } from './items/workstations/stove'
import { FurnaceItems } from './items/workstations/furnace'
import { WorkbenchItems } from './items/workstations/workbench'
import { SellableItems } from './items/sellables'
import { CurrencyItems } from './items/currencies'
import { GardenItems } from './items/garden'
import { Consumables } from './items/consumables'
import { ExpeditionItems } from './items/expeditions'
import { DungeonItems } from './items/dungeons'

const get: Item[] = [
    ...ChoppingItems,
    ...MiningItems,
    ...DiggingItems,
    ...ExploringItems,
    ...FishingItems,
    ...FarmingItems,
    ...StoveItems,
    ...FurnaceItems,
    ...WorkbenchItems,
    ...SellableItems,
    ...CurrencyItems,
    ...GardenItems,
    ...Consumables,
    ...ExpeditionItems,
    ...DungeonItems,
] satisfies Item[]
export type ItemID = (typeof get)[number]['id']

/**
 * Lookup Function
 */
const Lookup: Record<string, Item> = {}
get.forEach((item: Item) => {
    Lookup[item.id] = item
})

const getById = (id: string) => {
    return Lookup[id]
}

const ItemsContent = {
    get,
    getById,
}

export default ItemsContent

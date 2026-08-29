import { Item, ItemRecipe } from '@modules/inventory/types'
import { Skills } from '@modules/skilling/types'

export interface CraftingJob {
    id: string
    itemId: string
    amount: number
    item: Item
    recipe: ItemRecipe
    singleItemDuration: number
    totalDuration: number
}

export interface CrafterState {
    isActive: boolean
    item: Item | null
    progress: number
    duration: number
    startTime: number | null
    amount: number
    completedItems: number // Number of items completed so far
    singleItemDuration: number // Duration for crafting a single item
    queue: CraftingJob[] // Queue of pending crafting jobs
    speedMode?: boolean // If true, tool bonus applies as speed rather than XP
}

export interface SetWorkstationSpeedModePayload {
    workstation: Skills
    enabled: boolean
}

export interface StartCraftingPayload {
    itemId: string
    amount: number
    workstation: Skills
    ingredientId?: string // Optional: specifies which ingredient/recipe to use when item has multiple recipes
}

export interface UpdateCraftingPayload {
    deltaTime: number
    workstation: Skills
}

export interface StopCraftingPayload {
    workstation: Skills
}

export interface CancelQueuedItemPayload {
    workstation: Skills
    itemId: string
}

export interface ReorderQueuePayload {
    workstation: Skills
    jobId: string
    direction: 'up' | 'down'
}

export interface RemoveQueuedJobPayload {
    workstation: Skills
    jobId: string
}

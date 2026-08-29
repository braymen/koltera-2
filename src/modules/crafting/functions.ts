import { State } from '@engine/types'
import {
    StartCraftingPayload,
    UpdateCraftingPayload,
    StopCraftingPayload,
    CancelQueuedItemPayload,
    ReorderQueuePayload,
    RemoveQueuedJobPayload,
    CrafterState,
    CraftingJob,
    SetWorkstationSpeedModePayload,
} from './types'
import { combineInventoryWithDiscovery, canAffordInventoryCost } from '@modules/inventory/helpers'
import ResourceNotification from '@utils/notification'
import SkillingHelpers from '@modules/skilling/helpers'
import { addExperience } from '@modules/skilling/functions'
import ItemsContent from '@data/items'
import * as UpgradeHelpers from '@modules/upgrades/helpers'
import { triggerAchievement } from '@modules/collections/functions'
import BonusHelpers from '@modules/bonuses/helpers'

export const startCrafting = (state: State, payload: StartCraftingPayload): State => {
    const { itemId, amount, workstation, ingredientId } = payload

    const item = ItemsContent.getById(itemId)
    let recipe = item.recipes.find((recipe) => recipe.workstation === workstation)

    // If ingredientId is provided, find the specific recipe that uses that ingredient
    if (ingredientId && recipe) {
        const specificRecipe = item.recipes.find(
            (r) => r.workstation === workstation && r.ingredients.some((ing) => ing.id === ingredientId)
        )
        if (specificRecipe) {
            recipe = specificRecipe
        }
    }

    const workstationState = state[workstation.toLowerCase().replace(' ', '') as keyof State] as CrafterState | undefined

    if (!recipe || !workstationState) {
        return state
    }

    // Check if player has required skill level
    const workstationSkill = state.skills.find((skill) => skill.id === workstation)
    const workstationLevel = SkillingHelpers.getLevel(workstationSkill?.xp || 0)
    if (workstationLevel < recipe.levelRequirement) {
        return state
    }

    // Check if player has required ingredients
    const requiredIngredients = recipe.ingredients.map((ingredient) => ({
        id: ingredient.id,
        amount: ingredient.amount * amount,
    }))

    if (!canAffordInventoryCost(state.inventory, requiredIngredients)) {
        return state
    }

    // Initialize queue if it doesn't exist
    if (!workstationState.queue) {
        workstationState.queue = []
    }

    // Remove ingredients from inventory (only after validation checks pass)
    requiredIngredients.forEach((ingredient) => {
        const inventoryItem = state.inventory.find((item) => item.id === ingredient.id)
        if (inventoryItem) {
            inventoryItem.amount -= ingredient.amount
            if (inventoryItem.amount <= 0) {
                state.inventory = state.inventory.filter((item) => item.amount > 0)
            }
        }
    })

    // Apply workstation speed upgrade
    const speedBonus = UpgradeHelpers.getWorkstationSpeedBonus(state.purchasedUpgrades, workstation as any)
    const toolSpeedBonus = BonusHelpers.getWorkstationToolSpeedBonus(state, workstation)
    const totalSpeedBonus = speedBonus + toolSpeedBonus
    const speedMultiplier = Math.max(0.01, 1 - totalSpeedBonus / 100)
    const adjustedCraftTime = recipe.craftTime * speedMultiplier
    const totalDuration = adjustedCraftTime * amount

    // Create crafting job
    const job: CraftingJob = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        itemId: itemId,
        amount: amount,
        item: item,
        recipe: recipe,
        singleItemDuration: adjustedCraftTime,
        totalDuration: totalDuration,
    }

    // Add job to queue
    workstationState.queue.push(job)

    // If workstation is not active, start the first job in queue
    if (!workstationState.isActive) {
        startNextJobInQueue(state, workstation, workstationState)
    }

    return state
}

// Helper function to start the next job in the queue
// overflowSeconds: time that overflowed from the previous job (for offline progress)
const startNextJobInQueue = (state: State, workstation: string, workstationState: CrafterState, overflowSeconds: number = 0): void => {
    if (!workstationState.queue || workstationState.queue.length === 0) {
        return
    }

    const job = workstationState.queue[0]
    const currentTime = Date.now() / 1000

    workstationState.isActive = true
    workstationState.item = job.item
    workstationState.progress = 0
    workstationState.duration = job.totalDuration
    workstationState.singleItemDuration = job.singleItemDuration
    // Shift startTime back by overflow so elapsed time accounts for offline carryover
    workstationState.startTime = currentTime - overflowSeconds
    workstationState.amount = job.amount
    workstationState.completedItems = 0
}

export const updateCrafting = (state: State, payload: UpdateCraftingPayload): State => {
    const { deltaTime, workstation } = payload
    const workstationState = state[workstation.toLowerCase().replace(' ', '') as keyof State] as CrafterState | undefined

    if (!workstationState) {
        return state
    }

    // If workstation is not active but there are items in the queue, start the next job
    if (!workstationState.isActive && workstationState.queue && workstationState.queue.length > 0) {
        startNextJobInQueue(state, workstation, workstationState)
        // After starting the job, continue with the update logic below
    }

    if (!workstationState.isActive || !workstationState.item) {
        return state
    }

    const currentTime = Date.now() / 1000
    const elapsedTime = currentTime - (workstationState.startTime || 0)
    const singleItemDuration = workstationState.singleItemDuration || workstationState.duration / workstationState.amount

    // Calculate how many items should be completed based on elapsed time
    const itemsThatShouldBeCompleted = Math.floor(elapsedTime / singleItemDuration)
    const itemsToComplete = Math.min(itemsThatShouldBeCompleted, workstationState.amount) - workstationState.completedItems

    // Give items incrementally as they complete
    if (itemsToComplete > 0) {
        const item = workstationState.item
        // Get the recipe from the active job in the queue (not by re-finding it)
        // The active job should be the first one in the queue
        const activeJob = workstationState.queue && workstationState.queue.length > 0 ? workstationState.queue[0] : null
        const recipe = activeJob?.recipe || null

        if (recipe) {
            // Apply workstation XP, recovery, and tool upgrades
            const wsBonus = BonusHelpers.getWorkstationXpBonus(state, workstation)
            const recoveryChance = UpgradeHelpers.getWorkstationRecoveryChance(state.purchasedUpgrades, workstation as any)

            // Calculate output for the items that just completed
            const outputAmount = recipe.outputAmount * itemsToComplete
            const xpMultiplier = wsBonus.multiplier
            const experienceGained = Math.round(recipe.experience * itemsToComplete * xpMultiplier * 100) / 100

            // Add output items to inventory
            const outputItem = {
                id: item.id,
                amount: outputAmount,
            }

            combineInventoryWithDiscovery(state, [outputItem])

            // Recovery: chance to return ingredients per item crafted
            if (recoveryChance > 0) {
                for (let i = 0; i < itemsToComplete; i++) {
                    if (Math.random() * 100 < recoveryChance) {
                        const recoveredIngredients = recipe.ingredients.map((ingredient) => ({
                            id: ingredient.id,
                            amount: ingredient.amount,
                        }))
                        combineInventoryWithDiscovery(state, recoveredIngredients)
                        for (const ingredient of recoveredIngredients) {
                            ResourceNotification(ingredient.id, ingredient.amount)
                        }
                    }
                }
            }

            // Add experience
            addExperience(state, { skillId: workstation, xp: experienceGained })

            // Show notification for each completed item
            for (let i = 0; i < itemsToComplete; i++) {
                ResourceNotification(item.id, recipe.outputAmount)
            }

            // Update completed items count
            workstationState.completedItems += itemsToComplete

            // Track items crafted for statistics
            if (state.statistics?.itemsCrafted) {
                const workstationKey = workstation as keyof typeof state.statistics.itemsCrafted
                if (
                    workstationKey === 'Stove' ||
                    workstationKey === 'Workbench' ||
                    workstationKey === 'Furnace' ||
                    workstationKey === 'Timbershop'
                ) {
                    if (typeof state.statistics.itemsCrafted[workstationKey] === 'number') {
                        state.statistics.itemsCrafted[workstationKey] += itemsToComplete
                    }
                    if (typeof state.statistics.itemsCrafted.total === 'number') {
                        state.statistics.itemsCrafted.total += itemsToComplete
                    }
                }
            }
        }
    }

    // Update progress for display (based on total duration)
    workstationState.progress = Math.min(1, elapsedTime / workstationState.duration)

    // Check if all items are complete
    if (workstationState.completedItems >= workstationState.amount) {
        // Calculate overflow time for offline progress carryover
        const overflowSeconds = Math.max(0, elapsedTime - workstationState.duration)

        // Remove completed job from queue
        if (workstationState.queue && workstationState.queue.length > 0) {
            workstationState.queue.shift()
        }

        // Reset workstation state
        workstationState.isActive = false
        workstationState.item = null
        workstationState.progress = 0
        workstationState.duration = 0
        workstationState.startTime = null
        workstationState.amount = 0
        workstationState.completedItems = 0
        workstationState.singleItemDuration = 0

        // Start next job in queue if available, carrying over overflow time
        if (workstationState.queue && workstationState.queue.length > 0) {
            startNextJobInQueue(state, workstation, workstationState, overflowSeconds)
        }
    }

    return state
}

export const stopCrafting = (state: State, payload: StopCraftingPayload): State => {
    const { workstation } = payload
    const workstationState = state[workstation.toLowerCase().replace(' ', '') as keyof State] as CrafterState | undefined

    if (!workstationState) {
        return state
    }

    // If there's an active job, stop it and return ingredients
    if (workstationState.isActive && workstationState.item) {
        // Get the recipe from the active job in the queue (not by re-finding it)
        // The active job should be the first one in the queue
        const activeJob = workstationState.queue && workstationState.queue.length > 0 ? workstationState.queue[0] : null
        const recipe = activeJob?.recipe || null

        if (recipe) {
            // Calculate how many items were completed
            const completedItems = workstationState.completedItems || 0
            const remainingItems = workstationState.amount - completedItems

            // Return unused ingredients for remaining items
            if (remainingItems > 0) {
                const ingredientsToReturn = recipe.ingredients.map((ingredient) => ({
                    id: ingredient.id,
                    amount: ingredient.amount * remainingItems,
                }))

                // Add ingredients back to inventory
                ingredientsToReturn.forEach((ingredient) => {
                    const inventoryItem = state.inventory.find((item) => item.id === ingredient.id)
                    if (inventoryItem) {
                        inventoryItem.amount += ingredient.amount
                    } else {
                        state.inventory.push({ ...ingredient })
                    }
                })
            }
        }

        // Remove the current job from queue
        if (workstationState.queue && workstationState.queue.length > 0) {
            workstationState.queue.shift()
        }
    }

    // Reset workstation state
    workstationState.isActive = false
    workstationState.item = null
    workstationState.progress = 0
    workstationState.duration = 0
    workstationState.startTime = null
    workstationState.amount = 0
    workstationState.completedItems = 0
    workstationState.singleItemDuration = 0

    // Start next job in queue if available
    if (workstationState.queue && workstationState.queue.length > 0) {
        startNextJobInQueue(state, workstation, workstationState)
    }

    return state
}

export const cancelQueuedItem = (state: State, payload: CancelQueuedItemPayload): State => {
    const { workstation, itemId } = payload
    const workstationState = state[workstation.toLowerCase().replace(' ', '') as keyof State] as CrafterState | undefined

    if (!workstationState || !workstationState.queue) {
        return state
    }

    // Find the job in the queue
    const jobIndex = workstationState.queue.findIndex((job) => job.itemId === itemId)
    if (jobIndex === -1) {
        return state // Job not found in queue
    }

    const job = workstationState.queue[jobIndex]

    // Return ingredients to inventory
    const ingredientsToReturn = job.recipe.ingredients.map((ingredient) => ({
        id: ingredient.id,
        amount: ingredient.amount * job.amount,
    }))

    ingredientsToReturn.forEach((ingredient) => {
        const inventoryItem = state.inventory.find((item) => item.id === ingredient.id)
        if (inventoryItem) {
            inventoryItem.amount += ingredient.amount
        } else {
            state.inventory.push({ ...ingredient })
        }
    })

    // Remove job from queue
    workstationState.queue.splice(jobIndex, 1)

    return state
}

export const reorderQueue = (state: State, payload: ReorderQueuePayload): State => {
    const { workstation, jobId, direction } = payload
    const workstationState = state[workstation.toLowerCase().replace(' ', '') as keyof State] as CrafterState | undefined

    if (!workstationState || !workstationState.queue) {
        return state
    }

    const jobIndex = workstationState.queue.findIndex((job) => job.id === jobId)
    if (jobIndex === -1) return state

    // Don't allow reordering the active job (index 0)
    if (jobIndex === 0) return state

    const targetIndex = direction === 'up' ? jobIndex - 1 : jobIndex + 1

    // Don't swap into the active job slot (index 0) or out of bounds
    if (targetIndex < 1 || targetIndex >= workstationState.queue.length) return state

    const temp = workstationState.queue[jobIndex]
    workstationState.queue[jobIndex] = workstationState.queue[targetIndex]
    workstationState.queue[targetIndex] = temp

    return state
}

export const setWorkstationSpeedMode = (state: State, payload: SetWorkstationSpeedModePayload): State => {
    const { workstation, enabled } = payload
    const workstationState = state[workstation.toLowerCase().replace(' ', '') as keyof State] as CrafterState | undefined
    if (!workstationState) return state
    workstationState.speedMode = enabled
    return state
}

export const removeQueuedJob = (state: State, payload: RemoveQueuedJobPayload): State => {
    const { workstation, jobId } = payload
    const workstationState = state[workstation.toLowerCase().replace(' ', '') as keyof State] as CrafterState | undefined

    if (!workstationState || !workstationState.queue) {
        return state
    }

    const jobIndex = workstationState.queue.findIndex((job) => job.id === jobId)
    if (jobIndex === -1) return state

    // Don't allow removing the active job (use stopCrafting for that)
    if (jobIndex === 0 && workstationState.isActive) return state

    const job = workstationState.queue[jobIndex]

    // Return ingredients to inventory
    job.recipe.ingredients.forEach((ingredient) => {
        const inventoryItem = state.inventory.find((item) => item.id === ingredient.id)
        const returnAmount = ingredient.amount * job.amount
        if (inventoryItem) {
            inventoryItem.amount += returnAmount
        } else {
            state.inventory.push({ id: ingredient.id, amount: returnAmount })
        }
    })

    workstationState.queue.splice(jobIndex, 1)

    return state
}

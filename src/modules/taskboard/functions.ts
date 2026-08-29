import { State } from '@engine/types'
import { Task, CompleteTaskPayload, SkipTaskPayload } from './types'
import ItemsContent, { ItemID } from '@data/items'
import { Item } from '@modules/inventory/types'
import { canAffordInventoryCost } from '@modules/inventory/helpers'
import ResourceNotification from '@utils/notification'
import SkillContent from '@data/skills'
import SkillingHelpers from '@modules/skilling/helpers'
import TaskboardConfig from '@configs/taskboard'

const getAvailableGatheringItems = (state: State): ItemID[] => {
    const gatheringSkills = ['Chopping', 'Mining', 'Exploring', 'Fishing', 'Farming', 'Digging']
    const availableItems = new Set<ItemID>()

    gatheringSkills.forEach((skillId) => {
        const skill = SkillContent.getById(skillId)
        if (!skill || !skill.activities) return

        const playerSkill = state.skills.find((s) => s.id === skillId)
        const playerLevel = SkillingHelpers.getLevel(playerSkill?.xp || 0)

        // Get all activities the player can access
        skill.activities.forEach((activity) => {
            if (playerLevel >= activity.levelRequirement) {
                // Add all items from this activity's output
                activity.output.forEach((loot) => {
                    if (loot.id !== 'nothing') {
                        availableItems.add(loot.id)
                    }
                })
            }
        })
    })

    return Array.from(availableItems)
}

const getItemDropChance = (itemId: ItemID): number => {
    const gatheringSkills = ['Chopping', 'Mining', 'Exploring', 'Fishing', 'Farming', 'Digging']
    let lowestChance = Infinity

    gatheringSkills.forEach((skillId) => {
        const skill = SkillContent.getById(skillId)
        if (!skill || !skill.activities) return

        // Only check the first (level 1) activity for base drop rates
        const firstActivity = skill.activities[0]
        if (!firstActivity) return

        firstActivity.output.forEach((loot) => {
            if (loot.id === itemId && loot.chance < lowestChance) {
                lowestChance = loot.chance
            }
        })
    })

    return lowestChance === Infinity ? 1 : lowestChance
}

export const generateTasks = (state: State): Task[] => {
    const gatheringItems = getAvailableGatheringItems(state)
    const obtainableItems = new Set([...gatheringItems])

    const availableItems = ItemsContent.get.filter(
        (item) => item.id !== 'gold' && item.type !== 'Container' && obtainableItems.has(item.id)
    )

    if (availableItems.length === 0) {
        return []
    }

    const tasks: Task[] = []
    const usedItems = new Set<ItemID>()

    const taskConfigs = TaskboardConfig.TASK_TIERS

    let taskIndex = 0

    // Generate tasks for each difficulty level
    for (const config of taskConfigs) {
        for (let i = 0; i < config.count; i++) {
            // Find an item that hasn't been used yet
            let item = availableItems[Math.floor(Math.random() * availableItems.length)]
            let attempts = 0

            // If we don't have enough unique items, allow duplicates
            const allowDuplicates = availableItems.length < 8

            while (!allowDuplicates && usedItems.has(item.id) && attempts < 100) {
                item = availableItems[Math.floor(Math.random() * availableItems.length)]
                attempts++
            }

            // If we can't find a unique item and we need unique items, break
            if (!allowDuplicates && usedItems.has(item.id)) {
                break
            }

            if (!allowDuplicates) {
                usedItems.add(item.id)
            }

            const now = Date.now() / 1000
            const dropChance = getItemDropChance(item.id)
            const adjustedAmount = Math.max(1, Math.round(config.amount * dropChance))
            tasks.push({
                id: `task-${Date.now()}-${taskIndex}`,
                itemId: item.id,
                amount: adjustedAmount,
                goldReward: config.goldReward,
                completed: false,
                lastResetTime: now,
            })

            taskIndex++
        }
    }

    return tasks
}

export const shouldResetTasks = (lastResetTime: number | null): boolean => {
    if (!lastResetTime) {
        return true
    }

    const lastReset = new Date(lastResetTime * 1000)
    const now = new Date()

    // Check if it's Tuesday (day 2, where 0 = Sunday)
    const isTuesday = now.getDay() === 2

    // Check if it's night time (8 PM or later / 20:00)
    const isNight = now.getHours() >= 20

    // Calculate the most recent Tuesday night at 8 PM
    let mostRecentTuesdayNight = new Date(now)
    if (isTuesday && isNight) {
        // If it's Tuesday night, use today
        mostRecentTuesdayNight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0, 0)
    } else {
        // Find the most recent Tuesday
        const currentDay = now.getDay()
        let daysToSubtract = 0
        if (currentDay > 2) {
            daysToSubtract = currentDay - 2
        } else if (currentDay < 2) {
            daysToSubtract = currentDay + 5 // Go back to previous week's Tuesday
        } else {
            // It's Tuesday but before 8 PM, so use last week's Tuesday
            daysToSubtract = 7
        }
        mostRecentTuesdayNight.setDate(now.getDate() - daysToSubtract)
        mostRecentTuesdayNight.setHours(20, 0, 0, 0)
    }

    // Reset if the most recent Tuesday night is after the last reset time
    // This means we've passed a Tuesday night since the last reset
    return mostRecentTuesdayNight.getTime() > lastReset.getTime()
}

export const shouldResetIndividualTask = (task: Task): boolean => {
    // Only reset completed tasks after 24 hours
    if (!task.completed) {
        return false
    }

    const now = Date.now() / 1000
    const timeSinceReset = now - task.lastResetTime

    return timeSinceReset >= TaskboardConfig.COOLDOWNS.INDIVIDUAL_TASK_COOLDOWN_SECONDS
}

const generateSingleTask = (
    state: State,
    config: { amount: number; goldReward: number },
    availableItems: Item[]
): Task | null => {
    if (availableItems.length === 0) {
        return null
    }

    const item = availableItems[Math.floor(Math.random() * availableItems.length)]
    const now = Date.now() / 1000
    const dropChance = getItemDropChance(item.id)
    const adjustedAmount = Math.max(1, Math.round(config.amount * dropChance))

    return {
        id: `task-${Date.now()}-${Math.random()}`,
        itemId: item.id,
        amount: adjustedAmount,
        goldReward: config.goldReward,
        completed: false,
        lastResetTime: now,
    }
}

export const resetTasks = (state: State): State => {
    const now = new Date()

    // Calculate the most recent Tuesday night at 8 PM (this is when the reset happened)
    let resetTuesday = new Date(now)
    const currentDay = now.getDay()
    const currentHour = now.getHours()

    // If it's Tuesday and 8 PM or later, use today
    if (currentDay === 2 && currentHour >= 20) {
        resetTuesday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0, 0)
    } else {
        // Find the most recent Tuesday
        let daysToSubtract = 0
        if (currentDay > 2) {
            daysToSubtract = currentDay - 2
        } else if (currentDay < 2) {
            daysToSubtract = currentDay + 5 // Go back to previous week's Tuesday
        } else {
            // It's Tuesday but before 8 PM, so use last week's Tuesday
            daysToSubtract = 7
        }
        resetTuesday.setDate(now.getDate() - daysToSubtract)
        resetTuesday.setHours(20, 0, 0, 0)
    }

    const currentTime = resetTuesday.getTime() / 1000

    const generatedTasks = generateTasks(state)
    if (generatedTasks.length > 0) {
        state.taskBoard.tasks = generatedTasks
        state.taskBoard.lastResetTime = currentTime
    }
    return state
}

export const resetIndividualTask = (state: State, taskIndex: number): State => {
    const gatheringItems = getAvailableGatheringItems(state)
    const obtainableItems = new Set([...gatheringItems])

    const availableItems = ItemsContent.get.filter(
        (item) => item.id !== 'gold' && item.type !== 'Container' && obtainableItems.has(item.id)
    )

    if (availableItems.length === 0 || taskIndex < 0 || taskIndex >= state.taskBoard.tasks.length) {
        return state
    }

    const oldTask = state.taskBoard.tasks[taskIndex]

    // Determine difficulty based on old task's gold reward — look up matching tier from config
    const matchedTier = TaskboardConfig.TASK_TIERS.find((tier) => tier.goldReward === oldTask.goldReward)
    const config = matchedTier
        ? { amount: matchedTier.amount, goldReward: matchedTier.goldReward }
        : { amount: oldTask.amount, goldReward: oldTask.goldReward }

    const newTask = generateSingleTask(state, config, availableItems)
    if (newTask) {
        state.taskBoard.tasks[taskIndex] = newTask
    }

    return state
}

export const completeTask = (state: State, payload: CompleteTaskPayload): State => {
    const { taskId } = payload

    const taskIndex = state.taskBoard.tasks.findIndex((t) => t.id === taskId)
    const task = taskIndex >= 0 ? state.taskBoard.tasks[taskIndex] : null

    if (!task || task.completed) {
        return state
    }

    // Check if player has required items
    const requiredItems = [{ id: task.itemId, amount: task.amount }]
    if (!canAffordInventoryCost(state.inventory, requiredItems)) {
        return state
    }

    // Remove items from inventory
    const inventoryItem = state.inventory.find((item) => item.id === task.itemId)
    if (inventoryItem) {
        inventoryItem.amount -= task.amount
        if (inventoryItem.amount <= 0) {
            state.inventory = state.inventory.filter((item) => item.amount > 0)
        }
    }

    // Give gold reward
    const goldItem = state.inventory.find((item) => item.id === 'gold')
    if (goldItem) {
        goldItem.amount += task.goldReward
    } else {
        state.inventory.push({ id: 'gold', amount: task.goldReward })
    }

    // Track gold earned for statistics
    if (state.statistics) {
        if (typeof state.statistics.totalGoldEarned !== 'number') {
            state.statistics.totalGoldEarned = 0
        }
        state.statistics.totalGoldEarned += task.goldReward
    }

    // Show notification
    ResourceNotification('gold', task.goldReward)

    // Mark task as completed and update lastResetTime to start 5-minute cooldown
    task.completed = true
    task.lastResetTime = Date.now() / 1000

    // Track task completion for statistics
    if (state.statistics) {
        if (typeof state.statistics.totalTasksCompleted !== 'number') {
            state.statistics.totalTasksCompleted = 0
        }
        state.statistics.totalTasksCompleted++
    }

    return state
}

export const skipTask = (state: State, payload: SkipTaskPayload): State => {
    const { taskId } = payload

    const task = state.taskBoard.tasks.find((t) => t.id === taskId)

    if (!task || task.completed) {
        return state
    }

    // Mark task as completed and start cooldown — no rewards, no item removal
    task.completed = true
    task.lastResetTime = Date.now() / 1000

    return state
}

import StoryContent from '@data/story'
import { State } from '@engine/types'
import { combineInventoryWithDiscovery, canAffordInventoryCost } from '@modules/inventory/helpers'
import { ensureStoryState } from './helpers'
import { BASE_UNLOCKED_TABS } from './config'
import { StoryRequirement } from './types'

const isItemReq = (req: StoryRequirement): req is { type: 'item'; id: string; amount: number } => req.type === 'item'

export type TurnInTaskPayload = {
    taskId: string
}

export type SetLockOverridePayload = {
    enabled: boolean
}

export const turnInTask = (state: State, payload: TurnInTaskPayload): State => {
    const { taskId } = payload
    const story = ensureStoryState(state)
    const task = StoryContent.getById(taskId)
    if (!task) return state

    if (story.completedTasks.includes(task.id)) return state

    const taskIndex = StoryContent.get.findIndex((t) => t.id === task.id)
    const previousTasksComplete = StoryContent.get.slice(0, taskIndex).every((t) => story.completedTasks.includes(t.id))
    if (!previousTasksComplete) return state

    const requirements = task.requirements || []
    const itemRequirements = requirements.filter(isItemReq)
    if (
        itemRequirements.length &&
        !canAffordInventoryCost(
            state.inventory,
            itemRequirements.map((req) => ({ id: req.id, amount: req.amount }))
        )
    )
        return state

    if (itemRequirements.length) {
        itemRequirements.forEach((req) => {
            const inventoryItem = state.inventory.find((item) => item.id === req.id)
            if (inventoryItem) {
                inventoryItem.amount -= req.amount
            }
        })
        state.inventory = state.inventory.filter((item) => item.amount > 0)
    }

    story.completedTasks.push(task.id)

    if (task.reward?.items?.length) {
        combineInventoryWithDiscovery(state, task.reward.items)
    }

    if (task.reward?.unlockTabs?.length) {
        task.reward.unlockTabs.forEach((tabId) => {
            if (!story.unlockedTabs.includes(tabId)) {
                story.unlockedTabs.push(tabId)
            }
        })
    }

    return state
}

export const setLockOverride = (state: State, payload: SetLockOverridePayload): State => {
    const story = ensureStoryState(state)
    story.lockOverride = payload.enabled
    return state
}

export const resetStory = (state: State): State => {
    const story = ensureStoryState(state)
    story.completedTasks = []
    story.unlockedTabs = [...BASE_UNLOCKED_TABS]
    story.lockOverride = false
    return state
}

export type SkipTutorialPayload = undefined

export const skipTutorial = (state: State, payload: SkipTutorialPayload): State => {
    const story = ensureStoryState(state)
    const tasks = StoryContent.get

    tasks.forEach((task) => {
        const alreadyCompleted = story.completedTasks.includes(task.id)

        if (!alreadyCompleted) {
            story.completedTasks.push(task.id)

            if (task.reward?.items?.length) {
                combineInventoryWithDiscovery(state, task.reward.items)
            }

            if (task.reward?.unlockTabs?.length) {
                task.reward.unlockTabs.forEach((tabId) => {
                    if (!story.unlockedTabs.includes(tabId)) {
                        story.unlockedTabs.push(tabId)
                    }
                })
            }
        }
    })

    return state
}

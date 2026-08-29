import StoryContent from '@data/story'
import { State } from '@engine/types'
import { canAffordInventoryCost } from '@modules/inventory/helpers'
import { BASE_UNLOCKED_TABS } from './config'
import { StoryTask, StoryState } from './types'

export const ensureStoryState = (state: State): StoryState => {
    if (!state.story) {
        state.story = {
            completedTasks: [],
            unlockedTabs: [...BASE_UNLOCKED_TABS],
            lockOverride: false,
        }
        return state.story
    }

    if (!state.story.completedTasks) state.story.completedTasks = []
    if (!state.story.unlockedTabs) state.story.unlockedTabs = []
    if (typeof state.story.lockOverride !== 'boolean') state.story.lockOverride = false
    BASE_UNLOCKED_TABS.forEach((tab) => {
        if (!state.story!.unlockedTabs.includes(tab)) {
            state.story!.unlockedTabs.push(tab)
        }
    })

    // Unlock Sanctuary and Awaken Tree on first awaken-points earned
    const awakenPoints = state.inventory?.find((item) => item.id === 'awaken-points')?.amount ?? 0
    if (awakenPoints > 0) {
        for (const tab of ['Sanctuary', 'Fabrication']) {
            if (!state.story!.unlockedTabs.includes(tab)) {
                state.story!.unlockedTabs.push(tab)
            }
        }
    }

    // Unlock Sanctuary and Awaken Tree on first awaken-points earned
    const items = state.inventory.length
    if (items > 0) {
        for (const tab of ['Inventory']) {
            if (!state.story!.unlockedTabs.includes(tab)) {
                state.story!.unlockedTabs.push(tab)
            }
        }
    }

    // Unlock Creatures and Expeditions on first creature summoned
    if ((state.creatures?.length ?? 0) > 0) {
        for (const tab of ['Creatures', 'Helpers']) {
            if (!state.story!.unlockedTabs.includes(tab)) {
                state.story!.unlockedTabs.push(tab)
            }
        }
    }

    // Unlock Garden on first flower bought (in inventory or planted)
    const flowerIds = ['fire-flower', 'wind-flower', 'earth-flower', 'water-flower', 'gold-flower']
    const hasFlowerInInventory = state.inventory?.some((item) => flowerIds.includes(item.id) && item.amount > 0)
    const hasFlowerInGarden = (state.garden?.flowers?.length ?? 0) > 0
    if (hasFlowerInInventory || hasFlowerInGarden) {
        if (!state.story!.unlockedTabs.includes('Garden')) {
            state.story!.unlockedTabs.push('Garden')
        }
    }

    return state.story
}

export const isTaskCompleted = (state: State, taskId: string): boolean => {
    const story = ensureStoryState(state)
    return story.completedTasks.includes(taskId)
}

export const canTurnInTask = (state: State, task: StoryTask): boolean => {
    const story = ensureStoryState(state)
    if (isTaskCompleted(state, task.id)) return false

    const taskIndex = StoryContent.get.findIndex((t) => t.id === task.id)
    if (taskIndex === -1) return false

    // Check if all previous tasks are completed
    const previousTasksComplete = StoryContent.get.slice(0, taskIndex).every((t) => story.completedTasks.includes(t.id))
    if (!previousTasksComplete) return false

    const requirements = task.requirements?.length ? task.requirements : []
    if (!requirements.length) return true

    return requirements.every((req) => {
        if (req.type === 'item') return canAffordInventoryCost(state.inventory, [{ id: req.id, amount: req.amount }])
        if (req.type === 'creatureSummoned') return state.creatures?.some((c) => c.species === req.species) ?? false
        if (req.type === 'creatureHelper') return state.helpers?.some((h) => h.creatureId === req.species) ?? false
        if (req.type === 'assignedExpedition') return (state.activeExpeditions?.length ?? 0) > 0
        return false
    })
}

export const isTabUnlocked = (state: State, tabId: string): boolean => {
    const story = ensureStoryState(state)
    if (story.lockOverride) return true
    return story.unlockedTabs.includes(tabId)
}

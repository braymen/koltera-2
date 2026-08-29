import { ItemInstance } from '@modules/inventory/types'

export type StoryTaskReward = {
    items?: ItemInstance[]
    unlockTabs?: string[]
}

export type StoryRequirement =
    | { type: 'item'; id: string; amount: number }
    | { type: 'creatureSummoned'; species: string }
    | { type: 'creatureHelper'; species: string }
    | { type: 'assignedExpedition' }

export type StoryTask = {
    id: string
    title: string
    description: string
    requirements: StoryRequirement[]
    reward?: StoryTaskReward
}

export type StoryChapter = {
    id: string
    title: string
    description: string
    tasks: StoryTask[]
}

export type StoryState = {
    completedTasks: string[]
    unlockedTabs: string[]
    lockOverride: boolean
}

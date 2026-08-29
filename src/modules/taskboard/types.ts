import { ItemID } from '@data/items'

export interface Task {
    id: string // Unique task ID
    itemId: ItemID // Item required to turn in
    amount: number // Amount of item required
    goldReward: number // Gold reward for completing
    completed: boolean // Whether task has been completed
    lastResetTime: number // Timestamp when this task was last reset/created
}

export interface TaskBoardState {
    tasks: Task[]
    lastResetTime: number | null // Timestamp of last hourly reset (top of hour)
}

export type CompleteTaskPayload = {
    taskId: string
}

export type SkipTaskPayload = {
    taskId: string
}

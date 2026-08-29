import { State, Update } from '@engine/types'
import { shouldResetTasks, resetTasks, generateTasks, shouldResetIndividualTask, resetIndividualTask } from './functions'
import { Task } from './types'

let lastTaskboardCheck = 0
const TASKBOARD_CHECK_INTERVAL = 5 // seconds — resets are daily/weekly, no need to check every frame

export const onUpdate = (state: State, payload: Update): State => {
    const nowSeconds = Date.now() / 1000

    // If no tasks exist, generate tasks immediately (initial load or edge case) — skip throttle
    if (state.taskBoard.tasks.length === 0) {
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
            return state
        }
    }

    // Only run reset checks every 5 seconds — daily/weekly resets don't need per-frame precision
    if (nowSeconds - lastTaskboardCheck < TASKBOARD_CHECK_INTERVAL) {
        return state
    }
    lastTaskboardCheck = nowSeconds

    // Check if it's time for weekly reset (Tuesday night at 8 PM)
    if (shouldResetTasks(state.taskBoard.lastResetTime)) {
        return resetTasks(state)
    }

    // Check individual task cooldowns (16 hours)
    state.taskBoard.tasks.forEach((task, index) => {
        // Ensure task has lastResetTime (migration should have added it, but safety check)
        if (!task.lastResetTime) {
            task.lastResetTime = nowSeconds
        }
        if (shouldResetIndividualTask(task as Task)) {
            state = resetIndividualTask(state, index)
        }
    })

    return state
}

export const onFixedUpdate = (state: State, payload: any): State => {
    return state
}

import { State } from '@engine/types'

/**
 * Returns the timestamp (ms) of the most recent Tuesday 8 PM (20:00) local time.
 * This aligns with the task board weekly reset.
 */
export function getMostRecentWeeklyReset(): number {
    const now = new Date()
    const isTuesday = now.getDay() === 2
    const isAfter8PM = now.getHours() >= 20

    let resetDate = new Date(now)
    if (isTuesday && isAfter8PM) {
        resetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0, 0)
    } else {
        const currentDay = now.getDay()
        let daysToSubtract = 0
        if (currentDay > 2) {
            daysToSubtract = currentDay - 2
        } else if (currentDay < 2) {
            daysToSubtract = currentDay + 5
        } else {
            // Tuesday before 8 PM — use last week's Tuesday
            daysToSubtract = 7
        }
        resetDate.setDate(now.getDate() - daysToSubtract)
        resetDate.setHours(20, 0, 0, 0)
    }
    return resetDate.getTime()
}

/**
 * Gets how many of a specific item have been purchased this week.
 * Returns 0 if the stored reset timestamp is from a previous week.
 */
export function getWeeklyPurchaseCount(state: State, itemId: string): number {
    const currentReset = getMostRecentWeeklyReset()
    if (state.merchantWeeklyPurchases.resetTimestamp < currentReset) {
        return 0
    }
    return state.merchantWeeklyPurchases.purchases[itemId] ?? 0
}

/**
 * Gets the number of milliseconds until the next Tuesday 8 PM (20:00) local time.
 */
export function getMsUntilWeeklyReset(): number {
    const now = new Date()
    const currentDay = now.getDay()
    const currentHour = now.getHours()

    let nextTuesday = new Date(now)
    if (currentDay === 2 && currentHour < 20) {
        nextTuesday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0, 0)
    } else {
        const daysUntilTuesday =
            currentDay <= 2 ? 2 - currentDay + (currentDay === 2 && currentHour >= 20 ? 7 : 0) : 7 - currentDay + 2
        nextTuesday.setDate(now.getDate() + daysUntilTuesday)
        nextTuesday.setHours(20, 0, 0, 0)
    }
    return nextTuesday.getTime() - now.getTime()
}

/**
 * Formats milliseconds into a countdown string matching the task board format.
 * Shows: "Xd Yh Zm" if days > 0, "Xh Ym ZZs" if hours > 0, otherwise "M:SS"
 */
export function formatCountdown(ms: number): string {
    if (ms <= 0) return '0:00'
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds.toString().padStart(2, '0')}s`
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
}

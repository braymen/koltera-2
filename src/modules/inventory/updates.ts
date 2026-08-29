import { FixedUpdate, State, Update } from '@engine/types'
import { getMostRecentWeeklyReset } from './merchant-helpers'

export const onUpdate = (state: State, { deltaTime }: Update) => {
    // Reset merchant weekly purchases when a new weekly period has started
    const currentReset = getMostRecentWeeklyReset()
    if (state.merchantWeeklyPurchases.resetTimestamp !== 0 && state.merchantWeeklyPurchases.resetTimestamp < currentReset) {
        state.merchantWeeklyPurchases = { resetTimestamp: 0, purchases: {} }
    }

    return state
}

export const onFixedUpdate = (state: State, { deltaTime }: FixedUpdate) => {
    return state
}

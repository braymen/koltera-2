import { FixedUpdate, State, Update } from '@engine/types'
import { getExpeditionRewards, generatePartyScore } from './helpers'
import { collectExpeditionRewards, repeatExpedition } from './functions'

export const onUpdate = (state: State, { deltaTime }: Update) => {
    const currentTime = Date.now() / 1000
    const expeditionsToAutoCollect: string[] = []

    // Check active expeditions for completion
    if (state.activeExpeditions && state.activeExpeditions.length > 0) {
        for (const expedition of state.activeExpeditions) {
            // Skip if already completed
            if (expedition.completed) {
                continue
            }

            // Check if expedition duration has elapsed
            const elapsed = currentTime - expedition.startTime

            if (elapsed >= expedition.duration) {
                // Expeditions always succeed
                const success = true

                // Generate rewards (XP is granted at collection, not here)
                const rewards = getExpeditionRewards(expedition.instance, expedition.creatures.length, expedition.loopCount || 1)

                // Mark expedition as completed
                expedition.completed = true
                expedition.success = success
                expedition.rewards = rewards

                // Track expedition statistics
                if (state.statistics?.expeditions) {
                    state.statistics.expeditions.total++
                    if (success) {
                        state.statistics.expeditions.successful++
                    } else {
                        state.statistics.expeditions.failed++
                    }

                    // Calculate and track highest party score
                    try {
                        const creatures = state.creatures.filter((c) => expedition.creatures.includes(c.id))
                        if (creatures.length > 0) {
                            const partyScore = generatePartyScore(creatures, expedition.instance)
                            if (partyScore > state.statistics.expeditions.highestPartyScore) {
                                state.statistics.expeditions.highestPartyScore = partyScore
                            }
                        }
                    } catch (error) {
                        // Skip if calculation fails
                    }
                }

                // If expedition is set to repeat, automatically repeat it
                if (expedition.repeatExpedition) {
                    state = repeatExpedition(state, {
                        expeditionInstanceId: expedition.instance.id,
                    })
                    continue // Skip auto-collection since repeat handles it
                }

                // Collect expedition ID for auto-collection if setting is enabled
                if (state.settings?.autoCollectExpeditions !== false) {
                    expeditionsToAutoCollect.push(expedition.instance.id)
                }
            }
        }
    }

    // Auto-collect expeditions after the loop to avoid modifying array during iteration
    for (const expeditionInstanceId of expeditionsToAutoCollect) {
        state = collectExpeditionRewards(state, {
            expeditionInstanceId,
        })
    }

    return state
}

export const onFixedUpdate = (state: State, { deltaTime }: FixedUpdate) => {
    return state
}

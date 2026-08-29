import { FixedUpdate, State, Update } from '@engine/types'
import { getCreatureMaxXp } from '@modules/creatures/helpers'

export const onUpdate = (state: State, { deltaTime }: Update) => {
    return state
}

export const onFixedUpdate = (state: State, { deltaTime }: FixedUpdate) => {
    if (!state.sanctuary || state.sanctuary.length === 0) return state

    // Grant XP to sanctuary creatures (0.5 XP per second)
    for (const speciesId of state.sanctuary) {
        const creature = state.creatures.find((c) => c.species === speciesId)
        if (creature) {
            const maxXp = getCreatureMaxXp(creature)
            creature.experience = Math.min(creature.experience + 0.5, maxXp)
        }
    }

    return state
}

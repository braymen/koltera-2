import { FixedUpdate, State, Update } from '@engine/types'
import { changeInventory } from '@modules/inventory/functions'
import * as UpgradeHelpers from '@modules/upgrades/helpers'
import CreatureConfig from '@configs/creatures'

// Track seconds elapsed for gold generation (1 gold per minute per awakened creature)
let goldGenerationCounter = 0

export const onUpdate = (state: State, { deltaTime }: Update) => {
    return state
}

export const onFixedUpdate = (state: State, { deltaTime }: FixedUpdate) => {
    // Generate gold from awakened creatures (1 gold per minute per awakened creature + upgrades)
    const awakenedCreatures = state.creatures.filter((creature) => creature.awakened)
    const awakenGoldBonus = UpgradeHelpers.getAwakenGoldBonus(state.purchasedUpgrades)
    const goldPerMinute = awakenedCreatures.length * (CreatureConfig.GOLD_GENERATION.GOLD_PER_MINUTE_PER_AWAKENED + awakenGoldBonus)

    if (goldPerMinute > 0) {
        // Increment counter (fixedUpdate runs every 1 second)
        goldGenerationCounter++

        if (goldGenerationCounter >= CreatureConfig.GOLD_GENERATION.GENERATION_INTERVAL_SECONDS) {
            goldGenerationCounter = 0
            state = changeInventory(state, {
                resources: [{ id: 'gold', amount: Math.floor(goldPerMinute) }],
            })
        }
    }

    return state
}

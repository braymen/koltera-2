const SKILLING_HELPERS = {
    // Fraction of the activity's XP rate that helper creatures earn per cycle.
    // e.g. 0.1 = helpers earn 10% of the player's XP rate
    HELPER_XP_RATE: 0,

    // At job level 1 a helper is this many times slower than the base activity duration.
    // At job level 10 a helper matches the base duration exactly.
    // Formula: duration = activityDuration * slowestMultiplier ^ ((10 - jobLevel) / 9)
    HELPER_SLOWEST_MULTIPLIER: 10,
}

const SKILLING_DURATION = {
    // Minimum duration multiplier after all reductions are applied (prevents activities from
    // becoming instant). Applies to both the player and helpers.
    MIN_DURATION_MULTIPLIER: 0.01,
}

const SkillingConfig = {
    HELPERS: SKILLING_HELPERS,
    DURATION: SKILLING_DURATION,
}

export default SkillingConfig

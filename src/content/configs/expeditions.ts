// How many expedition slots exist per tier, and limits on expedition composition
const EXPEDITION_LIMITS = {
    EXPEDITIONS_PER_TIER: 3,
    MAX_TRAITS_PER_EXPEDITION: 3,
    MAX_TYPE_MODIFIERS_PER_EXPEDITION: 3,
    MAX_CREATURES_PER_EXPEDITION: 3,
    MAX_ITEMS_PER_EXPEDITION: 3,
    // Max percentage a single type modifier can affect creature score (as a fraction, e.g. 1 = 100%)
    MAX_TYPE_MODIFIER_PERCENT: 1,
}

// Base duration (in seconds) for each tier before any modifiers are applied
const EXPEDITION_BASE_DURATIONS: Record<number, number> = {
    1: 60 * 5, // 5 minutes
    2: 60 * 5, // 10 minutes
    3: 60 * 5, // 15 minutes
    4: 60 * 5, // 20 minutes
    5: 60 * 5, // 25 minutes
}

// Difficulty rating range that can be rolled for each tier
const EXPEDITION_DIFFICULTY_RANGES: Record<number, { min: number; max: number }> = {
    1: { min: 0, max: 50 },
    2: { min: 200, max: 500 },
    3: { min: 800, max: 1200 },
    4: { min: 1500, max: 2000 },
    5: { min: 2500, max: 3000 },
}

// Per-tier scaling modifiers applied on top of base values
const EXPEDITION_TIER_MODIFIERS: Record<
    number,
    {
        xpModifier: number // Multiplier applied to creature XP earned
        durationModifier: number // Multiplier applied to base duration
        difficultyModifier: number // Multiplier applied to the difficulty rating
        lootScale: number // Scales the quantity of loot rewarded
    }
> = {
    1: { xpModifier: 1.0, durationModifier: 1, difficultyModifier: 1, lootScale: 1 },
    2: { xpModifier: 1.2, durationModifier: 1, difficultyModifier: 1.5, lootScale: 2 },
    3: { xpModifier: 1.4, durationModifier: 1, difficultyModifier: 2, lootScale: 3 },
    4: { xpModifier: 1.6, durationModifier: 1, difficultyModifier: 2.5, lootScale: 4 },
    5: { xpModifier: 1.8, durationModifier: 1, difficultyModifier: 3, lootScale: 5 },
}

const EXPEDITION_DIFFICULTY_OFFSET = 1000

// How many completions of a tier are required to unlock the next tier
const EXPEDITION_UNLOCK_REQUIREMENTS: Record<number, number> = {
    1: 0, // Tier 1 unlocked by default
    2: 5, // Complete tier 1 five times
    3: 10, // Complete tier 2 ten times
    4: 15, // Complete tier 3 fifteen times
    5: 20, // Complete tier 4 twenty times
}

const EXPEDITION_TRAIT = {
    BONUS_MULTIPLIER: 1.5, // Score multiplier for creatures whose trait matches the expedition trait
}

const EXPEDITION_DURATION_BOUNDS = {
    MIN_SECONDS: 300, // 5 minutes minimum
    MAX_SECONDS: 300 * 12, // 30 minutes  maximum
}

const EXPEDITION_BIOME = {
    ADVANTAGE_MULTIPLIER: 1.5, // Score multiplier for creature types that match the biome
    DISADVANTAGE_MULTIPLIER: 0.5, // Score multiplier for creature types that are at a disadvantage
    // Minimum duration multiplier — expeditions can never complete faster than this fraction of base
    MIN_DURATION_MULTIPLIER: 0.8,
}

const EXPEDITION_LOOP_XP_BONUS = {
    RATE: 0.01, // 1% bonus per threshold
    LOOPS_PER_BONUS: 10, // Every 10 loops grants another 1%
    MAX_BONUS: 0.2, // Caps at 20%
}

const ExpeditionConfig = {
    LIMITS: EXPEDITION_LIMITS,
    BASE_DURATIONS: EXPEDITION_BASE_DURATIONS,
    DIFFICULTY_RANGES: EXPEDITION_DIFFICULTY_RANGES,
    TIER_MODIFIERS: EXPEDITION_TIER_MODIFIERS,
    UNLOCK_REQUIREMENTS: EXPEDITION_UNLOCK_REQUIREMENTS,
    TRAIT: EXPEDITION_TRAIT,
    BIOME: EXPEDITION_BIOME,
    DIFFICULTY_OFFSET: EXPEDITION_DIFFICULTY_OFFSET,
    DURATION_BOUNDS: EXPEDITION_DURATION_BOUNDS,
    LOOP_XP_BONUS: EXPEDITION_LOOP_XP_BONUS,
}

export default ExpeditionConfig

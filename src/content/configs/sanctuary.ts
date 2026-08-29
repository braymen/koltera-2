const SANCTUARY_CAPACITY = {
    MAX_SLOTS: 8, // Maximum number of creatures that can occupy the sanctuary
}

const SANCTUARY_JOB_SCORING = {
    // The total job score is divided by this value to produce a 0–1 percentage.
    // Raise this to make tiers harder to reach; lower it to make them easier.
    SCORE_DIVISOR: 60,
    // Percentage thresholds (0–1) that separate each tier. Five thresholds = five tiers.
    TIER_THRESHOLDS: [0.1, 0.3, 0.5, 0.7, 0.9],
}

// Cumulative bonuses gained at each sanctuary job tier.
// Each entry represents the *additional* bonus unlocked at that tier level.
// Index 0 = Tier 1, Index 1 = Tier 2, etc.
const SANCTUARY_JOB_TIER_BENEFITS = [
    { xpBonus: 40, durationReduction: 0, yieldBonus: 0 }, // Tier 1: +20% skill XP
    { xpBonus: 0, durationReduction: 10, yieldBonus: 0 }, // Tier 2: -10% activity duration
    { xpBonus: 80, durationReduction: 0, yieldBonus: 0 }, // Tier 3: +20% skill XP (total 40%)
    { xpBonus: 0, durationReduction: 10, yieldBonus: 0 }, // Tier 4: -10% activity duration (total 20%)
    { xpBonus: 0, durationReduction: 0, yieldBonus: 1 }, // Tier 5: +1 yield per gather
]

const SanctuaryConfig = {
    CAPACITY: SANCTUARY_CAPACITY,
    JOB_SCORING: SANCTUARY_JOB_SCORING,
    JOB_TIER_BENEFITS: SANCTUARY_JOB_TIER_BENEFITS,
}

export default SanctuaryConfig

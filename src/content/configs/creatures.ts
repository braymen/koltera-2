const CREATURE_LEVELING = {
    XP_FORMULA_COEFFICIENT: 50, // XP = coefficient * level^2
    MAX_LEVEL: 70, // Level cap for unawakened creatures
    MAX_LEVEL_AWAKENED: 120, // Level cap for awakened creatures
    AWAKEN_LEVEL_REQUIREMENT: 70, // Minimum level required to awaken a creature
}

const CREATURE_GOLD_GENERATION = {
    GOLD_PER_MINUTE_PER_AWAKENED: 1, // Base gold generated per minute per awakened creature
    GENERATION_INTERVAL_SECONDS: 60, // How often gold is generated (in seconds)
}

const BALANCES = {
    ESSENCE_BASE: {
        RAW_ESSENCE: 128,
        PURE_ESSENCE: 64,
        STONES: 32,
        INFINITY_STONES: 16,
    },
    PURE_ESSENCE_MULTI: 2,
}

export const getResourceAmount = (tier: number, index: number) => {
    return [100, 1000, 5000, 10000, 20000, 30000][tier]
}

export const getExpeditionAmount = (tier: number, index: number) => {
    return [0, 25, 50, 200, 600, 800][tier]
}

export const getRefinedAmount = (tier: number, index: number) => {
    return [0, 0, 600, 1000, 1300, 1500][tier]
}

export const getDungeonRuneAmount = (tier: number, index: number) => {
    return [0, 0, 0, 0, 600, 1800][tier]
}

export const getCharms = (tier: number, index: number) => {
    return [5, 25, 100, 200, 400, 800][tier]
}

export const getRawEssence = () => {
    return BALANCES.ESSENCE_BASE.RAW_ESSENCE
}

export const getPureEssence = () => {
    return BALANCES.ESSENCE_BASE.PURE_ESSENCE
}

export const getStones = () => {
    return BALANCES.ESSENCE_BASE.STONES
}

export const getInfinityStones = () => {
    return BALANCES.ESSENCE_BASE.INFINITY_STONES
}

const CreatureConfig = {
    LEVELING: CREATURE_LEVELING,
    GOLD_GENERATION: CREATURE_GOLD_GENERATION,
    BALANCES: BALANCES,
}

export default CreatureConfig

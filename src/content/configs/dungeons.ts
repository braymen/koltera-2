import { DungeonFocus, DungeonGrade, DungeonReward, GatheringSubFocus } from '@modules/dungeons/types'
import { ExpeditionStatWeights } from '@modules/expeditions/types'

const DUNGEON_DURATION = 900 // 15 minutes in seconds

const DUNGEON_MAX_CREATURES = 3

const DUNGEON_ARMOR_ITEM_ID = 'armor-set'

const DUNGEON_STAT_WEIGHTS: Record<DungeonFocus, ExpeditionStatWeights> = {
    combat: {
        power: 0.25,
        grit: 0.25,
        agility: 0.25,
        smarts: 0.25,
        looting: 0,
        luck: 0,
    },
    gathering: {
        power: 0,
        grit: 0,
        agility: 0,
        smarts: 0.33,
        looting: 0.33,
        luck: 0.33,
    },
}

const DUNGEON_TIER_CONFIG: Record<
    number,
    {
        baseRating: number
        xpReward: number
    }
> = {
    1: { baseRating: 2000, xpReward: 450 }, // 1 xp/sec × 900s
    2: { baseRating: 4000, xpReward: 450 * 2 }, // 2 xp/sec × 900s
    3: { baseRating: 6000, xpReward: 450 * 3 }, // 3 xp/sec × 900s
    4: { baseRating: 8000, xpReward: 450 * 4 }, // 4 xp/sec × 900s
    5: { baseRating: 10000, xpReward: 450 * 5 }, // 5 xp/sec × 900s
}

// Grade thresholds as ratio of partyScore / baseRating (checked top-down, first match wins)
const DUNGEON_GRADE_THRESHOLDS: { grade: DungeonGrade; minRatio: number; multiplier: number }[] = [
    { grade: 'S', minRatio: 2.0, multiplier: 2.0 },
    { grade: 'A', minRatio: 1.0, multiplier: 1.5 },
    { grade: 'B', minRatio: 0.6, multiplier: 1.0 },
    { grade: 'C', minRatio: 0.3, multiplier: 0.5 },
    { grade: 'F', minRatio: 0, multiplier: 0.25 },
]

const DUNGEON_COMBAT_REWARDS: Record<number, DungeonReward[]> = {
    1: [
        { itemId: 'dungeon-rune', amount: 2 },
        { itemId: 'hide', amount: 5 },
        { itemId: 'meat', amount: 10 },
        { itemId: 'egg', amount: 5 },
    ],
    2: [
        { itemId: 'dungeon-rune', amount: 4 },
        { itemId: 'hide', amount: 10 },
        { itemId: 'meat', amount: 20 },
        { itemId: 'egg', amount: 4 },
    ],
    3: [
        { itemId: 'dungeon-rune', amount: 6 },
        { itemId: 'hide', amount: 20 },
        { itemId: 'meat', amount: 30 },
        { itemId: 'egg', amount: 6 },
    ],
    4: [
        { itemId: 'dungeon-rune', amount: 8 },
        { itemId: 'hide', amount: 40 },
        { itemId: 'meat', amount: 40 },
        { itemId: 'egg', amount: 10 },
    ],
    5: [
        { itemId: 'dungeon-rune', amount: 12 },
        { itemId: 'hide', amount: 60 },
        { itemId: 'meat', amount: 50 },
        { itemId: 'egg', amount: 15 },
    ],
}

const DUNGEON_GATHERING_REWARDS: Record<GatheringSubFocus, Record<number, DungeonReward[]>> = {
    Chopping: {
        1: [
            { itemId: 'twig', amount: 100 },
            { itemId: 'pine-log', amount: 95 },
            { itemId: 'birch-log', amount: 90 },
        ],
        2: [
            { itemId: 'oak-log', amount: 85 },
            { itemId: 'maple-log', amount: 80 },
            { itemId: 'cedar-log', amount: 75 },
        ],
        3: [
            { itemId: 'ash-log', amount: 70 },
            { itemId: 'spruce-log', amount: 65 },
        ],
        4: [
            { itemId: 'willow-log', amount: 60 },
            { itemId: 'runic-log', amount: 55 },
        ],
        5: [
            { itemId: 'elder-log', amount: 50 },
            { itemId: 'arcanum-log', amount: 45 },
        ],
    },
    Mining: {
        1: [
            { itemId: 'stone', amount: 70 },
            { itemId: 'copper-ore', amount: 65 },
            { itemId: 'tin-ore', amount: 60 },
        ],
        2: [
            { itemId: 'coal', amount: 55 },
            { itemId: 'iron-ore', amount: 50 },
            { itemId: 'silver-ore', amount: 45 },
        ],
        3: [
            { itemId: 'gold-ore', amount: 40 },
            { itemId: 'platinum-ore', amount: 35 },
        ],
        4: [
            { itemId: 'adamantite-ore', amount: 30 },
            { itemId: 'runic-ore', amount: 25 },
        ],
        5: [
            { itemId: 'solarite-ore', amount: 20 },
            { itemId: 'arcanum-ore', amount: 15 },
        ],
    },
    Digging: {
        1: [
            { itemId: 'stone', amount: 100 },
            { itemId: 'clay', amount: 95 },
            { itemId: 'sand', amount: 90 },
        ],
        2: [
            { itemId: 'mud', amount: 85 },
            { itemId: 'ice', amount: 80 },
            { itemId: 'obsidian', amount: 75 },
        ],
        3: [
            { itemId: 'gravel', amount: 70 },
            { itemId: 'fossil', amount: 65 },
        ],
        4: [
            { itemId: 'dungeon-dust', amount: 60 },
            { itemId: 'runestone', amount: 55 },
        ],
        5: [
            { itemId: 'volcanic-rock', amount: 50 },
            { itemId: 'key-fragment', amount: 45 },
        ],
    },
    Farming: {
        1: [
            { itemId: 'grass', amount: 100 },
            { itemId: 'wheat', amount: 95 },
            { itemId: 'carrot', amount: 90 },
        ],
        2: [
            { itemId: 'tomato', amount: 85 },
            { itemId: 'lettuce', amount: 80 },
            { itemId: 'potato', amount: 75 },
        ],
        3: [
            { itemId: 'corn', amount: 70 },
            { itemId: 'eggplant', amount: 65 },
        ],
        4: [
            { itemId: 'onion', amount: 60 },
            { itemId: 'pepper', amount: 55 },
        ],
        5: [
            { itemId: 'pineapple', amount: 50 },
            { itemId: 'mango', amount: 45 },
        ],
    },
    Fishing: {
        1: [
            { itemId: 'minnow', amount: 100 },
            { itemId: 'trout', amount: 95 },
            { itemId: 'bass', amount: 90 },
        ],
        2: [
            { itemId: 'walleye', amount: 85 },
            { itemId: 'salmon', amount: 80 },
            { itemId: 'snail', amount: 75 },
        ],
        3: [
            { itemId: 'carp', amount: 70 },
            { itemId: 'magical-carp', amount: 65 },
        ],
        4: [
            { itemId: 'crab', amount: 60 },
            { itemId: 'redfish', amount: 55 },
        ],
        5: [
            { itemId: 'rainbow-fish', amount: 50 },
            { itemId: 'emberfish', amount: 45 },
        ],
    },
    Exploring: {
        1: [
            { itemId: 'berry', amount: 100 },
            { itemId: 'butterfly', amount: 95 },
            { itemId: 'shell', amount: 90 },
        ],
        2: [
            { itemId: 'horn', amount: 85 },
            { itemId: 'reed', amount: 80 },
            { itemId: 'lichen', amount: 75 },
        ],
        3: [
            { itemId: 'mushroom', amount: 70 },
            { itemId: 'memory-orb', amount: 65 },
        ],
        4: [
            { itemId: 'vine', amount: 60 },
            { itemId: 'geode', amount: 55 },
        ],
        5: [
            { itemId: 'snow', amount: 50 },
            { itemId: 'legacy-fragment', amount: 45 },
        ],
    },
}

const DungeonConfig = {
    DURATION: DUNGEON_DURATION,
    MAX_CREATURES: DUNGEON_MAX_CREATURES,
    ARMOR_ITEM_ID: DUNGEON_ARMOR_ITEM_ID,
    TIER_CONFIG: DUNGEON_TIER_CONFIG,
    GRADE_THRESHOLDS: DUNGEON_GRADE_THRESHOLDS,
    COMBAT_REWARDS: DUNGEON_COMBAT_REWARDS,
    GATHERING_REWARDS: DUNGEON_GATHERING_REWARDS,
    STAT_WEIGHTS: DUNGEON_STAT_WEIGHTS,
}

export default DungeonConfig

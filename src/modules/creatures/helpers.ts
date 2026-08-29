import CreaturesContent from '@data/creatures'
import { Creature } from './types'
import CreatureConfig from '@configs/creatures'

/**
 * Creature-specific experience formula
 * Uses a faster polynomial formula: XP = 50 * level^2
 * This makes creatures level up much faster than skills
 * 
 * Examples:
 * - Level 2: 200 XP (vs ~83 for skills)
 * - Level 10: 5,000 XP (vs ~1,154 for skills)
 * - Level 50: 125,000 XP (vs ~1,111,945 for skills)
 * - Level 99: 490,050 XP (vs ~14,800,499,89 for skills)
 */
export const getCreatureXpForLevel = (level: number): number => {
    // Level 1 is 0 XP
    if (level <= 1) return 0
    // Use polynomial formula: coefficient * level^2
    return Math.floor(CreatureConfig.LEVELING.XP_FORMULA_COEFFICIENT * level * level)
}

/**
 * Get creature level from experience points
 * Uses inverse of the XP formula: level = sqrt(XP / 50)
 * Finds the highest level where XP >= getCreatureXpForLevel(level)
 */
const getCreatureLevelFromXp = (xp: number): number => {
    // Level 1 is 0 XP
    if (xp < 0) return 1
    if (xp === 0) return 1
    
    // Calculate level using inverse formula
    // XP = coefficient * level^2, so level = sqrt(XP / coefficient)
    // We find the highest level where XP >= getCreatureXpForLevel(level)
    const calculatedLevel = Math.sqrt(xp / CreatureConfig.LEVELING.XP_FORMULA_COEFFICIENT)
    let level = Math.floor(calculatedLevel) + 1
    
    // Verify the level is correct by checking XP requirements
    // If XP is less than required for this level, reduce by 1
    while (level > 1 && xp < getCreatureXpForLevel(level)) {
        level--
    }
    
    return level
}

// Generate a new creature given a species and required information
export const createCreature = (species: string, level: number) => {
    // Validate the species
    const creatureContent = CreaturesContent.getById(species)
    if (!creatureContent) {
        throw new Error('Invalid species')
    }

    // Get Creature Experience for the given level
    // Level 1 should start at 0 XP
    const creatureExperience = level === 1 ? 0 : getCreatureXpForLevel(level)

    const creature: Creature = {
        id: crypto.randomUUID(),
        species: species,
        experience: creatureExperience,
    }

    return creature
}

/**
 * Get creature level based on XP and awakened status
 * Unawakened creatures cap at level 99, awakened creatures cap at level 120
 */
export const getCreatureLevel = (creature: Creature): number => {
    const xp = creature.experience
    const maxLevel = creature.awakened ? CreatureConfig.LEVELING.MAX_LEVEL_AWAKENED : CreatureConfig.LEVELING.MAX_LEVEL

    // Level 1 is 0 XP
    if (xp < 0) return 1

    // Get base level from creature XP formula
    let level = getCreatureLevelFromXp(xp)

    // Apply creature-specific cap
    return Math.min(level, maxLevel)
}

/**
 * Get max XP for a creature based on awakened status
 */
export const getCreatureMaxXp = (creature: Creature): number => {
    const maxLevel = creature.awakened ? CreatureConfig.LEVELING.MAX_LEVEL_AWAKENED : CreatureConfig.LEVELING.MAX_LEVEL
    return getCreatureXpForLevel(maxLevel)
}

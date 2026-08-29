import ExpeditionConfig from '@configs/expeditions'
import { ExpeditionInstance, ExpeditionTypeContent, ExpeditionStatWeights, ExpeditionState, ExpeditionRewards, ExpeditionReward } from './types'
import { Creature, CreatureContent } from '@modules/creatures/types'
import CreaturesContent from '@data/creatures'
import ExpeditionsContent from '@data/expeditions'
import BiomesContent from '@data/biomes'
import { ItemInstance } from '@modules/inventory/types'
import { getCreatureLevel } from '@modules/creatures/helpers'

export const generateExpedition = (tier: number, expeditionTypeId?: string) => {
    // Use provided expeditionTypeId or generate a random one
    const typeId = expeditionTypeId || getRandomExpeditionTypeId()
    const expeditionTypeContent = ExpeditionsContent.getById(typeId)
    const biomeId = expeditionTypeContent.biome

    const expedition: ExpeditionInstance = {
        id: crypto.randomUUID(),
        expeditionTypeId: typeId,
        tier: tier,
        difficultyRating: generateDifficultyRating(expeditionTypeContent.baseRating, tier),
        biomeId: biomeId,
    }
    return expedition
}

export const generateDifficultyRating = (baseRating: number, tier: number) => {
    const tierModifier = ExpeditionConfig.TIER_MODIFIERS[tier as keyof typeof ExpeditionConfig.TIER_MODIFIERS]

    if (!tierModifier) {
        throw new Error(`Invalid expedition tier: ${tier}`)
    }

    const difficultyRating = Math.floor(baseRating * tierModifier.difficultyModifier)
    return difficultyRating
}

export const generatePartyScore = (creatures: Creature[], expedition: ExpeditionInstance) => {
    let partyScore = 0
    const expeditionTypeContent = ExpeditionsContent.getById(expedition.expeditionTypeId)
    const biome = BiomesContent.getById(expedition.biomeId)
    const statWeights = expeditionTypeContent.statWeights
    const expeditionTrait = expeditionTypeContent.trait
    for (const creature of creatures) {
        const creatureContent = CreaturesContent.getById(creature.species)
        const creatureLevel = getCreatureLevel(creature)
        const statScore = calculateStatScore(creatureContent, creatureLevel, statWeights)
        const adjustedScoreByBiome = adjustStatScoreByBiome(statScore, creatureContent, biome)
        const adjustedScoreByTrait = adjustStatScoreByTrait(adjustedScoreByBiome, creatureContent, expeditionTrait)
        partyScore += Math.floor(adjustedScoreByTrait)
    }
    return partyScore
}

export const calculateStatScore = (
    creatureContent: CreatureContent,
    creatureLevel: number,
    statWeights: ExpeditionStatWeights
) => {
    let statScore = 0
    const stats = creatureContent.stats
    for (const statName in statWeights) {
        if (Object.prototype.hasOwnProperty.call(statWeights, statName)) {
            // Map expedition stat names to creature stat names
            let creatureStatName = statName
            if (statName === 'looting') {
                creatureStatName = 'gathering'
            } else if (statName === 'grit') {
                creatureStatName = 'toughness'
            } else if (statName === 'smarts') {
                creatureStatName = 'intelligence'
            }
            if (Object.prototype.hasOwnProperty.call(stats, creatureStatName)) {
                statScore += (stats[creatureStatName] ?? 0) * (statWeights[statName] ?? 0) * creatureLevel
            }
        }
    }
    return Math.floor(statScore)
}

export const adjustStatScoreByBiome = (
    statScore: number,
    creatureContent: CreatureContent,
    biome: { advantage?: string[]; disadvantage?: string[] } | null
) => {
    if (!biome) {
        return Math.floor(statScore)
    }

    let adjustedScore = statScore
    const creatureTypes = creatureContent.types
    const advantageMultiplier = ExpeditionConfig.BIOME.ADVANTAGE_MULTIPLIER
    const disadvantageMultiplier = ExpeditionConfig.BIOME.DISADVANTAGE_MULTIPLIER

    for (const type of creatureTypes) {
        // Check if this type has advantage
        if (biome.advantage && biome.advantage.includes(type)) {
            adjustedScore = adjustedScore * advantageMultiplier
        }
        // Check if this type has disadvantage
        if (biome.disadvantage && biome.disadvantage.includes(type)) {
            adjustedScore = adjustedScore * disadvantageMultiplier
        }
    }

    return adjustedScore
}

export const adjustStatScoreByTrait = (statScore: number, creatureContent: CreatureContent, expeditionTrait: string) => {
    if (!expeditionTrait || !creatureContent.trait) {
        return statScore
    }

    if (creatureContent.trait === expeditionTrait) {
        return statScore * ExpeditionConfig.TRAIT.BONUS_MULTIPLIER
    }

    return statScore
}

export const calculateExpeditionDuration = (
    expeditionTypeContent: ExpeditionTypeContent,
    expeditionInstance: ExpeditionInstance,
    partyScore: number
): number => {
    const minSeconds = ExpeditionConfig.DURATION_BOUNDS.MIN_SECONDS
    const maxSeconds = ExpeditionConfig.DURATION_BOUNDS.MAX_SECONDS
    const difficultyRating = expeditionInstance.difficultyRating
    // Ratio of party score to difficulty rating, capped at 1
    const ratio = difficultyRating > 0 ? Math.min(partyScore / difficultyRating, 1) : 0
    // Linear interpolation: 100% score = min duration (5 min), 0% score = max duration (2 hr)
    const duration = maxSeconds - ratio * (maxSeconds - minSeconds)
    return Math.floor(Math.max(minSeconds, Math.min(duration, maxSeconds)))
}

export const getRandomExpeditionTypeId = () => {
    return ExpeditionsContent.get[Math.floor(Math.random() * ExpeditionsContent.get.length)].id
}

export const getTimeUntilNextRotation = (): number => {
    // No automatic rotation resets - return 0 to indicate no timer
    return 0
}

export const getExpeditionsInProgress = (activeExpeditions: ExpeditionState): string[] => {
    if (!activeExpeditions || activeExpeditions.length === 0) {
        return []
    }

    return activeExpeditions.map((expedition) => expedition.instance.id)
}

export const getLoopXpBonus = (loopCount: number): number => {
    const { RATE, LOOPS_PER_BONUS, MAX_BONUS } = ExpeditionConfig.LOOP_XP_BONUS
    return Math.min(Math.floor(loopCount / LOOPS_PER_BONUS) * RATE, MAX_BONUS)
}

export const getExpeditionRewards = (expedition: ExpeditionInstance, partySize: number = 1, loopCount: number = 0): ExpeditionRewards => {
    const expeditionTypeContent = ExpeditionsContent.getById(expedition.expeditionTypeId)

    // Get lootScale multiplier for the current tier
    const tierModifier = ExpeditionConfig.TIER_MODIFIERS[expedition.tier as keyof typeof ExpeditionConfig.TIER_MODIFIERS]
    const lootScale = tierModifier?.lootScale || 1

    // Multiply all rewards by lootScale
    const allRewards: ExpeditionReward[] = expeditionTypeContent.rewards.map((reward) => ({
        itemId: reward.itemId,
        amount: reward.amount * lootScale,
    }))

    // Combine duplicates - always give all rewards
    const rewardMap = new Map<string, number>()

    for (const reward of allRewards) {
        const currentAmount = rewardMap.get(reward.itemId) || 0
        rewardMap.set(reward.itemId, currentAmount + reward.amount)
    }

    // Convert map to ItemInstance array
    const rewardItems: ItemInstance[] = Array.from(rewardMap.entries()).map(([id, amount]) => ({
        id,
        amount,
    }))

    return {
        items: rewardItems,
        creatureExperience: getCreatureExperienceReward(expedition, partySize, loopCount),
    }
}

export const getCreatureExperienceReward = (expedition: ExpeditionInstance, partySize: number = 1, loopCount: number = 0) => {
    const expeditionTypeContent = ExpeditionsContent.getById(expedition.expeditionTypeId)
    const baseXP = expeditionTypeContent.baseXP
    const tierKey = expedition.tier as keyof typeof ExpeditionConfig.TIER_MODIFIERS
    const tierModifier = ExpeditionConfig.TIER_MODIFIERS[tierKey]
    const xpModifier = tierModifier.xpModifier
    const loopBonus = 1 + getLoopXpBonus(loopCount)

    // Fixed XP at completion, split evenly among party members, with loop bonus
    return Math.floor((baseXP * xpModifier * loopBonus) / Math.max(1, partySize))
}

export const getExpeditionExperienceReward = (expedition: ExpeditionInstance, partySize: number = 1) => {
    const creatureExperience = getCreatureExperienceReward(expedition, partySize)
    // Expedition XP is 1/5th of creature XP for balance
    const expeditionExperience = Math.floor(creatureExperience / 5)
    return expeditionExperience
}

export const getCreatureIdsOnExpeditions = (activeExpeditions: ExpeditionState): string[] => {
    if (!activeExpeditions || activeExpeditions.length === 0) {
        return []
    }

    const creatureIds: string[] = []
    for (const expedition of activeExpeditions) {
        creatureIds.push(...expedition.creatures)
    }
    return creatureIds
}

export const getExpeditionDurationLeft = (expedition: ExpeditionState[0], currentTime: number): number => {
    if (expedition.completed) {
        return 0
    }

    const elapsed = currentTime - expedition.startTime
    const remaining = expedition.duration - elapsed
    return Math.max(0, remaining)
}

function generateCombinations<T>(arr: T[], size: number): T[][] {
    if (size === 0) return [[]]
    if (size > arr.length) return []
    if (size === arr.length) return [arr]

    const combinations: T[][] = []

    function backtrack(start: number, current: T[]) {
        if (current.length === size) {
            combinations.push([...current])
            return
        }

        for (let i = start; i < arr.length; i++) {
            current.push(arr[i])
            backtrack(i + 1, current)
            current.pop()
        }
    }

    backtrack(0, [])
    return combinations
}

export const getBestExpeditionTeam = (
    creatures: Creature[],
    expeditionInstance: ExpeditionInstance,
    activeExpeditions: ExpeditionState,
    helpers: { creatureId: string }[],
    sanctuary: string[]
): string[] => {
    const maxPartySize = 3
    // Get creatures that are on expeditions (by instance ID)
    const creaturesOnExpeditions = getCreatureIdsOnExpeditions(activeExpeditions)
    const creaturesOnExpeditionsSet = new Set(creaturesOnExpeditions)

    // Get helper species IDs
    const helperSpeciesIds = new Set(helpers.map((helper) => helper.creatureId))

    // Get sanctuary species IDs
    const sanctuarySpeciesIds = new Set(sanctuary)

    // Filter available creatures - exclude:
    // 1. Creatures already on expeditions (by instance ID)
    // 2. Creatures that are helpers (by species ID)
    // 3. Creatures in sanctuary (by species ID)
    const availableCreatures = creatures.filter((creature) => {
        const isOnExpedition = creaturesOnExpeditionsSet.has(creature.id)
        const isHelper = helperSpeciesIds.has(creature.species)
        const isInSanctuary = sanctuarySpeciesIds.has(creature.species)
        return !isOnExpedition && !isHelper && !isInSanctuary
    })

    if (availableCreatures.length === 0) {
        return []
    }

    // Limit the number of candidates to avoid combinatorial explosion
    // Calculate individual scores for each creature to prioritize candidates
    const biome = BiomesContent.getById(expeditionInstance.biomeId)
    const creatureScores = availableCreatures.map((creature) => {
        const creatureContent = CreaturesContent.getById(creature.species)
        const creatureLevel = getCreatureLevel(creature)
        const expeditionTypeContent = ExpeditionsContent.getById(expeditionInstance.expeditionTypeId)
        const statWeights = expeditionTypeContent.statWeights
        const statScore = calculateStatScore(creatureContent, creatureLevel, statWeights)
        const adjustedScoreByBiome = adjustStatScoreByBiome(statScore, creatureContent, biome)
        const adjustedScore = adjustStatScoreByTrait(adjustedScoreByBiome, creatureContent, expeditionTypeContent.trait)
        return { creature, score: Math.floor(adjustedScore) }
    })

    // Sort by individual score and take top candidates (at least maxPartySize * 2 to ensure good combinations)
    const candidateCount = Math.min(availableCreatures.length, Math.max(maxPartySize * 2, 10))
    const topCandidates = creatureScores
        .sort((a, b) => b.score - a.score)
        .slice(0, candidateCount)
        .map((item) => item.creature)

    let bestTeam: Creature[] = []
    let bestScore = -1

    // Try all possible team sizes from 1 to maxPartySize
    for (let teamSize = 1; teamSize <= Math.min(maxPartySize, topCandidates.length); teamSize++) {
        const combinations = generateCombinations(topCandidates, teamSize)

        for (const combination of combinations) {
            const score = generatePartyScore(combination, expeditionInstance)
            if (score > bestScore) {
                bestScore = score
                bestTeam = combination
            }
        }
    }

    // If we found a team but it's smaller than maxPartySize, try filling remaining slots
    // Since we already tried all combinations, if a smaller team is best, we should verify
    // if adding more creatures helps (trait bonuses can make larger teams better)
    if (bestTeam.length > 0 && bestTeam.length < maxPartySize && topCandidates.length > bestTeam.length) {
        const usedIds = new Set(bestTeam.map((c) => c.id))
        const remaining = topCandidates.filter((c) => !usedIds.has(c.id))
        const slotsToFill = maxPartySize - bestTeam.length

        // Try filling with best remaining creatures
        // Sort remaining by their individual scores
        const remainingScores = remaining.map((creature) => {
            const scoreEntry = creatureScores.find((cs) => cs.creature.id === creature.id)
            return { creature, score: scoreEntry?.score || 0 }
        })
        remainingScores.sort((a, b) => b.score - a.score)

        // Try adding creatures one by one, keeping only if it improves score
        let currentTeam = [...bestTeam]
        let currentScore = bestScore
        for (let i = 0; i < Math.min(slotsToFill, remainingScores.length); i++) {
            const testTeam = [...currentTeam, remainingScores[i].creature]
            const testScore = generatePartyScore(testTeam, expeditionInstance)
            // Always add if it improves, or if we haven't filled all slots yet
            if (testScore >= currentScore || currentTeam.length < maxPartySize) {
                currentTeam = testTeam
                currentScore = testScore
            }
        }
        bestTeam = currentTeam
        bestScore = currentScore
    }

    return bestTeam.map((creature) => creature.id)
}

// Helper to convert state completion format to Map format
export const convertCompletionsToMap = (
    expeditionCompletions?: Record<string, Record<number, number>>
): Map<string, Map<number, number>> => {
    const map = new Map<string, Map<number, number>>()

    if (!expeditionCompletions) {
        return map
    }

    for (const [expeditionTypeId, tierCompletions] of Object.entries(expeditionCompletions)) {
        const tierMap = new Map<number, number>()
        for (const [tierStr, count] of Object.entries(tierCompletions)) {
            tierMap.set(Number(tierStr), count)
        }
        map.set(expeditionTypeId, tierMap)
    }

    return map
}

// Helper to check if a tier is unlocked for an expedition type
export const isTierUnlocked = (
    tier: number,
    expeditionTypeId: string,
    expeditionCompletions?: Record<string, Record<number, number>>
): boolean => {
    // Tier 1 is always unlocked
    if (tier === 1) {
        return true
    }

    // If we don't have completion tracking, default to locked
    if (!expeditionCompletions) {
        return false
    }

    const typeCompletions = expeditionCompletions[expeditionTypeId]
    if (!typeCompletions) {
        return false
    }

    // Check if we've completed enough of the previous tier
    const previousTier = tier - 1
    const requiredCompletions = ExpeditionConfig.UNLOCK_REQUIREMENTS[tier] || 0
    const actualCompletions = typeCompletions[previousTier] || 0

    return actualCompletions >= requiredCompletions
}

// Helper to get completion count for a tier
export const getTierCompletionCount = (
    tier: number,
    expeditionTypeId: string,
    expeditionCompletions?: Record<string, Record<number, number>>
): number => {
    if (!expeditionCompletions) {
        return 0
    }

    const typeCompletions = expeditionCompletions[expeditionTypeId]
    if (!typeCompletions) {
        return 0
    }

    return typeCompletions[tier] || 0
}

// Helper to get required completions to unlock a tier
export const getRequiredCompletionsForTier = (tier: number): number => {
    return ExpeditionConfig.UNLOCK_REQUIREMENTS[tier] || 0
}

// Helper to calculate total completed expeditions across all types and tiers
export const getTotalCompletedExpeditions = (expeditionCompletions?: Record<string, Record<number, number>>): number => {
    if (!expeditionCompletions) {
        return 0
    }

    let total = 0
    for (const expeditionTypeId in expeditionCompletions) {
        const tierCompletions = expeditionCompletions[expeditionTypeId]
        for (const tier in tierCompletions) {
            total += tierCompletions[Number(tier)] || 0
        }
    }

    return total
}

// Helper to check if an expedition type is unlocked
export const isExpeditionTypeUnlocked = (
    expeditionTypeId: string,
    expeditionCompletions?: Record<string, Record<number, number>>
): boolean => {
    const expeditionTypeContent = ExpeditionsContent.getById(expeditionTypeId)
    if (!expeditionTypeContent) {
        return false
    }

    const required = expeditionTypeContent.requiredExpeditionCompletions
    const totalCompleted = getTotalCompletedExpeditions(expeditionCompletions)

    return totalCompleted >= required
}

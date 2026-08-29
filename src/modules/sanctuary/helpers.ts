import { State } from '@engine/types'
import CreaturesContent from '@data/creatures'
import { SanctuaryJobTiers, SanctuaryBenefits } from './types'
import SanctuaryConfig from '@configs/sanctuary'

const gatheringJobs = ['chopping', 'mining', 'digging', 'exploring', 'fishing', 'farming'] as const

// Memoization cache for calculateJobTiers — keyed on sanctuary lineup
let _cachedSanctuary: string[] | null = null
let _cachedTiers: SanctuaryJobTiers | null = null

// Memoization cache for getJobBenefits — keyed on tier number
const _benefitsCache: Map<number, SanctuaryBenefits> = new Map()

const sanctuaryChanged = (sanctuary: string[]): boolean => {
    if (!_cachedSanctuary || _cachedSanctuary.length !== sanctuary.length) return true
    for (let i = 0; i < sanctuary.length; i++) {
        if (_cachedSanctuary[i] !== sanctuary[i]) return true
    }
    return false
}

export const calculateJobScores = (state: State): Record<string, number> => {
    const jobScores: Record<string, number> = {
        chopping: 0,
        mining: 0,
        digging: 0,
        exploring: 0,
        fishing: 0,
        farming: 0,
    }

    for (const creatureSpeciesId of state.sanctuary) {
        const creatureContent = CreaturesContent.getById(creatureSpeciesId)
        if (!creatureContent) continue

        for (const job of gatheringJobs) {
            const jobScore = creatureContent.jobs[job] || 0
            jobScores[job] += jobScore
        }
    }

    return jobScores
}

export const calculateJobTiers = (state: State): SanctuaryJobTiers => {
    // Return cached result if sanctuary lineup hasn't changed
    if (_cachedTiers && !sanctuaryChanged(state.sanctuary)) {
        return _cachedTiers
    }

    const jobScores = calculateJobScores(state)
    const tiers: SanctuaryJobTiers = {
        chopping: 0,
        mining: 0,
        digging: 0,
        exploring: 0,
        fishing: 0,
        farming: 0,
    }

    const { TIER_THRESHOLDS, SCORE_DIVISOR } = SanctuaryConfig.JOB_SCORING

    for (const job of gatheringJobs) {
        const totalScore = jobScores[job]
        const percentage = totalScore / SCORE_DIVISOR

        // Determine tier based on thresholds
        let tier = 0
        for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
            if (percentage >= TIER_THRESHOLDS[i]) {
                tier = i + 1
                break
            }
        }

        tiers[job] = Math.min(tier, TIER_THRESHOLDS.length) // Cap at max tier
    }

    _cachedSanctuary = [...state.sanctuary]
    _cachedTiers = tiers
    return tiers
}

export const getJobBenefits = (tier: number): SanctuaryBenefits => {
    // Return cached result for this tier
    const cached = _benefitsCache.get(tier)
    if (cached) return cached

    let jobXpBonus = 0
    let yieldBonus = 0
    let durationReduction = 0

    const benefits = SanctuaryConfig.JOB_TIER_BENEFITS
    for (let i = 0; i < tier && i < benefits.length; i++) {
        jobXpBonus += benefits[i].xpBonus
        durationReduction += benefits[i].durationReduction
        yieldBonus += benefits[i].yieldBonus
    }

    const result = { jobXpBonus, yieldBonus, durationReduction }
    _benefitsCache.set(tier, result)
    return result
}

export const getAllJobBenefits = (state: State): Record<string, SanctuaryBenefits> => {
    const tiers = calculateJobTiers(state)
    const benefits: Record<string, SanctuaryBenefits> = {}

    for (const job of gatheringJobs) {
        benefits[job] = getJobBenefits(tiers[job])
    }

    return benefits
}

const SanctuaryHelpers = {
    calculateJobScores,
    calculateJobTiers,
    getJobBenefits,
    getAllJobBenefits,
}

export default SanctuaryHelpers

export interface SanctuaryJobTiers {
    chopping: number
    mining: number
    digging: number
    exploring: number
    fishing: number
    farming: number
}

export interface SanctuaryBenefits {
    jobXpBonus: number // Percentage bonus (e.g., 20 = 20%)
    yieldBonus: number // Additional yield (e.g., 1 = +1 yield)
    durationReduction: number // Duration reduction percentage (e.g., 20 = -20%)
}

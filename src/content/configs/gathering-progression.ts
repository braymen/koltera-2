export interface GatheringActivityProgression {
    levelRequirement: number
    xpRate: number
    duration: number
}

export const GATHERING_SKILL_PROGRESSION: GatheringActivityProgression[] = [
    { levelRequirement: 1, xpRate: 2, duration: 8 },
    { levelRequirement: 5, xpRate: 3, duration: 9 },
    { levelRequirement: 10, xpRate: 4, duration: 10 },
    { levelRequirement: 15, xpRate: 6, duration: 11 },
    { levelRequirement: 20, xpRate: 8, duration: 12 },
    { levelRequirement: 30, xpRate: 10, duration: 13 },
    { levelRequirement: 40, xpRate: 14, duration: 14 },
    { levelRequirement: 50, xpRate: 20, duration: 16 },
    { levelRequirement: 60, xpRate: 30, duration: 20 },
    { levelRequirement: 70, xpRate: 50, duration: 25 },
    { levelRequirement: 80, xpRate: 90, duration: 35 },
    { levelRequirement: 90, xpRate: 220, duration: 45 },
]

export const getGatheringProgression = (index: number): GatheringActivityProgression => {
    if (index < 0 || index >= GATHERING_SKILL_PROGRESSION.length) {
        throw new Error(`Invalid progression index: ${index}. Must be between 0 and ${GATHERING_SKILL_PROGRESSION.length - 1}`)
    }
    return GATHERING_SKILL_PROGRESSION[index]
}

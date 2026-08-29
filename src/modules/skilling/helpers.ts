import SkillContent from '@data/skills'

const xpTable = [
    83, 174, 276, 388, 512, 650, 801, 969, 1154, 1358, 1584, 1833, 2107, 2411, 2746, 3115, 3523, 3973, 4470, 5018, 5624, 6291,
    7028, 7842, 8740, 9730, 10824, 12031, 13363, 14833, 16456, 18247, 20224, 22406, 24815, 27473, 30408, 33648, 37224, 41171,
    45529, 50339, 55649, 61512, 67983, 75127, 83014, 91721, 101333, 111945, 123660, 136594, 150872, 166636, 184040, 203254,
    224466, 247886, 273742, 302288, 333804, 368599, 407015, 449428, 496254, 547953, 605032, 668051, 737627, 814445, 899257,
    992895, 1096278, 1210421, 1336443, 1475581, 1629200, 1798808, 1986068, 2192818, 2421087, 2673114, 2951373, 3258594, 3597792,
    3972294, 4385776, 4842295, 5346332, 5902831, 6517253, 7195629, 7944614, 8771558, 9684577, 10692629, 11805606, 13034431,
    14391160, 15889109, 17542976, 19368992, 21385073, 23611006, 26068632, 28782069, 31777943, 35085654, 38737661, 42769801,
    47221641, 52136869, 57563718, 63555443, 70170840, 77474828, 85539082, 94442737, 104273167, 115126838, 127110260, 140341028,
    154948977, 171077457, 188884740, 200000000, 220000000, 242000000, 266200000, 292820000, 322102000, 354312200, 389743420,
    428717762, 471589538, 518748492, 570623341, 627685675, 690454243, 759499667, 835449634, 918994597, 1010894057, 1111983463,
    1223181809, 1345499990, 1480049989,
]

// Level 5      388
// Level 10     1154
// Level 20     4470
// Level 30     13363
// Level 50     101333
// Level 70     737627
// Level 90     5346332
// Level 99     13034431

const getLevel = (xp: number) => {
    // Level 1 is 0 XP
    if (xp < 0) return 1

    let level = 1
    // Use >= so that when XP equals a threshold, you advance to that level
    while (level <= 99 && xp >= xpTable[level - 1]) {
        level++
    }
    // Cap at max level 99
    return Math.min(level, 99)
}

const getXpForLevel = (level: number) => {
    // Level 1 is 0 XP
    if (level <= 1) return 0
    // Cap at max level 99
    if (level > 99) level = 99
    return xpTable[level - 1]
}

const getMaxXp = () => {
    // Return the XP required for level 99 (last entry in table)
    return xpTable[xpTable.length - 1]
}

const getSecondsForNextLevel = (xp: number, xpPerSecond: number) => {
    const currentLevel = getLevel(xp)
    if (currentLevel >= 99) return 0
    const nextLevelXp = xpTable[currentLevel - 1]
    const remainingXp = Math.max(0, nextLevelXp - xp)
    return remainingXp / xpPerSecond
}

const getNextLevelProgress = (xp: number) => {
    if (xp === 0) return 0
    const currentLevel = getLevel(xp)
    if (currentLevel >= 99) return 1.0
    const currentLevelXp = xpTable[currentLevel - 1]
    const previousLevelXp = currentLevel === 1 ? 0 : xpTable[currentLevel - 2]
    return (xp - previousLevelXp) / (currentLevelXp - previousLevelXp)
}

const getXpProgress = (xp: number) => {
    const currentLevel = getLevel(xp)
    if (currentLevel >= 99) {
        const maxXp = xpTable[xpTable.length - 1]
        const previousLevelXp = xpTable[xpTable.length - 2]
        return {
            current: xp - previousLevelXp,
            total: maxXp - previousLevelXp,
        }
    }
    const currentLevelXp = xpTable[currentLevel - 1]
    const previousLevelXp = currentLevel === 1 ? 0 : xpTable[currentLevel - 2]
    return {
        current: xp - previousLevelXp,
        total: currentLevelXp - previousLevelXp,
    }
}

const getPlayerLevel = (skills: Array<{ xp: number; id: string }>): number => {
    const allSkills = SkillContent.get
    const totalLevels = allSkills.reduce((sum: number, skill) => {
        const xp = skills.find((s) => s.id === skill.id)?.xp || 0
        return sum + getLevel(xp)
    }, 0)
    return Math.min(Math.floor(totalLevels / allSkills.length), 99)
}

const getPlayerLevelXpBonus = (skills: Array<{ xp: number; id: string }>): number => {
    return getPlayerLevel(skills) * 0.25 + 0.25
}

const SkillingHelpers = {
    getLevel,
    getXpForLevel,
    getMaxXp,
    getSecondsForNextLevel,
    getNextLevelProgress,
    getXpProgress,
    getPlayerLevel,
    getPlayerLevelXpBonus,
}

export default SkillingHelpers

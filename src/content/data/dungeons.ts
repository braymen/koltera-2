export interface DungeonRewardEntry {
    itemId: string
    baseAmount: number
    minPerformance?: number
}

export interface DungeonContent {
    id: string
    name: string
    description: string
    image: string
    stats: [string, string]
    targetScore: number
    typeAdvantage: string[]
    typeDisadvantage: string[]
    rewards: DungeonRewardEntry[]
}

const get: DungeonContent[] = [
    {
        id: 'volcanic-lair',
        name: 'Volcanic Lair',
        description: 'A scorching cavern deep beneath an active volcano. Only the mightiest survive.',
        image: 'items/fire-rune.png',
        stats: ['power', 'grit'],
        targetScore: 24000,
        typeAdvantage: ['Fire'],
        typeDisadvantage: ['Water'],
        rewards: [
            { itemId: 'dungeon-rune', baseAmount: 500 },
            { itemId: 'key-fragment', baseAmount: 64 },
            { itemId: 'legacy-fragment', baseAmount: 64 },
            { itemId: 'dungeon-core', baseAmount: 64 },
            { itemId: 'fire-rune', baseAmount: 64 },
        ],
    },
    {
        id: 'flooded-depths',
        name: 'Flooded Depths',
        description: 'Ancient ruins submerged beneath an underground lake. Treasure lies beneath the currents.',
        image: 'items/water-rune.png',
        stats: ['grit', 'looting'],
        targetScore: 24000,
        typeAdvantage: ['Water'],
        typeDisadvantage: ['Fire'],
        rewards: [
            { itemId: 'dungeon-rune', baseAmount: 500 },
            { itemId: 'key-fragment', baseAmount: 64 },
            { itemId: 'legacy-fragment', baseAmount: 64 },
            { itemId: 'dungeon-core', baseAmount: 64 },
            { itemId: 'water-rune', baseAmount: 64 },
        ],
    },
    {
        id: 'gale-summit',
        name: 'Gale Summit',
        description: 'A peak shrouded in perpetual storms. Those with sharp minds navigate its treacherous winds.',
        image: 'items/wind-rune.png',
        stats: ['agility', 'smarts'],
        targetScore: 24000,
        typeAdvantage: ['Wind'],
        typeDisadvantage: ['Earth'],
        rewards: [
            { itemId: 'dungeon-rune', baseAmount: 500 },
            { itemId: 'key-fragment', baseAmount: 64 },
            { itemId: 'legacy-fragment', baseAmount: 64 },
            { itemId: 'dungeon-core', baseAmount: 64 },
            { itemId: 'wind-rune', baseAmount: 64 },
        ],
    },
    {
        id: 'stone-labyrinth',
        name: 'Stone Labyrinth',
        description: 'An endless maze carved into solid rock. Speed and power are needed to escape.',
        image: 'items/earth-rune.png',
        stats: ['power', 'agility'],
        targetScore: 24000,
        typeAdvantage: ['Earth'],
        typeDisadvantage: ['Wind'],
        rewards: [
            { itemId: 'dungeon-rune', baseAmount: 500 },
            { itemId: 'key-fragment', baseAmount: 64 },
            { itemId: 'legacy-fragment', baseAmount: 64 },
            { itemId: 'dungeon-core', baseAmount: 64 },
            { itemId: 'earth-rune', baseAmount: 64 },
        ],
    },
    {
        id: 'the-vale',
        name: 'The Vale',
        description: 'A mystical hollow where ancient knowledge drifts on the breeze. Wisdom is paramount here.',
        image: 'items/wind-rune.png',
        stats: ['smarts', 'luck'],
        targetScore: 24000,
        typeAdvantage: ['Wind'],
        typeDisadvantage: ['Earth'],
        rewards: [
            { itemId: 'dungeon-rune', baseAmount: 500 },
            { itemId: 'key-fragment', baseAmount: 64 },
            { itemId: 'legacy-fragment', baseAmount: 64 },
            { itemId: 'dungeon-core', baseAmount: 64 },
            { itemId: 'wind-rune', baseAmount: 64 },
        ],
    },
    {
        id: 'deep-ocean-vault',
        name: 'Deep Ocean Vault',
        description: 'A sealed vault on the ocean floor, guarded by the crushing pressure of the deep.',
        image: 'items/water-rune.png',
        stats: ['power', 'luck'],
        targetScore: 24000,
        typeAdvantage: ['Water'],
        typeDisadvantage: ['Fire'],
        rewards: [
            { itemId: 'dungeon-rune', baseAmount: 500 },
            { itemId: 'key-fragment', baseAmount: 64 },
            { itemId: 'legacy-fragment', baseAmount: 64 },
            { itemId: 'dungeon-core', baseAmount: 64 },
            { itemId: 'water-rune', baseAmount: 64 },
        ],
    },
    {
        id: 'scorched-wasteland',
        name: 'Scorched Wasteland',
        description: 'A vast expanse of ash and embers. Only the swiftest can gather its smoldering rewards.',
        image: 'items/fire-rune.png',
        stats: ['agility', 'looting'],
        targetScore: 24000,
        typeAdvantage: ['Fire'],
        typeDisadvantage: ['Water'],
        rewards: [
            { itemId: 'dungeon-rune', baseAmount: 500 },
            { itemId: 'key-fragment', baseAmount: 64 },
            { itemId: 'legacy-fragment', baseAmount: 64 },
            { itemId: 'dungeon-core', baseAmount: 64 },
            { itemId: 'fire-rune', baseAmount: 64 },
        ],
    },
    {
        id: 'ancient-ruins',
        name: 'Ancient Ruins',
        description: 'The remnants of a forgotten civilization. Endurance and cunning unlock its buried secrets.',
        image: 'items/earth-rune.png',
        stats: ['grit', 'smarts'],
        targetScore: 24000,
        typeAdvantage: ['Earth'],
        typeDisadvantage: ['Wind'],
        rewards: [
            { itemId: 'dungeon-rune', baseAmount: 500 },
            { itemId: 'key-fragment', baseAmount: 64 },
            { itemId: 'legacy-fragment', baseAmount: 64 },
            { itemId: 'dungeon-core', baseAmount: 64 },
            { itemId: 'earth-rune', baseAmount: 64 },
        ],
    },
]

const Lookup: Record<string, DungeonContent> = {}
get.forEach((dungeon) => {
    Lookup[dungeon.id] = dungeon
})

const getById = (id: string): DungeonContent => {
    return Lookup[id]
}

const DungeonsContent = {
    get,
    getById,
}

export default DungeonsContent

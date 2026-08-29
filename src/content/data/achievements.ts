import { CollectionItem } from '@modules/collections/types'

const get: CollectionItem[] = [
    {
        id: 'collect-1-creature',
        name: 'First Friend',
        description: 'Collect your first creature.',
        image: 'achievements/complete/collect-1-creature.png',
    },
    {
        id: 'collect-10-creatures',
        name: 'Growing Collection',
        description: 'Collect 10 creatures.',
        image: 'achievements/complete/collect-10-creatures.png',
    },
    {
        id: 'collect-20-creatures',
        name: 'Creature Enthusiast',
        description: 'Collect 20 creatures.',
        image: 'achievements/complete/collect-20-creatures.png',
    },
    {
        id: 'collect-40-creatures',
        name: 'Creature Hoarder',
        description: 'Collect 40 creatures.',
        image: 'achievements/complete/collect-40-creatures.png',
    },
    {
        id: 'collect-80-creatures',
        name: 'Creature Connoisseur',
        description: 'Collect 80 creatures.',
        image: 'achievements/complete/collect-80-creatures.png',
    },
    {
        id: 'collect-120-creatures',
        name: 'Creature Master',
        description: 'Collect 120 creatures.',
        image: 'achievements/complete/collect-120-creatures.png',
    },
    {
        id: 'collect-100k-gold',
        name: 'Pocket Change',
        description: 'Collect a total of 100,000 gold.',
        image: 'achievements/complete/collect-100k-gold.png',
    },
    {
        id: 'collect-1m-gold',
        name: 'Making It Rain',
        description: 'Collect a total of 1,000,000 gold.',
        image: 'achievements/complete/collect-1m-gold.png',
    },
    {
        id: 'collect-10m-gold',
        name: 'Too Much Goop',
        description: 'Collect a total of 10,000,000 gold.',
        image: 'achievements/complete/collect-10m-gold.png',
    },
    {
        id: 'skill-99-chopping',
        name: 'Master Lumberjack',
        description: 'Reach level 99 in Chopping.',
        image: 'achievements/complete/skill-99-chopping.png',
    },
    {
        id: 'skill-99-mining',
        name: 'Master Miner',
        description: 'Reach level 99 in Mining.',
        image: 'achievements/complete/skill-99-mining.png',
    },
    {
        id: 'skill-99-exploring',
        name: 'Master Explorer',
        description: 'Reach level 99 in Exploring.',
        image: 'achievements/complete/skill-99-exploring.png',
    },
    {
        id: 'skill-99-digging',
        name: 'Master Digger',
        description: 'Reach level 99 in Digging.',
        image: 'achievements/complete/skill-99-digging.png',
    },
    {
        id: 'skill-99-fishing',
        name: 'Master Fisherman',
        description: 'Reach level 99 in Fishing.',
        image: 'achievements/complete/skill-99-fishing.png',
    },
    {
        id: 'skill-99-farming',
        name: 'Master Farmer',
        description: 'Reach level 99 in Farming.',
        image: 'achievements/complete/skill-99-farming.png',
    },
    {
        id: 'skill-99-furnace',
        name: 'Master Smelter',
        description: 'Reach level 99 in Furnace.',
        image: 'achievements/complete/skill-99-furnace.png',
    },
    {
        id: 'skill-99-workbench',
        name: 'Master Craftsman',
        description: 'Reach level 99 in Workbench.',
        image: 'achievements/complete/skill-99-workbench.png',
    },
    {
        id: 'skill-99-stove',
        name: 'Master Chef',
        description: 'Reach level 99 in Stove.',
        image: 'achievements/complete/skill-99-stove.png',
    },
]

const Lookup: Record<string, CollectionItem> = {}
get.forEach((item: CollectionItem) => {
    Lookup[item.id] = item
})

const getById = (id: string) => {
    return Lookup[id]
}

const AchievementsContent = {
    get,
    getById,
}

export default AchievementsContent

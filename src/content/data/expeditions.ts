import ExpeditionConfig from '@configs/expeditions'
import { ExpeditionTypeContent } from '@modules/expeditions/types'

/**
 * Expedition Ideas
 *
 * Biomes
 * - Forest
 * - Desert
 * - Mountain
 * - Cave
 * - Swamp
 * - Plains
 *
 * Expedition Types
 * - Forage
 * - Hunt
 * - Gather
 * - Explore
 * - Craft
 * - Build
 * - Defend
 * - Investigate
 *
 * 1. Expedition Training - Smarts - Plains - learner - Knowledge Orb
 * 2. Clear the Path - Agility/Power - Forest - gatherer - Web
 * 3. Water Delivery - Agility/Smarts - Desert - heat-resistance - Water Vial
 * 4. Scout Abandoned Mine - Looting/Luck - Mountain - scouting - Gemstone
 * 5. Water Rescue - Agility/Grit - Lake - water-breathing - Kelp
 * 6. Attack Poacher Camps - Power/Grit/Agility - Forest - regeneration - Cloth
 * 7. Rare Material Sighting - Looting/Luck - Cave - night-vision - Night Shard
 * 8. Defend Koltera Outpost - Power/Grit - Plains - hard-shell - Scrap Metal
 * 9. Sunken Shipwreck Recovery - Looting/Agility - Lake - water-breathing - Pearl
 * 10. Supply Delivery - Smarts/Agility - Forest - camouflage - Empty Can
 * 11. Discover a Dungeon - Looting/Smarts/Luck - Swamp - poison-resistance - Dungeon Core
 * 12. Recover Lost Supplies - Looting/Agility - Plains - tracking - Box of Fish
 * 13. Tracking Rare Creature - Agility/Luck/Grit - Desert - tracking - Scale
 * 14. Rescue Lost Creatures - Grit/Smarts/Luck - Mountain - cold-resistance - Ancient Tome
 * 15. Research the Swamp - Smarts/Grit - Swamp - poison-resistance - Poison Vial
 * 16. Ancient Water Ruins - Smarts/Luck/Looting - Lake - scouting - Coral
 * 17. Corrupted Creature Hunt - Power/Grit - Cave - night-vision - Night Feather
 * 18. Recover Buried Artifacts - Luck/Looting - Mountain - lucky - Artifact
 * 19. Treasure Hunt - Looting/Luck - Plains - lucky - Skull
 * 20. Battle for Koltera - Power/Grit/Agility - Plains - hard-shell - Blood Vial
 */

const get: ExpeditionTypeContent[] = [
    {
        id: 'expedition-type-1',
        name: 'Expedition Training',
        description: 'Train your creatures for expeditions.',
        image: 'items/knowledge-orb.png',
        baseRating: 1,
        baseDuration: 300,
        baseXP: 300,
        maxPartySize: 3,
        trait: 'learner',
        biome: 'plains',
        requiredExpeditionCompletions: 0,
        statWeights: {
            power: 0.25,
            grit: 0.25,
            agility: 0.25,
            smarts: 0.25,
            looting: 0,
            luck: 0,
        },
        rewards: [
            {
                itemId: 'knowledge-orb',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-2',
        name: 'Clear the Path',
        description: 'Make a new path through the forest.',
        image: 'items/web.png',
        baseRating: 50,
        baseDuration: 300,
        baseXP: 400,
        maxPartySize: 3,
        trait: 'gatherer',
        biome: 'forest',
        requiredExpeditionCompletions: 5,
        statWeights: {
            power: 0.6,
            grit: 0,
            agility: 0.4,
            smarts: 0,
            looting: 0,
            luck: 0,
        },
        rewards: [
            {
                itemId: 'web',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-3',
        name: 'Water Delivery',
        description: 'Deliver water to a village in need.',
        image: 'items/water-vials.png',
        baseRating: 100,
        baseDuration: 300,
        baseXP: 450,
        maxPartySize: 3,
        trait: 'heat-resistance',
        biome: 'desert',
        requiredExpeditionCompletions: 10,
        statWeights: {
            power: 0,
            grit: 0.4,
            agility: 0.4,
            smarts: 0.2,
            looting: 0,
            luck: 0,
        },
        rewards: [
            {
                itemId: 'water-vial',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-4',
        name: 'Harvest Abandoned Mine',
        description: 'Scout the abandoned mine for valuable resources.',
        image: 'items/gemstone.png',
        baseRating: 300,
        baseDuration: 300,
        baseXP: 500,
        maxPartySize: 3,
        trait: 'scouting',
        biome: 'mountain',
        requiredExpeditionCompletions: 20,
        statWeights: {
            power: 0,
            grit: 0,
            agility: 0,
            smarts: 0,
            looting: 0.5,
            luck: 0.5,
        },
        rewards: [
            {
                itemId: 'gemstone',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-5',
        name: 'Water Rescue',
        description: 'Rescue a lost creature from the water.',
        image: 'items/kelp.png',
        baseRating: 500,
        baseDuration: 300,
        baseXP: 550,
        maxPartySize: 3,
        trait: 'water-breathing',
        biome: 'lake',
        requiredExpeditionCompletions: 30,
        statWeights: {
            power: 0,
            grit: 0.3,
            agility: 0.7,
            smarts: 0,
            looting: 0,
            luck: 0,
        },
        rewards: [
            {
                itemId: 'kelp',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-6',
        name: 'Attack Poacher Camps',
        description: 'Attack poacher camps and reclaim the land.',
        image: 'items/cloth.png',
        baseRating: 700,
        baseDuration: 300,
        baseXP: 600,
        maxPartySize: 3,
        trait: 'regeneration',
        biome: 'forest',
        requiredExpeditionCompletions: 50,
        statWeights: {
            power: 0.5,
            grit: 0.4,
            agility: 0.1,
            smarts: 0,
            looting: 0,
            luck: 0,
        },
        rewards: [
            {
                itemId: 'cloth',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-7',
        name: 'Rare Material Sighting',
        description: 'Recover a rare material in a cave.',
        image: 'items/night-shard.png',
        baseRating: 900,
        baseDuration: 300,
        baseXP: 650,
        maxPartySize: 3,
        trait: 'night-vision',
        biome: 'cave',
        requiredExpeditionCompletions: 70,
        statWeights: {
            power: 0,
            grit: 0,
            agility: 0,
            smarts: 0,
            looting: 0.8,
            luck: 0.2,
        },
        rewards: [
            {
                itemId: 'night-shard',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-8',
        name: 'Defend Koltera Outpost',
        description: 'Defend a Koltera outpost from poachers.',
        image: 'items/scrap-metal.png',
        baseRating: 1200,
        baseDuration: 300,
        baseXP: 700,
        maxPartySize: 3,
        trait: 'hard-shell',
        biome: 'plains',
        requiredExpeditionCompletions: 100,
        statWeights: {
            power: 0.5,
            grit: 0.5,
            agility: 0,
            smarts: 0,
            looting: 0,
            luck: 0,
        },
        rewards: [
            {
                itemId: 'scrap-metal',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-9',
        name: 'Sunken Shipwreck Recovery',
        description: 'Recover resources from a sunken shipwreck.',
        image: 'items/pearl.png',
        baseRating: 1500,
        baseDuration: 300,
        baseXP: 750,
        maxPartySize: 3,
        trait: 'water-breathing',
        biome: 'lake',
        requiredExpeditionCompletions: 200,
        statWeights: {
            power: 0,
            grit: 0,
            agility: 0.5,
            smarts: 0,
            looting: 0.5,
            luck: 0,
        },
        rewards: [
            {
                itemId: 'pearl',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-10',
        name: 'Supply Delivery',
        description: 'Deliver supplies to a village in need.',
        image: 'items/empty-can.png',
        baseRating: 1800,
        baseDuration: 300,
        baseXP: 800,
        maxPartySize: 3,
        trait: 'camouflage',
        biome: 'forest',
        requiredExpeditionCompletions: 300,
        statWeights: {
            power: 0,
            grit: 0,
            agility: 0.7,
            smarts: 0.3,
            looting: 0,
            luck: 0,
        },
        rewards: [
            {
                itemId: 'empty-can',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-11',
        name: 'Discover a Dungeon',
        description: 'Discover a dungeon and retrieve the core.',
        image: 'items/dungeon-core.png',
        baseRating: 2300,
        baseDuration: 300,
        baseXP: 850,
        maxPartySize: 3,
        trait: 'poison-resistance',
        biome: 'swamp',
        requiredExpeditionCompletions: 400,
        statWeights: {
            power: 0,
            grit: 0,
            agility: 0,
            smarts: 0.4,
            looting: 0.4,
            luck: 0.2,
        },
        rewards: [
            {
                itemId: 'dungeon-core',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-12',
        name: 'Recover Lost Supplies',
        description: 'Recover lost supplies from a village in need.',
        image: 'items/box-of-fish.png',
        baseRating: 2500,
        baseDuration: 300,
        baseXP: 900,
        maxPartySize: 3,
        trait: 'tracking',
        biome: 'desert',
        requiredExpeditionCompletions: 500,
        statWeights: {
            power: 0,
            grit: 0,
            agility: 0.6,
            smarts: 0,
            looting: 0.4,
            luck: 0,
        },
        rewards: [
            {
                itemId: 'box-of-fish',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-13',
        name: 'Tracking Rare Creature',
        description: 'Track down a rare creature in the desert.',
        image: 'items/scale.png',
        baseRating: 2900,
        baseDuration: 300,
        baseXP: 950,
        maxPartySize: 3,
        trait: 'tracking',
        biome: 'desert',
        requiredExpeditionCompletions: 700,
        statWeights: {
            power: 0,
            grit: 0.5,
            agility: 0.4,
            smarts: 0,
            looting: 0,
            luck: 0.1,
        },
        rewards: [
            {
                itemId: 'scale',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-14',
        name: 'Rescue Lost Creatures',
        description: 'Rescue lost creatures from a mountain.',
        image: 'items/ancient-tome.png',
        baseRating: 3300,
        baseDuration: 300,
        baseXP: 1000,
        maxPartySize: 3,
        trait: 'cold-resistance',
        biome: 'mountain',
        requiredExpeditionCompletions: 300,
        statWeights: {
            power: 0,
            grit: 0.7,
            agility: 0,
            smarts: 0.2,
            looting: 0,
            luck: 0.1,
        },
        rewards: [
            {
                itemId: 'ancient-tome',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-15',
        name: 'Research the Swamp',
        description: 'Research the swamp and retrieve the poison vial.',
        image: 'items/poison-vial.png',
        baseRating: 3800,
        baseDuration: 300,
        baseXP: 1050,
        maxPartySize: 3,
        trait: 'poison-resistance',
        biome: 'swamp',
        requiredExpeditionCompletions: 1100,
        statWeights: {
            power: 0,
            grit: 0.5,
            agility: 0,
            smarts: 0.5,
            looting: 0,
            luck: 0,
        },
        rewards: [
            {
                itemId: 'poison-vial',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-16',
        name: 'Ancient Water Ruins',
        description: 'Discover ancient water ruins and retrieve coral.',
        image: 'items/coral.png',
        baseRating: 4200,
        baseDuration: 300,
        baseXP: 1100,
        maxPartySize: 3,
        trait: 'scouting',
        biome: 'lake',
        requiredExpeditionCompletions: 1300,
        statWeights: {
            power: 0,
            grit: 0,
            agility: 0,
            smarts: 0.3,
            looting: 0.1,
            luck: 0.6,
        },
        rewards: [
            {
                itemId: 'coral',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-17',
        name: 'Corrupted Creature Hunt',
        description: 'Hunt down a corrupted creature in the cave.',
        image: 'items/night-feather.png',
        baseRating: 4600,
        baseDuration: 1500,
        baseXP: 1150,
        maxPartySize: 3,
        trait: 'night-vision',
        biome: 'cave',
        requiredExpeditionCompletions: 1500,
        statWeights: {
            power: 0.3,
            grit: 0.7,
            agility: 0,
            smarts: 0,
            looting: 0,
            luck: 0,
        },
        rewards: [
            {
                itemId: 'night-feather',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-18',
        name: 'Recover Buried Artifacts',
        description: 'Recover buried artifacts from a mountain.',
        image: 'items/artifact.png',
        baseRating: 5000,
        baseDuration: 300,
        baseXP: 1200,
        maxPartySize: 3,
        trait: 'lucky',
        biome: 'mountain',
        requiredExpeditionCompletions: 2000,
        statWeights: {
            power: 0,
            grit: 0,
            agility: 0,
            smarts: 0,
            looting: 0.3,
            luck: 0.7,
        },
        rewards: [
            {
                itemId: 'artifact',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-19',
        name: 'Treasure Hunt',
        description: 'Find treasure in the plains.',
        image: 'items/skull.png',
        baseRating: 5500,
        baseDuration: 300,
        baseXP: 1250,
        maxPartySize: 3,
        trait: 'lucky',
        biome: 'plains',
        requiredExpeditionCompletions: 2500,
        statWeights: {
            power: 0,
            grit: 0,
            agility: 0,
            smarts: 0,
            looting: 0.7,
            luck: 0.3,
        },
        rewards: [
            {
                itemId: 'skull',
                amount: 1,
            },
        ],
    },
    {
        id: 'expedition-type-20',
        name: 'Battle for Koltera',
        description: 'Protect Koltera from invaders.',
        image: 'items/blood-vial.png',
        baseRating: 6000,
        baseDuration: 2000,
        baseXP: 1300,
        maxPartySize: 3,
        trait: 'hard-shell',
        biome: 'plains',
        requiredExpeditionCompletions: 3000,
        statWeights: {
            power: 0.7,
            grit: 0.2,
            agility: 0.1,
            smarts: 0,
            looting: 0,
            luck: 0,
        },
        rewards: [
            {
                itemId: 'blood-vial',
                amount: 1,
            },
        ],
    },
] satisfies ExpeditionTypeContent[]

const Lookup: Record<string, ExpeditionTypeContent> = {}
get.forEach((type) => {
    Lookup[type.id] = type
})

const getById = (id: string) => Lookup[id]

const ExpeditionsContent = {
    get,
    getById,
}

export default ExpeditionsContent

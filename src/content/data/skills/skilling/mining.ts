import { Skill, LootTable } from '@modules/skilling/types'
import { getGatheringProgression, GATHERING_SKILL_PROGRESSION } from '../../../configs/gathering-progression'

const BASE_DURATION = GATHERING_SKILL_PROGRESSION[0].duration

const universalDrops = (progressionIndex: number): LootTable[] => {
    const duration = GATHERING_SKILL_PROGRESSION[progressionIndex].duration
    return [
        {
            id: 'dirt',
            chance: 0.2 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
        {
            id: 'relic',
            chance: 0.1 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
        {
            id: 'crate',
            chance: 0.01 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
    ]
}

export const MiningSkill: Skill = {
    id: 'Mining',
    description: '',
    image: 'items/placeholder.png',
    maxLevel: 0,
    baseXpRate: 0,
    type: 'skilling',
    activities: [
        {
            id: 'stone',
            name: 'Stone',
            description: '',
            image: 'items/stone.png',
            ...getGatheringProgression(0),
            output: [
                {
                    id: 'stone',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(0),
            ],
        },
        {
            id: 'copper-ore',
            name: 'Copper Ore',
            description: '',
            image: 'items/copper-ore.png',
            ...getGatheringProgression(1),
            output: [
                {
                    id: 'copper-ore',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(1),
            ],
        },
        {
            id: 'tin-ore',
            name: 'Tin Ore',
            description: '',
            image: 'items/tin-ore.png',
            ...getGatheringProgression(2),
            output: [
                {
                    id: 'tin-ore',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(2),
            ],
        },
        {
            id: 'coal',
            name: 'Coal',
            description: '',
            image: 'items/coal.png',
            ...getGatheringProgression(3),
            output: [
                {
                    id: 'coal',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(3),
            ],
        },
        {
            id: 'iron-ore',
            name: 'Iron Ore',
            description: '',
            image: 'items/iron-ore.png',
            ...getGatheringProgression(4),
            output: [
                {
                    id: 'iron-ore',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(4),
            ],
        },
        {
            id: 'silver-ore',
            name: 'Silver Ore',
            description: '',
            image: 'items/silver-ore.png',
            ...getGatheringProgression(5),
            output: [
                {
                    id: 'silver-ore',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(5),
            ],
        },
        {
            id: 'gold-ore',
            name: 'Gold Ore',
            description: '',
            image: 'items/gold-ore.png',
            ...getGatheringProgression(6),
            output: [
                {
                    id: 'gold-ore',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(6),
            ],
        },
        {
            id: 'platinum-ore',
            name: 'Platinum Ore',
            description: '',
            image: 'items/platinum-ore.png',
            ...getGatheringProgression(7),
            output: [
                {
                    id: 'platinum-ore',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(7),
            ],
        },
        {
            id: 'adamantite-ore',
            name: 'Adamantite Ore',
            description: '',
            image: 'items/adamantite-ore.png',
            ...getGatheringProgression(8),
            output: [
                {
                    id: 'adamantite-ore',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(8),
            ],
        },
        {
            id: 'runic-ore',
            name: 'Runic Ore',
            description: '',
            image: 'items/runic-ore.png',
            ...getGatheringProgression(9),
            output: [
                {
                    id: 'runic-ore',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(9),
            ],
        },
        {
            id: 'solarite-ore',
            name: 'Solarite Ore',
            description: '',
            image: 'items/solarite-ore.png',
            ...getGatheringProgression(10),
            output: [
                {
                    id: 'solarite-ore',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(10),
            ],
        },
        {
            id: 'arcanum-ore',
            name: 'Arcanum Ore',
            description: '',
            image: 'items/arcanum-ore.png',
            ...getGatheringProgression(11),
            output: [
                {
                    id: 'arcanum-ore',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(11),
            ],
        },
    ],
}

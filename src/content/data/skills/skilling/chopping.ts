import { Skill, LootTable } from '@modules/skilling/types'
import { getGatheringProgression, GATHERING_SKILL_PROGRESSION } from '../../../configs/gathering-progression'

const BASE_DURATION = GATHERING_SKILL_PROGRESSION[0].duration

const universalDrops = (progressionIndex: number): LootTable[] => {
    const duration = GATHERING_SKILL_PROGRESSION[progressionIndex].duration
    return [
        {
            id: 'leaf',
            chance: 0.2 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
        {
            id: 'feather',
            chance: 0.1 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
        {
            id: 'pouch',
            chance: 0.01 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
    ]
}

export const ChoppingSkill: Skill = {
    id: 'Chopping',
    description: '',
    image: 'items/placeholder.png',
    maxLevel: 0,
    baseXpRate: 0,
    type: 'skilling',
    activities: [
        {
            id: 'sapling',
            name: 'Sapling',
            description: '',
            image: 'gathering-skills/chopping/sappling.png',
            ...getGatheringProgression(0),
            output: [
                {
                    id: 'twig',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(0),
            ],
        },
        {
            id: 'pine-tree',
            name: 'Pine Tree',
            description: '',
            image: 'gathering-skills/chopping/pine-tree.png',
            ...getGatheringProgression(1),
            output: [
                {
                    id: 'pine-log',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(1),
            ],
        },
        {
            id: 'birch-tree',
            name: 'Birch Tree',
            description: '',
            image: 'gathering-skills/chopping/birch-tree.png',
            ...getGatheringProgression(2),
            output: [
                {
                    id: 'birch-log',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(2),
            ],
        },
        {
            id: 'oak-tree',
            name: 'Oak Tree',
            description: '',
            image: 'gathering-skills/chopping/oak-tree.png',
            ...getGatheringProgression(3),
            output: [
                {
                    id: 'oak-log',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(3),
            ],
        },
        {
            id: 'maple-tree',
            name: 'Maple Tree',
            description: '',
            image: 'gathering-skills/chopping/maple-tree.png',
            ...getGatheringProgression(4),
            output: [
                {
                    id: 'maple-log',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(4),
            ],
        },
        {
            id: 'cedar-tree',
            name: 'Cedar Tree',
            description: '',
            image: 'gathering-skills/chopping/cedar-tree.png',
            ...getGatheringProgression(5),
            output: [
                {
                    id: 'cedar-log',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(5),
            ],
        },
        {
            id: 'ash-tree',
            name: 'Ash Tree',
            description: '',
            image: 'gathering-skills/chopping/ash-tree.png',
            ...getGatheringProgression(6),
            output: [
                {
                    id: 'ash-log',
                    chance: 1,
                    min: 1,
                    max: 1,
                },

                ...universalDrops(6),
            ],
        },
        {
            id: 'spruce-tree',
            name: 'Spruce Tree',
            description: '',
            image: 'gathering-skills/chopping/spruce-tree.png',
            ...getGatheringProgression(7),
            output: [
                {
                    id: 'spruce-log',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(7),
            ],
        },
        {
            id: 'willow-tree',
            name: 'Willow Tree',
            description: '',
            image: 'gathering-skills/chopping/willow-tree.png',
            ...getGatheringProgression(8),
            output: [
                {
                    id: 'willow-log',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(8),
            ],
        },
        {
            id: 'runic-tree',
            name: 'Runic Tree',
            description: '',
            image: 'gathering-skills/chopping/runic-tree.png',
            ...getGatheringProgression(9),
            output: [
                {
                    id: 'runic-log',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(9),
            ],
        },
        {
            id: 'elder-tree',
            name: 'Elder Tree',
            description: '',
            image: 'gathering-skills/chopping/elder-tree.png',
            ...getGatheringProgression(10),
            output: [
                {
                    id: 'elder-log',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(10),
            ],
        },
        {
            id: 'arcanum-tree',
            name: 'Arcanum Tree',
            description: '',
            image: 'gathering-skills/chopping/arcanum-tree.png',
            ...getGatheringProgression(11),
            output: [
                {
                    id: 'arcanum-log',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(11),
            ],
        },
    ],
}

import { Skill, LootTable } from '@modules/skilling/types'
import { getGatheringProgression, GATHERING_SKILL_PROGRESSION } from '../../../configs/gathering-progression'

const BASE_DURATION = GATHERING_SKILL_PROGRESSION[0].duration

const universalDrops = (progressionIndex: number): LootTable[] => {
    const duration = GATHERING_SKILL_PROGRESSION[progressionIndex].duration
    return [
        {
            id: 'meat',
            chance: 0.2 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
        {
            id: 'hide',
            chance: 0.1 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
        {
            id: 'backpack',
            chance: 0.01 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
    ]
}

export const ExploringSkill: Skill = {
    id: 'Exploring',
    description: 'Venture into various areas to discover herbs, flowers, foliage, and other natural resources.',
    image: 'items/placeholder.png',
    maxLevel: 0,
    baseXpRate: 0,
    type: 'skilling',
    activities: [
        {
            id: 'forest',
            name: 'Forest',
            description: '',
            image: 'items/berry.png',
            ...getGatheringProgression(0),
            output: [
                {
                    id: 'berry',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(0),
            ],
        },
        {
            id: 'meadow',
            name: 'Meadow',
            description: '',
            image: 'items/butterfly.png',
            ...getGatheringProgression(1),
            output: [
                {
                    id: 'butterfly',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(1),
            ],
        },
        {
            id: 'riverbank',
            name: 'Riverbank',
            description: '',
            image: 'items/shells.png',
            ...getGatheringProgression(2),
            output: [
                {
                    id: 'shell',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(2),
            ],
        },
        {
            id: 'hillside',
            name: 'Hillside',
            description: '',
            image: 'items/horn.png',
            ...getGatheringProgression(3),
            output: [
                {
                    id: 'horn',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(3),
            ],
        },
        {
            id: 'wetland',
            name: 'Wetland',
            description: '',
            image: 'items/reed.png',
            ...getGatheringProgression(4),
            output: [
                {
                    id: 'reed',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(4),
            ],
        },
        {
            id: 'mountain',
            name: 'Mountain',
            description: '',
            image: 'items/lichen.png',
            ...getGatheringProgression(5),
            output: [
                {
                    id: 'lichen',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(5),
            ],
        },
        {
            id: 'deep-forest',
            name: 'Deep Forest',
            description: '',
            image: 'items/mushroom.png',
            ...getGatheringProgression(6),
            output: [
                {
                    id: 'mushroom',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(6),
            ],
        },
        {
            id: 'graveyard',
            name: 'Graveyard',
            description: '',
            image: 'items/memory-orb.png',
            ...getGatheringProgression(7),
            output: [
                {
                    id: 'memory-orb',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(7),
            ],
        },

        {
            id: 'swamp',
            name: 'Swamp',
            description: '',
            image: 'items/vine.png',
            ...getGatheringProgression(8),
            output: [
                {
                    id: 'vine',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(8),
            ],
        },
        {
            id: 'caverns',
            name: 'Caverns',
            description: '',
            image: 'items/geode.png',
            ...getGatheringProgression(9),
            output: [
                {
                    id: 'geode',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(9),
            ],
        },
        {
            id: 'tundra',
            name: 'Tundra',
            description: '',
            image: 'items/snow.png',
            ...getGatheringProgression(10),
            output: [
                {
                    id: 'snow',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(10),
            ],
        },
        {
            id: 'ancient-site',
            name: 'Ancient Site',
            description: '',
            image: 'items/legacy-fragment.png',
            ...getGatheringProgression(11),
            output: [
                {
                    id: 'legacy-fragment',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(11),
            ],
        },
    ],
}

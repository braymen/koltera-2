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
            id: 'bone',
            chance: 0.1 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
        {
            id: 'burried-chest',
            chance: 0.01 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
    ]
}

export const DiggingSkill: Skill = {
    id: 'Digging',
    description: '',
    image: 'items/stone.png',
    maxLevel: 0,
    baseXpRate: 0,
    type: 'skilling',
    activities: [
        {
            id: 'soft-soil',
            name: 'Soft Soil',
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
            id: 'clay-deposit',
            name: 'Clay Deposit',
            description: '',
            image: 'items/clay.png',
            ...getGatheringProgression(1),
            output: [
                {
                    id: 'clay',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(1),
            ],
        },
        {
            id: 'sand-deposit',
            name: 'Sand Beach',
            description: '',
            image: 'items/sand.png',
            ...getGatheringProgression(2),
            output: [
                {
                    id: 'sand',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(2),
            ],
        },
        {
            id: 'muddy-pit',
            name: 'Muddy Pit',
            description: '',
            image: 'items/mud.png',
            ...getGatheringProgression(3),
            output: [
                {
                    id: 'mud',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(3),
            ],
        },
        {
            id: 'snow-cover',
            name: 'Snow Cover',
            description: '',
            image: 'items/ice.png',
            ...getGatheringProgression(4),
            output: [
                {
                    id: 'ice',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(4),
            ],
        },
        {
            id: 'deep-soil',
            name: 'Deep Soil',
            description: '',
            image: 'items/obsidian.png',
            ...getGatheringProgression(5),
            output: [
                {
                    id: 'obsidian',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(5),
            ],
        },
        {
            id: 'gravel-deposit',
            name: 'Gravel Deposit',
            description: '',
            image: 'items/gravel.png',
            ...getGatheringProgression(6),
            output: [
                {
                    id: 'gravel',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(6),
            ],
        },
        {
            id: 'fossil-bed',
            name: 'Fossil Bed',
            description: '',
            image: 'items/fossil.png',
            ...getGatheringProgression(7),
            output: [
                {
                    id: 'fossil',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(7),
            ],
        },
        {
            id: 'old-foundations',
            name: 'Old Foundations',
            description: '',
            image: 'items/echo-dust.png',
            ...getGatheringProgression(8),
            output: [
                {
                    id: 'dungeon-dust',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(8),
            ],
        },

        {
            id: 'runic-debris',
            name: 'Runic Debris',
            description: '',
            image: 'items/runestone.png',
            ...getGatheringProgression(9),
            output: [
                {
                    id: 'runestone',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(9),
            ],
        },
        {
            id: 'ember-pits',
            name: 'Ember Pits',
            description: '',
            image: 'items/volcanic-rock.png',
            ...getGatheringProgression(10),
            output: [
                {
                    id: 'volcanic-rock',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(10),
            ],
        },
        {
            id: 'vault-rubble',
            name: 'Vault Rubble',
            description: '',
            image: 'items/key-fragment.png',
            ...getGatheringProgression(11),
            output: [
                {
                    id: 'key-fragment',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(11),
            ],
        },
    ],
}

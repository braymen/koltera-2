import { Skill, LootTable } from '@modules/skilling/types'
import { getGatheringProgression, GATHERING_SKILL_PROGRESSION } from '../../../configs/gathering-progression'

const BASE_DURATION = GATHERING_SKILL_PROGRESSION[0].duration

const universalDrops = (progressionIndex: number): LootTable[] => {
    const duration = GATHERING_SKILL_PROGRESSION[progressionIndex].duration
    return [
        {
            id: 'trash',
            chance: 0.2 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
        {
            id: 'seaweed',
            chance: 0.1 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
        {
            id: 'treasure-chest',
            chance: 0.01 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
    ]
}

export const FishingSkill: Skill = {
    id: 'Fishing',
    description: 'Cast your line and catch fish from various water bodies.',
    image: 'items/minnow.png',
    maxLevel: 0,
    baseXpRate: 0,
    type: 'skilling',
    activities: [
        {
            id: 'shallow-pond',
            name: 'Shallow Pond',
            description: '',
            image: 'items/minnow.png',
            ...getGatheringProgression(0),
            output: [
                {
                    id: 'minnow',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(0),
            ],
        },
        {
            id: 'quiet-stream',
            name: 'Quiet Stream',
            description: '',
            image: 'items/trout.png',
            ...getGatheringProgression(1),
            output: [
                {
                    id: 'trout',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(1),
            ],
        },
        {
            id: 'lakeside',
            name: 'Lakeside',
            description: '',
            image: 'items/bass.png',
            ...getGatheringProgression(2),
            output: [
                {
                    id: 'bass',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(2),
            ],
        },
        {
            id: 'forest-creek',
            name: 'Forest Creek',
            description: '',
            image: 'items/walleye.png',
            ...getGatheringProgression(3),
            output: [
                {
                    id: 'walleye',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(3),
            ],
        },
        {
            id: 'wide-river',
            name: 'Wide River',
            description: '',
            image: 'items/salmon.png',
            ...getGatheringProgression(4),
            output: [
                {
                    id: 'salmon',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(4),
            ],
        },
        {
            id: 'muddy-marsh',
            name: 'Muddy Marsh',
            description: '',
            image: 'items/snail.png',
            ...getGatheringProgression(5),
            output: [
                {
                    id: 'snail',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(5),
            ],
        },
        {
            id: 'hidden-lake',
            name: 'Hidden Lake',
            description: '',
            image: 'items/carp.png',
            ...getGatheringProgression(6),
            output: [
                {
                    id: 'carp',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(6),
            ],
        },
        {
            id: 'deep-lake',
            name: 'Deep Lake',
            description: '',
            image: 'items/magical-carp.png',
            ...getGatheringProgression(7),
            output: [
                {
                    id: 'magical-carp',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(7),
            ],
        },
        {
            id: 'rock-coast',
            name: 'Rock Coast',
            description: '',
            image: 'items/crab.png',
            ...getGatheringProgression(8),
            output: [
                {
                    id: 'crab',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(8),
            ],
        },
        {
            id: 'coastal-waters',
            name: 'Coastal Waters',
            description: '',
            image: 'items/redfish.png',
            ...getGatheringProgression(9),
            output: [
                {
                    id: 'redfish',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(9),
            ],
        },
        {
            id: 'deep-ocean',
            name: 'Deep Ocean',
            description: '',
            image: 'items/rainbow-fish.png',
            ...getGatheringProgression(10),
            output: [
                {
                    id: 'rainbow-fish',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(10),
            ],
        },
        {
            id: 'molten-lake',
            name: 'Molten Lake',
            description: '',
            image: 'items/emberfish.png',
            ...getGatheringProgression(11),
            output: [
                {
                    id: 'emberfish',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(11),
            ],
        },
    ],
}

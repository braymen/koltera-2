import { Skill, LootTable } from '@modules/skilling/types'
import { getGatheringProgression, GATHERING_SKILL_PROGRESSION } from '../../../configs/gathering-progression'

const BASE_DURATION = GATHERING_SKILL_PROGRESSION[0].duration

const universalDrops = (progressionIndex: number): LootTable[] => {
    const duration = GATHERING_SKILL_PROGRESSION[progressionIndex].duration
    return [
        {
            id: 'weeds',
            chance: 0.2 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
        {
            id: 'caterpillar',
            chance: 0.1 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
        {
            id: 'herb-pouch',
            chance: 0.01 * (duration / BASE_DURATION),
            min: 1,
            max: 1,
        },
    ]
}

export const FarmingSkill: Skill = {
    id: 'Farming',
    description: 'Plant and harvest crops to feed yourself and create valuable materials.',
    image: 'items/placeholder.png',
    maxLevel: 0,
    baseXpRate: 0,
    type: 'skilling',
    activities: [
        {
            id: 'grass-seeds',
            name: 'Grass Seeds',
            description: '',
            image: 'items/grass.png',
            ...getGatheringProgression(0),
            output: [
                {
                    id: 'grass',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(0),
            ],
        },
        {
            id: 'wheat-seeds',
            name: 'Wheat Seeds',
            description: '',
            image: 'items/wheat.png',
            ...getGatheringProgression(1),
            output: [
                {
                    id: 'wheat',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(1),
            ],
        },
        {
            id: 'carrot-seeds',
            name: 'Carrot Seeds',
            description: '',
            image: 'items/carrot.png',
            ...getGatheringProgression(2),
            output: [
                {
                    id: 'carrot',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(2),
            ],
        },
        {
            id: 'tomato-seeds',
            name: 'Tomato Seeds',
            description: '',
            image: 'items/tomato.png',
            ...getGatheringProgression(3),
            output: [
                {
                    id: 'tomato',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(3),
            ],
        },
        {
            id: 'lettuce-seeds',
            name: 'Lettuce Seeds',
            description: '',
            image: 'items/lettuce.png',
            ...getGatheringProgression(4),
            output: [
                {
                    id: 'lettuce',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(4),
            ],
        },
        {
            id: 'potato-seeds',
            name: 'Potato Seeds',
            description: '',
            image: 'items/potato.png',
            ...getGatheringProgression(5),
            output: [
                {
                    id: 'potato',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(5),
            ],
        },
        {
            id: 'corn-seeds',
            name: 'Corn Seeds',
            description: '',
            image: 'items/corn.png',
            ...getGatheringProgression(6),
            output: [
                {
                    id: 'corn',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(6),
            ],
        },
        {
            id: 'eggplant-seeds',
            name: 'Eggplant Seeds',
            description: '',
            image: 'items/eggplant.png',
            ...getGatheringProgression(7),
            output: [
                {
                    id: 'eggplant',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(7),
            ],
        },
        {
            id: 'onion-seeds',
            name: 'Onion Seeds',
            description: '',
            image: 'items/onion.png',
            ...getGatheringProgression(8),
            output: [
                {
                    id: 'onion',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(8),
            ],
        },
        {
            id: 'pepper-seeds',
            name: 'Pepper Seeds',
            description: '',
            image: 'items/pepper.png',
            ...getGatheringProgression(9),
            output: [
                {
                    id: 'pepper',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(9),
            ],
        },
        {
            id: 'pineapple-seeds',
            name: 'Pineapple Seeds',
            description: '',
            image: 'items/pineapple.png',
            ...getGatheringProgression(10),
            output: [
                {
                    id: 'pineapple',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(10),
            ],
        },
        {
            id: 'mango-seeds',
            name: 'Mango Seeds',
            description: '',
            image: 'items/mango.png',
            ...getGatheringProgression(11),
            output: [
                {
                    id: 'mango',
                    chance: 1,
                    min: 1,
                    max: 1,
                },
                ...universalDrops(11),
            ],
        },
    ],
}

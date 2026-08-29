import { Skill } from '@modules/skilling/types'
import { ChoppingSkill } from './skills/skilling/chopping'
import { DiggingSkill } from './skills/skilling/digging'
import { ExploringSkill } from './skills/skilling/exploring'
import { FarmingSkill } from './skills/skilling/farming'
import { FishingSkill } from './skills/skilling/fishing'
import { MiningSkill } from './skills/skilling/mining'

/**
 * Data
 */
const get: Skill[] = [
    {
        id: 'Furnace',
        description: '',
        image: 'items/placeholder.png',
        maxLevel: 0,
        baseXpRate: 0,
        type: 'workstation',
    },
    {
        id: 'Stove',
        description: 'Prepare delicious meals and recipes from farmed ingredients and caught fish.',
        image: 'items/placeholder.png',
        maxLevel: 0,
        baseXpRate: 0,
        type: 'workstation',
    },
    {
        id: 'Workbench',
        description: '',
        image: 'items/placeholder.png',
        maxLevel: 0,
        baseXpRate: 0,
        type: 'workstation',
    },
    ChoppingSkill,
    DiggingSkill,
    ExploringSkill,
    FarmingSkill,
    FishingSkill,
    MiningSkill,
] satisfies Skill[]
export type SkillID = (typeof get)[number]['id']

/**
 * Lookup Function
 */
const Lookup: Record<string, Skill> = {}
get.forEach((item: Skill) => {
    Lookup[item.id] = item
})

const getById = (id: string) => {
    return Lookup[id]
}

const SkillContent = {
    get,
    getById,
}

export default SkillContent

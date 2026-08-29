import { ItemID } from '@data/items'
import { BaseContent } from '@engine/types'
import { ItemInstance } from '@modules/inventory/types'

export type Skills = 'Chopping' | 'Mining' | 'Digging' | 'Exploring' | 'Fishing' | 'Farming' | 'Workbench' | 'Furnace' | 'Stove'

export interface Skill {
    id: string
    description: string
    image: string
    maxLevel: number
    baseXpRate: number
    type: 'skilling' | 'workstation' | 'creatures'
    activities?: SkillActivity[]
}

export interface SkillInstance {
    id: string
    xp: number
}

export interface SkillActivity extends BaseContent {
    levelRequirement: number
    xpRate: number
    duration: number
    output: LootTable[]
}

export interface SkillProgress {
    id: string
    activity: string
    progress: number
    startTime: number | null
    items: ItemInstance[]
}

export interface LootTable {
    id: ItemID
    chance: number
    min: number
    max: number
}

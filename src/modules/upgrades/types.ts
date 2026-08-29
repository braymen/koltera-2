import { BaseContent } from '@engine/types'

export type SkillName = 'Chopping' | 'Mining' | 'Digging' | 'Exploring' | 'Fishing' | 'Farming'
export type WorkstationName = 'Furnace' | 'Workbench' | 'Stove'

export type UpgradeEffect =
    | { type: 'skill_xp'; skill: SkillName; value: number }
    | { type: 'skill_yield'; skill: SkillName; value: number }
    | { type: 'skill_duration'; skill: SkillName; value: number }
    | { type: 'all_skill_yield'; value: number }
    | { type: 'helper_slot'; value: number }
    | { type: 'workstation_speed'; workstation: WorkstationName; value: number }
    | { type: 'workstation_xp'; workstation: WorkstationName; value: number }
    | { type: 'all_workstation_speed'; value: number }
    | { type: 'workstation_recovery'; workstation: WorkstationName; value: number }
    | { type: 'all_workstation_recovery'; value: number }
    | { type: 'awaken_gold'; value: number }
    | { type: 'task_rewards_multiplier'; value: number }
    | { type: 'merchant_discount'; value: number }
    | { type: 'sellable_gold_bonus'; value: number }
    | { type: 'expedition_trait_bonus_multiplier'; value: number }
    | { type: 'expedition_type_modifier_dampen'; value: number }
    | { type: 'expedition_reward_yield'; value: number }
    | { type: 'expedition_xp_bonus'; value: number }
    | { type: 'qol_expedition_min_maxer' }
    | { type: 'qol_auto_task_board' }

export interface Upgrade extends BaseContent {
    category: string
    cost: number
    effect: string
    effectData: UpgradeEffect
    x: number // Position in tree (0-100)
    y: number // Position in tree (0-100)
    prerequisites: string[] // IDs of prerequisite upgrades
}

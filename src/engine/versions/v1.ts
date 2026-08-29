import * as PreviousVersion from './v0'
import { ItemInstance } from '@modules/inventory/types'
import { SkillInstance, SkillProgress } from '@modules/skilling/types'
import { CrafterState } from '@modules/crafting/types'
import { Collection } from '@modules/collections/types'
import { Creature } from '@modules/creatures/types'
import { Settings, DEFAULT_SETTINGS } from '../settings'
import { StoryState } from '@modules/story/types'
import { BASE_UNLOCKED_TABS } from '@modules/story/config'
import { ExpeditionInstance, ExpeditionState } from '@modules/expeditions/types'
import { GardenState } from '@modules/garden/types'
import { ItemLogEntry } from '@modules/inventory/types'
import { ToolState } from '@modules/tools/types'
import { MilestoneState } from '@modules/milestones/types'
import { FabricationState } from '@modules/fabrication/types'
import { MachinesState } from '@modules/machines/types'
import { DungeonsState } from '@modules/dungeons/types'

export type Progress = {
    skilling: SkillProgress
}

export type StateV1 = {
    version: number
    name: string
    tab: string
    subtab: string
    lastSaveTime: number | null
    firstPlayTime: number | null // Timestamp when player first started playing
    firstTimeLoad: boolean // Whether to show first-time settings modal
    totalPlaytime: number // Total seconds played (sum of online and offline time)
    onlinePlaytime: number // Seconds played while game is actively running
    offlinePlaytime: number // Seconds calculated from offline progress
    inventory: ItemInstance[]
    creatures: Creature[]
    skills: SkillInstance[]
    progress: Progress
    collections: Collection
    settings: Settings
    favoriteItems: string[]
    furnace: CrafterState
    stove: CrafterState
    workbench: CrafterState
    helpers: {
        startTime: number
        creatureId: string
        skillId: string
        activityId: string
        progress: number
    }[]
    sanctuary: string[] // Array of creature species IDs (max 6)
    story: StoryState
    activeExpeditions: ExpeditionState
    expeditionRotation: ExpeditionInstance[] // Deprecated: kept for migration compatibility
    lastExpeditionRotationTime: number | null // Deprecated: kept for migration compatibility
    expeditionTierSelections: Record<string, number> // expeditionTypeId -> selected tier
    expeditionCompletions: Record<string, Record<number, number>> // expeditionTypeId -> tier -> count
    taskBoard: {
        tasks: Array<{
            id: string
            itemId: string
            amount: number
            goldReward: number
            completed: boolean
            lastResetTime?: number // Optional for migration compatibility
        }>
        lastResetTime: number | null
    }
    purchasedUpgrades: string[] // Array of purchased upgrade IDs
    garden: GardenState
    unlockedAutomations: string[] // Array of unlocked automation IDs
    visitedTabs: string[] // Array of tab IDs that the player has visited
    unseenSummons: string[] // Array of creature IDs that are discoverable but haven't been viewed
    seenSummons: string[] // Array of creature IDs that have been viewed (persistent)
    itemLog: ItemLogEntry[] // Log of item gains/losses (max 20 entries)
    lastOpenedChestRolledCollectibles?: string[] // Temporary: collectibles that were rolled from the last opened chest (for UI display)
    merchantWeeklyPurchases: {
        resetTimestamp: number // Timestamp (ms) of the weekly reset period these purchases belong to
        purchases: Record<string, number> // itemId -> amount purchased this week
    }
    gameCompleted: boolean // Whether the player has seen the end screen (all 120 creatures summoned)
    tools: ToolState
    milestones: MilestoneState
    fabrication: FabricationState
    machines: MachinesState
    dungeons: DungeonsState
    statistics: {
        skillingCycles: {
            Chopping: number
            Mining: number
            Digging: number
            Farming: number
            Fishing: number
            Exploring: number
        }
        helperCycles: {
            Chopping: number
            Mining: number
            Digging: number
            Farming: number
            Fishing: number
            Exploring: number
        }
        totalGoldEarned: number
        totalTasksCompleted: number
        totalCreatureXP: number
        expeditions: {
            total: number
            successful: number
            failed: number
            highestPartyScore: number
        }
        totalItemsGained: number
        itemsCrafted: {
            Stove: number
            Workbench: number
            Furnace: number
            Timbershop: number
            total: number
        }
    }
}

export const DefaultSave: StateV1 = {
    version: 21,
    name: '',
    tab: 'Tutorial',
    subtab: '',
    lastSaveTime: null,
    firstPlayTime: null,
    firstTimeLoad: true,
    gameCompleted: false,
    totalPlaytime: 0,
    onlinePlaytime: 0,
    offlinePlaytime: 0,
    inventory: [],
    story: {
        completedTasks: [],
        unlockedTabs: [...BASE_UNLOCKED_TABS],
        lockOverride: false,
    },
    creatures: [],
    skills: [],
    progress: {
        skilling: {
            id: '',
            activity: '',
            progress: 0,
            startTime: null,
            items: [],
        },
    },
    settings: DEFAULT_SETTINGS,
    favoriteItems: ['gold', 'awaken-points', 'prestige-points'],
    stove: {
        isActive: false,
        item: null,
        progress: 0,
        duration: 0,
        startTime: null,
        amount: 0,
        completedItems: 0,
        singleItemDuration: 0,
        queue: [],
        speedMode: false,
    },
    furnace: {
        isActive: false,
        item: null,
        progress: 0,
        duration: 0,
        startTime: null,
        amount: 0,
        completedItems: 0,
        singleItemDuration: 0,
        queue: [],
        speedMode: false,
    },
    workbench: {
        isActive: false,
        item: null,
        progress: 0,
        duration: 0,
        startTime: null,
        amount: 0,
        completedItems: 0,
        singleItemDuration: 0,
        queue: [],
        speedMode: false,
    },
    collections: {
        items: [],
        achievements: [],
        creatures: [],
    },
    helpers: [],
    sanctuary: [],
    activeExpeditions: [],
    expeditionRotation: [],
    lastExpeditionRotationTime: null,
    expeditionTierSelections: {},
    expeditionCompletions: {},
    taskBoard: {
        tasks: [],
        lastResetTime: null,
    },
    purchasedUpgrades: [],
    garden: {
        flowers: [],
        lastCycleTime: null,
        rocks: (() => {
            // Initialize all 25 grid positions (5x5) with rocks
            const rocks: Array<{ x: number; y: number }> = []
            for (let y = 0; y < 5; y++) {
                for (let x = 0; x < 5; x++) {
                    rocks.push({ x, y })
                }
            }
            return rocks
        })(),
    },
    tools: {
        axe: 0,
        pickaxe: 0,
        machete: 0,
        shovel: 0,
        'fishing-pole': 0,
        pitchfork: 0,
        sword: 0,
        staff: 0,
        hammer: 0,
        saw: 0,
        knife: 0,
    },
    milestones: [],
    fabrication: {
        allocations: {},
        lastGenerationTime: null,
    },
    machines: {
        machines: {},
    },
    dungeons: {
        activeDungeons: [],
        completions: {},
    },
    unlockedAutomations: [],
    visitedTabs: [
        'Settings',
        'Statistics',
        'Changelog',
        'Credits',
        'Developer Tools',
        'Tutorial',
        'Content Exporter',
        'Save Management',
        'Collectibles',
        'Beastiary',
        'Item Codex',
        'Achievements',
        'Content Exporter',
    ],
    unseenSummons: [],
    seenSummons: [],
    itemLog: [],
    lastOpenedChestRolledCollectibles: undefined,
    merchantWeeklyPurchases: {
        resetTimestamp: 0,
        purchases: {},
    },
    statistics: {
        skillingCycles: {
            Chopping: 0,
            Mining: 0,
            Digging: 0,
            Farming: 0,
            Fishing: 0,
            Exploring: 0,
        },
        helperCycles: {
            Chopping: 0,
            Mining: 0,
            Digging: 0,
            Farming: 0,
            Fishing: 0,
            Exploring: 0,
        },
        totalGoldEarned: 0,
        totalTasksCompleted: 0,
        totalCreatureXP: 0,
        expeditions: {
            total: 0,
            successful: 0,
            failed: 0,
            highestPartyScore: 0,
        },
        totalItemsGained: 0,
        itemsCrafted: {
            Stove: 0,
            Workbench: 0,
            Furnace: 0,
            Timbershop: 0,
            total: 0,
        },
    },
}

export const convertPreviousVersion = (v0: PreviousVersion.State): StateV1 => {
    return {
        version: DefaultSave.version,
        name: DefaultSave.name,
        tab: DefaultSave.tab,
        subtab: DefaultSave.subtab,
        gameCompleted: false,
        inventory: DefaultSave.inventory,
        creatures: DefaultSave.creatures,
        skills: DefaultSave.skills,
        progress: DefaultSave.progress,
        settings: DefaultSave.settings,
        stove: DefaultSave.stove,
        furnace: DefaultSave.furnace,
        workbench: DefaultSave.workbench,
        collections: DefaultSave.collections,
        favoriteItems: DefaultSave.favoriteItems,
        lastSaveTime: DefaultSave.lastSaveTime,
        firstPlayTime: DefaultSave.firstPlayTime,
        firstTimeLoad: (v0 as any).firstTimeLoad ?? true, // Default to true for migrated saves
        totalPlaytime: DefaultSave.totalPlaytime,
        onlinePlaytime: DefaultSave.onlinePlaytime,
        offlinePlaytime: DefaultSave.offlinePlaytime,
        helpers: DefaultSave.helpers,
        sanctuary: DefaultSave.sanctuary,
        story: DefaultSave.story,
        activeExpeditions: DefaultSave.activeExpeditions,
        expeditionRotation: DefaultSave.expeditionRotation,
        lastExpeditionRotationTime: DefaultSave.lastExpeditionRotationTime,
        expeditionTierSelections: (v0 as any).expeditionTierSelections || {},
        expeditionCompletions: (v0 as any).expeditionCompletions || {},
        taskBoard: DefaultSave.taskBoard,
        purchasedUpgrades: DefaultSave.purchasedUpgrades,
        garden: DefaultSave.garden,
        unlockedAutomations: DefaultSave.unlockedAutomations,
        visitedTabs: (v0 as any).visitedTabs || [],
        unseenSummons: (v0 as any).unseenSummons || [],
        seenSummons: (v0 as any).seenSummons || [],
        tools: DefaultSave.tools,
        milestones: DefaultSave.milestones,
        fabrication: DefaultSave.fabrication,
        machines: DefaultSave.machines,
        dungeons: DefaultSave.dungeons,
        itemLog: DefaultSave.itemLog,
        merchantWeeklyPurchases: DefaultSave.merchantWeeklyPurchases,
        statistics: DefaultSave.statistics,
    }
}

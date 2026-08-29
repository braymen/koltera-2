import { makeWorkstationPage } from '@pages/WorkstationPage'
import Merchant from '@pages/player/Merchant'
import Story from '@pages/player/Story'
import TaskBoard from '@pages/player/TaskBoard'
import AwakenTree from '@pages/player/AwakenTree'
import Summoning from '@pages/creatures/Summoning'
import Helpers from '@pages/creatures/Helpers'
import Sanctuary from '@pages/creatures/Sanctuary'
import { makeCollectionPage } from '@pages/CollectionPage'
import { makeGatheringPage } from '@pages/GatheringPage'
import Creatures from '@pages/creatures/Creatures'
import Settings from '@pages/misc/Settings'
import Inventory from '@pages/player/Inventory'
import SkillingHelpers from '@modules/skilling/helpers'
import { State } from '@engine/types'
import ItemsContent from '@data/items'
import CreaturesContent from '@data/creatures'
import AchievementsContent from '@data/achievements'
import Expeditions from '@pages/creatures/Expeditions'
import Dungeons from '@pages/creatures/Dungeons'
import ExpeditionsContent from '@data/expeditions'
import { isExpeditionTypeUnlocked } from '@modules/expeditions/helpers'
import MilestonesConfig from '@configs/milestones'
import SaveManagement from '@pages/misc/SaveManagement'
import DeveloperTools from '@pages/misc/DeveloperTools'
import Garden from '@pages/player/Garden'
import Statistics from '@pages/misc/Statistics'
// import DigSites from '@pages/minigames/DigSites'
import FishingDocks from '@pages/minigames/FishingDocks'
import GamblersTavern from '@pages/minigames/GamblersTavern'
// import BattlePit from '@pages/minigames/BattlePit'
// import Bank from '@pages/minigames/Bank'
// import ManaShrine from '@pages/minigames/ManaShrine'
import FloorChickenHunt from '@pages/minigames/FloorChickenHunt'
import SupplyRun from '@pages/minigames/SupplyRun'
import Machines from '@pages/player/Machines'
import Tools from '@pages/player/Tools'
import Gauntlet from '@pages/player/Gauntlet'
import Milestones from '@pages/player/Milestones'
import ItemGrid from '@pages/player/ItemGrid'
import PlayerHandbook from '@pages/player/PlayerHandbook'

const Beastiary = makeCollectionPage('creatures')
const ItemCodex = makeCollectionPage('items')
const Achievements = makeCollectionPage('achievements')

const Chopping = makeGatheringPage('Chopping')
const Mining = makeGatheringPage('Mining')
const Digging = makeGatheringPage('Digging')
const Exploring = makeGatheringPage('Exploring')
const Fishing = makeGatheringPage('Fishing')
const Farming = makeGatheringPage('Farming')

const Furnace = makeWorkstationPage('Furnace')
const Workbench = makeWorkstationPage('Workbench')
const Stove = makeWorkstationPage('Stove')

export interface NavigationTab {
    id: string
    image: string
    color: string
    component?: React.ComponentType<any>
    onclick?: () => void
    section?: string
}

export const NAVIGATION_MAP: { section: string; tabs: NavigationTab[] }[] = [
    {
        section: 'Player',
        tabs: [
            { id: 'Inventory', image: 'icons/inventory.png', color: '#4a3a2a', component: Inventory },
            { id: 'Tools', image: 'icons/shovel.png', color: '#3a2a2a', component: Tools },
            { id: 'Merchant', image: 'icons/merchant.png', color: '#6b5a2a', component: Merchant },
            { id: 'Task Board', image: 'icons/task-board.png', color: '#3a2a1a', component: TaskBoard },
            { id: 'Garden', image: 'icons/garden.png', color: '#0a2a0a', component: Garden },
            { id: 'Awaken Tree', image: 'icons/upgrades.png', color: '#2a0a3a', component: AwakenTree },
            { id: 'Fabrication', image: 'icons/item-grid.png', color: '#2a3a4a', component: ItemGrid },
            { id: 'Milestones', image: 'icons/milestones.png', color: '#3a3a1a', component: Milestones },
            // { id: 'Player Handbook', image: 'icons/player-handbook.png', color: '#1a2a4a', component: PlayerHandbook },
            { id: 'Tutorial', image: 'icons/tutorial.png', color: '#0a1a3a', component: Story },
        ],
    },
    {
        section: 'Creatures',
        tabs: [
            { id: 'Creatures', image: 'creatures/farming/mushy.png', color: '#0a2a00', component: Creatures },
            { id: 'Summoning', image: 'icons/summoning.png', color: '#2a0a3a', component: Summoning },
            { id: 'Helpers', image: 'icons/helpers.png', color: '#5a2a3a', component: Helpers },
            { id: 'Expeditions', image: 'icons/expeditions.png', color: '#002a2a', component: Expeditions },
            // { id: 'Gauntlet', image: 'icons/gauntlet.png', color: '#4a1a1a', component: Gauntlet },
            { id: 'Dungeons', image: 'icons/dungeons.png', color: '#1a0a2a', component: Dungeons },
            { id: 'Sanctuary', image: 'icons/sanctuary.png', color: '#1a2a1a', component: Sanctuary },
        ],
    },
    {
        section: 'Gathering',
        tabs: [
            { id: 'Chopping', image: 'items/log.png', color: '#3a1a0a', component: Chopping },
            { id: 'Mining', image: 'items/stone.png', color: '#2a2a2a', component: Mining },
            { id: 'Exploring', image: 'items/grass.png', color: '#0a2a0a', component: Exploring },
            { id: 'Digging', image: 'icons/digging.png', color: '#3a1a0a', component: Digging },
            { id: 'Fishing', image: 'icons/fishing.png', color: '#002a4a', component: Fishing },
            { id: 'Farming', image: 'icons/farming.png', color: '#0a2a0a', component: Farming },
        ],
    },
    {
        section: 'Workstations',
        tabs: [
            { id: 'Furnace', image: 'icons/furnace.png', color: '#5c1a00', component: Furnace },
            { id: 'Workbench', image: 'icons/workbench.png', color: '#3a1a0a', component: Workbench },
            { id: 'Stove', image: 'icons/stove.png', color: '#3a0a4a', component: Stove },
            { id: 'Machines', image: 'icons/machines.png', color: '#2a2a3a', component: Machines },
        ],
    },
    // {
    //     section: 'Mini-Games',
    //     tabs: [
    //         // { id: 'Dirt to Riches', image: 'icons/gamblers-tavern.png', color: '#4a3a0a', component: GamblersTavern },
    //         // { id: 'Fishing Docks', image: 'icons/fishing-docks.png', color: '#002a4a', component: FishingDocks },
    //         // { id: 'Dig Sites', image: 'icons/dig-sites.png', color: '#3a2a1a', component: DigSites },
    //         // { id: 'Supply Run', image: 'icons/supply-run.png', color: '#2a3a1a', component: SupplyRun },
    //         // { id: 'Battle Pit', image: 'icons/battle-pit.png', color: '#4a0a0a', component: BattlePit },
    //         // { id: 'Bank', image: 'icons/bank.png', color: '#2a3a2a', component: Bank },
    //         // { id: 'Mana Shrine', image: 'icons/mana-shrine.png', color: '#1a0a4a', component: ManaShrine },
    //         // { id: 'Chicken & Cow Hunt', image: 'icons/battle-pit.png', color: '#4a2a0a', component: FloorChickenHunt },
    //     ],
    // },
    {
        section: 'Collections',
        tabs: [
            { id: 'Beastiary', image: 'icons/beastiary.png', color: '#0a1a0a', component: Beastiary },
            { id: 'Item Codex', image: 'icons/items-codex.png', color: '#0a1a3a', component: ItemCodex },
            { id: 'Achievements', image: 'icons/achievements.png', color: '#4a2a4a', component: Achievements },
        ],
    },
    {
        section: 'Misc',
        tabs: [
            {
                id: 'Discord',
                image: 'icons/discord.png',
                color: '#1a2a5a',
                onclick: () => window.api.link('https://discord.kingottergames.com/'),
            },
            { id: 'Settings', image: 'icons/settings.png', color: '#2a2a2a', component: Settings },
            { id: 'Statistics', image: 'icons/statistics.png', color: '#3a2a4a', component: Statistics },
            { id: 'Save Management', image: 'icons/save-management.png', color: '#002a4a', component: SaveManagement },
            ...(process.env.NODE_ENV === 'development'
                ? [{ id: 'Developer Tools', image: 'icons/developer-tools.png', color: '#5c0000', component: DeveloperTools }]
                : []),
            { id: 'Quit', image: 'icons/quit.png', color: '#3a0000', onclick: () => window.api.quit('') },
        ],
    },
]

export const FLAT_NAVIGATION_MAP = NAVIGATION_MAP.reduce((acc, section) => {
    const tabsWithTitle = section.tabs.map((tab) => ({ ...tab, section: section.section }))
    return acc.concat(tabsWithTitle)
}, [] as NavigationTab[])

export const getNavigationSubtext = (state: State, tabId: string): string => {
    const tab = FLAT_NAVIGATION_MAP.find((tab) => tab.id === tabId)
    if (!tab) return ''

    if (
        tab.id === 'Player Handbook' ||
        tab.id === 'Fishing Docks' ||
        tab.id === 'Chicken & Cow Hunt' ||
        tab.id === 'Dig Sites' ||
        tab.id === 'Supply Run'
    ) {
        return 'COMING SOON'
    }

    if (tab.id === 'Milestones') {
        const claimed = state.milestones?.length || 0
        const total = MilestonesConfig.ALL_MILESTONES.length
        return Math.floor((claimed / total) * 100) + '%'
    }

    if (tab.id === 'Expeditions') {
        const unlocked = ExpeditionsContent.get.filter((e) => isExpeditionTypeUnlocked(e.id, state.expeditionCompletions)).length
        const active = (state.activeExpeditions || []).filter((e) => !e.completed).length
        return `${unlocked - active} Inactive`
    }

    if (
        tab.id === 'Summoning' ||
        tab.id === 'Creatures' ||
        tab.id === 'Team' ||
        tab.id === 'Helpers' ||
        tab.id === 'Sanctuary' ||
        tab.id === 'Pasture' ||
        tab.id === 'Dungeons' ||
        tab.id === 'Machines' ||
        tab.id === 'Gauntlet'
    ) {
        return ''
    }

    if (tab.section === 'Gathering' || tab.section === 'Workstations' || tab.section === 'Creatures') {
        const level = SkillingHelpers.getLevel(state.skills.find((s) => s.id === tab.id)?.xp || 0)
        return 'Level ' + level
    } else if (tab.section === 'Collections') {
        switch (tab.id) {
            case 'Beastiary':
                return state.collections.creatures.length + '/' + CreaturesContent.get.length
            case 'Item Codex':
                return state.collections.items.length + '/' + ItemsContent.get.length
            case 'Achievements':
                return state.collections.achievements.length + '/' + AchievementsContent.get.length
        }
    }

    return ''
}

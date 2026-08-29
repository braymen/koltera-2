import { useState } from 'react'
import Images from '@utils/images'
import Sounds from '@utils/sounds'
import Navigation from '@modules/navigation/dispatch'
import { StateProps } from '@engine/types'
import GlobalConfig from '@configs/global'
import { getNavigationSubtext, NAVIGATION_MAP } from '@utils/navigation'
import { isTabUnlocked, canTurnInTask, isTaskCompleted } from '@modules/story/helpers'
import { getAwakenGoldBonus } from '@modules/upgrades/helpers'
import CreatureConfig from '@configs/creatures'
import ItemsContent from '@data/items'
import StoryContent from '@data/story'
import CreaturesContent from '@data/creatures'
import { isCreatureDiscoverable } from '@modules/collections/helpers'
import ConfirmModal from '../common/ConfirmModal'
import Tooltip from '../common/Tooltip'

const NavBadge = ({ color, children }: { color: string; children: React.ReactNode }) => (
    <span
        className="nav-badge-pulse"
        style={{ backgroundColor: color, color: 'white', fontSize: '14px', padding: '0px 6px', textTransform: 'uppercase' }}
    >
        {children}
    </span>
)

export function Navbar({ state, dispatch }: StateProps) {
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
    const [confirmModal, setConfirmModal] = useState<{ text: string; action: () => void } | null>(null)

    const toggleSection = (sectionName: string) => {
        Sounds.play('click.wav')
        setCollapsedSections((prev) => {
            const next = new Set(prev)
            if (next.has(sectionName)) {
                next.delete(sectionName)
            } else {
                next.add(sectionName)
            }
            return next
        })
    }

    const switchTab = (tab: string) => {
        Sounds.play('click.wav')
        Navigation.tab(dispatch, tab)
    }

    const completedTasks = (state.taskBoard?.tasks || []).filter((task) => task.completed).length
    const totalTasks = state.taskBoard?.tasks?.length || 0
    const goldAmount = state.inventory.find((item) => item.id === 'gold')?.amount ?? 0
    const goldImage = ItemsContent.getById('gold')?.image
    const awakenPointsAmount = state.inventory.find((item) => item.id === 'awaken-points')?.amount ?? 0
    const awakenPointsImage = ItemsContent.getById('awaken-points')?.image
    const prestigePointsAmount = state.inventory.find((item) => item.id === 'prestige-points')?.amount ?? 0
    const prestigePointsImage = ItemsContent.getById('prestige-points')?.image
    const awakenedCreatures = state.creatures.filter((c) => c.awakened)
    const awakenGoldBonus = getAwakenGoldBonus(state.purchasedUpgrades)
    const awakenGoldPerMinute =
        awakenedCreatures.length * (CreatureConfig.GOLD_GENERATION.GOLD_PER_MINUTE_PER_AWAKENED + awakenGoldBonus)
    const activeHelpers = state.helpers?.length ?? 0
    const activeSanctuary = state.sanctuary?.length ?? 0
    const unseenSummons = state.unseenSummons || []
    const visitedTabs = state.visitedTabs || []

    return (
        <>
            <center>
                <div style={{ position: 'relative' }}>
                    <img
                        className="pixel"
                        src={Images.get('branding/logo.png')}
                        alt="Koltera Logo"
                        style={{ width: '100px', margin: '0 auto', marginTop: '4px' }}
                    />
                    <p style={{ fontSize: '16px', position: 'absolute', right: '70px', top: '40px', color: 'white' }}>
                        v{GlobalConfig.PROJECT_INFO.VERSION}
                    </p>
                </div>
            </center>

            {NAVIGATION_MAP.map((section) => {
                const disabledTabs = state.settings?.disabledNavigationTabs || []
                const allTabsDisabled = section.tabs.every((tab) => disabledTabs.includes(tab.id))
                if (allTabsDisabled) return null

                const isCollapsed = collapsedSections.has(section.section)
                return (
                    <div key={section.section} style={{ marginBottom: '24px' }}>
                        <h3
                            className="nav-section-header"
                            onClick={() => toggleSection(section.section)}
                            style={{
                                margin: '8px 8px 2px',
                                color: 'rgba(255,255,255,.5)',
                                fontWeight: '400',
                                cursor: 'pointer',
                                userSelect: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                borderBottom: '2px solid rgba(255,255,255,.07)',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '12px',
                                    transition: 'transform 0.2s',
                                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                }}
                            >
                                ▼
                            </span>
                            {section.section}
                        </h3>
                        {!isCollapsed &&
                            section.tabs.map((tab) => {
                                let color = 'white'
                                if (section.section === 'Workstations') {
                                    const workstationState = state[tab.id.toLowerCase().replace(' ', '') as keyof typeof state]
                                    if (
                                        workstationState &&
                                        typeof workstationState === 'object' &&
                                        'isActive' in workstationState
                                    ) {
                                        color = workstationState.isActive ? 'lime' : 'white'
                                    }
                                } else if (section.section === 'Gathering') {
                                    if (state.progress.skilling.id === tab.id && state.progress.skilling.activity) {
                                        color = 'orange'
                                    }
                                }

                                let tabUnlocked = isTabUnlocked(state, tab.id)
                                const isTabDisabled = (state.settings?.disabledNavigationTabs || []).includes(tab.id)
                                let canNavigate = tab.component ? tabUnlocked : true
                                const isNewTab = tab.component && tabUnlocked && !visitedTabs.includes(tab.id)

                                let isTutorialReady = false
                                if (tab.id === 'Tutorial' && tabUnlocked) {
                                    const tasks = StoryContent.get
                                    for (let i = 0; i < tasks.length; i++) {
                                        const task = tasks[i]
                                        if (!isTaskCompleted(state, task.id)) {
                                            const previousTasksComplete = tasks
                                                .slice(0, i)
                                                .every((t) => isTaskCompleted(state, t.id))
                                            if (previousTasksComplete) {
                                                isTutorialReady = canTurnInTask(state, task)
                                                break
                                            }
                                        }
                                    }
                                }

                                const hasUnseenSummons = tab.id === 'Summoning' && tabUnlocked && unseenSummons.length > 0
                                const hasCanSummon =
                                    (state.settings?.showCanSummonBadge ?? true) &&
                                    tab.id === 'Summoning' &&
                                    tabUnlocked &&
                                    !hasUnseenSummons &&
                                    CreaturesContent.get.some((creature) => {
                                        if (state.creatures.some((c) => c.species === creature.id)) return false
                                        if (!isCreatureDiscoverable(state, creature.id)) return false
                                        return creature.summoningCost.every((cost) => {
                                            const itemInstance = state.inventory.find((item) => item.id === cost.id)
                                            return itemInstance ? itemInstance.amount >= cost.amount : false
                                        })
                                    })

                                if (isTabDisabled) return null

                                const isActiveTab = state.tab === tab.id
                                let showLockedTooltip =
                                    (tab.id === 'Sanctuary' || tab.id === 'Dungeons' || tab.id === 'Fabrication') &&
                                    !tabUnlocked

                                const tabElement = (
                                    <div
                                        key={tab.id}
                                        onClick={() => {
                                            if (tab.component && !tabUnlocked) return
                                            if (tab.component) {
                                                switchTab(tab.id)
                                            } else if (tab.onclick) {
                                                if (tab.id === 'Quit' || tab.id === 'Discord') {
                                                    setConfirmModal({
                                                        text:
                                                            tab.id === 'Quit'
                                                                ? 'Are you sure you want to exit the game?'
                                                                : 'This will open discord through your browser. Continue?',
                                                        action: tab.onclick,
                                                    })
                                                } else {
                                                    tab.onclick()
                                                }
                                            }
                                        }}
                                        className="nav-btn"
                                        style={{
                                            padding: '6px 4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            opacity: canNavigate ? 1 : 0.1,
                                            cursor: canNavigate ? 'pointer' : 'not-allowed',
                                            position: 'relative',
                                            backgroundColor: isActiveTab ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                            borderLeft: isActiveTab
                                                ? '3px solid rgba(255, 255, 255, 0.5)'
                                                : '3px solid transparent',
                                            margin: '0 8px',
                                        }}
                                    >
                                        <img
                                            src={Images.get(tab.image)}
                                            alt={tab.id}
                                            style={{ width: '20px', height: '20px', marginRight: '6px' }}
                                        />
                                        <h3
                                            style={{
                                                flexGrow: 1,
                                                fontSize: '18px',
                                                fontWeight: '400',
                                                color: color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                            }}
                                        >
                                            {tab.id}
                                            {isTutorialReady ? (
                                                <NavBadge color="#0e9c34">Ready</NavBadge>
                                            ) : hasUnseenSummons ? (
                                                <NavBadge color="#7408cc">New Summon</NavBadge>
                                            ) : hasCanSummon ? (
                                                <NavBadge color="#0e9c34">Can Summon</NavBadge>
                                            ) : (
                                                isNewTab && <NavBadge color="#9e370e">NEW</NavBadge>
                                            )}
                                        </h3>
                                        {tab.id === 'Task Board' && totalTasks > 0 && (
                                            <span style={{ fontSize: '16px', color: 'white', lineHeight: '1' }}>
                                                {totalTasks - completedTasks} Available
                                            </span>
                                        )}
                                        {tab.id === 'Creatures' && awakenGoldPerMinute > 0 && goldImage && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', lineHeight: '1' }}>
                                                <img
                                                    className="pixel"
                                                    src={Images.get(goldImage)}
                                                    alt="Gold"
                                                    style={{ width: '16px', height: '16px' }}
                                                />
                                                <span style={{ fontSize: '16px', color: 'white' }}>
                                                    {awakenGoldPerMinute}/min
                                                </span>
                                            </div>
                                        )}
                                        {tab.id === 'Merchant' && goldImage && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', lineHeight: '1' }}>
                                                <img
                                                    className="pixel"
                                                    src={Images.get(goldImage)}
                                                    alt="Gold"
                                                    style={{ width: '16px', height: '16px' }}
                                                />
                                                <span style={{ fontSize: '16px', color: 'white' }}>
                                                    {goldAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {tab.id === 'Awaken Tree' && awakenPointsImage && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', lineHeight: '1' }}>
                                                <img
                                                    className="pixel"
                                                    src={Images.get(awakenPointsImage)}
                                                    alt="Awaken Points"
                                                    style={{ width: '16px', height: '16px' }}
                                                />
                                                <span style={{ fontSize: '16px', color: 'white' }}>
                                                    {awakenPointsAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {tab.id === 'Fabrication' && prestigePointsImage && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', lineHeight: '1' }}>
                                                <img
                                                    className="pixel"
                                                    src={Images.get(prestigePointsImage)}
                                                    alt="Prestige Points"
                                                    style={{ width: '16px', height: '16px' }}
                                                />
                                                <span style={{ fontSize: '16px', color: 'white' }}>
                                                    {prestigePointsAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {tab.id === 'Helpers' && (
                                            <span style={{ fontSize: '16px', color: 'white', lineHeight: '1' }}>
                                                {activeHelpers}/6 Active
                                            </span>
                                        )}
                                        {tab.id === 'Sanctuary' && (
                                            <span style={{ fontSize: '16px', color: 'white', lineHeight: '1' }}>
                                                {activeSanctuary}/8 Active
                                            </span>
                                        )}
                                        <h3 style={{ fontSize: '16px', fontWeight: '400', color: color }}>
                                            {tabUnlocked ||
                                            section.section === 'Mini-Games' ||
                                            tab.id === 'Machines' ||
                                            tab.id === 'Player Handbook'
                                                ? getNavigationSubtext(state, tab.id)
                                                : ''}
                                        </h3>
                                    </div>
                                )

                                if (showLockedTooltip) {
                                    return (
                                        <Tooltip
                                            key={tab.id}
                                            width="auto"
                                            offsetY={-10}
                                            content={
                                                <p
                                                    style={{
                                                        fontSize: '16px',
                                                        color: 'rgba(255,255,255,0.8)',
                                                        margin: 0,
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {tab.id === 'Dungeons'
                                                        ? 'Currently being reworked! Stay tuned.'
                                                        : tab.id === 'Fabrication'
                                                          ? 'Unlocks when you awaken your first creature.'
                                                          : 'Awaken a Creature to Unlock'}
                                                </p>
                                            }
                                        >
                                            {tabElement}
                                        </Tooltip>
                                    )
                                }

                                return tabElement
                            })}
                    </div>
                )
            })}
            <ConfirmModal
                opened={!!confirmModal}
                onClose={() => setConfirmModal(null)}
                onConfirm={() => {
                    confirmModal?.action()
                    setConfirmModal(null)
                }}
                text={confirmModal?.text ?? ''}
            />
        </>
    )
}

import { Navbar } from '@components/navbar/Navbar'
import { StateProps } from '@engine/types'
import { AppShell, ScrollArea } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect, useState, useRef } from 'react'
import NavSkillProgress from '@components/navbar/NavSkillProgress'
import { Notifications } from '@mantine/notifications'
import { FLAT_NAVIGATION_MAP } from '@utils/navigation'
import LayoutContent from '@components/navbar/LayoutContent'
import { DEFAULT_SETTINGS } from '@engine/settings'
import { isTabUnlocked } from '@modules/story/helpers'
import Navigation from '@modules/navigation/dispatch'
import { FloatingNotificationsRenderer } from '@utils/floating-notifications'

interface Props extends StateProps {
    isSaving: boolean
    showEnding: (show: boolean) => void
}

function Game({ state, dispatch, isSaving, showEnding }: Props) {
    const [opened] = useDisclosure()
    const [tab, setTab] = useState(() => {
        const disabledTabs = state.settings?.disabledNavigationTabs || []
        const explicit = FLAT_NAVIGATION_MAP.find((tab) => tab.id === state.tab && !disabledTabs.includes(tab.id))
        if (explicit && (!explicit.component || isTabUnlocked(state, explicit.id))) {
            return explicit
        }
        return FLAT_NAVIGATION_MAP.find(
            (candidate) => candidate.component && isTabUnlocked(state, candidate.id) && !disabledTabs.includes(candidate.id)
        )
    })
    const inProgress = state.progress.skilling.id !== ''
    const settings = state.settings || DEFAULT_SETTINGS
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    // Force ScrollArea to recalculate when window resizes (for scaling)
    useEffect(() => {
        if (!window.api?.onWindowResize) return

        const handleResize = () => {
            // Trigger a recalculation by forcing a resize event
            if (scrollAreaRef.current) {
                const scrollArea = scrollAreaRef.current.querySelector('[data-mantine-scroll-area-viewport]')
                if (scrollArea) {
                    // Force a layout recalculation by triggering a resize
                    window.dispatchEvent(new Event('resize'))
                }
            }
        }

        window.api.onWindowResize(handleResize)
        return () => {
            if (window.api?.removeWindowResizeListener) {
                window.api.removeWindowResizeListener()
            }
        }
    }, [])

    useEffect(() => {
        const disabledTabs = state.settings?.disabledNavigationTabs || []
        const explicit = FLAT_NAVIGATION_MAP.find((tab) => tab.id === state.tab && !disabledTabs.includes(tab.id))
        if (explicit && (!explicit.component || isTabUnlocked(state, explicit.id))) {
            setTab(explicit)
        } else {
            const fallback = FLAT_NAVIGATION_MAP.find(
                (candidate) => candidate.component && isTabUnlocked(state, candidate.id) && !disabledTabs.includes(candidate.id)
            )
            if (fallback) {
                setTab(fallback)
                Navigation.tab(dispatch, fallback.id)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.tab, state.story, state.settings?.disabledNavigationTabs, dispatch])

    // Mark current tab as visited when it changes (only for component tabs)
    useEffect(() => {
        if (tab?.component && tab.id && !state.visitedTabs?.includes(tab.id)) {
            Navigation.tab(dispatch, tab.id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab?.id])

    // Apply font setting dynamically
    useEffect(() => {
        const selectedFont = settings.selectedFont || 'GameFont'
        document.documentElement.style.setProperty('--game-font-family', `'${selectedFont}'`)
    }, [settings.selectedFont])

    const crtClass = settings.crtEffect ? 'crt' : ''
    const oldSchoolClass = settings.oldSchoolMode ? 'old-school-mode' : ''
    const disableAwakenClass = settings.disableAwakenCreatureAnimation ? 'disable-awaken-animation' : ''
    const combinedClass = [crtClass, oldSchoolClass, disableAwakenClass].filter(Boolean).join(' ')

    return (
        <div className={combinedClass || undefined}>
            <AppShell navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }} padding="md">
                <AppShell.Navbar
                    className="custom-navbar-scroll"
                    style={{
                        paddingBottom: inProgress ? '0' : '0',
                        backgroundColor: 'rgba(0,0,0,.4)',
                        backgroundImage: `
                            linear-gradient(45deg, rgba(30, 30, 30, 0.2) 25%, transparent 25%),
                            linear-gradient(-45deg, rgba(30, 30, 30, 0.2) 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, rgba(30, 30, 30, 0.2) 75%),
                            linear-gradient(-45deg, transparent 75%, rgba(30, 30, 30, 0.2) 75%)
                        `,
                        backgroundSize: '40px 40px',
                        backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px',
                        border: '1px solid rgba(255,255,255,.25)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <ScrollArea scrollbarSize={8} style={{ height: '100%', flex: 1 }} ref={scrollAreaRef}>
                        <div style={{ paddingBottom: '80px' }}>
                            <NavSkillProgress state={state} dispatch={dispatch} />
                            <Navbar state={state} dispatch={dispatch} />
                        </div>
                    </ScrollArea>
                </AppShell.Navbar>
                <AppShell.Main p={0} pl={'280px'}>
                    <LayoutContent state={state} dispatch={dispatch} tab={tab!} showEnding={showEnding} />
                </AppShell.Main>
            </AppShell>
            <Notifications
                style={{
                    position: 'fixed',
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    zIndex: 1000,
                    overflow: 'hidden',
                }}
                limit={5}
            />
            <FloatingNotificationsRenderer />
        </div>
    )
}

export default Game

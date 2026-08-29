import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import GlobalConfig from '@configs/global'
import Dispatcher from '@engine/dispatcher'
import Saves, { DEFAULT_SAVE } from '@engine/saves'
import { State } from '@engine/types'
import Layout from './Layout'
import { isDataValid } from '@utils/data-validations'
import { calculateOfflineProgress, OfflineProgressResult } from '@utils/offline-progress'
import OfflineProgressModal from './components/panels/OfflineProgressModal'
import FirstTimeLoadModal from './components/panels/FirstTimeLoadModal'
import EndScreenModal, { EndScreenStats } from './components/panels/EndScreenModal'
import { useDisclosure } from '@mantine/hooks'
import Sounds from '@utils/sounds'
import { updateNotificationSettings } from '@utils/notification'
import { updateFloatingNotificationSettings } from '@utils/floating-notifications'
import Music from '@utils/music'
import CreaturesContent from '@data/creatures'
import { checkForNewDiscoverableCreatures } from '@modules/collections/helpers'
import AutoScaleManager from '../components/AutoScaleManager'

function GameWrapper() {
    const [state, dispatch] = useReducer(Dispatcher.reducer, DEFAULT_SAVE)
    const [loaded, setLoaded] = useState(false)
    const [offlineResult, setOfflineResult] = useState<OfflineProgressResult | null>(null)
    const [offlineModalOpened, { open: openOfflineModal, close: closeOfflineModal }] = useDisclosure(false)
    const [firstTimeLoadModalOpened, { open: openFirstTimeLoadModal, close: closeFirstTimeLoadModal }] = useDisclosure(false)
    const [endScreenOpened, { open: openEndScreen, close: closeEndScreen }] = useDisclosure(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showEnding, setShowEnding] = useState(false)
    const showEndingRef = useRef(false)
    const [statsSnapshot, setStatsSnapshot] = useState<EndScreenStats | null>(null)
    const endScreenTriggeredRef = useRef(false)
    const savingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const stateRef = useRef(state)

    // Keep refs in sync with state
    useEffect(() => {
        stateRef.current = state
    }, [state])

    useEffect(() => {
        showEndingRef.current = showEnding
    }, [showEnding])

    /**
     * Detect 24 Hour Offline Potion result and show the offline progress modal
     */
    useEffect(() => {
        if (!loaded) return
        const potionResult = (state as any).pendingOfflinePotionResult
        if (potionResult) {
            setOfflineResult(potionResult)
            setTimeout(() => openOfflineModal(), 500)
            // Clear the flag so it doesn't re-trigger
            dispatch({
                action: (currentState: State) => {
                    delete (currentState as any).pendingOfflinePotionResult
                    return currentState
                },
                payload: {},
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [(state as any).pendingOfflinePotionResult, loaded])

    /**
     * End Screen - trigger when all 120 unique creature species are summoned
     */
    useEffect(() => {
        if (!loaded) return
        if (state.gameCompleted) return
        if (endScreenTriggeredRef.current) return

        const uniqueSummons = new Set(state.creatures.map((c: any) => c.species)).size
        const totalCreatures = CreaturesContent.get.length

        if (uniqueSummons >= totalCreatures) {
            endScreenTriggeredRef.current = true
            setStatsSnapshot({
                onlinePlaytime: (state as any).onlinePlaytime ?? 0,
                offlinePlaytime: (state as any).offlinePlaytime ?? 0,
                totalPlaytime: state.totalPlaytime ?? 0,
            })
            setShowEnding(true)
            setTimeout(() => openEndScreen(), 500)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.creatures, loaded])

    const handleEndScreenClose = () => {
        dispatch({
            action: (currentState: State) => {
                currentState.gameCompleted = true
                return currentState
            },
            payload: {},
        })
        setShowEnding(false)
        closeEndScreen()
    }

    useEffect(() => {
        document.title = `${GlobalConfig.PROJECT_INFO.TITLE}`

        isDataValid()

        const loadingState = async () => {
            const log = (msg: string) => window.api?.log?.('info', msg)?.catch(() => {})
            const logError = (msg: string) => window.api?.log?.('error', msg)?.catch(() => {})

            try {
                log('GameWrapper: starting loadingState')
                const initialState = await Saves.load()
                log('GameWrapper: save loaded successfully')

                // Check if this is a new game (firstPlayTime not set)
                const isNewGame = !initialState.firstPlayTime
                log('GameWrapper: isNewGame=' + isNewGame)

                // Validate and clean inventory (safety check)
                const { validateAndCleanInventory } = require('@modules/inventory/helpers')
                if (initialState.inventory && Array.isArray(initialState.inventory)) {
                    initialState.inventory = validateAndCleanInventory(initialState.inventory)
                }
                log('GameWrapper: inventory validated')

                // Ensure settings exist and migrate old settings format
                if (!initialState.settings) {
                    const { DEFAULT_SETTINGS } = require('@engine/settings')
                    initialState.settings = DEFAULT_SETTINGS
                } else {
                    // Migrate old settings format to new format
                    const { DEFAULT_SETTINGS } = require('@engine/settings')
                    const oldSettings = initialState.settings as any
                    initialState.settings = {
                        // Audio - keep existing or use defaults
                        masterVolume: oldSettings.masterVolume ?? DEFAULT_SETTINGS.masterVolume,
                        soundEffectsVolume: oldSettings.soundEffectsVolume ?? DEFAULT_SETTINGS.soundEffectsVolume,
                        musicVolume: oldSettings.musicVolume ?? DEFAULT_SETTINGS.musicVolume,
                        enableSoundEffects: oldSettings.enableSoundEffects ?? DEFAULT_SETTINGS.enableSoundEffects,
                        enableMusic: oldSettings.enableMusic ?? DEFAULT_SETTINGS.enableMusic,
                        // Interface - keep existing or use defaults
                        crtEffect: oldSettings.crtEffect ?? DEFAULT_SETTINGS.crtEffect,
                        showSaveIndicator: oldSettings.showSaveIndicator ?? DEFAULT_SETTINGS.showSaveIndicator,
                        enableItemGainNotifications:
                            oldSettings.enableItemGainNotifications ?? DEFAULT_SETTINGS.enableItemGainNotifications,
                        selectedFont: (() => {
                            const font = oldSettings.selectedFont ?? DEFAULT_SETTINGS.selectedFont
                            // Migrate removed fonts to default
                            if (font === '8BitWonder' || font === 'sans-serif') {
                                return DEFAULT_SETTINGS.selectedFont
                            }
                            return font
                        })(),
                        zoomFactor: oldSettings.zoomFactor ?? DEFAULT_SETTINGS.zoomFactor,
                        autoScaleEnabled: oldSettings.autoScaleEnabled ?? DEFAULT_SETTINGS.autoScaleEnabled,
                        oldSchoolMode: oldSettings.oldSchoolMode ?? DEFAULT_SETTINGS.oldSchoolMode,
                        fullscreen: oldSettings.fullscreen ?? DEFAULT_SETTINGS.fullscreen,
                        enableNotificationSounds:
                            oldSettings.enableNotificationSounds ?? DEFAULT_SETTINGS.enableNotificationSounds,
                        showCanSummonBadge: oldSettings.showCanSummonBadge ?? DEFAULT_SETTINGS.showCanSummonBadge,
                        disableAwakenCreatureAnimation:
                            oldSettings.disableAwakenCreatureAnimation ?? DEFAULT_SETTINGS.disableAwakenCreatureAnimation,
                        // Gameplay - keep existing or use defaults
                        offlineProgress: oldSettings.offlineProgress ?? DEFAULT_SETTINGS.offlineProgress,
                        disabledNavigationTabs: oldSettings.disabledNavigationTabs ?? DEFAULT_SETTINGS.disabledNavigationTabs,
                        autoCollectExpeditions: oldSettings.autoCollectExpeditions ?? DEFAULT_SETTINGS.autoCollectExpeditions,
                        defaultLoopExpeditions: oldSettings.defaultLoopExpeditions ?? DEFAULT_SETTINGS.defaultLoopExpeditions,
                        creatureProgressTowardsCap:
                            oldSettings.creatureProgressTowardsCap ?? DEFAULT_SETTINGS.creatureProgressTowardsCap,
                        muteWhenUnfocused: oldSettings.muteWhenUnfocused ?? DEFAULT_SETTINGS.muteWhenUnfocused,
                        disableConfirmAwakenTreeUpgrade:
                            oldSettings.disableConfirmAwakenTreeUpgrade ?? DEFAULT_SETTINGS.disableConfirmAwakenTreeUpgrade,
                    }
                }

                log('GameWrapper: settings migration complete')

                // Sync settings to systems
                if (initialState.settings) {
                    Sounds.updateSettings(initialState.settings)
                    Music.updateSettings(initialState.settings)
                    // Apply font setting immediately
                    const selectedFont = initialState.settings.selectedFont || 'GameFont'
                    document.documentElement.style.setProperty('--game-font-family', `'${selectedFont}'`)
                    // Apply zoom factor immediately
                    if (window.api?.setZoomFactor) {
                        const zoomFactor = initialState.settings.zoomFactor ?? 1.0
                        window.api.setZoomFactor(zoomFactor)
                    }
                    // Use default notification settings (always enabled)
                    updateNotificationSettings({
                        enableNotifications: true,
                        notificationDuration: 1000,
                    })
                    updateFloatingNotificationSettings({
                        enableNotifications: initialState.settings.enableItemGainNotifications ?? true,
                        enableNotificationSounds: initialState.settings.enableNotificationSounds ?? true,
                    })

                    // Auto-play music on initial load if enabled and not manually paused
                    // But don't auto-play if it's a new game - let the user decide first
                    if (!isNewGame) {
                        if (initialState.settings.enableMusic && !Music.getIsPlaying() && !Music.getIsManuallyPaused()) {
                            Music.play()
                        } else if (!initialState.settings.enableMusic && Music.getIsPlaying()) {
                            Music.pause()
                        }
                    }
                }

                // Initialize firstPlayTime if not set
                if (!initialState.firstPlayTime) {
                    initialState.firstPlayTime = Date.now() / 1000
                }

                // Initialize firstTimeLoad if not set (for backward compatibility, default to false for existing saves)
                if (typeof (initialState as any).firstTimeLoad === 'undefined') {
                    ;(initialState as any).firstTimeLoad = false // Existing saves should not show the modal
                }

                // Migrate playtime fields if they don't exist (for existing saves)
                if (typeof (initialState as any).onlinePlaytime === 'undefined') {
                    ;(initialState as any).onlinePlaytime = initialState.totalPlaytime || 0
                }
                if (typeof (initialState as any).offlinePlaytime === 'undefined') {
                    ;(initialState as any).offlinePlaytime = 0
                }
                // Ensure totalPlaytime is the sum
                initialState.totalPlaytime = (initialState as any).onlinePlaytime + (initialState as any).offlinePlaytime

                // Initialize task board if no tasks exist
                if (!initialState.taskBoard || initialState.taskBoard.tasks.length === 0) {
                    const now = new Date()
                    const topOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0)
                    const currentTime = topOfHour.getTime() / 1000

                    if (!initialState.taskBoard) {
                        initialState.taskBoard = {
                            tasks: [],
                            lastResetTime: null,
                        }
                    }

                    // Note: generateTasks requires state, but we're initializing, so we'll use the initialState
                    // We need to pass the state to generateTasks, but we're still building it
                    // For now, we'll let the update loop handle it, or we can call it after dispatch
                    // Actually, let's just set lastResetTime and let the update loop generate tasks
                    initialState.taskBoard.lastResetTime = currentTime
                }

                log('GameWrapper: settings synced, calculating offline progress')
                // Calculate offline progress if enabled
                if (initialState.settings?.offlineProgress ?? GlobalConfig.OFFLINE_PROGRESS.ENABLED) {
                    const result = calculateOfflineProgress(initialState)
                    if (result) {
                        setOfflineResult(result)
                        // Show modal after a short delay to let UI render
                        setTimeout(() => {
                            openOfflineModal()
                        }, 500)
                    }
                    // Note: calculateOfflineProgress already updates lastSaveTime and totalPlaytime
                } else {
                    // Update lastSaveTime when offline progress is disabled
                    const currentTime = Date.now() / 1000
                    if (initialState.lastSaveTime) {
                        // Add time since last save to online playtime (since game wasn't closed, it's online time)
                        const timeSinceLastSave = currentTime - initialState.lastSaveTime
                        ;(initialState as any).onlinePlaytime += timeSinceLastSave
                        initialState.totalPlaytime = (initialState as any).onlinePlaytime + (initialState as any).offlinePlaytime
                    }
                    initialState.lastSaveTime = currentTime
                }

                // Initialize unseenSummons and seenSummons if they don't exist
                if (!initialState.unseenSummons) {
                    initialState.unseenSummons = []
                }
                if (!initialState.seenSummons) {
                    initialState.seenSummons = []
                }

                // Check for discoverable creatures on load (populate unseenSummons for creatures that are already discoverable but not seen)
                checkForNewDiscoverableCreatures(initialState)

                dispatch({ action: () => initialState, payload: {} })
                setLoaded(true)

                // Show first-time load modal if needed (after a short delay to let UI render)
                // Only show if explicitly true (new games) - existing saves will have false or undefined
                if ((initialState as any).firstTimeLoad === true) {
                    setTimeout(() => {
                        openFirstTimeLoadModal()
                    }, 500)
                }
                log('GameWrapper: loadingState complete, game is ready')
            } catch (err) {
                logError('GameWrapper: FATAL error during loadingState: ' + String(err))
                console.error('GameWrapper: FATAL error during loadingState:', err)
            }
        }
        loadingState()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /**
     * Gameplay Loop
     */
    useEffect(() => {
        // Skip if not Loaded yet
        if (!loaded) return

        // Required Variables and Tracking
        const fixedUpdateInSeconds = 1
        const fixedUpdateRate = 1 / fixedUpdateInSeconds
        const DISPATCH_INTERVAL_MS = 33 // Sync to React at ~30fps
        const SLEEP_THRESHOLD_MS = 10_000 // 10 seconds gap = PC went to sleep
        let frameId = 0
        let prevFrameTime = 0
        let lastRealTime = Date.now() // Track real wall-clock time for sleep detection
        let accumulatedLagTime = 0
        let timeSinceLastDispatch = 0
        let accumulatedDelta = 0
        let pendingFixedUpdates = 0

        // Stopping Gameplay Loop Handler
        const stop = () => {
            cancelAnimationFrame(frameId)
            if (savingTimeoutRef.current) {
                clearTimeout(savingTimeoutRef.current)
                savingTimeoutRef.current = null
            }
        }

        // Ticks
        let currentFrameTime = 0
        let lastSave = 0
        const tick = (currentFrameTime: number) => {
            try {
                frameId = requestAnimationFrame(tick)

                // Detect sleep/wake by comparing real wall-clock time
                const now = Date.now()
                const realElapsed = now - lastRealTime
                lastRealTime = now

                if (realElapsed >= SLEEP_THRESHOLD_MS) {
                    // PC was asleep — trigger offline progress for the sleep duration
                    const offlineEnabled = stateRef.current.settings?.offlineProgress ?? GlobalConfig.OFFLINE_PROGRESS.ENABLED
                    if (offlineEnabled) {
                        dispatch({
                            action: (currentState: State) => {
                                const result = calculateOfflineProgress(currentState)
                                if (result) {
                                    setOfflineResult(result)
                                    setTimeout(() => openOfflineModal(), 500)
                                }
                                currentState.lastSaveTime = Date.now() / 1000
                                Saves.save(currentState)
                                return currentState
                            },
                            payload: {},
                        })
                    }
                    // Reset loop timing so we don't process the sleep gap as game time
                    prevFrameTime = currentFrameTime
                    accumulatedLagTime = 0
                    timeSinceLastDispatch = 0
                    accumulatedDelta = 0
                    pendingFixedUpdates = 0
                    lastSave = 0
                    return
                }

                // Calculate Lag & Delta Time
                const deltaMS = currentFrameTime - prevFrameTime

                // Calculate Delta Time
                const deltaTime = Math.min(fixedUpdateRate, deltaMS / 1000)
                accumulatedLagTime += deltaTime
                lastSave += deltaTime
                timeSinceLastDispatch += deltaMS
                accumulatedDelta += deltaTime

                // Count pending fixed updates
                while (accumulatedLagTime >= fixedUpdateRate) {
                    accumulatedLagTime -= fixedUpdateRate
                    pendingFixedUpdates++
                }

                // Batch all game logic into a single dispatch at throttled rate
                if (timeSinceLastDispatch >= DISPATCH_INTERVAL_MS) {
                    Dispatcher.gameTick(dispatch, accumulatedDelta, deltaTime, pendingFixedUpdates, !showEndingRef.current)
                    pendingFixedUpdates = 0
                    accumulatedDelta = 0
                    timeSinceLastDispatch = 0
                }

                // Check if save is needed (auto-save every 30 seconds)
                const autoSaveIntervalMinutes = 0.5 // 30 seconds
                if (lastSave >= autoSaveIntervalMinutes * 60) {
                    // Update lastSaveTime before saving
                    setIsSaving(true)
                    dispatch({
                        action: (currentState: State) => {
                            currentState.lastSaveTime = Date.now() / 1000
                            Saves.save(currentState)
                            return currentState
                        },
                        payload: {},
                    })
                    // Hide save indicator after a short delay
                    if (savingTimeoutRef.current) clearTimeout(savingTimeoutRef.current)
                    savingTimeoutRef.current = setTimeout(() => setIsSaving(false), 2000)
                    lastSave = 0
                }

                // Set Frame Time
                prevFrameTime = currentFrameTime
            } catch (err) {
                stop()
                throw err
            }
        }

        tick(currentFrameTime)

        return stop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loaded])

    /**
     * Save on Reload & Safe Exit
     */
    useEffect(() => {
        // Skip if not Loaded yet
        if (!loaded) return

        const handler = () => {
            // Save synchronously from the ref — dispatching here would schedule
            // a React update that may never process because the window is closing,
            // which keeps the event loop alive and causes Electron to hang.
            const currentState = stateRef.current
            currentState.lastSaveTime = Date.now() / 1000
            Saves.save(currentState)
        }

        window.addEventListener('beforeunload', handler)

        return () => {
            window.removeEventListener('beforeunload', handler)
        }
    }, [loaded])

    /**
     * Sync settings changes to systems
     * Uses a ref to compare values so this doesn't fire on every structuredClone dispatch (~30fps)
     */
    const prevSettingsRef = useRef<string>('')
    useEffect(() => {
        if (!loaded || !state.settings) return

        // Only sync when settings values actually change (not just reference from structuredClone)
        const settingsKey = JSON.stringify(state.settings)
        if (settingsKey === prevSettingsRef.current) return
        prevSettingsRef.current = settingsKey

        Sounds.updateSettings(state.settings)
        Music.updateSettings(state.settings)
        // Apply zoom factor when settings change (only if auto-scaling is disabled, or when manually changed)
        // AutoScaleManager will handle updates when auto-scaling is enabled
        if (window.api?.setZoomFactor && !state.settings.autoScaleEnabled) {
            const zoomFactor = state.settings.zoomFactor ?? 1.0
            window.api.setZoomFactor(zoomFactor)
        }
        // Use default notification settings (always enabled)
        updateNotificationSettings({
            enableNotifications: true,
            notificationDuration: 1000,
        })
        updateFloatingNotificationSettings({
            enableNotifications: state.settings.enableItemGainNotifications ?? true,
            enableNotificationSounds: state.settings.enableNotificationSounds ?? true,
        })

        // Handle music play/pause based on settings (skip if muted for unfocus)
        if (!Music.getIsMutedForUnfocus()) {
            if (state.settings.enableMusic && !Music.getIsPlaying() && !Music.getIsManuallyPaused()) {
                Music.play()
            } else if (!state.settings.enableMusic && Music.getIsPlaying()) {
                Music.pause()
            }
        }
    }, [state.settings, loaded])

    /**
     * Mute sound when window loses focus (if setting enabled)
     */
    const settingsRef = useRef(state.settings)
    useEffect(() => {
        settingsRef.current = state.settings
    }, [state.settings])

    const handleWindowFocusChange = useCallback((focused: boolean) => {
        const s = settingsRef.current
        if (!s?.muteWhenUnfocused) return
        if (focused) {
            Music.unmuteForUnfocus()
            Sounds.unmuteForUnfocus()
        } else {
            Music.muteForUnfocus()
            Sounds.muteForUnfocus()
        }
    }, [])

    useEffect(() => {
        if (!loaded) return
        if (!window.api?.onWindowFocusChange) return
        window.api.onWindowFocusChange(handleWindowFocusChange)
        return () => {
            window.api?.removeWindowFocusChangeListener?.()
        }
    }, [loaded, handleWindowFocusChange])

    if (!loaded) return <div>Loading...</div>

    return (
        <div>
            <AutoScaleManager state={state} dispatch={dispatch} />
            <Layout state={state} dispatch={dispatch} isSaving={isSaving} showEnding={setShowEnding} />
            <FirstTimeLoadModal
                opened={firstTimeLoadModalOpened}
                onClose={closeFirstTimeLoadModal}
                state={state}
                dispatch={dispatch}
            />
            <OfflineProgressModal opened={offlineModalOpened} onClose={closeOfflineModal} result={offlineResult} />
            <EndScreenModal opened={endScreenOpened} onClose={handleEndScreenClose} stats={statsSnapshot} />
        </div>
    )
}

export default GameWrapper

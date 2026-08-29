export interface Settings {
    // Audio
    masterVolume: number // 0-100
    soundEffectsVolume: number // 0-100
    musicVolume: number // 0-100
    enableSoundEffects: boolean
    enableMusic: boolean
    muteWhenUnfocused: boolean

    // Interface
    crtEffect: boolean
    showSaveIndicator: boolean
    enableItemGainNotifications: boolean
    selectedFont: string // Font family name
    zoomFactor: number // 0.5-2.0 (50%-200%)
    autoScaleEnabled: boolean // If true, automatically scale based on window width. If false, use manual zoomFactor
    oldSchoolMode: boolean // Turn everything green (monochrome green display)
    fullscreen: boolean // Whether the window is in fullscreen mode
    enableNotificationSounds: boolean // Play pop sound on resource gain notifications
    showCanSummonBadge: boolean // Show "Can Summon" badge in navigation
    disableAwakenCreatureAnimation: boolean // Disable shine/glow effect on awakened creatures

    // Gameplay
    offlineProgress: boolean
    disabledNavigationTabs: string[] // Array of tab IDs to disable
    autoCollectExpeditions: boolean
    defaultLoopExpeditions: boolean
    creatureProgressTowardsCap: boolean
    disableConfirmAwakenTreeUpgrade: boolean // Skip confirmation when purchasing awaken tree upgrades
}

export const DEFAULT_SETTINGS: Settings = {
    // Audio
    masterVolume: 50,
    soundEffectsVolume: 75,
    musicVolume: 8,
    enableSoundEffects: true,
    enableMusic: true,
    muteWhenUnfocused: false,

    // Interface
    crtEffect: true,
    showSaveIndicator: true,
    enableItemGainNotifications: true,
    selectedFont: 'GameFont', // Default to the original game font
    zoomFactor: 1.0, // Default 100% zoom
    autoScaleEnabled: true, // Default to auto-scaling enabled
    oldSchoolMode: false, // Default to normal colors
    fullscreen: false, // Default to windowed mode
    enableNotificationSounds: true, // Default to playing notification sounds
    showCanSummonBadge: true, // Default to showing "Can Summon" badge
    disableAwakenCreatureAnimation: false, // Default to showing awakened effects

    // Gameplay
    offlineProgress: true,
    disabledNavigationTabs: [],
    autoCollectExpeditions: true,
    defaultLoopExpeditions: true,
    creatureProgressTowardsCap: false,
    disableConfirmAwakenTreeUpgrade: false, // Default to showing confirmation
}

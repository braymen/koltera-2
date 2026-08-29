const PROJECT_INFO = {
    TITLE: 'Koltera 2',
    VERSION: '5.4',
}

const SAVING = {
    AUTO_SAVE_TIMER_MINUTES: 0.5,
}

const OFFLINE_PROGRESS = {
    ENABLED: true,
}

const AUTO_SCALE_CONFIG = {
    THRESHOLDS: [
        [1296, 1.0], // Default minimum width: 100% scale
        [1600, 1.2], // At 1600px width: 120% scale
        [1920, 1.4], // At 1920px width: 140% scale
        [2560, 1.6], // At 2560px width: 160% scale
        [3840, 1.8], // At 3840px width: 180% scale
    ] as Array<[number, number]>,
}

const GlobalConfig = {
    PROJECT_INFO,
    SAVING,
    OFFLINE_PROGRESS,
    AUTO_SCALE_CONFIG,
}
export default GlobalConfig

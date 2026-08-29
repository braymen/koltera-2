// @ts-nocheck
import { Howl } from 'howler'

function importAll(r) {
    let sounds = {}
    r.keys().forEach((item) => {
        sounds[item.replace('./', '')] = r(item)
    })
    return sounds
}

const sounds = importAll(require.context('../content/sounds/', true))

let SoundLibrary = {}
let Keys = Object.keys(sounds)
for (let i = 0; i < Keys.length; i++) {
    SoundLibrary[Keys[i]] = new Howl({
        src: sounds[Keys[i]],
        volume: Keys[i] === 'type' ? 0.05 : 0.75,
        pool: 1, // Minimize retained Sound objects (we throttle rapid plays)
    })
}

// Settings state (will be updated from game state)
let isMutedForUnfocus = false

let currentSettings = {
    masterVolume: 75,
    soundEffectsVolume: 75,
    musicVolume: 50,
    enableSoundEffects: true,
    enableMusic: true,
}

export const updateSettings = (settings: any) => {
    currentSettings = settings
    updateVolumes()
}

const updateVolumes = () => {
    const masterMultiplier = currentSettings.masterVolume / 100
    let keys = Object.keys(SoundLibrary)
    for (let i = 0; i < keys.length; i++) {
        const key = Keys[i]
        const isMusic = key.includes('music') || key.includes('bgm')
        const baseVolume = key === 'type' ? 0.05 : isMusic ? 0.5 : 0.75
        const volumeMultiplier = isMusic ? currentSettings.musicVolume / 100 : currentSettings.soundEffectsVolume / 100
        SoundLibrary[key].volume(baseVolume * masterMultiplier * volumeMultiplier)
    }
}

// Throttle rapid-fire sounds to prevent Howler internal node accumulation
const lastPlayTime = {}
const SOUND_THROTTLE_MS = 80

const play = (key: string) => {
    if (isMutedForUnfocus) return
    if (!currentSettings.enableSoundEffects) return
    const isMusic = key.includes('music') || key.includes('bgm')
    if (isMusic && !currentSettings.enableMusic) return
    if (!isMusic && !currentSettings.enableSoundEffects) return

    // Throttle rapid-fire sounds (e.g. pop.wav from many helpers)
    const now = performance.now()
    if (lastPlayTime[key] && now - lastPlayTime[key] < SOUND_THROTTLE_MS) return
    lastPlayTime[key] = now

    SoundLibrary[key]?.play()
}

const volume = (level: number) => {
    let keys = Object.keys(SoundLibrary)
    for (let i = 0; i < keys.length; i++) {
        SoundLibrary[keys[i]].volume(level)
    }
}

const stop = () => {
    let keys = Object.keys(SoundLibrary)
    for (let i = 0; i < keys.length; i++) {
        SoundLibrary[keys[i]].stop()
    }
}

// Initialize volumes
updateVolumes()

const muteForUnfocus = () => {
    isMutedForUnfocus = true
    stop()
}

const unmuteForUnfocus = () => {
    isMutedForUnfocus = false
}

const Sounds = {
    play,
    volume,
    stop,
    updateSettings,
    muteForUnfocus,
    unmuteForUnfocus,
}

export default Sounds

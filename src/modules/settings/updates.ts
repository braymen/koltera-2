import { Module, State, Update } from '@engine/types'
import Music from '@utils/music'
import Sounds from '@utils/sounds'

let prevMasterVolume: number | undefined
let prevMusicVolume: number | undefined
let prevEnableMusic: boolean | undefined
let prevSoundEffectsVolume: number | undefined
let prevEnableSoundEffects: boolean | undefined

const onUpdate = (state: State, payload: Update): State => {
    if (!state.settings) return state

    const s = state.settings

    const masterChanged = s.masterVolume !== prevMasterVolume
    const musicChanged = masterChanged || s.musicVolume !== prevMusicVolume || s.enableMusic !== prevEnableMusic
    const soundsChanged =
        masterChanged || s.soundEffectsVolume !== prevSoundEffectsVolume || s.enableSoundEffects !== prevEnableSoundEffects

    if (musicChanged || soundsChanged) {
        prevMasterVolume = s.masterVolume
        prevMusicVolume = s.musicVolume
        prevEnableMusic = s.enableMusic
        prevSoundEffectsVolume = s.soundEffectsVolume
        prevEnableSoundEffects = s.enableSoundEffects
        if (musicChanged) Music.updateSettings(s)
        if (soundsChanged) Sounds.updateSettings(s)
    }

    return state
}

const onFixedUpdate = (state: State, payload: any): State => {
    return state
}

const SettingsModule: Module = {
    onUpdate,
    onFixedUpdate,
}

export default SettingsModule

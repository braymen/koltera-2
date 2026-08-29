// @ts-nocheck
import { Howl } from 'howler'

// Import all music files
function importAll(r: any) {
    let music: Record<string, any> = {}
    r.keys().forEach((item: string) => {
        music[item.replace('./', '')] = r(item)
    })
    return music
}

const musicFiles = importAll(require.context('../content/music/', true, /\.mp3$/))

const allMusicFiles = Object.keys(musicFiles).sort()

// Instead of keeping all Howls alive, create them on demand and unload when done
const musicLibrary: Record<string, Howl | null> = {}

const createTrack = (filename: string): Howl => {
    const howl = new Howl({
        src: musicFiles[filename],
        volume: 0,
        loop: false,
        html5: true,
        pool: 1,
        preload: true,
        onend: () => {
            if (isPlaying && currentTrack === howl) {
                playNextTrackImmediate()
            }
        },
    })
    musicLibrary[filename] = howl
    return howl
}

// Unload a track to free its buffered audio data
const unloadTrack = (filename: string) => {
    const track = musicLibrary[filename]
    if (track) {
        try {
            track.stop()
            track.unload()
        } catch (e) {}
        musicLibrary[filename] = null
    }
}

// Get an existing track or create a fresh one
const getTrack = (filename: string): Howl => {
    const existing = musicLibrary[filename]
    if (existing && existing.state() !== 'unloaded') {
        return existing
    }
    return createTrack(filename)
}

let currentTrackIndex = 0
let currentTrackFilename: string | null = null
let currentTrack: Howl | null = null
let nextTrack: Howl | null = null
let isPlaying = false
let isManuallyPaused = false
let fadeInterval: NodeJS.Timeout | null = null
let fadeTimeout: NodeJS.Timeout | null = null
let fadeCheckInterval: NodeJS.Timeout | null = null
let nextTrackTimeout: NodeJS.Timeout | null = null
let isFading = false
let isMutedForUnfocus = false
let wasPlayingBeforeUnfocus = false

let currentSettings = {
    masterVolume: 75,
    musicVolume: 50,
    enableMusic: true,
}
export const updateSettings = (settings: any) => {
    currentSettings = settings
    updateVolumes()
}

const updateVolumes = () => {
    if (!currentSettings.enableMusic) {
        stop()
        return
    }

    const masterMultiplier = currentSettings.masterVolume / 100
    const musicMultiplier = currentSettings.musicVolume / 100
    const targetVolume = 0.5 * masterMultiplier * musicMultiplier

    if (currentTrack && !isFading) {
        currentTrack.volume(targetVolume)
    }
}

const getTrackName = (filename: string): string => {
    return filename.replace('.mp3', '')
}

const startFadeTransition = () => {
    if (!currentTrack || !isPlaying || isFading) return

    const trackDuration = currentTrack.duration()
    if (!trackDuration || trackDuration < 9) {
        playNextTrackImmediate()
        return
    }

    clearFade()
    if (nextTrackTimeout) {
        clearTimeout(nextTrackTimeout)
        nextTrackTimeout = null
    }

    isFading = true

    const masterMultiplier = currentSettings.masterVolume / 100
    const musicMultiplier = currentSettings.musicVolume / 100
    const targetVolume = 0.5 * masterMultiplier * musicMultiplier

    const fadeOutDuration = 2000
    const updateInterval = 50
    const fadeOutSteps = fadeOutDuration / updateInterval
    let step = 0

    fadeInterval = setInterval(() => {
        if (!currentTrack || !isPlaying) {
            clearFade()
            return
        }

        step++
        const fadeOutProgress = Math.min(step / fadeOutSteps, 1)
        const currentVolume = targetVolume * (1 - fadeOutProgress)
        currentTrack.volume(Math.max(0, currentVolume))

        if (fadeOutProgress >= 1) {
            if (fadeInterval) {
                clearInterval(fadeInterval)
                fadeInterval = null
            }

            // Unload the finished track to free memory
            if (currentTrackFilename) {
                unloadTrack(currentTrackFilename)
            }

            const nextIndex = (currentTrackIndex + 1) % allMusicFiles.length
            currentTrack = null
            currentTrackFilename = null
            currentTrackIndex = nextIndex
            isFading = false

            nextTrackTimeout = setTimeout(() => {
                nextTrackTimeout = null
                playNextTrackImmediate()
            }, 5000)
        }
    }, updateInterval)
}

const setupNextFade = () => {
    if (!currentTrack || !isPlaying || isFading) return

    // Clear any existing fade timeout and check interval
    if (fadeTimeout) {
        clearTimeout(fadeTimeout)
        fadeTimeout = null
    }
    if (fadeCheckInterval) {
        clearInterval(fadeCheckInterval)
        fadeCheckInterval = null
    }

    // Use a periodic check to ensure fade is set up correctly
    fadeCheckInterval = setInterval(() => {
        if (!currentTrack || !isPlaying || isFading) {
            if (fadeCheckInterval) {
                clearInterval(fadeCheckInterval)
                fadeCheckInterval = null
            }
            return
        }

        // Try to get duration
        const trackDuration = currentTrack.duration()
        if (!trackDuration || trackDuration < 9) {
            return // Keep checking
        }

        // Get current position
        const currentSeek = currentTrack.seek() as number
        if (typeof currentSeek !== 'number' || isNaN(currentSeek)) {
            return // Keep checking
        }

        const timeRemaining = trackDuration - currentSeek

        if (timeRemaining <= 9 && timeRemaining > 0 && !fadeTimeout) {
            // We're in the fade zone, start fade immediately
            if (fadeCheckInterval) {
                clearInterval(fadeCheckInterval)
                fadeCheckInterval = null
            }
            startFadeTransition()
        } else if (timeRemaining > 9 && !fadeTimeout) {
            // Set up fade 9 seconds before end
            const timeUntilFade = (timeRemaining - 9) * 1000
            fadeTimeout = setTimeout(
                () => {
                    fadeTimeout = null
                    if (fadeCheckInterval) {
                        clearInterval(fadeCheckInterval)
                        fadeCheckInterval = null
                    }
                    startFadeTransition()
                },
                Math.max(0, timeUntilFade)
            )
        } else if (timeRemaining <= 0) {
            // Track already ended, play next immediately
            if (fadeCheckInterval) {
                clearInterval(fadeCheckInterval)
                fadeCheckInterval = null
            }
            playNextTrackImmediate()
        }
    }, 1000) // Check every second
}

const clearFade = () => {
    isFading = false
    if (fadeInterval) {
        clearInterval(fadeInterval)
        fadeInterval = null
    }
    if (fadeTimeout) {
        clearTimeout(fadeTimeout)
        fadeTimeout = null
    }
    if (fadeCheckInterval) {
        clearInterval(fadeCheckInterval)
        fadeCheckInterval = null
    }
    if (nextTrackTimeout) {
        clearTimeout(nextTrackTimeout)
        nextTrackTimeout = null
    }
    if (nextTrack) {
        nextTrack.stop()
        nextTrack = null
    }
}

const playNextTrackImmediate = () => {
    if (allMusicFiles.length === 0 || !isPlaying) return

    clearFade()

    // Unload the finished track to free memory
    if (currentTrackFilename) {
        unloadTrack(currentTrackFilename)
    }
    currentTrack = null
    currentTrackFilename = null

    // Move to next track
    currentTrackIndex = (currentTrackIndex + 1) % allMusicFiles.length
    const nextFilename = allMusicFiles[currentTrackIndex]
    currentTrack = getTrack(nextFilename)
    currentTrackFilename = nextFilename

    if (currentTrack && currentSettings.enableMusic && isPlaying) {
        // Start new track at full volume immediately (no fade-in)
        const masterMultiplier = currentSettings.masterVolume / 100
        const musicMultiplier = currentSettings.musicVolume / 100
        const targetVolume = 0.5 * masterMultiplier * musicMultiplier

        currentTrack.volume(targetVolume)
        currentTrack.play()

        // Set up fade for this track
        setupNextFade()
    }
}

const playNextTrack = () => {
    // This is called when a track ends naturally (shouldn't happen with fade, but backup)
    playNextTrackImmediate()
}

const play = () => {
    if (!currentSettings.enableMusic || allMusicFiles.length === 0) return

    // Check if any track is already playing (prevents stacking on hot reload)
    if (isAnyTrackPlaying()) {
        // Already playing, don't start another
        return
    }

    // Stop all tracks first to prevent stacking
    stopAllTracks()

    isPlaying = true
    isManuallyPaused = false // Clear manual pause flag when playing

    if (!currentTrack) {
        // Start from beginning
        const filename = allMusicFiles[currentTrackIndex]
        currentTrack = getTrack(filename)
        currentTrackFilename = filename
    }

    if (currentTrack) {
        // Start track at full volume immediately (no fade-in)
        const masterMultiplier = currentSettings.masterVolume / 100
        const musicMultiplier = currentSettings.musicVolume / 100
        const targetVolume = 0.5 * masterMultiplier * musicMultiplier

        currentTrack.volume(targetVolume)
        currentTrack.play()

        // Set up fade transition for this track
        // Use a small delay to ensure seek() returns correct value after play()
        setTimeout(() => {
            if (currentTrack && isPlaying) {
                setupNextFade()
            }
        }, 100)
    }
}

// Helper function to stop all tracks (prevents stacking on hot reload)
const stopAllTracks = () => {
    clearFade()
    Object.keys(musicLibrary).forEach((key) => {
        const track = musicLibrary[key]
        if (track) {
            try {
                if (track.playing()) {
                    track.stop()
                }
            } catch (e) {
                // Ignore errors if track is invalid
            }
        }
    })
    // Also stop current track reference
    if (currentTrack) {
        try {
            if (currentTrack.playing()) {
                currentTrack.stop()
            }
        } catch (e) {
            // Ignore
        }
    }
}

// Check if any track is currently playing
const isAnyTrackPlaying = (): boolean => {
    // Check current track
    if (currentTrack) {
        try {
            if (currentTrack.playing()) return true
        } catch (e) {
            // Ignore
        }
    }
    // Check all tracks in library
    for (const key of Object.keys(musicLibrary)) {
        const track = musicLibrary[key]
        if (track) {
            try {
                if (track.playing()) return true
            } catch (e) {
                // Ignore
            }
        }
    }
    return false
}

const pause = () => {
    isPlaying = false
    isManuallyPaused = true // Mark as manually paused
    clearFade() // Stop any ongoing fade
    if (currentTrack) {
        currentTrack.pause()
    }
    if (nextTrack) {
        nextTrack.pause()
    }
}

const stop = () => {
    isPlaying = false
    isManuallyPaused = false
    clearFade() // Stop any ongoing fade
    if (currentTrackFilename) {
        unloadTrack(currentTrackFilename)
    }
    currentTrack = null
    currentTrackFilename = null
}

const skip = () => {
    if (allMusicFiles.length === 0) {
        return
    }

    // Ensure we're in playing state
    isPlaying = true
    isManuallyPaused = false

    // Clear any ongoing fades
    clearFade()

    // Unload current track
    if (currentTrackFilename) {
        unloadTrack(currentTrackFilename)
    }
    currentTrack = null
    currentTrackFilename = null

    // Move to next track
    currentTrackIndex = (currentTrackIndex + 1) % allMusicFiles.length
    const nextFilename = allMusicFiles[currentTrackIndex]

    currentTrack = getTrack(nextFilename)
    currentTrackFilename = nextFilename

    if (!currentTrack) {
        console.error('Track not found in library:', nextFilename, 'Available:', Object.keys(musicLibrary))
        return
    }

    if (currentSettings.enableMusic) {
        // Start new track at full volume immediately (no fade-in)
        const masterMultiplier = currentSettings.masterVolume / 100
        const musicMultiplier = currentSettings.musicVolume / 100
        const targetVolume = 0.5 * masterMultiplier * musicMultiplier

        currentTrack.volume(targetVolume)
        currentTrack.play()

        // Set up fade for this track
        setupNextFade()
    }
}

const getCurrentTrackName = (): string => {
    if (!currentTrack || currentTrackIndex >= allMusicFiles.length) {
        return 'No track'
    }
    return getTrackName(allMusicFiles[currentTrackIndex])
}

const getIsPlaying = (): boolean => {
    // Check if we're in playing state AND the track is actually playing (not paused)
    if (!isPlaying || !currentTrack || isManuallyPaused) {
        return false
    }
    try {
        // Howl.playing() returns true if playing, false if paused or stopped
        return currentTrack.playing()
    } catch (e) {
        return false
    }
}

const getIsManuallyPaused = (): boolean => {
    return isManuallyPaused
}

const getIsMutedForUnfocus = (): boolean => {
    return isMutedForUnfocus
}

const muteForUnfocus = () => {
    if (isMutedForUnfocus) return
    wasPlayingBeforeUnfocus = isPlaying && !isManuallyPaused
    isMutedForUnfocus = true
    if (currentTrack && isPlaying) {
        currentTrack.pause()
    }
}

const unmuteForUnfocus = () => {
    if (!isMutedForUnfocus) return
    isMutedForUnfocus = false
    if (wasPlayingBeforeUnfocus && currentSettings.enableMusic) {
        if (currentTrack) {
            currentTrack.play()
        } else {
            play()
        }
    }
    wasPlayingBeforeUnfocus = false
}

// Initialize volumes
updateVolumes()

const Music = {
    play,
    pause,
    stop,
    skip,
    updateSettings,
    getCurrentTrackName,
    getIsPlaying,
    getIsManuallyPaused,
    getIsMutedForUnfocus,
    muteForUnfocus,
    unmuteForUnfocus,
}

export default Music

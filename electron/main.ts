import { app, BrowserWindow, ipcMain, session } from 'electron'
import * as configs from './configs'
import * as path from 'path'
import * as steamworks from 'steamworks.js'
import * as ipc from './ipc'
import * as fs from 'fs'
import * as os from 'os'

import { initLogger, log, logError } from './utils'

/**
 * Setup Folder Structure for Saving
 * Platform-specific paths:
 * - Windows: ~/Saved Games/[Company]/[Game]
 * - macOS: ~/Library/Application Support/[Company]/[Game]
 * - Linux: ~/.config/[Company]/[Game] (or use app.getPath('userData'))
 */
const getSaveDirectory = (): string => {
    const platform = process.platform

    if (platform === 'win32') {
        // Windows: Use Saved Games folder
        return path.join(os.homedir(), 'Saved Games', configs.COMPANY_NAME, configs.GAME_NAME)
    } else if (platform === 'darwin') {
        // macOS: Use Application Support folder
        return path.join(os.homedir(), 'Library', 'Application Support', configs.COMPANY_NAME, configs.GAME_NAME)
    } else {
        // Linux and other platforms: Use .config folder
        return path.join(os.homedir(), '.config', configs.COMPANY_NAME, configs.GAME_NAME)
    }
}

const gamedir = getSaveDirectory()
const dirs = [gamedir, path.join(gamedir, 'backups')]

try {
    dirs.forEach((dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    })
} catch (err) {
    console.error(err)
}

initLogger(gamedir)

log('save directory: save path - ' + gamedir)
log('save directory: backups path - ' + dirs[1])

/**
 * Pre-load Options for Chromium
 */
// app.commandLine.appendSwitch('in-process-gpu') // Kinda needed for steam overlay...
// app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-direct-composition')
app.commandLine.appendSwitch('disable-renderer-backgrounding')
app.commandLine.appendSwitch('disable-background-timer-throttling')
app.commandLine.appendSwitch('disable-accelerated-2d-canvas')
app.commandLine.appendSwitch('disable-accelerated-mjpeg-decode')
app.commandLine.appendSwitch('disable-accelerated-video-decode')
app.commandLine.appendSwitch('disable-accelerated-video-encode')
app.commandLine.appendSwitch('disk-cache-size', '0')
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
app.commandLine.appendSwitch('disable-features', 'Geolocation')

app.on('ready', () => {
    if (process.platform === 'win32') {
        app.setAppUserModelId('Koltera 2')
    }
})

/**
 * Options to enable WORSE CASE for memory issues, BUT Steam Overlay will not show
 */
//app.commandLine.appendSwitch('disable-gpu-compositing')
//app.commandLine.appendSwitch('disable-gpu')
//app.disableHardwareAcceleration()
//app.commandLine.appendSwitch('disable-audio-output')

/**
 * Connect to Steamworks
 */
let steamClient: any
const initSteamworks = () => {
    try {
        steamClient = steamworks.init(configs.APPID)
        if (!steamClient) return
        log('steam: connected to steam with the steamid of: ', steamClient.localplayer.getSteamId().steamId64)
    } catch (err) {
        logError('steam: failed to initialize steamworks:', err)
    }
}

/**
 * Create the Electron Window
 */
const createWindow = (): BrowserWindow => {
    log('createWindow: starting')
    const iconPath = app.isPackaged ? path.join(__dirname, '../favicon.ico') : path.join(__dirname, '../../public/favicon.ico')
    log('createWindow: iconPath - ', iconPath)

    const preloadPath = path.join(__dirname, 'preload.js')
    log('createWindow: preloadPath - ', preloadPath)
    log('createWindow: preload exists - ', String(fs.existsSync(preloadPath)))

    const win = new BrowserWindow({
        minWidth: configs.MIN_WINDOW_WIDTH,
        minHeight: configs.MIN_WINDOW_HEIGHT,
        width: configs.MIN_WINDOW_WIDTH,
        height: configs.MIN_WINDOW_HEIGHT,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: true,
            backgroundThrottling: false,
        },
        autoHideMenuBar: true,
        center: true,
        icon: iconPath,
    })
    log('createWindow: BrowserWindow created')

    if (app.isPackaged) {
        const htmlPath = path.join(__dirname, '..', 'index.html')
        log('createWindow: loading packaged URL, index.html exists - ', String(fs.existsSync(htmlPath)), ' path -', htmlPath)
        win.loadFile(htmlPath)
        win.removeMenu()
    } else {
        log('createWindow: loading dev URL http://localhost:3000/index.html')
        win.loadURL('http://localhost:3000/index.html')

        win.webContents.openDevTools({ mode: 'detach' })

        require('electron-reload')(__dirname, {
            electron: path.join(
                __dirname,
                '..',
                '..',
                'node_modules',
                '.bin',
                'electron' + (process.platform === 'win32' ? '.cmd' : '')
            ),
            forceHardReset: true,
            hardResetMethod: 'exit',
        })
    }

    // Capture ALL renderer console output to game.log
    win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        const levelStr = ['LOG', 'WARN', 'ERROR'][level] || 'LOG'
        log(`[renderer logs ${levelStr}] ${message} (${sourceId}:${line})`)
    })

    // Log renderer crashes
    win.webContents.on('render-process-gone', (_event, details) => {
        logError('renderer process gone! Reason:', details.reason, 'Exit code:', String(details.exitCode))
    })

    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        logError('failed to load URL:', validatedURL, 'Error:', errorDescription, '(code:', String(errorCode) + ')')
    })

    win.on('closed', () => {
        log('window closed event fired')
        app.quit()
        return
    })

    // Send window size to renderer on resize
    const sendWindowSize = () => {
        const [width, height] = win.getSize()
        win.webContents.send('window-resize', { width, height })
    }

    win.webContents.once('dom-ready', () => {
        log('dom: renderer DOM is ready')
    })

    // Handle F11 to toggle fullscreen (removed menu in packaged build removes default handler)
    win.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown' && input.key === 'F11') {
            win.setFullScreen(!win.isFullScreen())
        }
    })

    // Notify renderer when fullscreen state changes (F11 or OS gesture)
    win.on('enter-full-screen', () => {
        win.webContents.send('fullscreen-changed', true)
    })

    win.on('leave-full-screen', () => {
        win.webContents.send('fullscreen-changed', false)
    })

    // Notify renderer when window focus changes
    win.on('focus', () => {
        win.webContents.send('window-focus-changed', true)
    })

    win.on('blur', () => {
        win.webContents.send('window-focus-changed', false)
    })

    // Send initial size when window is ready
    win.webContents.once('did-finish-load', () => {
        log('did-finish-load: page fully loaded')
        sendWindowSize()
    })

    // Listen for window resize events
    win.on('resize', () => {
        sendWindowSize()
    })

    return win
}

let mainWindow: BrowserWindow | null = null

/**
 * Enable Single Instance of Game
 */
const isSingleInstance = app.requestSingleInstanceLock()
if (!isSingleInstance) {
    log('single instance: ', isSingleInstance)
    app.quit()
    process.exit(0)
}

/**
 * Cleanup on Quit
 */
app.on('will-quit', () => {
    log('will-quit: cleaning up')
    app.exit(0)
})

/**
 * Electron Startup
 */
app.whenReady().then(() => {
    log('app: starting up')

    // Deny all permission requests (geolocation, camera, microphone, etc.)
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
        callback(false)
    })

    // Deny all permission checks so Chromium never triggers OS-level prompts (e.g. location services)
    session.defaultSession.setPermissionCheckHandler(() => {
        return false
    })

    log('app: initializing steamworks')
    initSteamworks()
    log('app: steamworks initialized')

    log('app: creating window')
    mainWindow = createWindow()
    log('app: window created')

    log('app: initializing IPC handlers')
    ipc.init(ipcMain, steamClient, gamedir, app, mainWindow)
    log('app: startup complete')

    // Handle window size requests
    ipcMain.handle('get-window-size', () => {
        if (mainWindow) {
            const [width, height] = mainWindow.getSize()
            return { width, height }
        }
        return { width: configs.MIN_WINDOW_WIDTH, height: configs.MIN_WINDOW_HEIGHT }
    })

    log('app: get-window-size handler created')

    app.on('activate', () => {
        log('app: browserWindows total: ' + BrowserWindow.getAllWindows().length)
        if (BrowserWindow.getAllWindows().length === 0) {
            mainWindow = createWindow()
            if (mainWindow) {
                log('app: ipc init function called')
                ipc.init(ipcMain, steamClient, gamedir, app, mainWindow)
            }
        }
    })

    log('app: activate handler created')

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })

    log('app: windows-all-closed handler created')
})

/**
 * Force exit if the process hangs after quitting
 */
app.on('quit', () => {
    setTimeout(() => {
        logError('force quit required after hanging')
        process.exit(0)
    }, 3000).unref()
})

/**
 * Catching Errors
 */
process.on('uncaughtException', function (err) {
    logError('Uncaught exception:', err)
})

process.on('unhandledRejection', function (err) {
    logError('Unhandled rejection:', err)
})

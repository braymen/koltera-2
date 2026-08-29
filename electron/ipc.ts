import { IpcMain, shell } from 'electron'
import * as utils from './utils'
import * as fs from 'fs'
import * as path from 'path'
import * as encryption from './encryption'

export const init = (
    ipcMain: IpcMain,
    steamClient: any,
    gamedir: string,
    app: Electron.App,
    mainWindow: Electron.BrowserWindow | null
) => {
    const savePath = path.resolve(gamedir, 'save.json')
    const backupDir = path.resolve(gamedir, 'backups')
    const BACKUP_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes
    let lastBackupTime = Date.now()

    const ensureBackupDir = () => {
        try {
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true })
            }
        } catch (err) {
            utils.logError(err)
        }
    }

    ipcMain.handle('log', (_event, level: string, message: string) => {
        if (level === 'error') {
            utils.logError('[Renderer]', message)
        } else {
            utils.log('[Renderer]', message)
        }
    })

    ipcMain.handle('save', (event, data) => {
        try {
            // String data
            const stringData: string = JSON.stringify(data)

            // Encrypt the save data
            const encryptedData = encryption.encrypt(stringData)

            // Keep a copy of the last known good save before overwriting
            const prevPath = savePath + '.prev'
            try {
                if (fs.existsSync(savePath)) {
                    fs.copyFileSync(savePath, prevPath)
                }
            } catch (err) {
                utils.logError('Failed to copy previous save:', err)
            }

            // Write to temp file, fsync to flush to disk, then rename
            const tempPath = savePath + '.tmp'
            const fd = fs.openSync(tempPath, 'w')
            fs.writeSync(fd, encryptedData)
            fs.fsyncSync(fd)
            fs.closeSync(fd)
            fs.renameSync(tempPath, savePath)

            // Add a backup every 15 minutes (also encrypted)
            const now = Date.now()
            if (now - lastBackupTime >= BACKUP_INTERVAL_MS) {
                lastBackupTime = now
                ensureBackupDir()
                const backups = fs.readdirSync(backupDir).sort()

                // Remove oldest backup if full
                if (backups.length > 10) {
                    fs.unlinkSync(path.join(backupDir, backups[0]))
                }

                // Write new backup (encrypted)
                try {
                    const backupPath = path.join(backupDir, utils.formatBackupName())
                    fs.writeFileSync(backupPath, encryptedData, { flag: 'w+' })
                } catch (err) {
                    utils.logError(err)
                }
            }
        } catch (err) {
            utils.logError('Failed to save game data:', err)
        }
    })

    // Try to read and parse a save file, returns parsed data or null
    const tryLoadFile = (filePath: string): any | null => {
        try {
            if (!fs.existsSync(filePath)) return null
            const fileStats = fs.statSync(filePath)
            if (fileStats.size === 0) return null
            utils.log('Trying to load:', filePath, 'size:', fileStats.size, 'bytes')

            const data = fs.readFileSync(filePath, 'utf8')
            let decryptedData: string
            if (encryption.isEncrypted(data)) {
                decryptedData = encryption.decrypt(data)
            } else {
                decryptedData = data
            }
            const parsed = JSON.parse(decryptedData)
            utils.log('Successfully loaded from:', filePath, 'version:', parsed?.version)
            return parsed
        } catch (err) {
            utils.logError('Failed to load from:', filePath, err)
            return null
        }
    }

    ipcMain.handle('load', (event) => {
        return new Promise((res, rej) => {
            utils.log('Loading save from:', savePath)

            // 1. Try main save file
            const mainSave = tryLoadFile(savePath)
            if (mainSave) {
                res(mainSave)
                return
            }

            // 2. Try previous save (.prev) — the last known good save before the most recent write
            const prevPath = savePath + '.prev'
            utils.log('Main save failed or missing, trying previous save...')
            const prevSave = tryLoadFile(prevPath)
            if (prevSave) {
                utils.log('Recovered from previous save file')
                res(prevSave)
                return
            }

            // 3. Try backups (newest first)
            utils.log('Previous save failed or missing, trying backups...')
            try {
                ensureBackupDir()
                const backups = fs.readdirSync(backupDir).sort().reverse() // newest first
                for (const backup of backups) {
                    const backupPath = path.join(backupDir, backup)
                    const backupSave = tryLoadFile(backupPath)
                    if (backupSave) {
                        utils.log('Recovered from backup:', backup)
                        res(backupSave)
                        return
                    }
                }
            } catch (err) {
                utils.logError('Failed to read backups directory:', err)
            }

            // 4. No valid save found anywhere
            utils.log('No valid save found, starting fresh')
            res(null)
        })
    })

    ipcMain.handle('remove', (event) => {
        try {
            fs.unlinkSync(savePath)
        } catch (err) {
            utils.logError(err)
        }
    })

    ipcMain.handle('open-backups', () => {
        ensureBackupDir()
        return shell.openPath(backupDir)
    })

    ipcMain.handle('encrypt', (_event, text: string) => {
        return encryption.encrypt(text)
    })

    ipcMain.handle('decrypt', (_event, text: string) => {
        return encryption.decrypt(text)
    })

    ipcMain.handle('achievement', (event, key) => {
        steamClient.achievement.activate(key)
    })

    ipcMain.handle('link', (event, url) => {
        shell.openExternal(url)
    })

    ipcMain.handle('quit', (event) => {
        app.quit()
    })

    ipcMain.handle('set-zoom-factor', (event, zoomFactor: number) => {
        if (mainWindow) {
            // Clamp zoom factor between 0.5 and 2.0 (50% to 200%)
            const clampedZoom = Math.max(0.5, Math.min(2.0, zoomFactor))
            mainWindow.webContents.setZoomFactor(clampedZoom)
        }
    })

    ipcMain.handle('get-zoom-factor', (event) => {
        if (mainWindow) {
            return mainWindow.webContents.getZoomFactor()
        }
        return 1.0
    })

    ipcMain.handle('set-fullscreen', (event, fullscreen: boolean) => {
        if (mainWindow) {
            mainWindow.setFullScreen(fullscreen)
        }
    })

    ipcMain.handle('get-fullscreen', (event) => {
        if (mainWindow) {
            return mainWindow.isFullScreen()
        }
        return false
    })
}

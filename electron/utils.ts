import * as fs from 'fs'
import * as path from 'path'

const MAX_LOG_SIZE = 1024 * 1024 // 1MB

let logPath: string | null = null

export const initLogger = (gamedir: string) => {
    logPath = path.resolve(gamedir, 'game.log')
    // Truncate if over 1MB
    try {
        if (fs.existsSync(logPath) && fs.statSync(logPath).size > MAX_LOG_SIZE) {
            fs.writeFileSync(logPath, '')
        }
    } catch (_) {}
    log('--- Session started ---')
}

export const log = (...args: any[]) => {
    const timestamp = new Date().toISOString()
    const message = args.map((a) => (a instanceof Error ? a.stack || a.message : String(a))).join(' ')
    const line = `[${timestamp}] ${message}\n`
    console.log(...args)
    if (logPath) {
        try {
            fs.appendFileSync(logPath, line)
        } catch (_) {}
    }
}

export const logError = (...args: any[]) => {
    const timestamp = new Date().toISOString()
    const message = args.map((a) => (a instanceof Error ? a.stack || a.message : String(a))).join(' ')
    const line = `[${timestamp}] ERROR: ${message}\n`
    console.error(...args)
    if (logPath) {
        try {
            fs.appendFileSync(logPath, line)
        } catch (_) {}
    }
}

const formatFileDate = (date: Date) => {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear()

    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day

    return [year, month, day].join('-')
}

export const formatBackupName = () => {
    const date = new Date()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()
    const dateStr =
        '' +
        formatFileDate(date) +
        '_' +
        (hours < 10 ? '0' + hours : hours) +
        '-' +
        (minutes < 10 ? '0' + minutes : minutes) +
        '-' +
        (seconds < 10 ? '0' + seconds : seconds)
    return dateStr + '-backup.json'
}

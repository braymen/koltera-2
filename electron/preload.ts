const { ipcRenderer, contextBridge } = require('electron')
contextBridge.exposeInMainWorld('api', {
    save: (data: object) => {
        return ipcRenderer.invoke('save', data)
    },
    load: () => {
        return ipcRenderer.invoke('load')
    },
    remove: () => {
        return ipcRenderer.invoke('remove')
    },
    openBackups: () => {
        return ipcRenderer.invoke('open-backups')
    },
    encrypt: (text: string) => {
        return ipcRenderer.invoke('encrypt', text)
    },
    decrypt: (text: string) => {
        return ipcRenderer.invoke('decrypt', text)
    },
    achievement: (key: string) => {
        return ipcRenderer.invoke('achievement', key)
    },
    link: (url: string) => {
        return ipcRenderer.invoke('link', url)
    },
    quit: () => {
        return ipcRenderer.invoke('quit')
    },
    log: (level: string, message: string) => {
        return ipcRenderer.invoke('log', level, message)
    },
    onWindowResize: (callback: (size: { width: number; height: number }) => void) => {
        ipcRenderer.on('window-resize', (_event, size) => callback(size))
    },
    removeWindowResizeListener: () => {
        ipcRenderer.removeAllListeners('window-resize')
    },
    getWindowSize: () => {
        return ipcRenderer.invoke('get-window-size')
    },
    setZoomFactor: (zoomFactor: number) => {
        return ipcRenderer.invoke('set-zoom-factor', zoomFactor)
    },
    getZoomFactor: () => {
        return ipcRenderer.invoke('get-zoom-factor')
    },
    setFullscreen: (fullscreen: boolean) => {
        return ipcRenderer.invoke('set-fullscreen', fullscreen)
    },
    getFullscreen: () => {
        return ipcRenderer.invoke('get-fullscreen')
    },
    onFullscreenChange: (callback: (fullscreen: boolean) => void) => {
        ipcRenderer.on('fullscreen-changed', (_event, fullscreen) => callback(fullscreen))
    },
    removeFullscreenChangeListener: () => {
        ipcRenderer.removeAllListeners('fullscreen-changed')
    },
    onWindowFocusChange: (callback: (focused: boolean) => void) => {
        ipcRenderer.on('window-focus-changed', (_event, focused) => callback(focused))
    },
    removeWindowFocusChangeListener: () => {
        ipcRenderer.removeAllListeners('window-focus-changed')
    },
})

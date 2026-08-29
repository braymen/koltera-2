import ReactDOM from 'react-dom/client'
import Steam from '@engine/steam'
import { createTheme, MantineProvider } from '@mantine/core'

/**
 * Styles
 */
import '@mantine/core/styles.css'
import './index.css'
import GameWrapper from './views/GameWrapper'
import WindowScaler from './components/WindowScaler'

const theme = createTheme({
    /** Put your mantine theme override here */
})

declare global {
    interface Window {
        api: {
            save: Function
            load: Function
            remove: Function
            achievement: Function
            link: Function
            openBackups: Function
            encrypt: (text: string) => Promise<string>
            decrypt: (text: string) => Promise<string>
            quit: Function
            log: (level: string, message: string) => Promise<void>
            onWindowResize: (callback: (size: { width: number; height: number }) => void) => void
            removeWindowResizeListener: () => void
            getWindowSize: () => Promise<{ width: number; height: number }>
            setZoomFactor: (zoomFactor: number) => Promise<void>
            getZoomFactor: () => Promise<number>
            setFullscreen: (fullscreen: boolean) => Promise<void>
            getFullscreen: () => Promise<boolean>
            onFullscreenChange: (callback: (fullscreen: boolean) => void) => void
            removeFullscreenChangeListener: () => void
            onWindowFocusChange: (callback: (focused: boolean) => void) => void
            removeWindowFocusChangeListener: () => void
        }
    }
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
    <>
        <MantineProvider theme={theme} defaultColorScheme="dark">
            {/* <WindowScaler /> */}
            {/* <div id="game-content-wrapper"> */}
            <GameWrapper />
            <Steam />
            {/* </div> */}
        </MantineProvider>
    </>
)

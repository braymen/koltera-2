import { useEffect } from 'react'

const MIN_WINDOW_WIDTH = 1296
const MIN_WINDOW_HEIGHT = 759

const WindowScaler = () => {
    useEffect(() => {
        // Only run in Electron environment
        if (!window.api?.onWindowResize) {
            return
        }

        const rootElement = document.getElementById('root')
        const wrapperElement = document.getElementById('game-content-wrapper')

        if (!rootElement || !wrapperElement) {
            return
        }

        const handleResize = ({ width, height }: { width: number; height: number }) => {
            // Calculate scale factors for stretching (non-uniform scaling)
            const scaleX = width / MIN_WINDOW_WIDTH
            const scaleY = height / MIN_WINDOW_HEIGHT

            // Apply stretching transform to the wrapper (not root) so fixed positioning still works
            wrapperElement.style.transform = `scale(${scaleX}, ${scaleY})`
            wrapperElement.style.transformOrigin = 'top left'

            // Keep the wrapper at minimum size, it will be scaled
            wrapperElement.style.width = `${MIN_WINDOW_WIDTH}px`
            wrapperElement.style.height = `${MIN_WINDOW_HEIGHT}px`
            wrapperElement.style.position = 'relative'

            // Adjust body/html to accommodate scaled content
            document.body.style.width = `${width}px`
            document.body.style.height = `${height}px`
            document.body.style.overflow = 'hidden'

            const html = document.documentElement
            html.style.width = `${width}px`
            html.style.height = `${height}px`
            html.style.overflow = 'hidden'

            // Ensure root element fills the viewport for proper height calculations
            rootElement.style.width = '100%'
            rootElement.style.height = '100%'
            rootElement.style.position = 'relative'
        }

        // Get initial window size
        window.api
            .getWindowSize()
            .then(handleResize)
            .catch(() => {
                // Fallback to minimum size if request fails
                handleResize({ width: MIN_WINDOW_WIDTH, height: MIN_WINDOW_HEIGHT })
            })

        // Set up listener for future resize events
        window.api.onWindowResize(handleResize)

        // Cleanup
        return () => {
            if (window.api?.removeWindowResizeListener) {
                window.api.removeWindowResizeListener()
            }

            // Reset styles on cleanup
            const wrapper = document.getElementById('game-content-wrapper')
            if (wrapper) {
                wrapper.style.transform = ''
                wrapper.style.transformOrigin = ''
                wrapper.style.width = ''
                wrapper.style.height = ''
                wrapper.style.position = ''
            }
            document.body.style.width = ''
            document.body.style.height = ''
            document.body.style.overflow = ''
            const html = document.documentElement
            html.style.width = ''
            html.style.height = ''
            html.style.overflow = ''
        }
    }, [])

    return null
}

export default WindowScaler

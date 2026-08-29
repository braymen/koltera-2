import { useEffect } from 'react'
import { StateProps } from '@engine/types'
import { calculateAutoScale } from '@utils/auto-scale'
import { updateSettings } from '@modules/settings/functions'

/**
 * Component that automatically adjusts interface scale based on window width
 * Only applies auto-scaling if autoScaleEnabled is true in settings
 */
const AutoScaleManager = ({ state, dispatch }: StateProps) => {
    useEffect(() => {
        // Only run in Electron environment
        if (!window.api?.onWindowResize) {
            return
        }

        const settings = state.settings
        if (!settings) {
            return
        }

        // If auto-scaling is disabled, apply the manual zoomFactor and exit
        if (!settings.autoScaleEnabled) {
            if (window.api?.setZoomFactor) {
                window.api.setZoomFactor(settings.zoomFactor || 1.0)
            }
            return
        }

        const handleResize = ({ width }: { width: number; height: number }) => {
            // Get current settings from state (may have changed)
            const currentSettings = state.settings
            if (!currentSettings || !currentSettings.autoScaleEnabled) {
                return
            }

            // Calculate the appropriate scale based on width
            const newScale = calculateAutoScale(width)

            // Only update if the scale has changed (avoid unnecessary updates)
            const currentZoom = currentSettings.zoomFactor || 1.0
            if (Math.abs(currentZoom - newScale) > 0.01) {
                // Update settings with the new scale
                dispatch({
                    action: updateSettings,
                    payload: { settings: { zoomFactor: newScale } },
                })

                // Apply zoom immediately
                if (window.api?.setZoomFactor) {
                    window.api.setZoomFactor(newScale)
                }
            }
        }

        // Get initial window size and apply scale
        window.api
            .getWindowSize()
            .then(handleResize)
            .catch(() => {
                // Fallback: use current settings zoom factor
                if (window.api?.setZoomFactor) {
                    window.api.setZoomFactor(settings.zoomFactor || 1.0)
                }
            })

        // Set up listener for future resize events
        window.api.onWindowResize(handleResize)

        // Cleanup
        return () => {
            if (window.api?.removeWindowResizeListener) {
                window.api.removeWindowResizeListener()
            }
        }
    }, [state.settings?.autoScaleEnabled, state.settings?.zoomFactor, dispatch, state.settings])

    return null
}

export default AutoScaleManager


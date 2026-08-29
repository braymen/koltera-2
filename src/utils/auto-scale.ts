import GlobalConfig from '@configs/global'

export const calculateAutoScale = (width: number): number => {
    const thresholds = GlobalConfig.AUTO_SCALE_CONFIG.THRESHOLDS
    let selectedScale = 1.0
    for (let i = thresholds.length - 1; i >= 0; i--) {
        const [minWidth, scaleFactor] = thresholds[i]
        if (width >= minWidth) {
            selectedScale = scaleFactor
            break
        }
    }
    return selectedScale
}

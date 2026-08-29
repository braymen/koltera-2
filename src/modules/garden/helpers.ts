export const FLOWER_TO_ITEM: Record<string, string> = {
    'fire-flower': 'raw-fire-essence',
    'water-flower': 'raw-water-essence',
    'wind-flower': 'raw-wind-essence',
    'earth-flower': 'raw-earth-essence',
    'gold-flower': 'gold',
}

export function getFlowerLevelUpCost(currentLevel: number): { itemId: string; amount: number } {
    return { itemId: 'fertilizer', amount: currentLevel }
}

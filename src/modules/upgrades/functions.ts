import { State } from '@engine/types'
import UpgradesContent from '@data/upgrades'

export type PurchaseUpgradePayload = {
    upgradeId: string
}

export const purchaseUpgrade = (state: State, payload: PurchaseUpgradePayload): State => {
    const { upgradeId } = payload

    // Check if upgrade exists
    const upgrade = UpgradesContent.getById(upgradeId)
    if (!upgrade) return state

    // Check if already purchased
    if (state.purchasedUpgrades.includes(upgradeId)) return state

    // Check prerequisites
    const prerequisitesMet = upgrade.prerequisites.every((prereqId) => state.purchasedUpgrades.includes(prereqId))
    if (!prerequisitesMet && upgrade.prerequisites.length > 0) return state

    // Check if player has enough awaken points
    const awakenPointsItem = state.inventory.find((item) => item.id === 'awaken-points')
    const awakenPoints = awakenPointsItem?.amount ?? 0
    if (awakenPoints < upgrade.cost) return state

    // Remove awaken points
    if (awakenPointsItem) {
        awakenPointsItem.amount -= upgrade.cost
        if (awakenPointsItem.amount <= 0) {
            state.inventory = state.inventory.filter((item) => item.id !== 'awaken-points')
        }
    }

    // Add upgrade to purchased list
    if (!state.purchasedUpgrades.includes(upgradeId)) {
        state.purchasedUpgrades.push(upgradeId)
    }

    return state
}

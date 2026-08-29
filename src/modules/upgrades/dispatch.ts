import { Action } from '@engine/types'
import * as Functions from './functions'

export const purchaseUpgrade = (dispatch: React.Dispatch<Action<Functions.PurchaseUpgradePayload>>, upgradeId: string) => {
    dispatch({
        action: Functions.purchaseUpgrade,
        payload: {
            upgradeId,
        },
    })
}

const Upgrades = {
    purchaseUpgrade,
}

export default Upgrades

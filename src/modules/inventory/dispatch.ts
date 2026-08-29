import { Action } from '@engine/types'
import * as Functions from './functions'
import { ItemInstance } from './types'

export const change = (dispatch: React.Dispatch<Action<Functions.ChangeInventoryPayload>>, resources: ItemInstance[]) => {
    dispatch({
        action: Functions.changeInventory,
        payload: {
            resources,
        },
    })
}

export const toggleFavorite = (dispatch: React.Dispatch<Action<Functions.ToggleFavoritePayload>>, itemId: string) => {
    dispatch({
        action: Functions.toggleFavorite,
        payload: {
            itemId,
        },
    })
}

export const openChest = (
    dispatch: React.Dispatch<Action<Functions.OpenChestPayload>>,
    itemId: string,
    amount: number = 1,
    loot?: ItemInstance[]
) => {
    dispatch({
        action: Functions.openChest,
        payload: {
            itemId,
            amount,
            loot,
        },
    })
}

export const consumeItem = (dispatch: React.Dispatch<Action<Functions.ConsumeItemPayload>>, itemId: string) => {
    dispatch({
        action: Functions.consumeItem,
        payload: {
            itemId,
        },
    })
}

const Inventory = {
    change,
    toggleFavorite,
    openChest,
    consumeItem,
}

export default Inventory

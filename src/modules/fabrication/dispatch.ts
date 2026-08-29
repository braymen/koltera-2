import * as Functions from './functions'

export const allocatePrestigePoint = (dispatch: any, itemId: string) => {
    dispatch({
        action: Functions.allocatePrestigePoint,
        payload: { itemId },
    })
}

export const deallocatePrestigePoint = (dispatch: any, itemId: string) => {
    dispatch({
        action: Functions.deallocatePrestigePoint,
        payload: { itemId },
    })
}

const FabricationActions = {
    allocatePrestigePoint,
    deallocatePrestigePoint,
}

export default FabricationActions

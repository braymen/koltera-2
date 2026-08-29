import * as Functions from './functions'
import { MachineId } from './types'

export const purchaseMachine = (dispatch: any, machineId: MachineId) => {
    dispatch({
        action: Functions.purchaseMachine,
        payload: { machineId },
    })
}

export const upgradeMachine = (dispatch: any, machineId: MachineId) => {
    dispatch({
        action: Functions.upgradeMachine,
        payload: { machineId },
    })
}

export const assignCreature = (dispatch: any, machineId: MachineId, creatureId: string) => {
    dispatch({
        action: Functions.assignCreature,
        payload: { machineId, creatureId },
    })
}

export const unassignCreature = (dispatch: any, machineId: MachineId) => {
    dispatch({
        action: Functions.unassignCreature,
        payload: { machineId },
    })
}

export const selectRecipe = (dispatch: any, machineId: MachineId, inputItemId: string | null) => {
    dispatch({
        action: Functions.selectRecipe,
        payload: { machineId, inputItemId },
    })
}

export const toggleSmeltAllDirection = (dispatch: any, machineId: MachineId) => {
    dispatch({
        action: Functions.toggleSmeltAllDirection,
        payload: { machineId },
    })
}

const MachinesActions = {
    purchaseMachine,
    upgradeMachine,
    assignCreature,
    unassignCreature,
    selectRecipe,
    toggleSmeltAllDirection,
}

export default MachinesActions

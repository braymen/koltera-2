import { Action } from '@engine/types'
import * as Functions from './functions'

export const addCreature = (dispatch: React.Dispatch<Action<Functions.AddCreaturePayload>>, creatureId: string) => {
    dispatch({
        action: Functions.addCreature,
        payload: {
            creatureId,
        },
    })
}

export const removeCreature = (dispatch: React.Dispatch<Action<Functions.RemoveCreaturePayload>>, creatureId: string) => {
    dispatch({
        action: Functions.removeCreature,
        payload: {
            creatureId,
        },
    })
}

const Sanctuary = {
    addCreature,
    removeCreature,
}

export default Sanctuary

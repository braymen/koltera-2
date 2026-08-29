import * as Functions from './functions'

export const summonCreature = (dispatch: any, species: string) => {
    dispatch({
        action: Functions.summonCreature,
        payload: {
            species: species,
        },
    })
}

export const summonAllCreatures = (dispatch: any) => {
    dispatch({
        action: Functions.summonAllCreatures,
        payload: {},
    })
}

export const awakenCreature = (dispatch: any, creatureId: string) => {
    dispatch({
        action: Functions.awakenCreature,
        payload: {
            creatureId: creatureId,
        },
    })
}

export const prestigeCreature = (dispatch: any, creatureId: string) => {
    dispatch({
        action: Functions.prestigeCreature,
        payload: {
            creatureId: creatureId,
        },
    })
}

export const giveRandomCreatureLevel100 = (dispatch: any) => {
    dispatch({
        action: Functions.giveRandomCreatureLevel100,
        payload: {},
    })
}

const CreaturesActions = {
    summonCreature,
    summonAllCreatures,
    awakenCreature,
    prestigeCreature,
    giveRandomCreatureLevel100,
}

export default CreaturesActions

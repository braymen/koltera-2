import * as Functions from './functions'
import { DungeonFocus, DungeonTier, GatheringSubFocus } from './types'

export const startDungeon = (
    dispatch: any,
    payload: { tier: DungeonTier; focus: DungeonFocus; creatureIds: string[]; loop?: boolean; gatheringSkill?: GatheringSubFocus }
) => {
    dispatch({
        action: Functions.startDungeon,
        payload,
    })
}

export const collectDungeonRewards = (dispatch: any, dungeonId: string) => {
    dispatch({
        action: Functions.collectDungeonRewards,
        payload: { dungeonId },
    })
}

export const cancelDungeon = (dispatch: any, dungeonId: string) => {
    dispatch({
        action: Functions.cancelDungeon,
        payload: { dungeonId },
    })
}

export const repeatDungeon = (dispatch: any, dungeonId: string) => {
    dispatch({
        action: Functions.repeatDungeon,
        payload: { dungeonId },
    })
}

export const toggleDungeonLoop = (dispatch: any, dungeonId: string) => {
    dispatch({
        action: Functions.toggleDungeonLoop,
        payload: { dungeonId },
    })
}

const DungeonsActions = {
    startDungeon,
    collectDungeonRewards,
    cancelDungeon,
    repeatDungeon,
    toggleDungeonLoop,
}

export default DungeonsActions

import { Action } from '@engine/types'
import * as Functions from './functions'

const tab = (dispatch: React.Dispatch<Action<Functions.TabPayload>>, id: string) => {
    dispatch({
        action: Functions.tab,
        payload: { tab: id },
    })
}

const subtab = (dispatch: React.Dispatch<Action<Functions.SubtabPayload>>, id: string) => {
    dispatch({
        action: Functions.subtab,
        payload: { subtab: id },
    })
}

const Navigation = {
    tab,
    subtab,
}

export default Navigation

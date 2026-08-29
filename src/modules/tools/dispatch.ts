import * as Functions from './functions'
import { ToolId } from './types'

export const upgradeTool = (dispatch: any, toolId: ToolId) => {
    dispatch({
        action: Functions.upgradeTool,
        payload: { toolId },
    })
}

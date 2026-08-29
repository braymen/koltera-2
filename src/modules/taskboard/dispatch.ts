import { Action } from '@engine/types'
import * as Functions from './functions'
import { CompleteTaskPayload, SkipTaskPayload } from './types'

export const completeTask = (dispatch: React.Dispatch<Action<CompleteTaskPayload>>, taskId: string) => {
    dispatch({
        action: Functions.completeTask,
        payload: {
            taskId,
        },
    })
}

export const skipTask = (dispatch: React.Dispatch<Action<SkipTaskPayload>>, taskId: string) => {
    dispatch({
        action: Functions.skipTask,
        payload: {
            taskId,
        },
    })
}

export const resetTasks = (dispatch: React.Dispatch<Action<{}>>) => {
    dispatch({
        action: Functions.resetTasks,
        payload: {},
    })
}

const TaskBoardActions = {
    completeTask,
    skipTask,
    resetTasks,
}

export default TaskBoardActions

import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import ItemsContent from '@data/items'
import Images from '@utils/images'
import Button from '@components/common/Button'
import TaskBoardActions from '@modules/taskboard/dispatch'
import { shouldResetTasks } from '@modules/taskboard/functions'
import ConfirmModal from '@components/common/ConfirmModal'
import { useMemo, useEffect, useState } from 'react'

function TaskBoard({ state, dispatch }: StateProps) {
    const [timeUntilReset, setTimeUntilReset] = useState('')
    const [currentTime, setCurrentTime] = useState(Date.now() / 1000)
    const [skipConfirmTaskId, setSkipConfirmTaskId] = useState<string | null>(null)

    // Calculate time until next Tuesday night reset (8 PM)
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date()

            // Find the next Tuesday at 8 PM (20:00)
            let nextTuesday = new Date(now)
            const currentDay = now.getDay()
            const currentHour = now.getHours()

            // If it's Tuesday and before 8 PM, reset is today
            if (currentDay === 2 && currentHour < 20) {
                nextTuesday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0, 0)
            } else {
                // Calculate days until next Tuesday
                const daysUntilTuesday =
                    currentDay <= 2 ? 2 - currentDay + (currentDay === 2 && currentHour >= 20 ? 7 : 0) : 7 - currentDay + 2
                nextTuesday.setDate(now.getDate() + daysUntilTuesday)
                nextTuesday.setHours(20, 0, 0, 0)
            }

            const diff = nextTuesday.getTime() - now.getTime()
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            if (days > 0) {
                setTimeUntilReset(`${days}d ${hours}h ${minutes}m`)
            } else if (hours > 0) {
                setTimeUntilReset(`${hours}h ${minutes}m ${seconds.toString().padStart(2, '0')}s`)
            } else {
                setTimeUntilReset(`${minutes}:${seconds.toString().padStart(2, '0')}`)
            }
            setCurrentTime(Date.now() / 1000)
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)

        return () => clearInterval(interval)
    }, [])

    // Calculate countdown for a completed task (16 hours)
    const getTaskCountdown = (task: any): string => {
        if (!task.completed || !task.lastResetTime) {
            return ''
        }

        const COOLDOWN_SECONDS = 20 * 60 * 60 // 20 hours in seconds
        const timeSinceCompletion = currentTime - task.lastResetTime
        const timeRemaining = COOLDOWN_SECONDS - timeSinceCompletion

        if (timeRemaining <= 0) {
            return '0:00'
        }

        const hours = Math.floor(timeRemaining / 3600)
        const minutes = Math.floor((timeRemaining % 3600) / 60)
        const seconds = Math.floor(timeRemaining % 60)

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`
        }
    }

    // Get tasks with item metadata
    const tasksWithMeta = useMemo(() => {
        return state.taskBoard.tasks.map((task) => {
            const itemMeta = ItemsContent.getById(task.itemId)
            const playerAmount = state.inventory.find((item) => item.id === task.itemId)?.amount || 0
            const canComplete = playerAmount >= task.amount && !task.completed

            return {
                ...task,
                itemMeta,
                playerAmount,
                canComplete,
            }
        })
    }, [state.taskBoard.tasks, state.inventory])

    const handleCompleteTask = (taskId: string) => {
        TaskBoardActions.completeTask(dispatch, taskId)
    }

    const handleSkipTask = () => {
        if (skipConfirmTaskId) {
            TaskBoardActions.skipTask(dispatch, skipConfirmTaskId)
            setSkipConfirmTaskId(null)
        }
    }

    const needsReset = shouldResetTasks(state.taskBoard.lastResetTime)

    return (
        <div>
            <Panel>
                <div style={{ width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', color: 'rgba(255,255,255,1)' }}>
                        {needsReset ? (
                            <span style={{ color: '#ff6b6b' }}>Resetting soon...</span>
                        ) : (
                            <span style={{ color: 'yellow' }}>Next Weekly Reset in: {timeUntilReset}</span>
                        )}
                    </div>
                </div>
                <p
                    style={{
                        textAlign: 'center',
                        color: 'rgba(255,255,255,.8)',
                        fontSize: '18px',
                        padding: 0,
                        margin: 0,
                        marginTop: '-8px',
                    }}
                >
                    Tasks reset individually after completion and a 20 hour cooldown. Board resets weekly on Tuesday nights at 8
                    PM.
                </p>
            </Panel>
            <div style={{ marginBottom: '8px' }}></div>
            <Panel>
                <div style={{ backgroundColor: 'rgb(20,20,20)' }}>
                    {needsReset && state.taskBoard.tasks.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.8)' }}>
                            <p>Tasks will be available on Tuesday night at 8 PM!</p>
                        </div>
                    )}

                    {state.taskBoard.tasks.length === 0 && !needsReset && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.8)' }}>
                            <p>No tasks available. New tasks will appear on Tuesday night at 8 PM.</p>
                        </div>
                    )}

                    {state.taskBoard.tasks.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {tasksWithMeta.map((task) => {
                                if (!task.itemMeta) return null

                                const countdown = getTaskCountdown(task)
                                const showCountdown = task.completed && countdown && countdown !== '0:00'

                                return (
                                    <div
                                        key={task.id}
                                        style={{
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '0px',
                                            padding: '8px 8px',
                                            backgroundColor: task.completed ? 'rgba(0, 0, 0, .3)' : 'rgba(32, 32, 32, 0.2)',
                                            height: '134px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'relative',
                                        }}
                                    >
                                        {!task.completed && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    zIndex: 5,
                                                }}
                                            >
                                                <button
                                                    onClick={() => setSkipConfirmTaskId(task.id)}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.1)',
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        color: 'rgba(255,255,255,0.8)',
                                                        padding: '2px 8px',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Skip
                                                </button>
                                            </div>
                                        )}
                                        {showCountdown ? (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    zIndex: 10,
                                                    borderRadius: '0px',
                                                    gap: '0',
                                                    marginTop: '8px',
                                                }}
                                            >
                                                <p style={{ marginBottom: '-8px', paddingBottom: 0 }}>Resetting in</p>
                                                <div
                                                    style={{
                                                        marginTop: '0',
                                                        fontSize: '32px',
                                                        fontWeight: 'bold',
                                                        color: 'white',
                                                    }}
                                                >
                                                    {countdown}{' '}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        marginBottom: '0px',
                                                    }}
                                                >
                                                    <img
                                                        className="pixel"
                                                        src={Images.get(task.itemMeta.image)}
                                                        alt={task.itemMeta.name}
                                                        style={{ width: '48px', height: '48px' }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                                                            {task.itemMeta.name}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: '15px',
                                                                color: 'rgba(255,255,255,0.8)',
                                                                marginTop: '-8px',
                                                            }}
                                                        >
                                                            Turn in these items to complete this task and earn gold.
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginTop: 'auto',
                                                        marginBottom: '8px',
                                                    }}
                                                >
                                                    <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)' }}>
                                                        You have{' '}
                                                        <span
                                                            style={{
                                                                color:
                                                                    task.playerAmount > 0
                                                                        ? task.playerAmount >= task.amount
                                                                            ? '#51cf66'
                                                                            : '#f59e0b'
                                                                        : '#ff6b6b',
                                                            }}
                                                        >
                                                            {task.playerAmount}/{task.amount}
                                                        </span>{' '}
                                                        of the <span>{task.itemMeta.name}</span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontSize: '18px',
                                                        }}
                                                    >
                                                        <img
                                                            className="pixel"
                                                            src={Images.get(
                                                                ItemsContent.getById('gold')?.image || 'items/placeholder.png'
                                                            )}
                                                            alt="Gold"
                                                            style={{ width: '20px', height: '20px' }}
                                                        />
                                                        <span style={{ fontWeight: '400', color: '#ffd700' }}>
                                                            +{task.goldReward}
                                                        </span>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => handleCompleteTask(task.id)}
                                                    disabled={!task.canComplete}
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: task.canComplete ? 'green' : 'rgba(255,255,255,0.1)',
                                                        color: task.canComplete ? 'white' : 'rgba(255,255,255,0.5)',
                                                        cursor: task.canComplete ? 'pointer' : 'not-allowed',
                                                    }}
                                                >
                                                    {task.completed
                                                        ? 'Completed'
                                                        : task.canComplete
                                                          ? 'Turn In'
                                                          : 'Insufficient Items'}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </Panel>
            <ConfirmModal
                opened={skipConfirmTaskId !== null}
                onClose={() => setSkipConfirmTaskId(null)}
                onConfirm={handleSkipTask}
                text="Are you sure you want to skip this task? You won't receive any rewards and will need to wait the 20 hours for the next task."
            />
        </div>
    )
}

export default TaskBoard

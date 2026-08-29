import { useEffect, useState } from 'react'
import { StateProps } from '@engine/types'
import StoryContent from '@data/story'
import Panel from '@components/common/Panel'
import StoryActions from '@modules/story/dispatch'
import { canTurnInTask, isTaskCompleted } from '@modules/story/helpers'
import ItemsContent from '@data/items'
import CreaturesContent from '@data/creatures'
import Images from '@utils/images'
import { FLAT_NAVIGATION_MAP } from '@utils/navigation'
import { StoryRequirement } from '@modules/story/types'
import Button from '@components/common/Button'
import { updateSettings } from '@modules/settings/functions'
import Navigation from '@modules/navigation/dispatch'
import ConfirmModal from '@components/common/ConfirmModal'

function Story({ state, dispatch }: StateProps) {
    const tasks = StoryContent.get
    const [taskPageIndex, setTaskPageIndex] = useState(0)
    const [showSkipConfirm, setShowSkipConfirm] = useState(false)

    const completedTasksLength = state.story?.completedTasks.length ?? 0

    // Find the current task (first incomplete task that can be worked on, or last task if all complete)
    const getCurrentTaskIndex = () => {
        if (!tasks.length) return 0

        // Find first incomplete task that is unlocked and can be worked on
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i]
            if (!isTaskCompleted(state, task.id)) {
                const previousTasksComplete = tasks.slice(0, i).every((t) => isTaskCompleted(state, t.id))
                if (previousTasksComplete) {
                    return i
                }
            }
        }

        // All tasks complete, return last task
        return tasks.length - 1
    }

    useEffect(() => {
        if (!tasks.length) {
            setTaskPageIndex(0)
            return
        }

        const currentTaskIndex = getCurrentTaskIndex()
        setTaskPageIndex(currentTaskIndex)
    }, [completedTasksLength, tasks]) // eslint-disable-line react-hooks/exhaustive-deps

    if (!tasks.length) {
        return (
            <Panel>
                <p>Tutorial content is not available yet.</p>
            </Panel>
        )
    }

    const renderRequirements = (requirements: StoryRequirement[] = []) => {
        const visibleRequirements = requirements.filter((req) => req.type !== 'assignedExpedition')
        if (!visibleRequirements.length) {
            return <p style={{ margin: '12px 0 0 0', fontSize: '18px' }}></p>
        }

        const cardStyle = {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(255,255,255,.07)',
            backgroundColor: 'rgb(14,14,14)',
            padding: '8px 12px',
            borderRadius: '0px',
            width: '200px',
        }

        return (
            <div style={{ marginTop: '12px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontWeight: '400' }}>Requirements</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {visibleRequirements.map((req, i) => {
                        if (req.type === 'item') {
                            const owned = state.inventory.find((item) => item.id === req.id)?.amount || 0
                            const itemMeta = ItemsContent.getById(req.id)
                            const met = owned >= req.amount
                            return (
                                <div key={i} style={cardStyle}>
                                    <img
                                        className="pixel"
                                        src={Images.get(itemMeta?.image || 'items/placeholder.png')}
                                        alt={itemMeta?.name || req.id}
                                        style={{ width: '28px', height: '28px' }}
                                    />
                                    <div>
                                        <p style={{ margin: 0, fontSize: '18px', color: 'white' }}>{itemMeta?.name || req.id}</p>
                                        <p style={{ margin: 0, fontSize: '18px' }}>
                                            <span style={{ color: met ? '#9be45d' : '#ff6b6b' }}>{owned}</span>
                                            <span style={{ color: 'rgba(255,255,255,.6)' }}>/</span>
                                            <span style={{ color: 'rgba(255,255,255,.6)' }}>{req.amount}</span>
                                        </p>
                                    </div>
                                </div>
                            )
                        }

                        if (req.type === 'creatureSummoned') {
                            const creatureMeta = CreaturesContent.getById(req.species)
                            const met = state.creatures?.some((c) => c.species === req.species) ?? false
                            return (
                                <div key={i} style={cardStyle}>
                                    <img
                                        className="pixel"
                                        src={Images.get(creatureMeta?.image || 'items/placeholder.png')}
                                        alt={creatureMeta?.name || req.species}
                                        style={{ width: '28px', height: '28px' }}
                                    />
                                    <div>
                                        <p style={{ margin: 0, fontSize: '18px', color: 'white' }}>
                                            {creatureMeta?.name || req.species}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '18px', color: met ? '#9be45d' : '#ff6b6b' }}>
                                            {met ? 'Summoned' : 'Not summoned'}
                                        </p>
                                    </div>
                                </div>
                            )
                        }

                        if (req.type === 'creatureHelper') {
                            const creatureMeta = CreaturesContent.getById(req.species)
                            const met = state.helpers?.some((h) => h.creatureId === req.species) ?? false
                            return (
                                <div key={i} style={cardStyle}>
                                    <img
                                        className="pixel"
                                        src={Images.get(creatureMeta?.image || 'items/placeholder.png')}
                                        alt={creatureMeta?.name || req.species}
                                        style={{ width: '28px', height: '28px' }}
                                    />
                                    <div>
                                        <p style={{ margin: 0, fontSize: '18px', color: 'white' }}>
                                            {creatureMeta?.name || req.species}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '18px', color: met ? '#9be45d' : '#ff6b6b' }}>
                                            {met ? 'Helping' : 'Not a helper'}
                                        </p>
                                    </div>
                                </div>
                            )
                        }

                        return null
                    })}
                </div>
            </div>
        )
    }

    const renderRewards = (task: (typeof tasks)[number]) => {
        if (!task?.reward || (!task.reward.items?.length && !task.reward.unlockTabs?.length)) {
            return <p style={{ margin: '12px 0 0 0', fontSize: '18px' }}>No rewards.</p>
        }

        return (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {task.reward.items?.length ? (
                    <div>
                        <h3 style={{ margin: '0 0 8px 0', fontWeight: '400' }}>Item Rewards</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {task.reward.items.map((rewardItem) => {
                                const itemMeta = ItemsContent.getById(rewardItem.id)
                                return (
                                    <div
                                        key={rewardItem.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            border: '1px solid rgba(255,255,255,.07)',
                                            backgroundColor: 'rgb(14,14,14)',
                                            padding: '8px 12px',
                                            borderRadius: '0px',
                                            width: '200px',
                                        }}
                                    >
                                        <img
                                            className="pixel"
                                            src={Images.get(itemMeta?.image || 'items/placeholder.png')}
                                            alt={itemMeta?.name || rewardItem.id}
                                            style={{ width: '28px', height: '28px' }}
                                        />
                                        <div>
                                            <p style={{ margin: 0, fontSize: '18px', color: 'white' }}>
                                                {itemMeta?.name || rewardItem.id}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '18px', color: 'rgba(255,255,255,.6)' }}>
                                                ×{rewardItem.amount}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : null}
                {task.reward.unlockTabs?.length ? (
                    <div>
                        <h3 style={{ margin: '0 0 8px 0', fontWeight: '400' }}>Tab Unlocks</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {task.reward.unlockTabs.map((tabId) => {
                                const tabMeta = FLAT_NAVIGATION_MAP.find((tab) => tab.id === tabId)
                                return (
                                    <div
                                        key={tabId}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            border: '1px solid rgba(255,255,255,.07)',
                                            backgroundColor: 'rgb(14,14,14)',
                                            padding: '4px 12px',
                                            borderRadius: '0px',
                                            width: '150px',
                                        }}
                                    >
                                        <img
                                            className="pixel"
                                            src={Images.get(tabMeta?.image || 'items/placeholder.png')}
                                            alt={tabId}
                                            style={{ width: '28px', height: '28px' }}
                                        />
                                        <div>
                                            <p style={{ margin: 0, fontSize: '18px', color: 'white' }}>{tabId}</p>
                                            {/* <p style={{ margin: 0, fontSize: '18px', color: 'rgba(255,255,255,.6)' }}>
                                                {tabMeta?.section || 'Tab'}
                                            </p> */}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : null}
            </div>
        )
    }

    const getMaxVisibleTaskIndex = () => {
        if (!tasks.length) return 0
        const completed = tasks.filter((task) => isTaskCompleted(state, task.id)).length
        return Math.min(completed, tasks.length - 1)
    }

    const maxVisibleTaskIndex = getMaxVisibleTaskIndex()
    const currentTask = tasks.length > 0 ? tasks[Math.min(taskPageIndex, tasks.length - 1)] : null

    const getTaskStatus = (task: (typeof tasks)[number]) => {
        if (isTaskCompleted(state, task.id)) return 'completed'
        const taskIndex = tasks.findIndex((t) => t.id === task.id)
        const previousTasksComplete = tasks.slice(0, taskIndex).every((t) => isTaskCompleted(state, t.id))
        if (!previousTasksComplete) return 'locked'
        if (canTurnInTask(state, task)) return 'ready'
        return 'incomplete'
    }

    const taskStatus = currentTask ? getTaskStatus(currentTask) : 'locked'

    // Check if all tasks are completed
    const allTasksCompleted = tasks.length > 0 && tasks.every((task) => isTaskCompleted(state, task.id))

    // Handle completion button click
    const handleCompleteTutorial = () => {
        const disabledTabs = state.settings?.disabledNavigationTabs || []
        if (!disabledTabs.includes('Tutorial')) {
            dispatch({
                action: updateSettings,
                payload: { settings: { disabledNavigationTabs: [...disabledTabs, 'Tutorial'] } },
            })
        }
        Navigation.tab(dispatch, 'Inventory')
    }

    // Show completion screen if all tasks are done
    if (allTasksCompleted) {
        return (
            <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '0px' }}>
                    <Panel style={{ width: '600px', margin: '40px auto' }}>
                        <h2 style={{ marginTop: 0, textAlign: 'center' }}>Tutorial Complete!</h2>
                        <p
                            style={{
                                color: 'rgba(255,255,255,.8)',
                                fontSize: '24px',
                                marginTop: '0',
                                textAlign: 'center',
                                letterSpacing: '-0.3px',
                            }}
                        >
                            Congratulations! You've completed all tutorial tasks. Now get out there and bring the creatures of
                            Koltera back into the world!
                            <br /> <br /> Click the button below to hide the Tutorial tab from navigation and return to your
                            inventory.
                        </p>
                        <Button
                            onClick={handleCompleteTutorial}
                            style={{
                                marginTop: '22px',
                                cursor: 'pointer',
                                fontSize: '18px',
                            }}
                        >
                            COMPLETE TUTORIAL
                        </Button>
                    </Panel>
                </div>
            </div>
        )
    }

    // Handle skip tutorial button click
    const handleSkipTutorial = () => {
        setShowSkipConfirm(true)
    }

    // Handle confirmed skip tutorial
    const handleConfirmSkipTutorial = () => {
        StoryActions.skipTutorial(dispatch)
        // Navigate to inventory after skipping
        Navigation.tab(dispatch, 'Inventory')
        setShowSkipConfirm(false)
    }

    return (
        <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '640px' }}>
                <Panel>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h2 style={{ marginTop: 0 }}>Tutorial</h2>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,.85)', fontSize: '20px' }}>
                        Complete tasks to unlock new features and progress through the game.
                    </p>
                    {!allTasksCompleted && (
                        <Button
                            onClick={handleSkipTutorial}
                            style={{
                                cursor: 'pointer',
                                padding: '8px 16px',
                                backgroundColor: '#4a2a2a',
                                border: '1px solid rgba(255,255,255,.2)',
                                width: '200px',
                                marginTop: '8px',
                            }}
                        >
                            Skip Tutorial
                        </Button>
                    )}
                </Panel>
                <Panel>
                    {currentTask ? (
                        <div>
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            <h2 style={{ margin: 0 }}>{currentTask.title}</h2>
                                            <span
                                                style={{
                                                    fontSize: '16px',
                                                    fontWeight: '400',
                                                    textTransform: 'uppercase',
                                                    color:
                                                        taskStatus === 'completed'
                                                            ? '#9be45d'
                                                            : taskStatus === 'locked'
                                                              ? '#e0de58'
                                                              : taskStatus === 'ready'
                                                                ? '#ffd86b'
                                                                : '#e0de58',
                                                }}
                                            >
                                                {taskStatus === 'completed'
                                                    ? 'Completed'
                                                    : taskStatus === 'locked'
                                                      ? 'Locked'
                                                      : taskStatus === 'ready'
                                                        ? 'Ready to Turn In'
                                                        : 'Missing Requirements'}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '20px', color: 'rgba(255,255,255,.85)' }}>
                                            {currentTask.description}
                                        </p>
                                    </div>
                                </div>
                                {renderRequirements(currentTask.requirements || [])}
                            </div>

                            {renderRewards(currentTask)}

                            <div>
                                {!isTaskCompleted(state, currentTask.id) ? (
                                    <Button
                                        disabled={!canTurnInTask(state, currentTask)}
                                        onClick={() => {
                                            StoryActions.turnInTask(dispatch, currentTask.id)
                                            // Advance to next task after turning in
                                            setTimeout(() => {
                                                const nextTaskIndex = taskPageIndex + 1
                                                if (nextTaskIndex < tasks.length) {
                                                    setTaskPageIndex(nextTaskIndex)
                                                }
                                            }, 100)
                                        }}
                                        style={{
                                            marginTop: '16px',
                                            cursor: canTurnInTask(state, currentTask) ? 'pointer' : 'not-allowed',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            backgroundColor: canTurnInTask(state, currentTask)
                                                ? '#26402a'
                                                : 'rgba(255,255,255,.1)',
                                        }}
                                    >
                                        Turn In
                                    </Button>
                                ) : (
                                    <div style={{ height: '52px' }}></div>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'end', alignItems: 'center', fontSize: '18px' }}>
                                <span>
                                    Task Selected:{' '}
                                    <span style={{ color: 'yellow' }}>
                                        {taskPageIndex + 1}/{tasks.length}
                                    </span>
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '0px' }}>
                                <Button
                                    onClick={() => setTaskPageIndex((prev) => Math.max(0, prev - 1))}
                                    disabled={taskPageIndex === 0}
                                    style={{
                                        flex: 1,
                                        cursor: taskPageIndex === 0 ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    Previous
                                </Button>
                                <Button
                                    onClick={() => setTaskPageIndex((prev) => Math.min(maxVisibleTaskIndex, prev + 1))}
                                    disabled={taskPageIndex >= maxVisibleTaskIndex}
                                    style={{
                                        flex: 1,
                                        cursor: taskPageIndex >= maxVisibleTaskIndex ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p style={{ marginTop: '16px' }}>No tasks available yet.</p>
                    )}
                </Panel>
            </div>
            <ConfirmModal
                opened={showSkipConfirm}
                onClose={() => setShowSkipConfirm(false)}
                onConfirm={handleConfirmSkipTutorial}
                text="Are you sure you want to skip the tutorial? You will receive all tutorial rewards and unlock all tutorial tabs."
            />
        </div>
    )
}

export default Story

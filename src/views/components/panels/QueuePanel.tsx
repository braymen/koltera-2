import Button from '@components/common/Button'
import Panel from '@components/common/Panel'
import { Group, Stack, Text } from '@mantine/core'
import { CrafterState } from '@modules/crafting/types'
import CraftingActions from '@modules/crafting/dispatch'
import { Skills } from '@modules/skilling/types'
import Images from '@utils/images'

interface Props {
    dispatch: any
    workstationType: Skills
    crafterState: CrafterState
}

const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
}

function QueuePanel({ dispatch, workstationType, crafterState }: Props) {
    const queue = crafterState?.queue || []
    const isActive = crafterState?.isActive

    // Total remaining time: active job remaining + all queued jobs
    let totalRemainingTime = 0
    if (isActive && queue.length > 0) {
        const activeJob = queue[0]
        const remainingItems = activeJob.amount - (crafterState.completedItems || 0)
        totalRemainingTime += remainingItems * activeJob.singleItemDuration * (1 - (crafterState.progress || 0) / remainingItems)
    }
    for (let i = 1; i < queue.length; i++) {
        totalRemainingTime += queue[i].totalDuration
    }

    // More accurate: use the actual progress-based remaining time for active job
    if (isActive && crafterState.duration > 0) {
        totalRemainingTime = crafterState.duration * (1 - (crafterState.progress || 0))
        for (let i = 1; i < queue.length; i++) {
            totalRemainingTime += queue[i].totalDuration
        }
    }

    return (
        <Panel style={{ minHeight: '578px', maxHeight: '578px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Group justify="space-between" align="center" style={{ marginBottom: '4px' }}>
                <h3 style={{ margin: 0 }}>Queue</h3>
                {queue.length > 0 && (
                    <Text size="xs" c="dimmed" style={{ fontSize: '16px' }}>
                        {formatTime(totalRemainingTime)}
                    </Text>
                )}
            </Group>

            {queue.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', flex: 1, fontSize: '24px' }}>
                    <Text style={{ fontSize: '20px' }}>Queue is empty</Text>
                    <Text size="xs" c="dimmed" style={{ fontSize: '16px', marginTop: '4px' }}>
                        Select a recipe and start crafting
                    </Text>
                </div>
            ) : (
                <Stack gap="4px" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                    {queue.map((job, index) => {
                        const isActiveJob = index === 0 && isActive

                        return (
                            <div
                                key={job.id || `${job.itemId}-${index}`}
                                style={{
                                    padding: '6px 8px',
                                    backgroundColor: isActiveJob ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                                    borderLeft: isActiveJob ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
                                }}
                            >
                                {/* Item info row */}
                                <Group gap="8px" style={{ minWidth: 0 }}>
                                    <img
                                        className="pixel"
                                        src={Images.get(job.item?.image || 'items/placeholder.png')}
                                        alt={job.item?.name || job.itemId}
                                        width={24}
                                        height={24}
                                        style={{ flexShrink: 0 }}
                                    />
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <Text
                                            size="sm"
                                            style={{ fontSize: '16px', lineHeight: 1.2, marginBottom: '-4px' }}
                                            truncate
                                        >
                                            {job.item?.name || job.itemId}
                                        </Text>
                                        <Group justify="space-between" style={{ fontSize: '16px', lineHeight: 1.2 }}>
                                            <Text size="xs" c="dimmed" style={{ fontSize: '16px', lineHeight: 1.2 }}>
                                                {isActiveJob
                                                    ? `${crafterState.completedItems || 0}/${job.amount}`
                                                    : `${job.amount}x`}
                                            </Text>
                                            <Text size="xs" c="dimmed" style={{ fontSize: '16px', lineHeight: 1.2 }}>
                                                {isActiveJob
                                                    ? formatTime(crafterState.duration * (1 - (crafterState.progress || 0)))
                                                    : formatTime(job.totalDuration)}
                                            </Text>
                                        </Group>
                                    </div>
                                </Group>

                                {/* Progress bar for active job */}
                                {isActiveJob && (
                                    <div
                                        style={{
                                            height: '4px',
                                            width: '100%',
                                            position: 'relative',
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            marginTop: '0px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: 0,
                                                right: (1 - (crafterState.progress || 0)) * 100 + '%',
                                                top: 0,
                                                bottom: 0,
                                                backgroundColor: 'rgba(255,255,255,0.6)',
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Action buttons row */}
                                <Group gap="4px" style={{ marginTop: '4px' }}>
                                    {isActiveJob ? (
                                        <Button
                                            onClick={() =>
                                                CraftingActions.stopCrafting(dispatch, {
                                                    workstation: workstationType,
                                                })
                                            }
                                            style={{
                                                padding: '1px 8px',
                                                fontSize: '16px',
                                                lineHeight: 1,
                                                height: '22px',
                                                width: 'auto',
                                                backgroundColor: '#402626',
                                                marginLeft: 'auto',
                                            }}
                                        >
                                            Stop
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={() =>
                                                    CraftingActions.reorderQueue(dispatch, {
                                                        workstation: workstationType,
                                                        jobId: job.id,
                                                        direction: 'up',
                                                    })
                                                }
                                                disabled={index <= 1}
                                                style={{
                                                    padding: '1px 6px',
                                                    fontSize: '16px',
                                                    lineHeight: 1,
                                                    height: '22px',
                                                    width: 'auto',
                                                }}
                                            >
                                                ▲ Up
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    CraftingActions.reorderQueue(dispatch, {
                                                        workstation: workstationType,
                                                        jobId: job.id,
                                                        direction: 'down',
                                                    })
                                                }
                                                disabled={index >= queue.length - 1}
                                                style={{
                                                    padding: '1px 6px',
                                                    fontSize: '16px',
                                                    lineHeight: 1,
                                                    height: '22px',
                                                    width: 'auto',
                                                }}
                                            >
                                                ▼ Down
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    CraftingActions.removeQueuedJob(dispatch, {
                                                        workstation: workstationType,
                                                        jobId: job.id,
                                                    })
                                                }
                                                style={{
                                                    padding: '1px 6px',
                                                    fontSize: '16px',
                                                    lineHeight: 1,
                                                    height: '22px',
                                                    width: 'auto',
                                                    backgroundColor: '#402626',
                                                    margin: '0 0 0 auto',
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    )}
                                </Group>
                            </div>
                        )
                    })}
                </Stack>
            )}
        </Panel>
    )
}

export default QueuePanel

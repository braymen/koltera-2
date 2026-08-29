import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import Button from '@components/common/Button'
import Tooltip from '@components/common/Tooltip'
import Images from '@utils/images'
import ItemsContent from '@data/items'
import MilestoneHelpers, { TrackSummary, MilestoneStatus } from '@modules/milestones/helpers'
import * as MilestoneDispatch from '@modules/milestones/dispatch'

function MilestoneTrackRow({ summary, dispatch, isPrimary }: { summary: TrackSummary; dispatch: any; isPrimary: boolean }) {
    const activeMilestoneIndex = summary.milestones.findIndex((m) => !m.claimed)
    const activeMilestone = activeMilestoneIndex !== -1 ? summary.milestones[activeMilestoneIndex] : null
    return (
        <Panel>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '-6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                        className="pixel"
                        src={Images.get(summary.image)}
                        alt={summary.name}
                        style={{ width: '24px', height: '24px' }}
                    />
                    <div>
                        <span
                            style={{
                                fontSize: '16px',
                                color: isPrimary ? 'rgb(255, 187, 0)' : 'rgba(255,255,255,0.4)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}
                        >
                            {isPrimary ? 'Main Objective' : 'Side Objective'}
                        </span>
                        <div style={{ fontSize: '24px', color: 'rgba(255,255,255,0.95)', marginTop: '-12px' }}>
                            {summary.name}
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', color: 'rgb(255, 187, 0)' }}>
                        {summary.current} / {summary.max} {summary.label}
                    </div>
                    {/* <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', marginTop: '-2px' }}>
                        {summary.claimedCount} / {summary.milestones.length} milestones claimed
                    </div> */}
                </div>
            </div>

            {/* Description */}
            <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>{summary.description}</div>

            {/* Sectioned progress bar */}
            <div style={{ display: 'flex', gap: '3px', marginBottom: '26px' }}>
                {summary.milestones.map((m, i) => {
                    const prevThreshold = i > 0 ? summary.milestones[i - 1].definition.threshold : 0
                    const segmentSize = m.definition.threshold - prevThreshold
                    const segmentProgress = Math.max(0, Math.min(summary.current - prevThreshold, segmentSize))
                    const fillPercent = segmentSize > 0 ? (segmentProgress / segmentSize) * 100 : 0

                    const isClaimed = m.claimed
                    const isClaimable = m.claimable
                    const isActive = i === activeMilestoneIndex

                    let fillColor = 'rgba(255,255,255,0.5)'
                    if (isClaimed) {
                        fillColor = 'rgba(0, 255, 38, 0.7)'
                    } else if (isClaimable) {
                        fillColor = 'rgb(255, 225, 0)'
                    }

                    return (
                        <div
                            key={m.definition.id}
                            style={{
                                flex: 1,
                                height: '14px',
                                backgroundColor: 'rgba(255,255,255,0.08)',
                                border: isActive
                                    ? '1px solid rgba(255,255,255,0.4)'
                                    : isClaimable
                                      ? '1px solid rgba(255, 187, 0, 0.5)'
                                      : '1px solid rgba(255,255,255,0.1)',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: fillPercent + '%',
                                    backgroundColor: fillColor,
                                    transition: 'width 0.3s ease',
                                }}
                            />
                        </div>
                    )
                })}
            </div>

            {/* Active milestone: single row with title, rewards, requirement, and claim */}
            {activeMilestone ? (
                <MilestoneRewardRow milestone={activeMilestone} dispatch={dispatch} />
            ) : (
                <div style={{ textAlign: 'center', fontSize: '18px', color: 'rgb(4, 255, 0)', padding: '4px 0' }}>
                    All milestones complete!
                </div>
            )}
        </Panel>
    )
}

function MilestoneRewardRow({ milestone, dispatch }: { milestone: MilestoneStatus; dispatch: any }) {
    const def = milestone.definition

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
            }}
        >
            {/* Rewards */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                {def.rewards.map((reward) => {
                    const item = ItemsContent.getById(reward.itemId)
                    if (!item) return null
                    return (
                        <Tooltip
                            key={reward.itemId}
                            inline
                            center
                            content={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '-8px' }}>
                                    <img
                                        className="pixel"
                                        src={Images.get(item.image)}
                                        alt={item.name}
                                        style={{ width: '38px', height: '38px', flexShrink: 0 }}
                                    />
                                    <div>
                                        <h1 style={{ fontSize: '18px', color: 'white', margin: 0 }}>{item.name}</h1>
                                        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            }
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <img
                                    className="pixel"
                                    src={Images.get(item.image)}
                                    alt={item.name}
                                    style={{ width: '32px', height: '32px' }}
                                />
                                <span style={{ fontSize: '24px', color: 'rgba(255,255,255, 1)' }}>
                                    {reward.amount.toLocaleString()}
                                </span>
                            </div>
                        </Tooltip>
                    )
                })}
            </div>

            {/* Requirement */}
            {/* <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                {def.threshold} required
            </div> */}

            {/* Claim button */}
            {milestone.claimable && (
                <Button
                    onClick={() => MilestoneDispatch.claimMilestone(dispatch, def.id)}
                    style={{ width: 'auto', padding: '0 16px', backgroundColor: 'rgb(41, 109, 41)' }}
                >
                    Collect Reward
                </Button>
            )}
        </div>
    )
}

function Milestones({ state, dispatch }: StateProps) {
    const summaries = MilestoneHelpers.getAllTrackSummaries(state)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '970px', margin: 'auto' }}>
            {summaries.map((summary) => (
                <MilestoneTrackRow key={summary.trackId} summary={summary} dispatch={dispatch} isPrimary={summary.isPrimary} />
            ))}
        </div>
    )
}

export default Milestones

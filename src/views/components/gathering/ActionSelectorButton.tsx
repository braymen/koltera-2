import { StateProps } from '@engine/types'
import Images from '@utils/images'
import Sounds from '@utils/sounds'
import Tooltip from '@components/common/Tooltip'
import { BonusBreakdown } from '@modules/bonuses/helpers'

interface Props extends StateProps {
    image: string
    label: string
    xp: number
    baseXp?: number
    duration: number
    baseDuration?: number
    levelRequirement: number
    onClick: () => void
    unlocked: boolean
    selected: boolean
    active?: boolean
    xpBreakdown?: BonusBreakdown
}

function ActivitySelectionButton({
    state,
    dispatch,
    image,
    label,
    xp,
    baseXp,
    duration,
    baseDuration,
    levelRequirement,
    onClick,
    unlocked,
    selected,
    active,
    xpBreakdown,
}: Props) {
    const clicked = () => {
        Sounds.play('click.wav')
        onClick()
    }

    const xpPerSecond = duration > 0 ? xp / duration : 0

    const bonusTooltipContent =
        xpBreakdown && baseXp !== undefined ? (
            <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '-4px', color: 'white' }}>XP Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>Base XP</span>
                        <span style={{ color: 'white' }}>{baseXp.toFixed(2)}</span>
                    </div>
                    {xpBreakdown.sanctuary > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Sanctuary</span>
                            <span style={{ color: '#4ade80' }}>+{xpBreakdown.sanctuary.toFixed(2)}%</span>
                        </div>
                    )}
                    {xpBreakdown.upgrades > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Awaken Tree</span>
                            <span style={{ color: '#4ade80' }}>+{xpBreakdown.upgrades.toFixed(2)}%</span>
                        </div>
                    )}
                    {xpBreakdown.playerLevel > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Player Level</span>
                            <span style={{ color: '#4ade80' }}>+{xpBreakdown.playerLevel.toFixed(2)}%</span>
                        </div>
                    )}
                    {xpBreakdown.tool > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Tool</span>
                            <span style={{ color: '#4ade80' }}>+{xpBreakdown.tool.toFixed(2)}%</span>
                        </div>
                    )}
                    {xpBreakdown.total > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '16px',
                                borderTop: '1px solid rgba(255,255,255,0.15)',
                                paddingTop: '4px',
                                marginTop: '2px',
                            }}
                        >
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Total Bonus</span>
                            <span style={{ color: '#4ade80' }}>+{xpBreakdown.total.toFixed(2)}%</span>
                        </div>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '16px',
                            borderTop: '1px solid rgba(255,255,255,0.15)',
                            paddingTop: '4px',
                            marginTop: '2px',
                        }}
                    >
                        <span style={{ color: 'white' }}>Final XP</span>
                        <span style={{ color: 'white' }}>{xp.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        ) : null

    return (
        <>
            <div
                onClick={unlocked ? clicked : () => {}}
                className={unlocked ? 'skill-focus-btn' : 'skill-focus-btn-disabled'}
                style={{
                    padding: '6.5px 2px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    backgroundColor: active ? 'rgba(255, 165, 0, 0.15)' : selected ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    borderLeft: active
                        ? '3px solid rgba(255, 165, 0, 0.5)'
                        : selected
                          ? '3px solid rgba(255, 255, 255, 0.5)'
                          : '3px solid transparent',
                }}
            >
                <img
                    className="pixel"
                    src={Images.get(image)}
                    alt="Skill Icon"
                    style={{
                        width: '24px',
                        height: '24px',
                        marginRight: '8px',
                        marginLeft: '4px',
                        filter: unlocked ? 'none' : 'brightness(0)',
                    }}
                />
                <h3
                    style={{
                        flexGrow: 1,
                        fontSize: '16px',
                        fontWeight: '400',
                        color: unlocked ? 'inherit' : 'rgba(255,255,255,.25)',
                    }}
                >
                    {unlocked ? label : '???'}
                </h3>
                <div
                    style={{
                        paddingRight: '8px',
                        display: 'flex',
                        width: '300px',
                        gap: '12px',
                        justifyContent: 'flex-end',
                    }}
                >
                    <span style={{ fontSize: '14px', fontWeight: '400', textAlign: 'right', minWidth: '68px' }}>
                        Level {levelRequirement}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '400', textAlign: 'right', minWidth: '68px' }}>
                        {unlocked ? <>{duration} secs</> : '???'}
                    </span>
                    <Tooltip
                        content={bonusTooltipContent}
                        disabled={!unlocked || !bonusTooltipContent}
                        width="240px"
                        center
                        inline
                    >
                        <span style={{ fontSize: '14px', fontWeight: '400', textAlign: 'right', minWidth: '54px' }}>
                            {unlocked ? <>{xp.toFixed(2)}xp</> : '???'}
                        </span>
                    </Tooltip>
                    <span style={{ fontSize: '14px', fontWeight: '400', textAlign: 'right', minWidth: '72px' }}>
                        {unlocked ? <>{xpPerSecond.toFixed(2)} XP/s</> : '???'}
                    </span>
                </div>
            </div>
        </>
    )
}

export default ActivitySelectionButton

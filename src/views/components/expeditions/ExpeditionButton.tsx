import { StateProps } from '@engine/types'
import Images from '@utils/images'
import Sounds from '@utils/sounds'
import { useState, useEffect, useMemo } from 'react'
import { getExpeditionDurationLeft } from '@modules/expeditions/helpers'
import Numbers from '@utils/numbers'
import ExpeditionsContent from '@data/expeditions'

interface Props extends StateProps {
    expeditionTypeId: string
    title: string
    difficultyRating: number
    tier: number
    selected?: boolean
    onClick: (expeditionTypeId: string) => void
    isUnlocked?: boolean
    remainingExpeditions?: number
}

function ExpeditionButton({
    state,
    dispatch,
    expeditionTypeId,
    title,
    difficultyRating,
    tier,
    selected,
    onClick,
    isUnlocked = true,
    remainingExpeditions = 0,
}: Props) {
    const [currentTime, setCurrentTime] = useState(Date.now() / 1000)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now() / 1000)
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const activeExpeditionOfSameType = useMemo(() => {
        return (state.activeExpeditions || []).find((exp) => exp.instance.expeditionTypeId === expeditionTypeId && !exp.completed)
    }, [state.activeExpeditions, expeditionTypeId])

    const completedExpeditionOfSameType = useMemo(() => {
        return (state.activeExpeditions || []).find((exp) => exp.instance.expeditionTypeId === expeditionTypeId && exp.completed)
    }, [state.activeExpeditions, expeditionTypeId])

    const clicked = () => {
        if (!isUnlocked) return
        Sounds.play('click.wav')
        onClick(expeditionTypeId)
    }

    return (
        <div
            onClick={clicked}
            className="skill-focus-btn"
            style={{
                padding: '8px 2px',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: selected ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                borderLeft: selected ? '3px solid rgba(255, 255, 255, 0.5)' : '3px solid transparent',
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '20px' }}>
                <img
                    className="pixel"
                    src={Images.get(ExpeditionsContent.getById(expeditionTypeId)?.image || 'items/placeholder.png')}
                    alt={title}
                    style={{
                        width: '18px',
                        height: '18px',
                        marginLeft: '4px',
                        marginRight: '8px',
                        filter: isUnlocked ? 'none' : 'brightness(0)',
                        opacity: isUnlocked ? 1 : 0.3,
                    }}
                />
                <h3 style={{ flexGrow: 1, fontSize: '16px', fontWeight: '400', color: isUnlocked ? 'inherit' : '#555' }}>
                    {isUnlocked ? title : `Complete ${remainingExpeditions} more Expeditions`}
                </h3>
                {isUnlocked && activeExpeditionOfSameType && (
                    <div
                        style={{
                            paddingRight: '8px',
                            fontSize: '16px',
                            fontWeight: '400',
                            color: 'lime',
                        }}
                    >
                        {Numbers.timeShort(getExpeditionDurationLeft(activeExpeditionOfSameType, currentTime))}
                    </div>
                )}
                {isUnlocked && !activeExpeditionOfSameType && !completedExpeditionOfSameType && (
                    <div
                        style={{
                            paddingRight: '8px',
                            fontSize: '16px',
                            fontWeight: '400',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-evenly',
                        }}
                    >
                        <img
                            className="pixel"
                            src={Images.get('icons/rating.png')}
                            alt="Difficulty Icon"
                            style={{ width: '18px', height: '18px', marginRight: '8px', filter: 'brightness(0.8)' }}
                        />
                        <span style={{ fontSize: '16px', fontWeight: '400', textAlign: 'right' }}>{difficultyRating}</span>
                    </div>
                )}
                {isUnlocked && completedExpeditionOfSameType && (
                    <div
                        style={{
                            paddingRight: '8px',
                            fontSize: '14px',
                            fontWeight: '400',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <span
                            style={{
                                backgroundColor: '#16a34a',
                                color: 'white',
                                fontSize: '14px',
                                padding: '4px 8px',
                                paddingTop: '6px',
                                borderRadius: '0px',
                                textTransform: 'uppercase',
                                fontWeight: '400',
                                lineHeight: '1',
                            }}
                        >
                            Collect
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ExpeditionButton

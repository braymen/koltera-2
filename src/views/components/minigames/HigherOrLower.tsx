import { useState } from 'react'
import { StateProps } from '@engine/types'
import { changeInventory } from '@modules/inventory/functions'
import Panel from '@components/common/Panel'
import Button from '@components/common/Button'
import Images from '@utils/images'
import Sounds from '@utils/sounds'

const ANTE_COST = 100

const PAYOUT_LADDER = [1, 2, 5, 10, 25, 50]

type GamePhase = 'idle' | 'playing' | 'won' | 'lost'

function HigherOrLower({ state, dispatch }: StateProps) {
    const [phase, setPhase] = useState<GamePhase>('idle')
    const [currentNumber, setCurrentNumber] = useState(0)
    const [streak, setStreak] = useState(0)
    const [lastGuess, setLastGuess] = useState<'higher' | 'lower' | null>(null)
    const [previousNumber, setPreviousNumber] = useState<number | null>(null)
    const [isRevealing, setIsRevealing] = useState(false)

    const dirtAmount = state.inventory.find((i) => i.id === 'dirt')?.amount ?? 0
    const canStart = dirtAmount >= ANTE_COST

    const currentPayout = streak > 0 ? PAYOUT_LADDER[Math.min(streak - 1, PAYOUT_LADDER.length - 1)] : 0
    const nextPayout = PAYOUT_LADDER[Math.min(streak, PAYOUT_LADDER.length - 1)]
    const atMaxStreak = streak >= PAYOUT_LADDER.length

    const startGame = () => {
        if (!canStart) return

        dispatch({
            action: changeInventory,
            payload: { resources: [{ id: 'dirt', amount: -ANTE_COST }] },
        })

        const num = Math.floor(Math.random() * 100) + 1
        setCurrentNumber(num)
        setStreak(0)
        setPhase('playing')
        setPreviousNumber(null)
        setLastGuess(null)
        Sounds.play('click.wav')
    }

    const guess = (choice: 'higher' | 'lower') => {
        if (phase !== 'playing' || isRevealing) return

        setIsRevealing(true)
        const nextNumber = Math.floor(Math.random() * 100) + 1

        setTimeout(() => {
            const isHigher = nextNumber > currentNumber
            const isEqual = nextNumber === currentNumber
            const correct = isEqual ? false : (choice === 'higher' && isHigher) || (choice === 'lower' && !isHigher)

            setPreviousNumber(currentNumber)
            setLastGuess(choice)
            setCurrentNumber(nextNumber)

            if (correct) {
                const newStreak = streak + 1
                setStreak(newStreak)

                if (newStreak >= PAYOUT_LADDER.length) {
                    // Max payout reached, auto cash out
                    const payout = PAYOUT_LADDER[PAYOUT_LADDER.length - 1]
                    dispatch({
                        action: changeInventory,
                        payload: { resources: [{ id: 'Dirt Credits', amount: payout }] },
                    })
                    setPhase('won')
                    Sounds.play('pop.wav')
                } else {
                    Sounds.play('pop.wav')
                }
            } else {
                setPhase('lost')
                Sounds.play('click.wav')
            }

            setIsRevealing(false)
        }, 500)
    }

    const cashOut = () => {
        if (phase !== 'playing' || streak === 0) return

        dispatch({
            action: changeInventory,
            payload: { resources: [{ id: 'Dirt Credits', amount: currentPayout }] },
        })

        setPhase('won')
        Sounds.play('pop.wav')
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Number display */}
            <Panel style={{ minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {phase === 'idle' ? (
                    <div style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)' }}>Pay {ANTE_COST} Dirt to start!</div>
                ) : (
                    <>
                        {previousNumber !== null && (
                            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                                Previous: {previousNumber} (guessed {lastGuess})
                            </div>
                        )}
                        <div
                            style={{
                                fontSize: '56px',
                                fontWeight: 'bold',
                                color:
                                    phase === 'lost'
                                        ? 'rgb(220, 40, 40)'
                                        : phase === 'won'
                                          ? 'rgb(0, 220, 40)'
                                          : isRevealing
                                            ? 'rgba(255,255,255,0.3)'
                                            : 'white',
                            }}
                        >
                            {isRevealing ? '?' : currentNumber}
                        </div>
                        <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)' }}>
                            Streak: {streak} | Current Payout:{' '}
                            <img
                                className="pixel"
                                src={Images.get('items/dirt-credits.png')}
                                alt=""
                                style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                            />{' '}
                            {currentPayout}
                        </div>
                    </>
                )}
            </Panel>

            {/* Controls */}
            <Panel>
                {phase === 'idle' && (
                    <Button onClick={startGame} disabled={!canStart}>
                        {`Start Game (${ANTE_COST} Dirt)`}
                    </Button>
                )}

                {phase === 'playing' && (
                    <>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                            <div style={{ flex: 1 }}>
                                <Button onClick={() => guess('higher')} disabled={isRevealing || atMaxStreak}>
                                    Higher
                                </Button>
                            </div>
                            <div style={{ flex: 1 }}>
                                <Button onClick={() => guess('lower')} disabled={isRevealing || atMaxStreak}>
                                    Lower
                                </Button>
                            </div>
                        </div>
                        {streak > 0 && (
                            <Button onClick={cashOut} disabled={isRevealing} style={{ backgroundColor: '#2a6b2a' }}>
                                {`Cash Out (${currentPayout} Credits)`}
                            </Button>
                        )}
                    </>
                )}

                {(phase === 'won' || phase === 'lost') && (
                    <div>
                        <div
                            style={{
                                textAlign: 'center',
                                fontSize: '18px',
                                marginBottom: '8px',
                                color: phase === 'won' ? 'rgb(0, 220, 40)' : 'rgb(220, 40, 40)',
                            }}
                        >
                            {phase === 'won' ? (
                                <span>
                                    You cashed out{' '}
                                    <img
                                        className="pixel"
                                        src={Images.get('items/dirt-credits.png')}
                                        alt=""
                                        style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                                    />{' '}
                                    {currentPayout} Dirt Credits!
                                </span>
                            ) : (
                                <span>Wrong! The number was {currentNumber}. You lost your ante.</span>
                            )}
                        </div>
                        <Button onClick={startGame} disabled={!canStart}>
                            {`Play Again (${ANTE_COST} Dirt)`}
                        </Button>
                    </div>
                )}
            </Panel>

            {/* Payout ladder */}
            <Panel>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Payout Ladder</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {PAYOUT_LADDER.map((payout, i) => (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                minWidth: '60px',
                                padding: '4px 8px',
                                textAlign: 'center',
                                fontSize: '14px',
                                backgroundColor:
                                    i < streak ? 'rgba(0, 220, 40, 0.15)' : i === streak && phase === 'playing' ? 'rgba(255, 187, 0, 0.15)' : 'rgba(255,255,255,0.05)',
                                border:
                                    i === streak && phase === 'playing'
                                        ? '1px solid rgba(255, 187, 0, 0.5)'
                                        : '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>x{i + 1}</div>
                            <div>{payout}</div>
                        </div>
                    ))}
                </div>
            </Panel>
        </div>
    )
}

export default HigherOrLower

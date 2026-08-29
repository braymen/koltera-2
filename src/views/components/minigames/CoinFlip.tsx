import { useState } from 'react'
import { StateProps } from '@engine/types'
import { changeInventory } from '@modules/inventory/functions'
import Panel from '@components/common/Panel'
import Button from '@components/common/Button'
import Images from '@utils/images'
import Sounds from '@utils/sounds'

const BET_PRESETS = [10, 50, 100, 500]

type CoinSide = 'heads' | 'tails'
type FlipResult = {
    pick: CoinSide
    result: CoinSide
    won: boolean
    betAmount: number
    payout: number
}

function CoinFlip({ state, dispatch }: StateProps) {
    const [betAmount, setBetAmount] = useState(10)
    const [lastResult, setLastResult] = useState<FlipResult | null>(null)
    const [isFlipping, setIsFlipping] = useState(false)

    const dirtAmount = state.inventory.find((i) => i.id === 'dirt')?.amount ?? 0
    const canBet = dirtAmount >= betAmount && betAmount > 0

    const flip = (pick: CoinSide) => {
        if (!canBet || isFlipping) return

        setIsFlipping(true)
        const result: CoinSide = Math.random() < 0.5 ? 'heads' : 'tails'
        const won = pick === result
        const payout = won ? Math.floor(betAmount * 0.8) : 0

        // Deduct dirt
        const resources = [{ id: 'dirt', amount: -betAmount }]
        if (won && payout > 0) {
            resources.push({ id: 'Dirt Credits', amount: payout })
        }

        dispatch({
            action: changeInventory,
            payload: { resources },
        })

        setTimeout(() => {
            setLastResult({ pick, result, won, betAmount, payout })
            setIsFlipping(false)
            Sounds.play(won ? 'pop.wav' : 'click.wav')
        }, 600)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Result display */}
            <Panel style={{ minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isFlipping ? (
                    <div style={{ fontSize: '32px', color: 'rgba(255,255,255,0.6)', animation: 'pulse 0.3s infinite' }}>
                        Flipping...
                    </div>
                ) : lastResult ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', marginBottom: '4px' }}>
                            {lastResult.result === 'heads' ? 'HEADS' : 'TAILS'}
                        </div>
                        <div
                            style={{
                                fontSize: '20px',
                                color: lastResult.won ? 'rgb(0, 220, 40)' : 'rgb(220, 40, 40)',
                            }}
                        >
                            {lastResult.won ? (
                                <span>
                                    You won{' '}
                                    <img
                                        className="pixel"
                                        src={Images.get('items/dirt-credits.png')}
                                        alt=""
                                        style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                                    />{' '}
                                    {lastResult.payout} Dirt Credits!
                                </span>
                            ) : (
                                <span>You lost {lastResult.betAmount} Dirt!</span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)' }}>Pick a side to flip!</div>
                )}
            </Panel>

            {/* Bet amount */}
            <Panel>
                <div style={{ marginBottom: '6px', fontSize: '16px', color: 'rgba(255,255,255,0.7)' }}>Bet Amount (Dirt)</div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {BET_PRESETS.map((preset) => (
                        <div
                            key={preset}
                            onClick={() => {
                                Sounds.play('click.wav')
                                setBetAmount(preset)
                            }}
                            style={{
                                flex: 1,
                                padding: '6px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                fontSize: '16px',
                                backgroundColor: betAmount === preset ? 'rgba(255, 187, 0, 0.15)' : 'rgba(255,255,255,0.05)',
                                border:
                                    betAmount === preset
                                        ? '1px solid rgba(255, 187, 0, 0.5)'
                                        : '1px solid rgba(255,255,255,0.15)',
                            }}
                        >
                            {preset}
                        </div>
                    ))}
                    <div
                        onClick={() => {
                            Sounds.play('click.wav')
                            setBetAmount(dirtAmount)
                        }}
                        style={{
                            flex: 1,
                            padding: '6px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            fontSize: '16px',
                            backgroundColor:
                                betAmount === dirtAmount && dirtAmount > 0
                                    ? 'rgba(255, 187, 0, 0.15)'
                                    : 'rgba(255,255,255,0.05)',
                            border:
                                betAmount === dirtAmount && dirtAmount > 0
                                    ? '1px solid rgba(255, 187, 0, 0.5)'
                                    : '1px solid rgba(255,255,255,0.15)',
                        }}
                    >
                        All In
                    </div>
                </div>

                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                    Win pays 0.8x in Dirt Credits (e.g. bet {betAmount} dirt, win {Math.floor(betAmount * 0.8)} credits)
                </div>

                {/* Flip buttons */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ flex: 1 }}>
                        <Button onClick={() => flip('heads')} disabled={!canBet || isFlipping}>
                            Heads
                        </Button>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Button onClick={() => flip('tails')} disabled={!canBet || isFlipping}>
                            Tails
                        </Button>
                    </div>
                </div>
            </Panel>
        </div>
    )
}

export default CoinFlip

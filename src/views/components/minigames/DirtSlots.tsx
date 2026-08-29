import { useState, useEffect, useRef } from 'react'
import { StateProps } from '@engine/types'
import { changeInventory } from '@modules/inventory/functions'
import Panel from '@components/common/Panel'
import Button from '@components/common/Button'
import Images from '@utils/images'
import Sounds from '@utils/sounds'

const SPIN_COST = 50

type SlotSymbol = {
    name: string
    image: string
    weight: number
    payout: number // dirt credits for 3-of-a-kind
}

const SYMBOLS: SlotSymbol[] = [
    { name: 'Dirt', image: 'items/dirt.png', weight: 35, payout: 1 },
    { name: 'Rock', image: 'items/stone.png', weight: 25, payout: 5 },
    { name: 'Bone', image: 'items/bone.png', weight: 20, payout: 10 },
    { name: 'Gold', image: 'items/gold.png', weight: 12, payout: 25 },
    { name: 'Emerald', image: 'items/emerald.png', weight: 6, payout: 50 },
    { name: 'Ruby', image: 'items/ruby.png', weight: 2, payout: 100 },
]

const TOTAL_WEIGHT = SYMBOLS.reduce((sum, s) => sum + s.weight, 0)

function rollSymbol(): SlotSymbol {
    let roll = Math.random() * TOTAL_WEIGHT
    for (const symbol of SYMBOLS) {
        roll -= symbol.weight
        if (roll <= 0) return symbol
    }
    return SYMBOLS[0]
}

type SpinResult = {
    reels: SlotSymbol[]
    payout: number
    matchCount: number
}

function DirtSlots({ state, dispatch }: StateProps) {
    const [lastResult, setLastResult] = useState<SpinResult | null>(null)
    const [isSpinning, setIsSpinning] = useState(false)
    const [displayReels, setDisplayReels] = useState<SlotSymbol[] | null>(null)
    const [autoSpin, setAutoSpin] = useState(false)
    const autoSpinTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const dirtAmount = state.inventory.find((i) => i.id === 'dirt')?.amount ?? 0
    const canSpin = dirtAmount >= SPIN_COST

    // Auto-spin: trigger next spin 1s after the previous one finishes
    useEffect(() => {
        if (autoSpin && !isSpinning && canSpin) {
            autoSpinTimer.current = setTimeout(() => {
                spin()
            }, 1000)
        }
        if (autoSpin && !canSpin) {
            setAutoSpin(false)
        }
        return () => {
            if (autoSpinTimer.current) clearTimeout(autoSpinTimer.current)
        }
    }, [autoSpin, isSpinning, canSpin])

    const spin = () => {
        if (!canSpin || isSpinning) return

        setIsSpinning(true)

        const reels = [rollSymbol(), rollSymbol(), rollSymbol()]

        // Check for matches
        const allMatch = reels[0].name === reels[1].name && reels[1].name === reels[2].name
        let payout = 0
        let matchCount = 0

        if (allMatch) {
            payout = reels[0].payout
            matchCount = 3
        } else {
            // Check for 2 matches
            if (reels[0].name === reels[1].name || reels[0].name === reels[2].name || reels[1].name === reels[2].name) {
                matchCount = 2
            }
        }

        // Deduct dirt cost
        const resources = [{ id: 'dirt', amount: -SPIN_COST }]
        if (payout > 0) {
            resources.push({ id: 'Dirt Credits', amount: payout })
        }

        dispatch({
            action: changeInventory,
            payload: { resources },
        })

        // Animate reels
        let animStep = 0
        const animInterval = setInterval(() => {
            setDisplayReels([rollSymbol(), rollSymbol(), rollSymbol()])
            animStep++
            if (animStep >= 8) {
                clearInterval(animInterval)
                setDisplayReels(reels)
                setLastResult({ reels, payout, matchCount })
                setIsSpinning(false)
                Sounds.play(payout > 0 ? 'pop.wav' : 'click.wav')
            }
        }, 100)
    }

    const showReels = displayReels || lastResult?.reels

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Slot machine display */}
            <Panel style={{ minHeight: '160px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '20px 0' }}>
                    {showReels ? (
                        showReels.map((symbol, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                }}
                            >
                                <img
                                    className="pixel"
                                    src={Images.get(symbol.image)}
                                    alt={symbol.name}
                                    style={{ width: '36px', height: '36px' }}
                                />
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{symbol.name}</span>
                            </div>
                        ))
                    ) : (
                        <>
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        border: '2px solid rgba(255,255,255,0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        color: 'rgba(255,255,255,0.2)',
                                    }}
                                >
                                    ?
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Result text */}
                {lastResult && !isSpinning && (
                    <div style={{ textAlign: 'center', fontSize: '18px', paddingBottom: '8px' }}>
                        {lastResult.payout > 0 ? (
                            <span style={{ color: 'rgb(0, 220, 40)' }}>
                                JACKPOT!{' '}
                                <img
                                    className="pixel"
                                    src={Images.get('items/dirt-credits.png')}
                                    alt=""
                                    style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                                />{' '}
                                {lastResult.payout} Dirt Credits!
                            </span>
                        ) : lastResult.matchCount === 2 ? (
                            <span style={{ color: 'rgb(255, 200, 0)' }}>So close! Two matched.</span>
                        ) : (
                            <span style={{ color: 'rgb(220, 40, 40)' }}>No match. Try again!</span>
                        )}
                    </div>
                )}
            </Panel>

            {/* Spin button */}
            <Panel>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                    Cost: {SPIN_COST} Dirt per spin. Match 3 symbols to win Dirt Credits!
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ flex: 1 }}>
                        <Button onClick={spin} disabled={!canSpin || isSpinning || autoSpin}>
                            {isSpinning ? 'Spinning...' : `Spin (${SPIN_COST} Dirt)`}
                        </Button>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Button
                            onClick={() => {
                                if (autoSpin) {
                                    setAutoSpin(false)
                                } else {
                                    setAutoSpin(true)
                                    if (!isSpinning) spin()
                                }
                            }}
                            disabled={!canSpin && !autoSpin}
                            style={{ backgroundColor: autoSpin ? '#6b2a2a' : '#354c69' }}
                        >
                            {autoSpin ? 'Stop Auto' : 'Auto Spin'}
                        </Button>
                    </div>
                </div>
            </Panel>

            {/* Payout table */}
            <Panel>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                    Payout Table (3 matches)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {SYMBOLS.map((symbol) => (
                        <div
                            key={symbol.name}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '2px 4px',
                                fontSize: '14px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img
                                    className="pixel"
                                    src={Images.get(symbol.image)}
                                    alt=""
                                    style={{ width: '16px', height: '16px' }}
                                />
                                <span>{symbol.name}</span>
                            </div>
                            <span style={{ color: 'rgb(255, 187, 0)' }}>{symbol.payout} Credits</span>
                        </div>
                    ))}
                </div>
            </Panel>
        </div>
    )
}

export default DirtSlots

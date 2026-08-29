import { useState, useEffect, useRef, useCallback } from 'react'
import { StateProps } from '@engine/types'
import { changeInventory } from '@modules/inventory/functions'
import Panel from '@components/common/Panel'
import Button from '@components/common/Button'
import Images from '@utils/images'
import Sounds from '@utils/sounds'

const BET_PRESETS = [10, 50, 100, 500]
const ROWS = 12
const BUCKET_COUNT = ROWS + 1 // 13 buckets for 12 rows

// Risk profiles with multipliers for each bucket (symmetrical, center = low, edges = high)
const RISK_PROFILES: Record<string, { label: string; multipliers: number[] }> = {
    low: {
        label: 'Low',
        multipliers: [5, 2.1, 1.6, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.6, 2.1, 5],
    },
    medium: {
        label: 'Medium',
        multipliers: [18, 4, 1.7, 1.3, 1, 0.5, 0.3, 0.5, 1, 1.3, 1.7, 4, 18],
    },
    high: {
        label: 'High',
        multipliers: [100, 25, 5, 2, 0.5, 0.2, 0.1, 0.2, 0.5, 2, 5, 25, 100],
    },
}

type Ball = {
    id: number
    row: number
    col: number
    path: number[]
    finalBucket: number
    settled: boolean
    betAmount: number
}

let ballIdCounter = 0

function Plinko({ state, dispatch }: StateProps) {
    const [betAmount, setBetAmount] = useState(50)
    const [risk, setRisk] = useState<string>('medium')
    const [balls, setBalls] = useState<Ball[]>([])
    const [lastResult, setLastResult] = useState<{ bucket: number; multiplier: number; payout: number } | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const multipliersRef = useRef(RISK_PROFILES['medium'].multipliers)
    const dispatchRef = useRef(dispatch)

    // Keep refs in sync
    multipliersRef.current = RISK_PROFILES[risk].multipliers
    dispatchRef.current = dispatch

    const dirtAmount = state.inventory.find((i) => i.id === 'dirt')?.amount ?? 0
    const canDrop = dirtAmount >= betAmount
    const multipliers = RISK_PROFILES[risk].multipliers

    // Single persistent animation loop
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setBalls((prev) => {
                const hasActive = prev.some((b) => !b.settled)
                if (!hasActive) return prev

                const updated = prev.map((ball) => {
                    if (ball.settled) return ball
                    const nextRow = ball.row + 1
                    if (nextRow >= ROWS) {
                        // Ball reached bottom — settle and pay out
                        const mult = multipliersRef.current[ball.finalBucket] ?? 0
                        const payout = Math.floor(ball.betAmount * mult)

                        if (payout > 0) {
                            dispatchRef.current({
                                action: changeInventory,
                                payload: { resources: [{ id: 'Dirt Credits', amount: payout }] },
                            })
                        }

                        setLastResult({ bucket: ball.finalBucket, multiplier: mult, payout })
                        Sounds.play(mult >= 2 ? 'pop.wav' : 'click.wav')

                        return { ...ball, row: nextRow, settled: true }
                    }
                    const nextCol = ball.col + ball.path[nextRow]
                    return { ...ball, row: nextRow, col: nextCol }
                })

                // Clean up old settled balls (keep last 5)
                const settled = updated.filter((b) => b.settled)
                const active = updated.filter((b) => !b.settled)
                if (settled.length > 5) {
                    return [...settled.slice(-5), ...active]
                }
                return updated
            })
        }, 120)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, []) // Empty deps — runs once, never recreated

    const dropBall = useCallback(() => {
        if (!canDrop) return

        dispatch({
            action: changeInventory,
            payload: { resources: [{ id: 'dirt', amount: -betAmount }] },
        })

        const path: number[] = []
        let col = 0
        for (let r = 0; r < ROWS; r++) {
            const dir = Math.random() < 0.5 ? -1 : 1
            path.push(dir)
            col += dir
        }

        const finalBucket = (col + ROWS) / 2

        const newBall: Ball = {
            id: ballIdCounter++,
            row: -1,
            col: 0,
            path,
            finalBucket,
            settled: false,
            betAmount,
        }

        setBalls((prev) => [...prev, newBall])
    }, [canDrop, betAmount, dispatch])

    // Board dimensions
    const boardWidth = 460
    const boardHeight = 360
    const pegSpacingX = boardWidth / (ROWS + 2)
    const pegSpacingY = boardHeight / (ROWS + 1)

    const getPegPosition = (row: number, pegIndex: number) => {
        const pegsInRow = row + 1
        const totalWidth = (pegsInRow - 1) * pegSpacingX
        const startX = (boardWidth - totalWidth) / 2
        return {
            x: startX + pegIndex * pegSpacingX,
            y: pegSpacingY * (row + 0.5),
        }
    }

    const getBallPosition = (ball: Ball) => {
        if (ball.row < 0) {
            return { x: boardWidth / 2, y: 0 }
        }
        const x = boardWidth / 2 + (ball.col * pegSpacingX) / 2
        const y = pegSpacingY * (ball.row + 0.5) + pegSpacingY * 0.3
        return { x, y }
    }

    const getBucketColor = (mult: number) => {
        if (mult >= 25) return 'rgba(220, 40, 40, 0.6)'
        if (mult >= 5) return 'rgba(255, 140, 0, 0.5)'
        if (mult >= 2) return 'rgba(255, 200, 0, 0.4)'
        if (mult >= 1) return 'rgba(0, 220, 40, 0.3)'
        return 'rgba(255, 255, 255, 0.1)'
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Plinko board */}
            <Panel>
                <div
                    style={{
                        position: 'relative',
                        width: boardWidth,
                        height: boardHeight + 40,
                        margin: '0 auto',
                        overflow: 'hidden',
                    }}
                >
                    {/* Pegs */}
                    {Array.from({ length: ROWS }, (_, row) =>
                        Array.from({ length: row + 1 }, (_, pegIdx) => {
                            const pos = getPegPosition(row, pegIdx)
                            return (
                                <div
                                    key={`peg-${row}-${pegIdx}`}
                                    style={{
                                        position: 'absolute',
                                        left: pos.x - 3,
                                        top: pos.y - 3,
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                    }}
                                />
                            )
                        })
                    )}

                    {/* Balls */}
                    {balls
                        .filter((b) => !b.settled)
                        .map((ball) => {
                            const pos = getBallPosition(ball)
                            return (
                                <img
                                    key={ball.id}
                                    className="pixel"
                                    src={Images.get('items/dirt.png')}
                                    alt=""
                                    style={{
                                        position: 'absolute',
                                        left: pos.x - 8,
                                        top: pos.y - 8,
                                        width: 24,
                                        height: 24,
                                        transition: 'left 0.1s ease-out, top 0.1s ease-out',
                                        zIndex: 10,
                                        // filter: 'drop-shadow(0 0 4px rgba(255, 187, 0, 0.5))',
                                    }}
                                />
                            )
                        })}

                    {/* Buckets at bottom */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            display: 'flex',
                            gap: '2px',
                            padding: '0 4px',
                        }}
                    >
                        {multipliers.map((mult, i) => {
                            const isHit = lastResult?.bucket === i
                            return (
                                <div
                                    key={i}
                                    style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        padding: '4px 0',
                                        fontSize: '11px',
                                        fontWeight: isHit ? 'bold' : '400',
                                        backgroundColor: isHit ? 'rgba(255, 187, 0, 0.3)' : getBucketColor(mult),
                                        border: isHit ? '1px solid rgba(255, 187, 0, 0.7)' : '1px solid rgba(255, 255, 255, 0.1)',
                                        color: mult >= 5 ? 'white' : 'rgba(255, 255, 255, 0.8)',
                                    }}
                                >
                                    {mult}x
                                </div>
                            )
                        })}
                    </div>
                </div>
            </Panel>

            {/* Result */}
            {lastResult && (
                <Panel>
                    <div
                        style={{
                            textAlign: 'center',
                            fontSize: '18px',
                            padding: '4px 0',
                            color: lastResult.payout > 0 ? 'rgb(0, 220, 40)' : 'rgb(220, 40, 40)',
                        }}
                    >
                        {lastResult.payout > 0 ? (
                            <span>
                                {lastResult.multiplier}x —{' '}
                                <img
                                    className="pixel"
                                    src={Images.get('items/dirt-credits.png')}
                                    alt=""
                                    style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                                />{' '}
                                {lastResult.payout} Dirt Credits!
                            </span>
                        ) : (
                            <span>{lastResult.multiplier}x — No payout</span>
                        )}
                    </div>
                </Panel>
            )}

            {/* Controls */}
            <Panel>
                {/* Risk selector */}
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Risk Level</div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {Object.entries(RISK_PROFILES).map(([key, profile]) => (
                        <div
                            key={key}
                            onClick={() => {
                                Sounds.play('click.wav')
                                setRisk(key)
                            }}
                            style={{
                                flex: 1,
                                padding: '6px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                fontSize: '16px',
                                backgroundColor: risk === key ? 'rgba(255, 187, 0, 0.15)' : 'rgba(255,255,255,0.05)',
                                border: risk === key ? '1px solid rgba(255, 187, 0, 0.5)' : '1px solid rgba(255,255,255,0.15)',
                            }}
                        >
                            {profile.label}
                        </div>
                    ))}
                </div>

                {/* Bet amount */}
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Bet Amount (Dirt)</div>
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
                </div>

                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                    Drop a ball through {ROWS} rows of pegs. It bounces left or right at each peg. Edges pay big!
                </div>

                <Button onClick={dropBall} disabled={!canDrop}>
                    {`Drop Ball (${betAmount} Dirt)`}
                </Button>
            </Panel>
        </div>
    )
}

export default Plinko

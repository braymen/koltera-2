import { useState, useEffect, useRef } from 'react'
import { StateProps } from '@engine/types'
import { changeInventory } from '@modules/inventory/functions'
import Panel from '@components/common/Panel'
import Button from '@components/common/Button'
import Images from '@utils/images'
import Sounds from '@utils/sounds'

const GRID_SIZE = 40
const DRAW_COUNT = 10
const MAX_PICKS = 10
const BET_PRESETS = [10, 50, 100, 500]

// Payout multipliers indexed by [picks][hits]
// House-favored: expected return ~85-90%
const PAYOUT_TABLE: Record<number, Record<number, number>> = {
    1: { 1: 3.6 },
    2: { 1: 1, 2: 8.1 },
    3: { 1: 0, 2: 2.8, 3: 25 },
    4: { 1: 0, 2: 1.5, 3: 8, 4: 72 },
    5: { 1: 0, 2: 0, 3: 3.2, 4: 18, 5: 200 },
    6: { 1: 0, 2: 0, 3: 1.8, 4: 6, 5: 60, 6: 500 },
    7: { 1: 0, 2: 0, 3: 1, 4: 3.5, 5: 18, 6: 150, 7: 1200 },
    8: { 1: 0, 2: 0, 3: 0, 4: 2.5, 5: 8, 6: 50, 7: 350, 8: 2500 },
    9: { 1: 0, 2: 0, 3: 0, 4: 1.5, 5: 4, 6: 20, 7: 100, 8: 800, 9: 5000 },
    10: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 1, 5: 3, 6: 10, 7: 50, 8: 300, 9: 2000, 10: 10000 },
}

type GamePhase = 'picking' | 'revealing' | 'done'

function Keno({ state, dispatch }: StateProps) {
    const [selectedTiles, setSelectedTiles] = useState<Set<number>>(new Set())
    const [drawnTiles, setDrawnTiles] = useState<Set<number>>(new Set())
    const [revealedTiles, setRevealedTiles] = useState<Set<number>>(new Set())
    const [phase, setPhase] = useState<GamePhase>('picking')
    const [betAmount, setBetAmount] = useState(50)
    const [lastPayout, setLastPayout] = useState<{ hits: number; multiplier: number; payout: number } | null>(null)
    const [autoPlay, setAutoPlay] = useState(false)
    const autoPlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const dirtAmount = state.inventory.find((i) => i.id === 'dirt')?.amount ?? 0
    const canPlay = dirtAmount >= betAmount && selectedTiles.size >= 1 && selectedTiles.size <= MAX_PICKS

    // Auto-play: start a new round 1s after the previous one finishes
    useEffect(() => {
        if (autoPlay && phase === 'done' && canPlay) {
            autoPlayTimer.current = setTimeout(() => {
                // Reset and play again with same picks
                setDrawnTiles(new Set())
                setRevealedTiles(new Set())
                setLastPayout(null)
                setPhase('picking')
                // Small delay to let state settle, then trigger play
                setTimeout(() => {
                    playRound()
                }, 50)
            }, 1000)
        }
        if (autoPlay && phase === 'done' && !canPlay) {
            setAutoPlay(false)
        }
        return () => {
            if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current)
        }
    }, [autoPlay, phase, canPlay])

    const toggleTile = (tile: number) => {
        if (phase !== 'picking') return
        const next = new Set(selectedTiles)
        if (next.has(tile)) {
            next.delete(tile)
        } else if (next.size < MAX_PICKS) {
            next.add(tile)
        }
        setSelectedTiles(next)
    }

    const clearPicks = () => {
        if (phase !== 'picking') return
        setSelectedTiles(new Set())
    }

    const autoPick = () => {
        if (phase !== 'picking') return
        const count = selectedTiles.size || 5 // default to 5 if nothing selected
        const available = Array.from({ length: GRID_SIZE }, (_, i) => i + 1)
        const picks = new Set<number>()
        while (picks.size < count && available.length > 0) {
            const idx = Math.floor(Math.random() * available.length)
            picks.add(available[idx])
            available.splice(idx, 1)
        }
        setSelectedTiles(picks)
    }

    const playRound = () => {
        if (!canPlay) return

        // Deduct bet
        dispatch({
            action: changeInventory,
            payload: { resources: [{ id: 'dirt', amount: -betAmount }] },
        })

        // Draw random tiles
        const available = Array.from({ length: GRID_SIZE }, (_, i) => i + 1)
        const drawn = new Set<number>()
        while (drawn.size < DRAW_COUNT) {
            const idx = Math.floor(Math.random() * available.length)
            drawn.add(available[idx])
            available.splice(idx, 1)
        }

        setDrawnTiles(drawn)
        setRevealedTiles(new Set())
        setPhase('revealing')
        setLastPayout(null)

        // Reveal tiles one by one
        const drawnArray = Array.from(drawn)
        let revealIndex = 0
        const revealInterval = setInterval(() => {
            if (revealIndex < drawnArray.length) {
                setRevealedTiles((prev) => new Set([...prev, drawnArray[revealIndex]]))
                const isHit = selectedTiles.has(drawnArray[revealIndex])
                Sounds.play(isHit ? 'pop.wav' : 'click.wav')
                revealIndex++
            } else {
                clearInterval(revealInterval)

                // Calculate payout
                const picks = selectedTiles.size
                let hits = 0
                drawn.forEach((t) => {
                    if (selectedTiles.has(t)) hits++
                })

                const multiplier = PAYOUT_TABLE[picks]?.[hits] ?? 0
                const payout = Math.floor(betAmount * multiplier)

                if (payout > 0) {
                    dispatch({
                        action: changeInventory,
                        payload: { resources: [{ id: 'Dirt Credits', amount: payout }] },
                    })
                }

                setLastPayout({ hits, multiplier, payout })
                setPhase('done')
            }
        }, 150)
    }

    const play = () => {
        if (phase !== 'picking') return
        playRound()
    }

    const newGame = () => {
        setDrawnTiles(new Set())
        setRevealedTiles(new Set())
        setPhase('picking')
        setLastPayout(null)
    }

    const getTileStyle = (tile: number): React.CSSProperties => {
        const isSelected = selectedTiles.has(tile)
        const isRevealed = revealedTiles.has(tile)
        const isDrawn = drawnTiles.has(tile)
        const isHit = isSelected && isRevealed

        let bg = 'rgba(255,255,255,0.06)'
        let border = '1px solid rgba(255,255,255,0.12)'
        let color = 'rgba(255,255,255,0.7)'

        if (isSelected && !isRevealed) {
            bg = 'rgba(255, 187, 0, 0.2)'
            border = '1px solid rgba(255, 187, 0, 0.6)'
            color = 'rgb(255, 187, 0)'
        }

        if (isRevealed && isHit) {
            bg = 'rgba(0, 220, 40, 0.25)'
            border = '1px solid rgba(0, 220, 40, 0.7)'
            color = 'rgb(0, 220, 40)'
        } else if (isRevealed && isSelected) {
            // Selected but drawn tile not yet revealed as hit — keep selected style
            bg = 'rgba(255, 187, 0, 0.2)'
            border = '1px solid rgba(255, 187, 0, 0.6)'
            color = 'rgb(255, 187, 0)'
        } else if (isRevealed && !isSelected) {
            bg = 'rgba(220, 40, 40, 0.15)'
            border = '1px solid rgba(220, 40, 40, 0.4)'
            color = 'rgba(220, 40, 40, 0.7)'
        }

        // After game done, show undrawn selected tiles dimmed
        if (phase === 'done' && isSelected && !isDrawn) {
            bg = 'rgba(255, 187, 0, 0.08)'
            border = '1px solid rgba(255, 187, 0, 0.25)'
            color = 'rgba(255, 187, 0, 0.4)'
        }

        return {
            width: '100%',
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            fontWeight: isHit ? 'bold' : '400',
            backgroundColor: bg,
            border,
            color,
            cursor: phase === 'picking' ? 'pointer' : 'default',
        }
    }

    // Current payout table for display
    const picks = selectedTiles.size
    const payoutEntries = picks > 0 ? PAYOUT_TABLE[picks] : null

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Grid */}
            <Panel>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(8, 1fr)',
                        gap: '4px',
                        maxWidth: '460px',
                        margin: '0 auto',
                    }}
                >
                    {Array.from({ length: GRID_SIZE }, (_, i) => i + 1).map((tile) => (
                        <div key={tile} onClick={() => toggleTile(tile)} style={getTileStyle(tile)}>
                            {tile}
                        </div>
                    ))}
                </div>
            </Panel>

            {/* Result */}
            {lastPayout && (
                <Panel>
                    <div
                        style={{
                            textAlign: 'center',
                            fontSize: '20px',
                            padding: '4px 0',
                            color: lastPayout.payout > 0 ? 'rgb(0, 220, 40)' : 'rgb(220, 40, 40)',
                        }}
                    >
                        {lastPayout.payout > 0 ? (
                            <span>
                                {lastPayout.hits} hit{lastPayout.hits !== 1 ? 's' : ''} — {lastPayout.multiplier}x —{' '}
                                <img
                                    className="pixel"
                                    src={Images.get('items/dirt-credits.png')}
                                    alt=""
                                    style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
                                />{' '}
                                {lastPayout.payout} Dirt Credits!
                            </span>
                        ) : (
                            <span>
                                {lastPayout.hits} hit{lastPayout.hits !== 1 ? 's' : ''} — No win
                            </span>
                        )}
                    </div>
                </Panel>
            )}

            {/* Controls */}
            <Panel>
                {phase === 'picking' && (
                    <>
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
                            Pick 1-{MAX_PICKS} numbers, then {DRAW_COUNT} are drawn. Bet Dirt, win Dirt Credits!
                        </div>

                        {/* Bet amount */}
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                            Bet Amount (Dirt) — {selectedTiles.size} pick{selectedTiles.size !== 1 ? 's' : ''} selected
                        </div>
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
                                        backgroundColor:
                                            betAmount === preset ? 'rgba(255, 187, 0, 0.15)' : 'rgba(255,255,255,0.05)',
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

                        <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                            <div style={{ flex: 1 }}>
                                <Button onClick={autoPick} disabled={false}>
                                    Auto Pick
                                </Button>
                            </div>
                            <div style={{ flex: 1 }}>
                                <Button onClick={clearPicks} disabled={selectedTiles.size === 0}>
                                    Clear
                                </Button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                            <div style={{ flex: 1 }}>
                                <Button onClick={play} disabled={!canPlay || autoPlay}>
                                    {selectedTiles.size === 0
                                        ? 'Select numbers to play'
                                        : `Play (${betAmount} Dirt)`}
                                </Button>
                            </div>
                            <div style={{ flex: 1 }}>
                                <Button
                                    onClick={() => {
                                        setAutoPlay(true)
                                        play()
                                    }}
                                    disabled={!canPlay || autoPlay}
                                    style={{ backgroundColor: '#354c69' }}
                                >
                                    Auto Play
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {phase === 'revealing' && (
                    <div>
                        <div style={{ textAlign: 'center', fontSize: '18px', color: 'rgba(255,255,255,0.6)', padding: '8px 0' }}>
                            Drawing numbers...
                        </div>
                        {autoPlay && (
                            <Button
                                onClick={() => setAutoPlay(false)}
                                style={{ backgroundColor: '#6b2a2a' }}
                            >
                                Stop Auto
                            </Button>
                        )}
                    </div>
                )}

                {phase === 'done' && (
                    autoPlay ? (
                        <Button
                            onClick={() => setAutoPlay(false)}
                            style={{ backgroundColor: '#6b2a2a' }}
                        >
                            Stop Auto
                        </Button>
                    ) : (
                        <Button onClick={newGame}>
                            Play Again
                        </Button>
                    )
                )}
            </Panel>

            {/* Payout table */}
            {payoutEntries && (
                <Panel>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                        Payouts for {picks} pick{picks !== 1 ? 's' : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {Object.entries(payoutEntries).map(([hits, mult]) => {
                            const hitCount = parseInt(hits)
                            const isCurrentHits = lastPayout?.hits === hitCount && phase === 'done'
                            return (
                                <div
                                    key={hits}
                                    style={{
                                        flex: 1,
                                        minWidth: '55px',
                                        padding: '4px 6px',
                                        textAlign: 'center',
                                        fontSize: '13px',
                                        backgroundColor: isCurrentHits
                                            ? mult > 0
                                                ? 'rgba(0, 220, 40, 0.15)'
                                                : 'rgba(220, 40, 40, 0.1)'
                                            : 'rgba(255,255,255,0.05)',
                                        border: isCurrentHits
                                            ? mult > 0
                                                ? '1px solid rgba(0, 220, 40, 0.5)'
                                                : '1px solid rgba(220, 40, 40, 0.3)'
                                            : '1px solid rgba(255,255,255,0.1)',
                                    }}
                                >
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                                        {hitCount} hit{hitCount !== 1 ? 's' : ''}
                                    </div>
                                    <div style={{ color: mult > 0 ? 'rgb(255, 187, 0)' : 'rgba(255,255,255,0.25)' }}>
                                        {mult > 0 ? `${mult}x` : '0x'}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Panel>
            )}
        </div>
    )
}

export default Keno

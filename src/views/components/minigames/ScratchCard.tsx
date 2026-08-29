import { useState } from 'react'
import { StateProps } from '@engine/types'
import { changeInventory } from '@modules/inventory/functions'
import Panel from '@components/common/Panel'
import Button from '@components/common/Button'
import Images from '@utils/images'
import Sounds from '@utils/sounds'

type CardTier = {
    name: string
    cost: number
    symbols: { name: string; image: string; payout: number; weight: number }[]
}

const CARD_TIERS: CardTier[] = [
    {
        name: 'Muddy Card',
        cost: 25,
        symbols: [
            { name: 'Mud', image: 'items/dirt.png', payout: 0, weight: 40 },
            { name: 'Pebble', image: 'items/stone.png', payout: 1, weight: 25 },
            { name: 'Worm', image: 'items/bone.png', payout: 3, weight: 20 },
            { name: 'Coin', image: 'items/gold.png', payout: 5, weight: 15 },
        ],
    },
    {
        name: 'Rocky Card',
        cost: 100,
        symbols: [
            { name: 'Gravel', image: 'items/stone.png', payout: 0, weight: 35 },
            { name: 'Fossil', image: 'items/bone.png', payout: 3, weight: 25 },
            { name: 'Crystal', image: 'items/gemstone.png', payout: 10, weight: 22 },
            { name: 'Nugget', image: 'items/gold.png', payout: 25, weight: 18 },
        ],
    },
    {
        name: 'Golden Card',
        cost: 500,
        symbols: [
            { name: 'Pyrite', image: 'items/gold.png', payout: 0, weight: 35 },
            { name: 'Ruby', image: 'items/ruby.png', payout: 10, weight: 25 },
            { name: 'Sapphire', image: 'items/sapphire.png', payout: 50, weight: 22 },
            { name: 'Emerald', image: 'items/emerald.png', payout: 200, weight: 18 },
        ],
    },
]

type PanelCell = {
    symbol: CardTier['symbols'][number]
    revealed: boolean
}

type CardState = {
    tier: CardTier
    panels: PanelCell[]
    revealedCount: number
    matchResult: { matched: boolean; payout: number; symbolName: string } | null
}

function rollSymbol(tier: CardTier) {
    const totalWeight = tier.symbols.reduce((s, sym) => s + sym.weight, 0)
    let roll = Math.random() * totalWeight
    for (const symbol of tier.symbols) {
        roll -= symbol.weight
        if (roll <= 0) return symbol
    }
    return tier.symbols[0]
}

function ScratchCard({ state, dispatch }: StateProps) {
    const [selectedTier, setSelectedTier] = useState(0)
    const [card, setCard] = useState<CardState | null>(null)

    const dirtAmount = state.inventory.find((i) => i.id === 'dirt')?.amount ?? 0
    const currentTier = CARD_TIERS[selectedTier]
    const canBuy = dirtAmount >= currentTier.cost

    const buyCard = () => {
        if (!canBuy || card) return

        // Deduct dirt
        dispatch({
            action: changeInventory,
            payload: { resources: [{ id: 'dirt', amount: -currentTier.cost }] },
        })

        // Generate 6 panels with pre-determined symbols
        const panels: PanelCell[] = Array.from({ length: 6 }, () => ({
            symbol: rollSymbol(currentTier),
            revealed: false,
        }))

        setCard({
            tier: currentTier,
            panels,
            revealedCount: 0,
            matchResult: null,
        })

        Sounds.play('click.wav')
    }

    const revealPanel = (index: number) => {
        if (!card || card.panels[index].revealed || card.revealedCount >= 3) return

        const newPanels = card.panels.map((p, i) => (i === index ? { ...p, revealed: true } : p))
        const newRevealedCount = card.revealedCount + 1

        Sounds.play('click.wav')

        let matchResult = card.matchResult
        if (newRevealedCount === 3) {
            // Check for 3-of-a-kind among revealed
            const revealed = newPanels.filter((p) => p.revealed)
            const names = revealed.map((p) => p.symbol.name)
            const allMatch = names[0] === names[1] && names[1] === names[2]

            if (allMatch) {
                const payout = revealed[0].symbol.payout
                matchResult = { matched: true, payout, symbolName: revealed[0].symbol.name }

                if (payout > 0) {
                    dispatch({
                        action: changeInventory,
                        payload: { resources: [{ id: 'Dirt Credits', amount: payout }] },
                    })
                    Sounds.play('pop.wav')
                }
            } else {
                matchResult = { matched: false, payout: 0, symbolName: '' }
            }
        }

        setCard({
            ...card,
            panels: newPanels,
            revealedCount: newRevealedCount,
            matchResult,
        })
    }

    const discardCard = () => {
        setCard(null)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Card tier selection */}
            {!card && (
                <Panel>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Select Card Tier</div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                        {CARD_TIERS.map((tier, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    Sounds.play('click.wav')
                                    setSelectedTier(i)
                                }}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: selectedTier === i ? 'rgba(255, 187, 0, 0.15)' : 'rgba(255,255,255,0.05)',
                                    border:
                                        selectedTier === i
                                            ? '1px solid rgba(255, 187, 0, 0.5)'
                                            : '1px solid rgba(255,255,255,0.15)',
                                }}
                            >
                                <div style={{ fontSize: '16px' }}>{tier.name}</div>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{tier.cost} Dirt</div>
                            </div>
                        ))}
                    </div>
                    <Button onClick={buyCard} disabled={!canBuy}>
                        {`Buy ${currentTier.name} (${currentTier.cost} Dirt)`}
                    </Button>
                </Panel>
            )}

            {/* Active card */}
            {card && (
                <Panel>
                    <div style={{ fontSize: '18px', marginBottom: '8px', textAlign: 'center' }}>
                        {card.tier.name} — Reveal 3 panels!
                    </div>

                    {/* 2x3 grid of panels */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '6px',
                            maxWidth: '320px',
                            margin: '0 auto',
                            marginBottom: '12px',
                        }}
                    >
                        {card.panels.map((panel, i) => (
                            <div
                                key={i}
                                onClick={() => revealPanel(i)}
                                style={{
                                    height: '80px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    cursor: panel.revealed || card.revealedCount >= 3 ? 'default' : 'pointer',
                                    backgroundColor: panel.revealed ? 'rgba(255,255,255,0.08)' : 'rgba(255, 187, 0, 0.1)',
                                    border: panel.revealed
                                        ? '1px solid rgba(255,255,255,0.2)'
                                        : '2px solid rgba(255, 187, 0, 0.4)',
                                }}
                            >
                                {panel.revealed ? (
                                    <>
                                        <img
                                            className="pixel"
                                            src={Images.get(panel.symbol.image)}
                                            alt=""
                                            style={{ width: '28px', height: '28px' }}
                                        />
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                            {panel.symbol.name}
                                        </span>
                                    </>
                                ) : (
                                    <span style={{ fontSize: '24px', color: 'rgba(255, 187, 0, 0.6)' }}>?</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Result */}
                    {card.matchResult && (
                        <div
                            style={{
                                textAlign: 'center',
                                fontSize: '18px',
                                marginBottom: '8px',
                                color: card.matchResult.matched && card.matchResult.payout > 0 ? 'rgb(0, 220, 40)' : 'rgb(220, 40, 40)',
                            }}
                        >
                            {card.matchResult.matched && card.matchResult.payout > 0 ? (
                                <span>
                                    3x {card.matchResult.symbolName}!{' '}
                                    <img
                                        className="pixel"
                                        src={Images.get('items/dirt-credits.png')}
                                        alt=""
                                        style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                                    />{' '}
                                    {card.matchResult.payout} Dirt Credits!
                                </span>
                            ) : card.matchResult.matched ? (
                                <span>3x {card.matchResult.symbolName}... but no payout!</span>
                            ) : (
                                <span>No match. Better luck next time!</span>
                            )}
                        </div>
                    )}

                    {card.revealedCount >= 3 && (
                        <Button onClick={discardCard}>
                            {canBuy ? 'Buy Another Card' : 'Discard Card'}
                        </Button>
                    )}

                    {card.revealedCount < 3 && (
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                            {3 - card.revealedCount} reveal{3 - card.revealedCount !== 1 ? 's' : ''} remaining. Match 3 to win!
                        </div>
                    )}
                </Panel>
            )}

            {/* Prize table */}
            <Panel>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                    {card ? card.tier.name : currentTier.name} — Prize Table
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {(card ? card.tier : currentTier).symbols.map((sym) => (
                        <div
                            key={sym.name}
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
                                    src={Images.get(sym.image)}
                                    alt=""
                                    style={{ width: '16px', height: '16px' }}
                                />
                                <span>3x {sym.name}</span>
                            </div>
                            <span style={{ color: sym.payout > 0 ? 'rgb(255, 187, 0)' : 'rgba(255,255,255,0.3)' }}>
                                {sym.payout > 0 ? `${sym.payout} Credits` : 'Nothing'}
                            </span>
                        </div>
                    ))}
                </div>
            </Panel>
        </div>
    )
}

export default ScratchCard

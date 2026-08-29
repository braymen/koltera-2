import { Modal } from '@mantine/core'
import { useEffect, useState, useMemo, useRef } from 'react'
import ItemsContent from '@data/items'
import Images from '@utils/images'
import { ItemInstance } from '@modules/inventory/types'
import Numbers from '@utils/numbers'

const REVEAL_DELAY_MS = 80
const REVEAL_DURATION_MS = 220
const SCROLL_ENABLE_DELAY_MS = 100

interface Props {
    opened: boolean
    onClose: () => void
    loot: ItemInstance[]
    chestName: string
}

function ChestLootModal({ opened, onClose, loot, chestName }: Props) {
    const [revealed, setRevealed] = useState(false)
    const [scrollEnabled, setScrollEnabled] = useState(false)
    const openIdRef = useRef(0)

    // Combine items and collectibles for display
    const allLoot = useMemo(() => {
        const items = loot.map((item) => ({ ...item, type: 'item' as const }))

        return [...items]
    }, [loot])

    // Only depend on opened so we don't cancel timeouts when parent re-renders (e.g. state update) and allLoot reference changes
    useEffect(() => {
        if (!opened) {
            setRevealed(false)
            setScrollEnabled(false)
            return
        }
        const id = ++openIdRef.current
        setRevealed(false)
        setScrollEnabled(false)

        const t1 = window.setTimeout(() => {
            if (id !== openIdRef.current) return
            setRevealed(true)
        }, REVEAL_DELAY_MS)

        const t2 = window.setTimeout(
            () => {
                if (id !== openIdRef.current) return
                setScrollEnabled(true)
            },
            REVEAL_DELAY_MS + REVEAL_DURATION_MS + SCROLL_ENABLE_DELAY_MS
        )

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
        }
    }, [opened])

    // Always show modal if opened, even if no loot (for collectible chests that give duplicates)
    if (!opened) {
        return null
    }

    return (
        <>
            {/* Backdrop overlay with blur */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    zIndex: 199,
                    pointerEvents: 'none',
                }}
            />

            <Modal
                opened={opened}
                onClose={onClose}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>You've opened {chestName}!</span>
                    </div>
                }
                size="md"
                styles={{
                    header: {
                        backgroundColor: 'rgba(20,20,20,1)',
                        color: '#fff',
                    },
                    body: {
                        backgroundColor: 'rgba(20,20,20,1)',
                        color: '#fff',
                        overflow: 'hidden',
                    },
                    content: {
                        backgroundColor: 'rgba(20,20,20,1)',
                        zIndex: 200,
                    },
                    overlay: {
                        backgroundColor: 'transparent',
                        backdropFilter: 'none',
                    },
                }}
            >
                <div style={{ padding: '8px 0' }}>
                    {allLoot.length > 0 ? (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                maxHeight: '400px',
                                overflowY: scrollEnabled ? 'auto' : 'hidden',
                                overflowX: 'hidden',
                            }}
                        >
                            {allLoot.map((item, index) => {
                                const itemData = ItemsContent.getById(item.id)

                                return (
                                    <div
                                        key={`${item.id}-${index}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '4px 12px',
                                            backgroundColor: revealed ? 'rgba(118, 118, 118, 0.1)' : 'rgba(255,255,255,0.05)',
                                            transform: revealed ? 'scale(1)' : 'scale(0.96)',
                                            opacity: revealed ? 1 : 0,
                                            transition: `opacity ${REVEAL_DURATION_MS}ms ease-out, transform ${REVEAL_DURATION_MS}ms ease-out, background-color 0.15s ease`,
                                        }}
                                    >
                                        <img
                                            className="pixel"
                                            src={Images.get(itemData?.image || 'items/placeholder.png')}
                                            alt={itemData?.name || item.id}
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                marginRight: '8px',
                                                marginLeft: '4px',
                                            }}
                                        />
                                        <h3
                                            style={{
                                                flexGrow: 1,
                                                fontSize: '16px',
                                                fontWeight: '400',
                                                color: 'white',
                                                margin: 0,
                                            }}
                                        >
                                            {itemData?.name || item.id}
                                        </h3>
                                        <div
                                            style={{
                                                paddingRight: '8px',
                                                fontSize: '16px',
                                                fontWeight: '400',
                                                display: 'flex',
                                                justifyContent: 'space-evenly',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '16px',
                                                    fontWeight: '400',
                                                    textAlign: 'right',
                                                    color: 'rgba(255,255,255,0.7)',
                                                    transition: `color ${REVEAL_DURATION_MS}ms ease-out`,
                                                }}
                                            >
                                                {Numbers.whole(item.amount)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                            No new items found.
                        </div>
                    )}
                </div>
            </Modal>
        </>
    )
}

export default ChestLootModal

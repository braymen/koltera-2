import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import { useState, useRef, useEffect, useMemo } from 'react'
import Images from '@utils/images'
import UpgradesContent from '@data/upgrades'
import { Upgrade } from '@modules/upgrades/types'
import Sounds from '@utils/sounds'
import ItemsContent from '@data/items'
import Upgrades from '@modules/upgrades/dispatch'
import ConfirmModal from '@components/common/ConfirmModal'

const allUpgrades = UpgradesContent.get

type TabType = 'gathering' | 'workstations' | 'gold' | 'expeditions'

// Grid spacing in pixels - each grid unit represents this many pixels
// Example: x: 0, y: 0 = top left (0px, 0px)
//          x: 1, y: 0 = 30px to the right (30px, 0px)
//          x: 0, y: 1 = 30px down (0px, 30px)
const GRID_SPACING = 55

// Size of each upgrade node in pixels
const UPGRADE_SIZE = 36

// Color map for each upgrade category when purchased
const CATEGORY_COLORS: Record<string, string> = {
    'Gathering Skills': 'rgba(100, 200, 255, 1)', // Light blue
    'Workstation Skills': 'rgba(255, 150, 100, 1)', // Orange
    Gold: 'rgba(255, 215, 0, 1)', // Gold
    Expeditions: 'rgba(150, 100, 255, 1)', // Purple
    QoL: 'rgba(100, 255, 150, 1)', // Light green
}

// Map tab IDs to category names
const CATEGORY_MAP: Record<TabType, string> = {
    gathering: 'Gathering Skills',
    workstations: 'Workstation Skills',
    gold: 'Gold',
    expeditions: 'Expeditions',
}

// CSS keyframes for purchase animation
const purchaseAnimationStyle = `
@keyframes spinPurchase {
    0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
    50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.2); }
    100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
}

@keyframes swirl {
    0% {
        opacity: 0;
        transform: translate(-50%, -50%) rotate(0deg) scale(0.5);
    }
    50% {
        opacity: 1;
        transform: translate(-50%, -50%) rotate(180deg) scale(1.5);
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -50%) rotate(360deg) scale(2);
    }
}
`

function UpgradesPage({ state, dispatch }: StateProps) {
    const [activeTab, setActiveTab] = useState<TabType>('gathering')
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })
    const [hoveredUpgrade, setHoveredUpgrade] = useState<Upgrade | null>(null)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [animatingUpgrades, setAnimatingUpgrades] = useState<Set<string>>(new Set())
    const [pendingUpgrade, setPendingUpgrade] = useState<Upgrade | null>(null)
    const animatingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

    // Get purchased upgrades from state
    const purchasedUpgrades = useMemo(() => new Set(state.purchasedUpgrades), [state.purchasedUpgrades])

    // Get awaken points for upgrade purchases
    const awakenPoints = state.inventory.find((item) => item.id === 'awaken-points')?.amount ?? 0

    // Filter upgrades based on active tab
    const upgradeTree = useMemo(() => {
        const category = CATEGORY_MAP[activeTab]
        return allUpgrades.filter((upgrade) => upgrade.category === category)
    }, [activeTab])

    // Calculate unlocked/total counts for each category
    const tabStats = useMemo(() => {
        const stats: Record<TabType, { unlocked: number; total: number }> = {
            gathering: { unlocked: 0, total: 0 },
            workstations: { unlocked: 0, total: 0 },
            gold: { unlocked: 0, total: 0 },
            expeditions: { unlocked: 0, total: 0 },
        }

        allUpgrades.forEach((upgrade) => {
            const category = upgrade.category
            let tabType: TabType | null = null

            if (category === 'Gathering Skills') tabType = 'gathering'
            else if (category === 'Workstation Skills') tabType = 'workstations'
            else if (category === 'Gold') tabType = 'gold'
            else if (category === 'Expeditions') tabType = 'expeditions'

            if (tabType) {
                stats[tabType].total++
                if (purchasedUpgrades.has(upgrade.id)) {
                    stats[tabType].unlocked++
                }
            }
        })

        return stats
    }, [purchasedUpgrades])

    const tabs: { id: TabType; label: string }[] = [
        { id: 'gathering', label: `Gathering (${tabStats.gathering.unlocked}/${tabStats.gathering.total})` },
        { id: 'workstations', label: `Workstations (${tabStats.workstations.unlocked}/${tabStats.workstations.total})` },
        { id: 'gold', label: `Gold (${tabStats.gold.unlocked}/${tabStats.gold.total})` },
    ]

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                })
            }
        }
        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
        }

        if (hoveredUpgrade) {
            window.addEventListener('mousemove', handleMouseMove)
            return () => window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [hoveredUpgrade])

    const isUnlocked = (node: Upgrade): boolean => {
        if (purchasedUpgrades.has(node.id)) return true
        if (node.prerequisites.length === 0) return true // No prerequisites means it's available from the start
        return node.prerequisites.every((prereq) => purchasedUpgrades.has(prereq))
    }

    const canPurchase = (node: Upgrade): boolean => {
        return isUnlocked(node) && !purchasedUpgrades.has(node.id) && awakenPoints >= node.cost
    }

    const handlePurchase = (node: Upgrade) => {
        if (!canPurchase(node)) return
        if (animatingUpgrades.has(node.id)) return
        if (state.settings?.disableConfirmAwakenTreeUpgrade) {
            doPurchase(node)
        } else {
            setPendingUpgrade(node)
        }
    }

    const doPurchase = (node: Upgrade) => {
        Upgrades.purchaseUpgrade(dispatch, node.id)
        Sounds.play('click.wav')

        setAnimatingUpgrades((prev) => new Set([...prev, node.id]))

        const timeoutId = setTimeout(() => {
            setAnimatingUpgrades((prev) => {
                const next = new Set(prev)
                next.delete(node.id)
                return next
            })
            animatingTimeoutRef.current.delete(node.id)
        }, 1000)

        animatingTimeoutRef.current.set(node.id, timeoutId)
    }

    const confirmPurchase = () => {
        if (!pendingUpgrade) return
        doPurchase(pendingUpgrade)
        setPendingUpgrade(null)
    }

    // Cleanup timeouts on unmount
    useEffect(() => {
        const timeoutMap = animatingTimeoutRef.current
        return () => {
            timeoutMap.forEach((timeout) => clearTimeout(timeout))
            timeoutMap.clear()
        }
    }, [])

    const renderTooltipContent = (node: Upgrade) => {
        const unlocked = isUnlocked(node)
        const canBuy = canPurchase(node)
        const isPurchased = purchasedUpgrades.has(node.id)

        return (
            <div style={{ width: '100%', padding: 0, margin: 0 }}>
                <h4
                    style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        marginBottom: '0px',
                        marginTop: 0,
                        color: 'white',
                        paddingTop: 0,
                    }}
                >
                    {node.name}
                </h4>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0px', fontSize: '18px' }}>{node.description}</p>
                <div style={{ marginBottom: '0px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '16px' }}>
                        {isPurchased ? (
                            <span style={{ color: 'lime' }}>Unlocked</span>
                        ) : (
                            <>
                                <span
                                    style={{
                                        fontWeight: '600',
                                        color: awakenPoints >= node.cost ? 'rgba(0, 255, 0, 0.9)' : 'rgba(255, 0, 0, 0.9)',
                                    }}
                                >
                                    {node.cost} Awaken Points
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <ConfirmModal
                opened={!!pendingUpgrade}
                onClose={() => setPendingUpgrade(null)}
                onConfirm={confirmPurchase}
                text={pendingUpgrade ? `Unlock "${pendingUpgrade.name}" for ${pendingUpgrade.cost} Awaken Points?` : ''}
            />
            <style>{purchaseAnimationStyle}</style>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', maxWidth: '1200px' }}>
                {/* Tab Navigation */}
                <div
                    style={{
                        display: 'flex',
                        gap: '4px',
                        marginBottom: '0px',
                        margin: '4px',
                        flexWrap: 'wrap',
                    }}
                >
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            onClick={() => {
                                Sounds.play('click.wav')
                                setActiveTab(tab.id)
                            }}
                            style={{
                                backgroundColor: activeTab === tab.id ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,.4)',
                                border:
                                    activeTab === tab.id ? '1px solid rgba(255,255,255,.4)' : '1px solid rgba(255,255,255,.25)',
                                padding: '8px 16px',
                                cursor: 'pointer',
                            }}
                        >
                            <h3 style={{ fontSize: '16px', fontWeight: '400', margin: 0 }}>{tab.label}</h3>
                        </div>
                    ))}
                </div>

                <Panel style={{ position: 'relative', width: '100%', margin: '4px' }}>
                    {(() => {
                        const awakenPointsImage = ItemsContent.getById('awaken-points')?.image
                        const awakenPointsDisplay = awakenPointsImage ? (
                            <div
                                key="awaken-points-display"
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    zIndex: 10,
                                }}
                            >
                                <img
                                    className="pixel"
                                    src={Images.get(awakenPointsImage)}
                                    alt="Awaken Points"
                                    style={{ width: '16px', height: '16px' }}
                                />
                                <span
                                    style={{
                                        fontSize: '18px',
                                        color: 'white',
                                    }}
                                >
                                    {awakenPoints.toLocaleString()}
                                </span>
                            </div>
                        ) : undefined
                        const elements: JSX.Element[] = []
                        if (awakenPointsDisplay) {
                            elements.push(awakenPointsDisplay)
                        }
                        elements.push(
                            <div
                                key="awaken-info"
                                style={{
                                    position: 'absolute',
                                    bottom: '12px',
                                    left: '12px',
                                    right: '12px',
                                    fontSize: '18px',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    zIndex: 10,
                                }}
                            >
                                Get a creature to <span style={{ color: 'rgba(41, 255, 3, 0.7)' }}>Level 70</span>, then awaken it
                                in the <span style={{ color: 'rgb(255, 137, 3)' }}>Creatures tab</span> to earn an Awaken Point.
                                More information found in that tab.
                            </div>
                        )
                        elements.push(
                            <div
                                key="upgrade-tree"
                                ref={containerRef}
                                style={{
                                    flex: 1,
                                    position: 'relative',
                                    minHeight: '580px',
                                }}
                            >
                                {/* Draw connections - show all connections */}
                                <svg
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        pointerEvents: 'none',
                                        zIndex: 1,
                                    }}
                                    viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
                                    preserveAspectRatio="none"
                                >
                                    {upgradeTree.map((node) => {
                                        return node.prerequisites.map((prereqId) => {
                                            const prereq = UpgradesContent.getById(prereqId)
                                            if (!prereq) return null

                                            const offset = UPGRADE_SIZE / 2
                                            const x1 = prereq.x * GRID_SPACING + offset
                                            const y1 = prereq.y * GRID_SPACING + offset
                                            const x2 = node.x * GRID_SPACING + offset
                                            const y2 = node.y * GRID_SPACING + offset

                                            const isUnlockedPath = purchasedUpgrades.has(prereqId)
                                            const strokeColor = isUnlockedPath
                                                ? 'rgba(255, 255, 255, 0.5)'
                                                : 'rgba(100, 100, 100, 0.2)'

                                            return (
                                                <line
                                                    key={`${prereqId}-${node.id}`}
                                                    x1={x1}
                                                    y1={y1}
                                                    x2={x2}
                                                    y2={y2}
                                                    stroke={strokeColor}
                                                    strokeWidth={2}
                                                />
                                            )
                                        })
                                    })}
                                </svg>

                                {/* Render all nodes */}
                                {upgradeTree.map((node) => {
                                    const isPurchased = purchasedUpgrades.has(node.id)
                                    const unlocked = isUnlocked(node)
                                    const canBuy = canPurchase(node)

                                    let borderColor = 'rgba(255, 255, 0, 0.9)'
                                    let backgroundColor = 'rgba(20, 20, 20, 1)'
                                    let imageOpacity = 1

                                    if (isPurchased) {
                                        // Use category-specific color when purchased
                                        borderColor = CATEGORY_COLORS[node.category] || 'rgba(0, 255, 0, 1)'
                                    } else if (canBuy) {
                                        borderColor = 'rgba(255, 255, 255, 1)'
                                    } else if (unlocked) {
                                        borderColor = 'rgba(150, 150, 150, 0.8)'
                                    } else {
                                        // Locked upgrades - darker, opaque to hide lines behind
                                        borderColor = 'rgba(40, 40, 40, 1)'
                                        backgroundColor = 'rgba(15, 15, 15, 1)'
                                        imageOpacity = 0.5 // Darker but still visible
                                    }

                                    const offset = UPGRADE_SIZE / 2
                                    const isAnimating = animatingUpgrades.has(node.id)
                                    const categoryColor = CATEGORY_COLORS[node.category] || 'rgba(0, 255, 0, 1)'

                                    return (
                                        <div
                                            key={node.id}
                                            style={{
                                                position: 'absolute',
                                                left: `${node.x * GRID_SPACING + offset}px`,
                                                top: `${node.y * GRID_SPACING + offset}px`,
                                                transform: 'translate(-50%, -50%)',
                                                zIndex: 2,
                                                transition: isAnimating ? 'none' : 'transform 0.2s',
                                                animation: isAnimating ? 'spinPurchase 1s ease-in-out' : 'none',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isAnimating && (canBuy || unlocked)) {
                                                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'
                                                }
                                                setHoveredUpgrade(node)
                                                setMousePosition({ x: e.clientX, y: e.clientY })
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isAnimating) {
                                                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
                                                }
                                                setHoveredUpgrade(null)
                                            }}
                                        >
                                            {/* Swirl effects */}
                                            {isAnimating && (
                                                <>
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            left: '50%',
                                                            width: `${UPGRADE_SIZE * 1.5}px`,
                                                            height: `${UPGRADE_SIZE * 1.5}px`,
                                                            border: `2px solid ${categoryColor}`,
                                                            borderRadius: '50%',
                                                            animation: 'swirl 1s ease-out',
                                                            pointerEvents: 'none',
                                                            opacity: 0.6,
                                                        }}
                                                    />
                                                </>
                                            )}
                                            <div
                                                onClick={() => handlePurchase(node)}
                                                style={{
                                                    width: `${UPGRADE_SIZE}px`,
                                                    height: `${UPGRADE_SIZE}px`,
                                                    backgroundColor: backgroundColor,
                                                    border: `2px solid ${borderColor}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: canBuy ? 'pointer' : unlocked ? 'not-allowed' : 'default',
                                                    position: 'relative',
                                                    zIndex: 1,
                                                }}
                                            >
                                                <img
                                                    className="pixel"
                                                    src={Images.get(node.image)}
                                                    alt={node.name}
                                                    style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        opacity: imageOpacity,
                                                        padding: '4px',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* Cursor-following tooltip */}
                                {hoveredUpgrade &&
                                    containerRef.current &&
                                    (() => {
                                        const containerRect = containerRef.current.getBoundingClientRect()
                                        const containerCenterX = containerRect.left + containerRect.width / 2
                                        const isPastHalfWidth = mousePosition.x > containerCenterX

                                        // Position tooltip: bottom-left if past half width, top-right otherwise
                                        const tooltipStyle: { [key: string]: string | number } = {
                                            position: 'fixed',
                                            zIndex: 10000,
                                            pointerEvents: 'none',
                                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            padding: '12px',
                                            borderRadius: '0px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                                            maxWidth: '300px',
                                        }

                                        if (isPastHalfWidth) {
                                            // Bottom-left of cursor: below and to the left
                                            tooltipStyle.top = `${mousePosition.y + 10}px`
                                            tooltipStyle.left = `${mousePosition.x - 10}px`
                                            tooltipStyle.transform = 'translateX(-100%)'
                                        } else {
                                            // Top-right of cursor (default)
                                            tooltipStyle.top = `${mousePosition.y + 10}px`
                                            tooltipStyle.left = `${mousePosition.x + 10}px`
                                        }

                                        return <div style={tooltipStyle}>{renderTooltipContent(hoveredUpgrade)}</div>
                                    })()}
                            </div>
                        )
                        return elements
                    })()}
                </Panel>
            </div>
        </>
    )
}

export default UpgradesPage

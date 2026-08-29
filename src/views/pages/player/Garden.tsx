import { StateProps } from '@engine/types'
import InventoryButton from '@components/inventory/InventoryButton'
import ItemsContent from '@data/items'
import { Input } from '@mantine/core'
import { useState, useMemo, useEffect } from 'react'
import Pagination from '@components/common/Pagination'
import Panel from '@components/common/Panel'
import Images from '@utils/images'
import GardenActions from '@modules/garden/dispatch'
import { GardenFlower } from '@modules/garden/types'
import { FLOWER_TO_ITEM, getFlowerLevelUpCost } from '@modules/garden/helpers'
import Button from '@components/common/Button'

function Garden({ state, dispatch }: StateProps) {
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 12
    const [selectedGridCell, setSelectedGridCell] = useState<number | null>(null)
    const [selectedFlower, setSelectedFlower] = useState<string | null>(null)
    const [selectedFlowerPosition, setSelectedFlowerPosition] = useState<{ x: number; y: number } | null>(null)
    const [selectedRockPosition, setSelectedRockPosition] = useState<{ x: number; y: number } | null>(null)
    const [hoveredGridCell, setHoveredGridCell] = useState<number | null>(null)
    const [currentTime, setCurrentTime] = useState(Date.now() / 1000)
    const [draggedCell, setDraggedCell] = useState<number | null>(null)

    // Build grid from state
    const gardenGrid = useMemo(() => {
        const grid: (GardenFlower | null)[] = Array(25).fill(null)
        if (state.garden?.flowers) {
            state.garden.flowers.forEach((flower: GardenFlower) => {
                const index = flower.y * 5 + flower.x
                if (index >= 0 && index < 25) {
                    grid[index] = flower
                }
            })
        }
        return grid
    }, [state.garden?.flowers])

    // Build rock positions set for quick lookup
    const rockPositions = useMemo(() => {
        const positions = new Set<string>()
        if (state.garden?.rocks) {
            state.garden.rocks.forEach((rock) => {
                positions.add(`${rock.x},${rock.y}`)
            })
        }
        return positions
    }, [state.garden?.rocks])

    // Update current time every second for progress bar
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now() / 1000)
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Calculate cycle progress (0 to 1)
    const getCycleProgress = (): number => {
        const GARDEN_CYCLE_INTERVAL = 60
        if (!state.garden?.lastCycleTime || state.garden.lastCycleTime === null) {
            return 0
        }
        const timeSinceLastCycle = currentTime - state.garden.lastCycleTime
        return Math.min(1, timeSinceLastCycle / GARDEN_CYCLE_INTERVAL)
    }

    // Filter only Garden items from inventory (flowers and essences)
    const filteredItems = state.inventory.filter((item) => {
        const itemMeta = ItemsContent.getById(item.id)
        const matchesSearch = !search || itemMeta.name.toLowerCase().includes(search.toLowerCase())
        const isGardenItem = item.id.includes('flower')
        return matchesSearch && isGardenItem
    })

    // Sort items: favorites first, then by name
    const sortedItems = [...filteredItems].sort((a, b) => {
        const aIsFavorite = state.favoriteItems.includes(a.id)
        const bIsFavorite = state.favoriteItems.includes(b.id)

        if (aIsFavorite && !bIsFavorite) return -1
        if (!aIsFavorite && bIsFavorite) return 1

        // Sort by name
        const aMeta = ItemsContent.getById(a.id)
        const bMeta = ItemsContent.getById(b.id)
        return aMeta.name.localeCompare(bMeta.name)
    })

    const totalPages = Math.ceil(sortedItems.length / itemsPerPage)
    const displayedItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handleItemSelect = (id: string) => {
        // If a grid cell is selected, place the flower there
        if (selectedGridCell !== null) {
            const x = selectedGridCell % 5
            const y = Math.floor(selectedGridCell / 5)
            dispatch({
                action: GardenActions.plantFlower,
                payload: { flowerId: id, x, y },
            })
            setSelectedGridCell(null)
            setSelectedFlower(null)
        } else {
            // Otherwise, select the flower
            setSelectedFlower(selectedFlower === id ? null : id)
        }
    }

    const handleGridCellClick = (index: number) => {
        const x = index % 5
        const y = Math.floor(index / 5)
        const flowerAtCell = gardenGrid[index]
        const hasRock = rockPositions.has(`${x},${y}`)

        // If clicking on an occupied cell, select it to show details
        if (flowerAtCell) {
            setSelectedFlowerPosition({ x, y })
            setSelectedRockPosition(null)
            setSelectedGridCell(null)
            setSelectedFlower(null)
            return
        }

        // If clicking on a rock, select it to show removal options
        if (hasRock) {
            setSelectedRockPosition({ x, y })
            setSelectedFlowerPosition(null)
            setSelectedGridCell(null)
            setSelectedFlower(null)
            return
        }

        // If clicking on an empty cell, deselect any selected flower or rock
        setSelectedFlowerPosition(null)
        setSelectedRockPosition(null)

        // If a flower is selected, place it in this grid cell
        if (selectedFlower !== null) {
            dispatch({
                action: GardenActions.plantFlower,
                payload: { flowerId: selectedFlower, x, y },
            })
            setSelectedFlower(null)
            setSelectedGridCell(null)
        } else {
            // Otherwise, select this grid cell
            setSelectedGridCell(selectedGridCell === index ? null : index)
        }
    }

    return (
        <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
            {/* Left Column - Inventory */}
            <Panel style={{ width: '270px', minHeight: '650px' }}>
                <div>
                    <h2 style={{ marginTop: 0 }}>Flowers</h2>
                    <Input
                        placeholder="Search garden items..."
                        style={{ marginBottom: '8px', marginTop: '8px' }}
                        radius={0}
                        onChange={(e) => {
                            setCurrentPage(1)
                            setSearch(e.target.value)
                        }}
                    />
                    <div style={{ height: '510px' }}>
                        {displayedItems.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginTop: '20px' }}>
                                {search ? 'No garden items match your search.' : 'No garden items in inventory.'}
                            </p>
                        ) : (
                            displayedItems.map((item) => {
                                const itemMeta = ItemsContent.getById(item.id)
                                const isFavorite = state.favoriteItems.includes(item.id)
                                const isSelected = selectedFlower === item.id
                                return (
                                    <InventoryButton
                                        key={item.id}
                                        state={state}
                                        dispatch={dispatch}
                                        id={item.id}
                                        image={itemMeta.image}
                                        label={itemMeta.name}
                                        amount={item.amount}
                                        onClick={handleItemSelect}
                                        isFavorite={isFavorite}
                                        isSelected={isSelected}
                                    />
                                )
                            })
                        )}
                    </div>
                    {totalPages > 1 && (
                        <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
                    )}
                </div>
            </Panel>

            {/* Right Column - Grid */}
            <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '0px' }}>
                {/* Progress Bar Row */}
                <Panel style={{ height: '60px' }}>
                    <div
                        style={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            padding: '8px',
                        }}
                    >
                        <div
                            style={{
                                height: '20px',
                                width: '100%',
                                display: 'flex',
                                gap: '2px',
                                alignItems: 'center',
                            }}
                        >
                            {/* 60 individual tick segments */}
                            {Array.from({ length: 60 }, (_, i) => {
                                const progress = getCycleProgress()
                                const tickProgress = progress * 60
                                const isFilled = i < Math.floor(tickProgress)
                                const isPartiallyFilled = i === Math.floor(tickProgress) && tickProgress % 1 > 0

                                // Garden-themed colors: green gradient from light to dark
                                const filledColors = [
                                    'rgb(144, 238, 144)', // Light green
                                    'rgb(124, 218, 144)', // Light teal-green
                                    'rgb(104, 198, 124)', // Medium green
                                    'rgb(84, 178, 104)', // Medium-dark green
                                    'rgb(64, 158, 84)', // Dark green
                                    'rgb(44, 138, 64)', // Darker green
                                ]
                                // Cycle through colors for visual variety
                                const colorIndex = i % filledColors.length
                                const filledColor = filledColors[colorIndex]

                                // Extract RGB values for rgba
                                const rgbMatch = filledColor.match(/\d+/g)
                                const r = rgbMatch ? parseInt(rgbMatch[0]) : 144
                                const g = rgbMatch ? parseInt(rgbMatch[1]) : 238
                                const b = rgbMatch ? parseInt(rgbMatch[2]) : 144

                                return (
                                    <div
                                        key={i}
                                        style={{
                                            flex: '1 1 0',
                                            height: '100%',
                                            backgroundColor: isFilled
                                                ? filledColor
                                                : isPartiallyFilled
                                                  ? `rgba(${r}, ${g}, ${b}, 0.5)`
                                                  : 'rgba(30, 50, 30, 0.6)',
                                            border: isFilled
                                                ? `1px solid rgba(${r}, ${g}, ${b}, 0.8)`
                                                : '1px solid rgba(60, 80, 60, 0.4)',
                                            transition: 'background-color 0.1s linear, border-color 0.1s linear',
                                        }}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </Panel>

                {/* Top Panel */}
                <Panel style={{ height: '400px' }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gridTemplateRows: 'repeat(5, 1fr)',
                            gap: '4px',
                            height: '100%',
                            padding: '8px',
                        }}
                    >
                        {Array.from({ length: 25 }, (_, index) => {
                            const flower = gardenGrid[index]
                            const flowerMeta = flower ? ItemsContent.getById(flower.flowerId) : null
                            const x = index % 5
                            const y = Math.floor(index / 5)
                            const hasRock = rockPositions.has(`${x},${y}`)
                            const isSelected =
                                selectedGridCell === index ||
                                (selectedFlowerPosition?.x === x && selectedFlowerPosition?.y === y) ||
                                (selectedRockPosition?.x === x && selectedRockPosition?.y === y)
                            const isHovered = hoveredGridCell === index
                            const hasFlower = flower !== null

                            // Determine background color
                            let backgroundColor = 'rgb(10,10,10)'
                            if (isSelected) {
                                backgroundColor = 'rgba(255, 216, 107, 0.2)'
                            } else if (isHovered) {
                                backgroundColor = hasFlower ? 'rgb(30,30,30)' : hasRock ? 'rgb(25,20,15)' : 'rgb(20,20,20)'
                            } else if (hasFlower) {
                                backgroundColor = 'rgb(25,25,25)'
                            } else if (hasRock) {
                                backgroundColor = 'rgb(20,15,10)'
                            }

                            const isDragOver = hoveredGridCell === index && draggedCell !== null && draggedCell !== index

                            return (
                                <div
                                    key={index}
                                    style={{
                                        border: isSelected
                                            ? '2px solid #ffd86b'
                                            : isDragOver
                                              ? '2px solid rgba(100, 180, 255, 0.8)'
                                              : '1px solid rgba(255,255,255,0.1)',
                                        backgroundColor: isDragOver ? 'rgba(100, 180, 255, 0.15)' : backgroundColor,
                                        cursor: hasFlower ? 'grab' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '0',
                                        position: 'relative',
                                        transition: 'background-color 0.1s ease',
                                        opacity: draggedCell === index ? 0.4 : 1,
                                    }}
                                    draggable={hasFlower}
                                    onDragStart={(e) => {
                                        if (!hasFlower) {
                                            e.preventDefault()
                                            return
                                        }
                                        setDraggedCell(index)
                                        e.dataTransfer.effectAllowed = 'move'
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault()
                                        e.dataTransfer.dropEffect = 'move'
                                        setHoveredGridCell(index)
                                    }}
                                    onDragLeave={() => {
                                        if (hoveredGridCell === index) setHoveredGridCell(null)
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault()
                                        if (draggedCell !== null && draggedCell !== index) {
                                            const fromX = draggedCell % 5
                                            const fromY = Math.floor(draggedCell / 5)
                                            dispatch({
                                                action: GardenActions.swapCells,
                                                payload: { fromX, fromY, toX: x, toY: y },
                                            })
                                        }
                                        setDraggedCell(null)
                                        setHoveredGridCell(null)
                                    }}
                                    onDragEnd={() => {
                                        setDraggedCell(null)
                                        setHoveredGridCell(null)
                                    }}
                                    onClick={() => handleGridCellClick(index)}
                                    onMouseEnter={() => { if (draggedCell === null) setHoveredGridCell(index) }}
                                    onMouseLeave={() => setHoveredGridCell(null)}
                                >
                                    {hasRock && !hasFlower
                                        ? (() => {
                                              const stoneMeta = ItemsContent.getById('stone')
                                              return (
                                                  <img
                                                      className="pixel"
                                                      src={Images.get(stoneMeta?.image || 'items/stone.png')}
                                                      alt="Rock"
                                                      style={{
                                                          width: '80%',
                                                          height: '80%',
                                                          objectFit: 'contain',
                                                          opacity: 0.8,
                                                      }}
                                                  />
                                              )
                                          })()
                                        : flowerMeta && (
                                              <>
                                                  <img
                                                      className="pixel"
                                                      src={Images.get(flowerMeta.image)}
                                                      alt={flowerMeta.name}
                                                      style={{
                                                          width: '80%',
                                                          height: '80%',
                                                          objectFit: 'contain',
                                                      }}
                                                  />
                                                  {flower && (
                                                      <div
                                                          style={{
                                                              position: 'absolute',
                                                              bottom: '2px',
                                                              left: '2px',
                                                              backgroundColor: 'rgba(0,0,0,0.2)',
                                                              color: '#fff',
                                                              fontSize: '14px',
                                                              padding: '2px 4px',
                                                              fontWeight: 'bold',
                                                          }}
                                                      >
                                                          Lv. {flower.level || 1}
                                                      </div>
                                                  )}
                                              </>
                                          )}
                                </div>
                            )
                        })}
                    </div>
                </Panel>

                {/* Lower Panels - Two Panels in a Row */}
                <div style={{ display: 'flex', gap: '0px', height: '182px' }}>
                    <Panel style={{ flex: '1 1 50%', height: '100%', padding: '12px' }}>
                        {!selectedFlowerPosition ? (
                            <div
                                style={{
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(255,255,255,0.5)',
                                    fontSize: '18px',
                                }}
                            >
                                Select a flower to upgrade it
                            </div>
                        ) : (
                            (() => {
                                const flower = state.garden?.flowers.find(
                                    (f) => f.x === selectedFlowerPosition.x && f.y === selectedFlowerPosition.y
                                )
                                if (!flower) return <></>

                                const flowerMeta = ItemsContent.getById(flower.flowerId)
                                if (!flowerMeta) return <></>

                                const currentLevel = flower.level || 1

                                // Item this flower produces (for production display)
                                const producedItemId = FLOWER_TO_ITEM[flower.flowerId]
                                const producedItemMeta = ItemsContent.getById(producedItemId)

                                // Cost to level up (single source of truth from helpers)
                                const { itemId: costItemId, amount: costAmount } = getFlowerLevelUpCost(currentLevel)
                                const costItemMeta = ItemsContent.getById(costItemId)
                                const playerCostAmount = state.inventory.find((item) => item.id === costItemId)?.amount || 0
                                const canLevelUp = currentLevel < 6 && playerCostAmount >= costAmount

                                // Calculate production per minute (level = items per 60 seconds = items per minute)
                                const productionPerMinute = currentLevel
                                const nextLevelProductionPerMinute = currentLevel < 6 ? currentLevel + 1 : currentLevel

                                return (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <div
                                            style={{
                                                marginBottom: '0px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>
                                                {flowerMeta.name}
                                            </div>
                                            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)' }}>
                                                Level {currentLevel}/6
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0px' }}>
                                            {/* Production per minute display */}
                                            {producedItemMeta && (
                                                <div
                                                    style={{
                                                        borderRadius: '4px',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: '16px',
                                                            color: 'rgba(255,255,255,1)',
                                                            marginBottom: '-4px',
                                                        }}
                                                    >
                                                        Production per minute:
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <img
                                                            className="pixel"
                                                            src={Images.get(producedItemMeta.image)}
                                                            alt={producedItemMeta.name}
                                                            style={{ width: '20px', height: '20px' }}
                                                        />
                                                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#90EE90' }}>
                                                            {productionPerMinute}
                                                        </span>
                                                        {currentLevel < 6 && (
                                                            <span
                                                                style={{
                                                                    fontSize: '16px',
                                                                    color: 'rgba(255,255,255,0.5)',
                                                                    marginLeft: '4px',
                                                                }}
                                                            >
                                                                → {nextLevelProductionPerMinute} (next level)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {currentLevel < 6 && costItemMeta && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        width: '100%',
                                                        marginTop: 'auto',
                                                    }}
                                                >
                                                    <img
                                                        className="pixel"
                                                        src={Images.get(costItemMeta.image)}
                                                        alt={costItemMeta.name}
                                                        style={{ width: '24px', height: '24px' }}
                                                    />
                                                    <span style={{ fontSize: '14px', flex: 1 }}>{costItemMeta.name}</span>
                                                    <span style={{ float: 'right' }}>
                                                        {costAmount} (
                                                        <span style={{ color: playerCostAmount >= costAmount ? 'lime' : 'red' }}>
                                                            {playerCostAmount}
                                                        </span>
                                                        )
                                                    </span>
                                                </div>
                                            )}
                                            <Button
                                                disabled={!canLevelUp}
                                                onClick={() => {
                                                    dispatch({
                                                        action: GardenActions.levelUpFlower,
                                                        payload: {
                                                            x: selectedFlowerPosition.x,
                                                            y: selectedFlowerPosition.y,
                                                        },
                                                    })
                                                }}
                                                style={{
                                                    marginTop: 'auto',
                                                    cursor: canLevelUp ? 'pointer' : 'not-allowed',
                                                }}
                                            >
                                                {currentLevel >= 6 ? 'Max Level Reached' : 'Level Up'}
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })()
                        )}
                    </Panel>
                    <Panel style={{ flex: '1 1 50%', height: '100%', padding: '12px' }}>
                        {selectedRockPosition ? (
                            (() => {
                                const rocksRemoved = 25 - (state.garden?.rocks?.length || 25)
                                const cost = Math.floor(750 * Math.pow(1.191232, rocksRemoved))
                                const currentGold = state.inventory.find((item) => item.id === 'gold')?.amount || 0
                                const canRemove = currentGold >= cost

                                const goldMeta = ItemsContent.getById('gold')

                                return (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                                                Remove Rock
                                            </div>
                                            {goldMeta && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                                    <img
                                                        className="pixel"
                                                        src={Images.get(goldMeta.image)}
                                                        alt={goldMeta.name}
                                                        style={{ width: '24px', height: '24px' }}
                                                    />
                                                    <span style={{ fontSize: '14px', flex: 1 }}>{goldMeta.name}</span>
                                                    <span style={{ float: 'right' }}>
                                                        {cost.toLocaleString()} (
                                                        <span style={{ color: canRemove ? 'lime' : 'red' }}>
                                                            {currentGold.toLocaleString()}
                                                        </span>
                                                        )
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <Button
                                                disabled={!canRemove}
                                                onClick={() => {
                                                    dispatch({
                                                        action: GardenActions.removeRock,
                                                        payload: {
                                                            x: selectedRockPosition.x,
                                                            y: selectedRockPosition.y,
                                                        },
                                                    })
                                                    setSelectedRockPosition(null)
                                                }}
                                                style={{
                                                    marginTop: 'auto',
                                                    cursor: canRemove ? 'pointer' : 'not-allowed',
                                                }}
                                            >
                                                Remove Rock
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })()
                        ) : !selectedFlowerPosition ? (
                            <div
                                style={{
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(255,255,255,0.5)',
                                    fontSize: '18px',
                                }}
                            >
                                Select a flower for additional options
                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <p style={{ textAlign: 'center', marginTop: 'auto' }}>
                                    This will remove the flower and return to your inventory. <br />
                                    <span style={{ color: 'red' }}>You will lose your flower level!</span>
                                </p>
                                <Button
                                    onClick={() => {
                                        dispatch({
                                            action: GardenActions.removeFlower,
                                            payload: {
                                                x: selectedFlowerPosition.x,
                                                y: selectedFlowerPosition.y,
                                            },
                                        })
                                        setSelectedFlowerPosition(null)
                                    }}
                                    style={{
                                        marginTop: 'auto',
                                        cursor: 'pointer',
                                        backgroundColor: 'rgba(220, 53, 69, 0.8)',
                                    }}
                                >
                                    Remove Flower
                                </Button>
                            </div>
                        )}
                    </Panel>
                </div>
            </div>
        </div>
    )
}

export default Garden

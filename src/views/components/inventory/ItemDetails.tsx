import Button from '@components/common/Button'
import ItemsContent from '@data/items'
import { StateProps } from '@engine/types'
import Images from '@utils/images'
import InventorySellItem from './InventorySellItem'
import InventoryBuyItem from './InventoryBuyItem'
import InventoryModule from '@modules/inventory/dispatch'
import Sounds from '@utils/sounds'
import * as UpgradeHelpers from '@modules/upgrades/helpers'
import { useState } from 'react'
import ChestLootModal from './ChestLootModal'
import { calculateChestLoot } from '@modules/inventory/functions'
import { ItemInstance } from '@modules/inventory/types'
import SkillingHelpers from '@modules/skilling/helpers'
import Numbers from '@utils/numbers'
import Tooltip from '@components/common/Tooltip'

interface Props extends StateProps {
    selected?: string
    amount?: number
    canSell?: boolean
    canBuy?: boolean
    showFavoriteButton?: boolean
    hideSellValue?: boolean
    hideBuyValue?: boolean
}

function InventoryItemDetails({
    state,
    dispatch,
    selected,
    amount,
    canSell,
    canBuy,
    showFavoriteButton = true,
    hideSellValue = false,
    hideBuyValue = false,
}: Props) {
    const itemMeta = selected ? ItemsContent.getById(selected) : undefined
    const ownedAmount = amount ?? 0
    const isFavorite = selected ? state.favoriteItems.includes(selected) : false
    const [chestLoot, setChestLoot] = useState<ItemInstance[]>([])
    const [chestModalOpened, setChestModalOpened] = useState(false)

    // Find all recipes that use this item as an ingredient
    const recipesUsingItem = selected
        ? ItemsContent.get
              .filter((item) =>
                  item.recipes.some((recipe) => recipe.ingredients.some((ingredient) => ingredient.id === selected))
              )
              .map((item) => {
                  const relevantRecipes = item.recipes.filter((recipe) =>
                      recipe.ingredients.some((ingredient) => ingredient.id === selected)
                  )
                  return {
                      item,
                      recipes: relevantRecipes,
                  }
              })
        : []

    const handleToggleFavorite = () => {
        if (selected) {
            Sounds.play('click.wav')
            InventoryModule.toggleFavorite(dispatch, selected)
        }
    }

    return (
        <div style={{ height: '626px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Item Details</h3>
                {itemMeta && showFavoriteButton && (
                    <button
                        onClick={handleToggleFavorite}
                        style={{
                            background: isFavorite ? 'rgba(255, 215, 0, 0.1)' : 'none',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: isFavorite ? '#FFD700' : 'rgba(255,255,255,0.6)',
                            fontSize: '20px',
                            padding: '1px 4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            height: '26px',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isFavorite ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255,255,255,0.1)'
                            e.currentTarget.style.borderColor = isFavorite ? '#FFD700' : 'rgba(255,255,255,0.5)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isFavorite ? 'rgba(255, 215, 0, 0.1)' : 'none'
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
                        }}
                        title={isFavorite ? 'Unfavorite' : 'Favorite'}
                    >
                        ★
                    </button>
                )}
            </div>
            {itemMeta && canBuy && (
                <span
                    style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '8px',
                        fontSize: '18px',
                        color: 'rgba(255,255,255,0.6)',
                    }}
                >
                    Owned: {Numbers.whole(state.inventory.find((item) => item.id === selected)?.amount || 0)}
                </span>
            )}
            {itemMeta ? (
                <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
                    <img
                        className="pixel"
                        src={Images.get(itemMeta.image)}
                        alt="item art"
                        style={{
                            width: '64px',
                            margin: 'auto',
                        }}
                    />
                    <div
                        style={{
                            display: 'flex',
                            marginTop: '16px',
                            borderTop: 'dashed 1px rgba(255,255,255,.1)',
                            paddingTop: '8px',
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontWeight: '400' }}>Name</h3>
                            <p style={{ color: 'rgba(255,255,255,.6)' }}>{itemMeta.name}</p>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontWeight: '400' }}>Type</h3>
                            <p style={{ color: 'rgba(255,255,255,.6)' }}>{itemMeta.type}</p>
                        </div>
                        {((itemMeta.buyValue !== undefined && !hideBuyValue) ||
                            (!hideSellValue && itemMeta.sellValue !== undefined)) && (
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: '400' }}>
                                    {hideSellValue || itemMeta.sellValue === undefined ? 'Buy Value' : 'Sell Value'}
                                </h3>
                                {!hideSellValue && itemMeta.sellValue !== undefined
                                    ? (() => {
                                          const goldBonus = UpgradeHelpers.getSellableGoldBonus(state.purchasedUpgrades)
                                          const baseSellValue = itemMeta.sellValue ?? 0
                                          const adjustedSellValue = Math.floor(baseSellValue * (1 + goldBonus / 100))
                                          return (
                                              <p style={{ color: 'rgba(255,255,255,.6)' }}>
                                                  {adjustedSellValue}
                                                  {goldBonus > 0 && (
                                                      <span
                                                          style={{
                                                              color: 'rgba(0,255,0,.8)',
                                                              marginLeft: '4px',
                                                          }}
                                                      >
                                                          (+{goldBonus}%)
                                                      </span>
                                                  )}
                                              </p>
                                          )
                                      })()
                                    : itemMeta.buyValue !== undefined && !hideBuyValue
                                      ? (() => {
                                            const discount = UpgradeHelpers.getMerchantDiscount(state.purchasedUpgrades)
                                            const baseBuyValue = itemMeta.buyValue ?? 0
                                            const adjustedBuyValue = Math.max(1, Math.floor(baseBuyValue * (1 - discount / 100)))
                                            return <p style={{ color: 'rgba(255,255,255,.6)' }}>{adjustedBuyValue}</p>
                                        })()
                                      : null}
                            </div>
                        )}
                    </div>
                    {!hideSellValue && itemMeta.sellValue !== undefined && itemMeta.buyValue !== undefined && !hideBuyValue && (
                        <div
                            style={{
                                display: 'flex',
                                marginTop: '8px',
                                paddingTop: '8px',
                            }}
                        >
                            <div style={{ width: '50%' }}>
                                <h3 style={{ fontWeight: '400' }}>Buy Value</h3>
                                {(() => {
                                    const discount = UpgradeHelpers.getMerchantDiscount(state.purchasedUpgrades)
                                    const baseBuyValue = itemMeta.buyValue ?? 0
                                    const adjustedBuyValue = Math.max(1, Math.floor(baseBuyValue * (1 - discount / 100)))
                                    return <p style={{ color: 'rgba(255,255,255,.6)' }}>{adjustedBuyValue}</p>
                                })()}
                            </div>
                        </div>
                    )}
                    <h3 style={{ fontWeight: '400', marginTop: '8px' }}>Description</h3>
                    <p style={{ color: 'rgba(255,255,255,.6)' }}>{itemMeta.description}</p>
                    {itemMeta.type === 'Container' && itemMeta.lootTable && (
                        <div style={{ marginTop: '16px' }}>
                            <h3 style={{ fontWeight: '400', marginBottom: '8px' }}>Possible Loot</h3>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    maxHeight: '180px',
                                    overflowY: 'auto',
                                }}
                            >
                                {itemMeta.lootTable.map((entry, index) => {
                                    const lootType = entry.type || 'item' // Default to 'item' for backwards compatibility
                                    const lootItem = lootType === 'item' && entry.id ? ItemsContent.getById(entry.id) : null

                                    // Always use white color
                                    const itemColor = 'white'

                                    // Get current count (inventory for items, collection for collectibles)
                                    let currentAmount = 0
                                    if (lootType === 'item' && entry.id) {
                                        const inventoryItem = state.inventory.find((invItem) => invItem.id === entry.id)
                                        currentAmount = inventoryItem?.amount || 0
                                    }

                                    const displayItem = lootItem
                                    const displayId = lootType === 'item' ? entry.id : entry.collectibleId

                                    return (
                                        <Tooltip
                                            key={index}
                                            center={true}
                                            content={
                                                <div
                                                    style={{
                                                        position: 'relative',
                                                        display: 'flex',
                                                        gap: '12px',
                                                        alignItems: 'flex-start',
                                                        width: '100%',
                                                    }}
                                                >
                                                    <img
                                                        className="pixel"
                                                        src={Images.get(displayItem?.image || 'items/placeholder.png')}
                                                        alt={displayItem?.name || displayId}
                                                        style={{
                                                            width: '38px',
                                                            height: '38px',
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <h1
                                                            style={{
                                                                fontSize: '18px',
                                                                color: 'white',
                                                                margin: 0,
                                                                padding: 0,
                                                                marginTop: '-10px',
                                                            }}
                                                        >
                                                            {displayItem?.name || displayId}
                                                        </h1>
                                                        <p
                                                            style={{
                                                                fontSize: '18px',
                                                                color: 'rgba(255,255,255,0.8)',
                                                                marginTop: '-6px',
                                                                padding: 0,
                                                                lineHeight: '0.9',
                                                            }}
                                                        >
                                                            {displayItem?.description || ''}
                                                        </p>
                                                    </div>
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: '-6px',
                                                            right: 0,
                                                            fontSize: '16px',
                                                            color: 'rgba(255,255,255,0.9)',
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        {lootType === 'collectible'
                                                            ? currentAmount > 0
                                                                ? 'Collected'
                                                                : 'Not Collected'
                                                            : `${currentAmount.toLocaleString()} Owned`}
                                                    </div>
                                                </div>
                                            }
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '4px 12px',
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                                                }}
                                            >
                                                <img
                                                    className="pixel"
                                                    src={Images.get(displayItem?.image || 'items/placeholder.png')}
                                                    alt={displayItem?.name || displayId}
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
                                                        color: itemColor,
                                                        transition: 'color 0.3s',
                                                        margin: 0,
                                                    }}
                                                >
                                                    {displayItem?.name || displayId}
                                                </h3>
                                                <div
                                                    style={{
                                                        paddingRight: '8px',
                                                        fontSize: '16px',
                                                        fontWeight: '400',
                                                        display: 'flex',
                                                        gap: '12px',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: '16px',
                                                            fontWeight: '400',
                                                            color: 'rgba(255,255,255,0.5)',
                                                            minWidth: '50px',
                                                            textAlign: 'right',
                                                        }}
                                                    >
                                                        {entry.chance !== undefined
                                                            ? `${(entry.chance * 100).toFixed(0)}%`
                                                            : '100%'}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: '16px',
                                                            fontWeight: '400',
                                                            textAlign: 'right',
                                                            color: 'rgba(255,255,255,0.9)',
                                                            minWidth: '60px',
                                                        }}
                                                    >
                                                        {Numbers.whole(entry.amount)}
                                                    </span>
                                                </div>
                                            </div>
                                        </Tooltip>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    {recipesUsingItem.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                            <h3 style={{ fontWeight: '400', marginBottom: '8px' }}>Used in Crafting</h3>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    maxHeight: '180px',
                                    overflowY: 'auto',
                                }}
                            >
                                {recipesUsingItem.map(({ item, recipes }) => {
                                    // Get the first recipe that uses this ingredient (they all use the same amount)
                                    const recipe = recipes[0]
                                    const ingredientAmount =
                                        recipe.ingredients.find((ingredient) => ingredient.id === selected)?.amount || 0
                                    const workstationSkill = state.skills.find((skill) => skill.id === recipe.workstation)
                                    const workstationLevel = SkillingHelpers.getLevel(workstationSkill?.xp || 0)
                                    const hasRequiredLevel = workstationLevel >= recipe.levelRequirement

                                    // Get unique workstations for this item
                                    const uniqueWorkstations = [...new Set(recipes.map((r) => r.workstation))]

                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '4px',
                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                borderRadius: '0px',
                                            }}
                                        >
                                            <img
                                                className="pixel"
                                                src={Images.get(item.image || 'items/placeholder.png')}
                                                alt={hasRequiredLevel ? item.name : '???'}
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    filter: hasRequiredLevel ? 'none' : 'brightness(0)',
                                                }}
                                            />
                                            <span style={{ fontSize: '16px', color: 'rgba(255,255,255,.8)' }}>
                                                {hasRequiredLevel ? item.name : '???'}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '16px',
                                                    color: 'rgba(255,255,255,.5)',
                                                    marginLeft: '4px',
                                                }}
                                            >
                                                ({uniqueWorkstations.join(', ')})
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '16px',
                                                    color: 'rgba(255,255,255,.5)',
                                                    marginLeft: 'auto',
                                                }}
                                            >
                                                {Numbers.whole(ingredientAmount)} required
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <p style={{ fontSize: '20px', color: 'rgba(255,255,255,.5)' }}>Select an item to view details.</p>
            )}
            <div style={{ marginTop: 'auto', width: '100%' }}>
                {itemMeta && itemMeta.type === 'Consumable' && ownedAmount > 0 && !canBuy && (
                    <div style={{ marginBottom: '0px' }}>
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                InventoryModule.consumeItem(dispatch, itemMeta.id)
                            }}
                            style={{
                                width: '100%',
                                cursor: 'pointer',
                            }}
                        >
                            Consume
                        </Button>
                    </div>
                )}
                {itemMeta && itemMeta.type === 'Container' && itemMeta.lootTable && ownedAmount > 0 && !canBuy && (
                    <div style={{ marginBottom: '0px', display: 'flex', gap: '8px' }}>
                        <Button
                            onClick={() => {
                                // Calculate loot first to show in modal
                                const loot = calculateChestLoot(itemMeta.id, 1)
                                setChestLoot(loot)
                                setChestModalOpened(true)
                                // Open the chest (this applies the loot) - pass the same loot to ensure consistency
                                InventoryModule.openChest(dispatch, itemMeta.id, 1, loot)
                            }}
                            style={{
                                flex: 1,
                                cursor: 'pointer',
                            }}
                        >
                            Open Chest
                        </Button>
                        {ownedAmount > 1 && (
                            <Button
                                onClick={() => {
                                    // Calculate loot for all chests
                                    const loot = calculateChestLoot(itemMeta.id, ownedAmount)
                                    setChestLoot(loot)
                                    setChestModalOpened(true)
                                    // Open all chests (this applies the loot) - pass the same loot to ensure consistency
                                    InventoryModule.openChest(dispatch, itemMeta.id, ownedAmount, loot)
                                }}
                                style={{
                                    flex: 1,
                                    cursor: 'pointer',
                                }}
                            >
                                {`Open All (${Numbers.whole(ownedAmount)})`}
                            </Button>
                        )}
                    </div>
                )}
                {itemMeta && itemMeta.id !== 'gold' && canSell && itemMeta.sellValue !== undefined && (
                    <InventorySellItem state={state} dispatch={dispatch} item={itemMeta} amount={ownedAmount} />
                )}
                {itemMeta && itemMeta.id !== 'gold' && canBuy && itemMeta.buyValue !== undefined && (
                    <InventoryBuyItem state={state} dispatch={dispatch} item={itemMeta} />
                )}
            </div>
            <ChestLootModal
                opened={chestModalOpened}
                onClose={() => {
                    // Clear the rolled collectibles after modal closes
                    if (state.lastOpenedChestRolledCollectibles) {
                        dispatch({
                            action: (s: any) => {
                                s.lastOpenedChestRolledCollectibles = undefined
                                return s
                            },
                            payload: {},
                        })
                    }
                    setChestModalOpened(false)
                }}
                loot={chestLoot}
                chestName={`a ${itemMeta?.name || 'Chest'}`}
            />
        </div>
    )
}

export default InventoryItemDetails

import Button from '@components/common/Button'
import ItemsContent from '@data/items'
import { StateProps } from '@engine/types'
import InventoryModule from '@modules/inventory/dispatch'
import { Item, ItemInstance } from '@modules/inventory/types'
import { Input, Slider } from '@mantine/core'
import Images from '@utils/images'
import ResourceNotification from '@utils/notification'
import { ChangeEvent, MouseEvent, useMemo, useState, useEffect, useRef } from 'react'
import * as UpgradeHelpers from '@modules/upgrades/helpers'
import { getWeeklyPurchaseCount, getMostRecentWeeklyReset } from '@modules/inventory/merchant-helpers'

interface Props extends StateProps {
    item: Item
}

const GOLD_ITEM_ID = 'gold'

function InventoryBuyItem({ state, dispatch, item }: Props) {
    const currentGold = state.inventory.find((item) => item.id === GOLD_ITEM_ID)?.amount ?? 0
    // Apply merchant discount
    const discount = UpgradeHelpers.getMerchantDiscount(state.purchasedUpgrades)
    const baseBuyValue = item.buyValue ?? 0
    const adjustedBuyValue = Math.max(1, Math.floor(baseBuyValue * (1 - discount / 100)))
    const maxAffordable = adjustedBuyValue > 0 ? Math.max(0, Math.floor(currentGold / adjustedBuyValue)) : 0

    // Apply weekly limit if applicable
    const weeklyPurchased = item.weeklyLimit ? getWeeklyPurchaseCount(state, item.id) : 0
    const weeklyRemaining = item.weeklyLimit ? Math.max(0, item.weeklyLimit - weeklyPurchased) : Infinity
    const maxAmount = Math.min(maxAffordable, weeklyRemaining)

    // Default to 1 if player can afford at least 1, otherwise 0
    const [BuyAmount, setBuyAmount] = useState<number>(maxAmount >= 1 ? 1 : 0)
    const previousItemIdRef = useRef<string>(item.id)

    // Update BuyAmount when item changes - default to 1 if affordable
    useEffect(() => {
        // Only reset to default when item actually changes
        if (previousItemIdRef.current !== item.id) {
            previousItemIdRef.current = item.id
            if (maxAmount >= 1) {
                setBuyAmount(1)
            } else {
                setBuyAmount(0)
            }
        } else if (BuyAmount > maxAmount) {
            // Clamp to max if it exceeds what we can afford (e.g., gold decreased)
            setBuyAmount(maxAmount)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.id, maxAmount])

    const totalValue = useMemo(() => {
        return Math.max(0, BuyAmount) * adjustedBuyValue
    }, [BuyAmount, adjustedBuyValue])

    const goldMeta = ItemsContent.getById(GOLD_ITEM_ID)

    const canBuy = BuyAmount > 0 && BuyAmount <= maxAmount

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10)
        if (Number.isNaN(value)) {
            setBuyAmount(0)
            return
        }
        const clamped = Math.min(Math.max(value, 0), maxAmount)
        setBuyAmount(clamped)
    }

    const handleBuy = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        if (!canBuy) {
            return
        }

        const updates: ItemInstance[] = [
            {
                id: item.id,
                amount: BuyAmount,
            },
        ]

        if (totalValue > 0) {
            updates.push({
                id: GOLD_ITEM_ID,
                amount: -totalValue,
            })
        }

        InventoryModule.change(dispatch, updates)

        // Track weekly purchase if item has a weekly limit
        if (item.weeklyLimit) {
            const resetTimestamp = getMostRecentWeeklyReset()
            dispatch({
                action: (s: any) => {
                    if (s.merchantWeeklyPurchases.resetTimestamp < resetTimestamp) {
                        s.merchantWeeklyPurchases = { resetTimestamp, purchases: {} }
                    }
                    s.merchantWeeklyPurchases.purchases[item.id] = (s.merchantWeeklyPurchases.purchases[item.id] ?? 0) + BuyAmount
                    return s
                },
                payload: {},
            })
        }

        // Show resource notification for the purchased item
        ResourceNotification(item.id, BuyAmount)
    }

    return (
        <div>
            <div>
                <h3 style={{ fontWeight: '400', marginTop: '8px', fontSize: '18px' }}>
                    Amount to Buy (max {maxAmount})
                    {item.weeklyLimit !== undefined && (
                        <span
                            style={{
                                color: weeklyRemaining === 0 ? 'rgb(255, 247, 0)' : 'rgb(255, 247, 0)',
                                float: 'right',
                            }}
                        >
                            Weekly Limit: {weeklyPurchased}/{item.weeklyLimit}
                        </span>
                    )}
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Input
                        type="number"
                        min={0}
                        max={maxAmount}
                        value={BuyAmount}
                        onChange={handleChange}
                        disabled={maxAmount === 0}
                        radius={0}
                        style={{ flex: 1 }}
                    />
                    <Button
                        onClick={() => setBuyAmount(Math.max(BuyAmount - 1, 0))}
                        disabled={maxAmount === 0 || BuyAmount <= 0}
                        style={{ maxWidth: '40px', padding: '0 8px' }}
                    >
                        -1
                    </Button>
                    <Button
                        onClick={() => setBuyAmount(Math.min(BuyAmount + 1, maxAmount))}
                        disabled={maxAmount === 0 || BuyAmount >= maxAmount}
                        style={{ maxWidth: '40px', padding: '0 8px' }}
                    >
                        +1
                    </Button>
                    <Button
                        onClick={() => setBuyAmount(maxAmount)}
                        disabled={maxAmount === 0}
                        style={{ maxWidth: '70px', padding: '0px' }}
                    >
                        Max
                    </Button>
                </div>
            </div>
            <Slider
                value={BuyAmount}
                onChange={(num) => setBuyAmount(num)}
                min={0}
                max={maxAmount}
                step={1}
                style={{ marginBottom: '4px', marginTop: '4px' }}
                label={null}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                <span style={{ color: 'rgba(255,255,255,.7)' }}>Gold Cost:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {goldMeta ? (
                        <img
                            className="pixel"
                            src={Images.get(goldMeta.image)}
                            alt={goldMeta.name}
                            style={{ width: '20px', height: '20px' }}
                        />
                    ) : null}
                    <span style={{ fontWeight: 400 }}>{totalValue}</span>
                </div>
            </div>

            <Button
                onClick={handleBuy}
                disabled={!canBuy}
                style={{ marginTop: '4px', backgroundColor: canBuy ? '#26402a' : 'rgb(40,40,40)' }}
            >
                Buy
            </Button>
        </div>
    )
}

export default InventoryBuyItem

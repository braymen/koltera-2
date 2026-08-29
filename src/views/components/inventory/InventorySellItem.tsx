import Button from '@components/common/Button'
import ItemsContent from '@data/items'
import { StateProps } from '@engine/types'
import InventoryModule from '@modules/inventory/dispatch'
import { Item, ItemInstance } from '@modules/inventory/types'
import { Input, Slider } from '@mantine/core'
import Images from '@utils/images'
import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import * as UpgradeHelpers from '@modules/upgrades/helpers'

interface Props extends StateProps {
    item: Item
    amount: number
}

const GOLD_ITEM_ID = 'gold'

function InventorySellItem({ state, dispatch, item, amount }: Props) {
    const [SellAmount, setSellAmount] = useState<number>(amount > 0 ? 1 : 0)
    const previousItemIdRef = useRef<string>(item.id)

    const maxAmount = Math.max(0, amount)

    useEffect(() => {
        if (previousItemIdRef.current !== item.id) {
            previousItemIdRef.current = item.id
            setSellAmount(amount > 0 ? 1 : 0)
        } else if (SellAmount > maxAmount) {
            setSellAmount(maxAmount)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.id, maxAmount])

    // Apply sellable gold bonus
    const goldBonus = UpgradeHelpers.getSellableGoldBonus(state.purchasedUpgrades)
    const baseSellValue = item.sellValue ?? 0
    const adjustedSellValue = Math.floor(baseSellValue * (1 + goldBonus / 100))

    const totalValue = useMemo(() => {
        return Math.max(0, SellAmount) * adjustedSellValue
    }, [SellAmount, adjustedSellValue])

    const goldMeta = ItemsContent.getById(GOLD_ITEM_ID)

    const canSell = SellAmount > 0 && SellAmount <= maxAmount

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10)
        if (Number.isNaN(value)) {
            setSellAmount(0)
            return
        }
        const clamped = Math.min(Math.max(value, 0), maxAmount)
        setSellAmount(clamped)
    }

    const handleSell = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        if (!canSell) {
            return
        }

        const updates: ItemInstance[] = [
            {
                id: item.id,
                amount: -SellAmount,
            },
        ]

        if (totalValue > 0) {
            updates.push({
                id: GOLD_ITEM_ID,
                amount: totalValue,
            })
        }

        InventoryModule.change(dispatch, updates)
    }

    return (
        <div>
            <div>
                <h3 style={{ fontWeight: '400', marginTop: '8px' }}>Amount to sell (max {maxAmount})</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Input
                        type="number"
                        min={0}
                        max={maxAmount}
                        value={SellAmount}
                        onChange={handleChange}
                        disabled={maxAmount === 0}
                        radius={0}
                        style={{ flex: 1 }}
                    />
                    <Button
                        onClick={() => setSellAmount(Math.max(SellAmount - 1, 0))}
                        disabled={maxAmount === 0 || SellAmount <= 0}
                        style={{ maxWidth: '40px', padding: '0 8px' }}
                    >
                        -1
                    </Button>
                    <Button
                        onClick={() => setSellAmount(Math.min(SellAmount + 1, maxAmount))}
                        disabled={maxAmount === 0 || SellAmount >= maxAmount}
                        style={{ maxWidth: '40px', padding: '0 8px' }}
                    >
                        +1
                    </Button>
                    <Button
                        onClick={() => setSellAmount(maxAmount)}
                        disabled={maxAmount === 0}
                        style={{ maxWidth: '60px', padding: '0 8px' }}
                    >
                        Max
                    </Button>
                </div>
            </div>
            <Slider
                value={SellAmount}
                onChange={(num) => setSellAmount(num)}
                min={0}
                max={maxAmount}
                step={1}
                style={{ marginBottom: '4px', marginTop: '4px' }}
                label={null}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                <span style={{ color: 'rgba(255,255,255,.7)' }}>Gold received</span>
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

            <Button onClick={handleSell} disabled={!canSell} style={{ marginTop: '4px' }}>
                Sell
            </Button>
        </div>
    )
}

export default InventorySellItem

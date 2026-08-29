import { StateProps } from '@engine/types'
import ItemsContent from '@data/items'
import { Input } from '@mantine/core'
import { useState, useEffect } from 'react'
import Pagination from '../common/Pagination'
import MerchantButton from './MerchantButton'
import Images from '@utils/images'
import Button from '../common/Button'
import { ItemPrimaryType } from '@modules/inventory/types'
import * as UpgradeHelpers from '@modules/upgrades/helpers'
import Numbers from '@utils/numbers'
import {
    getWeeklyPurchaseCount,
    getMsUntilWeeklyReset,
    formatCountdown,
} from '@modules/inventory/merchant-helpers'

interface Props extends StateProps {
    selected?: string
    onSelect: (id: string) => void
}

type SortOption = 'name' | 'price'

function MerchantInventory({ state, dispatch, selected, onSelect }: Props) {
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<ItemPrimaryType | 'All'>('All')
    const [sortBy, setSortBy] = useState<SortOption>('price')
    const [sortAscending, setSortAscending] = useState<boolean>(true)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Refresh timer countdown
    const [countdown, setCountdown] = useState('')
    useEffect(() => {
        const update = () => {
            const ms = getMsUntilWeeklyReset()
            setCountdown(formatCountdown(ms))
        }
        update()
        const interval = setInterval(update, 1000)
        return () => clearInterval(interval)
    }, [])

    const categories: (ItemPrimaryType | 'All')[] = [
        'All',
        'Gathered',
        'Refined',
        'Sellable',
        'Container',
        'Consumable',
        'Currency',
    ]

    // Get all items that have buyValue (except gold, which is currency)
    const merchantItems = ItemsContent.get.filter(
        (item) => item.id !== 'gold' && item.buyValue !== undefined && item.buyValue > 0
    )

    const filteredItems = merchantItems.filter((item) => {
        const itemMeta = ItemsContent.getById(item.id)
        const matchesSearch = !search || itemMeta.name.toLowerCase().includes(search.toLowerCase())
        const matchesCategory =
            selectedCategory === 'All' ||
            (selectedCategory === 'Sellable'
                ? itemMeta.sellValue !== undefined && itemMeta.sellValue > 0
                : itemMeta.type === selectedCategory)
        return matchesSearch && matchesCategory
    })

    // Apply merchant discount for display
    const discount = UpgradeHelpers.getMerchantDiscount(state.purchasedUpgrades)

    // Sort items by selected sort option
    const sortedItems = [...filteredItems].sort((a, b) => {
        if (sortBy === 'price') {
            const aBasePrice = a.buyValue ?? 0
            const bBasePrice = b.buyValue ?? 0
            const aPrice = Math.max(1, Math.floor(aBasePrice * (1 - discount / 100)))
            const bPrice = Math.max(1, Math.floor(bBasePrice * (1 - discount / 100)))
            const diff = aPrice - bPrice
            return sortAscending ? diff : -diff
        } else {
            // Sort by name
            const diff = a.name.localeCompare(b.name)
            return sortAscending ? diff : -diff
        }
    })

    const totalPages = Math.ceil(sortedItems.length / itemsPerPage)
    const displayedItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div>
            <h3>
                Items for Sale{' '}
                <span style={{ float: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '400', color: 'rgb(255, 251, 0)' }}>
                        Weekly Limit Resets in {countdown}
                    </span>
                    <img
                        className="pixel"
                        src={Images.get(ItemsContent.getById('gold').image)}
                        alt="Gold"
                        style={{ width: '18px', height: '18px' }}
                    />{' '}
                    <span style={{ fontSize: '18px', fontWeight: '400' }}>
                        {Numbers.whole(state.inventory.find((item) => item.id === 'gold')?.amount ?? 0)}
                    </span>
                </span>
            </h3>
            <Input
                placeholder="Search items for sale..."
                style={{ marginBottom: '8px', marginTop: '8px' }}
                radius={0}
                onChange={(e) => {
                    setCurrentPage(1)
                    setSearch(e.target.value)
                }}
            />
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {categories.map((category) => (
                    <Button
                        key={category}
                        onClick={() => {
                            setSelectedCategory(category)
                            setCurrentPage(1)
                        }}
                        style={{
                            padding: '4px 8px',
                            fontSize: '18px',
                            backgroundColor: selectedCategory === category ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${
                                selectedCategory === category ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'
                            }`,
                            flex: category === 'All' ? 0.4 : 1,
                            height: '26px',
                        }}
                    >
                        {category === 'Consumable' ? 'Consume' : category}
                    </Button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                <Button
                    onClick={() => {
                        if (sortBy === 'name') {
                            setSortAscending(!sortAscending)
                        } else {
                            setSortBy('name')
                            setSortAscending(true)
                        }
                        setCurrentPage(1)
                    }}
                    style={{
                        padding: '4px 8px',
                        fontSize: '18px',
                        backgroundColor: sortBy === 'name' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${sortBy === 'name' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}`,
                        flex: 1,
                        height: '26px',
                    }}
                >
                    {`Sort: Name${sortBy === 'name' ? (sortAscending ? ' ↑' : ' ↓') : ''}`}
                </Button>
                <Button
                    onClick={() => {
                        if (sortBy === 'price') {
                            setSortAscending(!sortAscending)
                        } else {
                            setSortBy('price')
                            setSortAscending(true)
                        }
                        setCurrentPage(1)
                    }}
                    style={{
                        padding: '4px 8px',
                        fontSize: '18px',
                        backgroundColor: sortBy === 'price' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${sortBy === 'price' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}`,
                        flex: 1,
                        height: '26px',
                    }}
                >
                    {`Sort: Price${sortBy === 'price' ? (sortAscending ? ' ↑' : ' ↓') : ''}`}
                </Button>
            </div>
            <div style={{ height: '440px' }}>
                {displayedItems.map((item) => {
                    const itemMeta = ItemsContent.getById(item.id)
                    // Apply merchant discount for display
                    const basePrice = itemMeta.buyValue ?? 0
                    const adjustedPrice = Math.max(1, Math.floor(basePrice * (1 - discount / 100)))
                    return (
                        <MerchantButton
                            key={item.id}
                            state={state}
                            dispatch={dispatch}
                            id={item.id}
                            image={itemMeta.image}
                            label={itemMeta.name}
                            amount={adjustedPrice}
                            onClick={onSelect}
                            isSelected={selected === item.id}
                            weeklyLimit={itemMeta.weeklyLimit}
                            weeklyPurchased={itemMeta.weeklyLimit ? getWeeklyPurchaseCount(state, item.id) : undefined}
                        />
                    )
                })}
            </div>
            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
        </div>
    )
}

export default MerchantInventory

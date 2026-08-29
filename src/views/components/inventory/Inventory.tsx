import { StateProps } from '@engine/types'
import InventoryButton from './InventoryButton'
import ItemsContent from '@data/items'
import { Input } from '@mantine/core'
import { useState } from 'react'
import Pagination from '../common/Pagination'
import Button from '../common/Button'
import { ItemPrimaryType } from '@modules/inventory/types'
import * as UpgradeHelpers from '@modules/upgrades/helpers'

interface Props extends StateProps {
    selected?: string
    onSelect: (id: string) => void
}

type SortOption = 'name' | 'amount' | 'totalValue' | 'obtainedDate'

function InventorySelection({ state, dispatch, selected, onSelect }: Props) {
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<ItemPrimaryType | 'All'>('All')
    const [sortBy, setSortBy] = useState<SortOption>('name')
    const [sortAscending, setSortAscending] = useState<boolean>(true)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 11

    const categories: (ItemPrimaryType | 'All')[] = [
        'All',
        'Gathered',
        'Refined',
        'Sellable',
        'Container',
        'Consumable',
        'Currency',
    ]

    // Filter items and preserve original index for obtained date sorting
    const filteredItems = state.inventory
        .map((item, originalIndex) => ({ item, originalIndex }))
        .filter(({ item }) => {
            const itemMeta = ItemsContent.getById(item.id)
            const matchesSearch = !search || itemMeta.name.toLowerCase().includes(search.toLowerCase())
            const matchesCategory =
                selectedCategory === 'All' ||
                (selectedCategory === 'Sellable'
                    ? itemMeta.sellValue !== undefined && itemMeta.sellValue > 0
                    : itemMeta.type === selectedCategory)
            return matchesSearch && matchesCategory
        })

    // Sort items: favorites first, then by selected sort option
    const sortedItems = [...filteredItems].sort((a, b) => {
        const aIsFavorite = state.favoriteItems.includes(a.item.id)
        const bIsFavorite = state.favoriteItems.includes(b.item.id)

        if (aIsFavorite && !bIsFavorite) return -1
        if (!aIsFavorite && bIsFavorite) return 1

        if (sortBy === 'amount') {
            const diff = a.item.amount - b.item.amount
            return sortAscending ? diff : -diff
        } else if (sortBy === 'totalValue') {
            // Calculate total value (sellValue * amount) with gold bonus applied
            const goldBonus = UpgradeHelpers.getSellableGoldBonus(state.purchasedUpgrades)
            const aMeta = ItemsContent.getById(a.item.id)
            const bMeta = ItemsContent.getById(b.item.id)
            const aBaseSellValue = aMeta.sellValue ?? 0
            const bBaseSellValue = bMeta.sellValue ?? 0
            const aAdjustedSellValue = Math.floor(aBaseSellValue * (1 + goldBonus / 100))
            const bAdjustedSellValue = Math.floor(bBaseSellValue * (1 + goldBonus / 100))
            const aTotalValue = aAdjustedSellValue * a.item.amount
            const bTotalValue = bAdjustedSellValue * b.item.amount
            const diff = aTotalValue - bTotalValue
            return sortAscending ? diff : -diff
        } else if (sortBy === 'obtainedDate') {
            // Sort by original index in inventory array (order obtained)
            const diff = a.originalIndex - b.originalIndex
            return sortAscending ? diff : -diff
        } else {
            // Sort by name
            const aMeta = ItemsContent.getById(a.item.id)
            const bMeta = ItemsContent.getById(b.item.id)
            const diff = aMeta.name.localeCompare(bMeta.name)
            return sortAscending ? diff : -diff
        }
    })

    const totalPages = Math.ceil(sortedItems.length / itemsPerPage)
    const displayedItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div>
            <Input
                placeholder="Search your inventory..."
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
                        if (sortBy === 'amount') {
                            setSortAscending(!sortAscending)
                        } else {
                            setSortBy('amount')
                            setSortAscending(false)
                        }
                        setCurrentPage(1)
                    }}
                    style={{
                        padding: '4px 8px',
                        fontSize: '18px',
                        backgroundColor: sortBy === 'amount' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${sortBy === 'amount' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}`,
                        flex: 1,
                        height: '26px',
                    }}
                >
                    {`Sort: Amount${sortBy === 'amount' ? (sortAscending ? ' ↑' : ' ↓') : ''}`}
                </Button>
                <Button
                    onClick={() => {
                        if (sortBy === 'totalValue') {
                            setSortAscending(!sortAscending)
                        } else {
                            setSortBy('totalValue')
                            setSortAscending(false)
                        }
                        setCurrentPage(1)
                    }}
                    style={{
                        padding: '4px 8px',
                        fontSize: '18px',
                        backgroundColor: sortBy === 'totalValue' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${sortBy === 'totalValue' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}`,
                        flex: 1,
                        height: '26px',
                    }}
                >
                    {`Sort: Value${sortBy === 'totalValue' ? (sortAscending ? ' ↑' : ' ↓') : ''}`}
                </Button>
                <Button
                    onClick={() => {
                        if (sortBy === 'obtainedDate') {
                            setSortAscending(!sortAscending)
                        } else {
                            setSortBy('obtainedDate')
                            setSortAscending(true)
                        }
                        setCurrentPage(1)
                    }}
                    style={{
                        padding: '4px 8px',
                        fontSize: '18px',
                        backgroundColor: sortBy === 'obtainedDate' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${sortBy === 'obtainedDate' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}`,
                        flex: 1,
                        height: '26px',
                    }}
                >
                    {`Sort: Date${sortBy === 'obtainedDate' ? (sortAscending ? ' ↑' : ' ↓') : ''}`}
                </Button>
            </div>
            <div style={{ height: '442px' }}>
                {displayedItems.map(({ item }) => {
                    const itemMeta = ItemsContent.getById(item.id)
                    const isFavorite = state.favoriteItems.includes(item.id)
                    return (
                        <InventoryButton
                            key={item.id}
                            state={state}
                            dispatch={dispatch}
                            id={item.id}
                            image={itemMeta.image}
                            label={itemMeta.name}
                            amount={item.amount}
                            onClick={onSelect}
                            isFavorite={isFavorite}
                            isSelected={selected === item.id}
                        />
                    )
                })}
            </div>
            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
        </div>
    )
}

export default InventorySelection

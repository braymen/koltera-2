import { StateProps } from '@engine/types'
import ItemsContent from '@data/items'
import { Input } from '@mantine/core'
import { useState } from 'react'
import Pagination from '../common/Pagination'
import CreaturesContent from '@data/creatures'
import Images from '@utils/images'
import Sounds from '@utils/sounds'
import { isCreatureDiscoverable } from '@modules/collections/helpers'
import CollectionActions from '@modules/collections/dispatch'

interface Props extends StateProps {
    selected?: string
    onSelect: (string: string) => void
}

function CreatureSummon({ state, dispatch, selected, onSelect }: Props) {
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [animatingImage, setAnimatingImage] = useState<string | null>(null)
    const [filterTier, setFilterTier] = useState<number | null>(null)
    const itemsPerPage = 10

    const checkCreatureDiscoverable = (creature: (typeof CreaturesContent.get)[0]) => {
        return isCreatureDiscoverable(state, creature.id)
    }

    const unseenSummons = state.unseenSummons || []

    const filteredCreatures = CreaturesContent.get
        .filter((creature) => {
            if (search) {
                const creatureMeta = ItemsContent.getById(creature.id)
                const searchName = creatureMeta?.name || creature.name
                if (!searchName.toLowerCase().includes(search.toLowerCase())) return false
            }
            if (filterTier !== null && creature.tier !== filterTier) return false
            return true
        })
        .filter((creature) => !state.creatures.some((c) => c.species === creature.id))
        .map((creature) => ({
            creature,
            isDiscoverable: checkCreatureDiscoverable(creature),
        }))
        .sort((a, b) => {
            if (a.isDiscoverable && !b.isDiscoverable) return -1
            if (!a.isDiscoverable && b.isDiscoverable) return 1
            return 0
        })
        .map((item) => item.creature)

    const totalPages = Math.ceil(filteredCreatures.length / itemsPerPage)
    const creatures = filteredCreatures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const ownedSpecies = new Set(state.creatures.map((c) => c.species))
    const getTierColor = (tier: number) => {
        const tierCreatures = CreaturesContent.get.filter((c) => c.tier === tier)
        const summonedCount = tierCreatures.filter((c) => ownedSpecies.has(c.id)).length
        if (summonedCount === 0) return { base: 'rgba(200, 50, 50, 0.4)', selected: 'rgba(200, 50, 50, 0.7)' }
        if (summonedCount >= tierCreatures.length) return { base: 'rgba(50, 180, 50, 0.4)', selected: 'rgba(50, 180, 50, 0.7)' }
        return { base: 'rgba(200, 180, 50, 0.4)', selected: 'rgba(200, 180, 50, 0.7)' }
    }

    return (
        <div>
            <h3>Summon a Creature</h3>
            <Input
                placeholder="Search creatures to summon..."
                style={{ marginBottom: '4px', marginTop: '8px' }}
                radius={0}
                onChange={(e) => {
                    setCurrentPage(1)
                    setSearch(e.target.value)
                }}
            />

            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4, 5].map((tier) => (
                    <button
                        key={tier}
                        onClick={() => {
                            Sounds.play('click.wav')
                            setFilterTier(filterTier === tier ? null : tier)
                            setCurrentPage(1)
                        }}
                        style={{
                            flex: 1,
                            padding: '0px 8px',
                            backgroundColor: filterTier === tier ? getTierColor(tier).selected : getTierColor(tier).base,
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                    >
                        T{tier + 1}
                    </button>
                ))}
                <button
                    onClick={() => {
                        Sounds.play('click.wav')
                        setFilterTier(null)
                        setCurrentPage(1)
                    }}
                    style={{
                        flex: 1,
                        padding: '0px 8px',
                        backgroundColor: filterTier === null ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: '16px',
                        cursor: 'pointer',
                    }}
                >
                    All
                </button>
            </div>

            <div style={{ height: '454px' }}>
                {creatures.map((creature) => {
                    const isDiscoverable = checkCreatureDiscoverable(creature)
                    const isUnseen = unseenSummons.includes(creature.id)
                    return (
                        <div
                            onClick={() => {
                                if (!isDiscoverable) return
                                Sounds.play('click.wav')
                                setAnimatingImage(creature.id)
                                setTimeout(() => setAnimatingImage(null), 400)
                                CollectionActions.markCreatureSeen(dispatch, creature.id)
                                onSelect(creature.id)
                            }}
                            className="skill-focus-btn"
                            style={{
                                padding: '6.5px 2px',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: isDiscoverable ? 1 : 0.5,
                                cursor: isDiscoverable ? 'pointer' : 'not-allowed',
                                backgroundColor: selected === creature.id ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                borderLeft:
                                    selected === creature.id ? '3px solid rgba(255, 255, 255, 0.5)' : '3px solid transparent',
                            }}
                        >
                            <img
                                className={`pixel ${animatingImage === creature.id ? 'creature-bounce' : ''}`}
                                src={Images.get(creature.image)}
                                alt="Skill Icon"
                                style={{ width: '32px', height: '32px', marginRight: '8px', marginLeft: '4px' }}
                            />
                            <h3
                                style={{
                                    flexGrow: 1,
                                    fontSize: '18px',
                                    fontWeight: '400',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                {isDiscoverable ? creature.name : '???'}
                                {isUnseen ? (
                                    <span
                                        className="nav-badge-pulse"
                                        style={{
                                            backgroundColor: '#7408cc',
                                            color: 'white',
                                            fontSize: '12px',
                                            padding: '0px 4px',
                                            borderRadius: '0px',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        New Summon
                                    </span>
                                ) : (
                                    isDiscoverable &&
                                    creature.summoningCost.every((cost) => {
                                        const itemInstance = state.inventory.find((item) => item.id === cost.id)
                                        return itemInstance ? itemInstance.amount >= cost.amount : false
                                    }) && (
                                        <span
                                            className="nav-badge-pulse"
                                            style={{
                                                backgroundColor: '#0e9c34',
                                                color: 'white',
                                                fontSize: '12px',
                                                padding: '0px 4px',
                                                borderRadius: '0px',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            Can Summon
                                        </span>
                                    )
                                )}
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
                                <span style={{ fontSize: '16px', fontWeight: '400', textAlign: 'right' }}></span>
                            </div>
                        </div>
                    )
                })}
            </div>
            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
        </div>
    )
}

export default CreatureSummon

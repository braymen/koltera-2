import { StateProps } from '@engine/types'
import { Input } from '@mantine/core'
import { useState, useRef, useEffect } from 'react'
import Pagination from '../common/Pagination'
import CreaturesContent from '@data/creatures'
import TraitsContent from '@data/traits'
import Images from '@utils/images'
import Sounds from '@utils/sounds'
import { getCreatureLevel, getCreatureXpForLevel } from '@modules/creatures/helpers'
import { getCreatureIdsOnExpeditions } from '@modules/expeditions/helpers'
import { getCreatureIdsInDungeons } from '@modules/dungeons/helpers'
import ExpeditionsContent from '@data/expeditions'
import { Stats } from '@modules/creatures/types'
import AwakenedShine from '@components/creatures/AwakenedShine'
import Tooltip from '../common/Tooltip'

interface Props extends StateProps {
    selected?: string
    onSelect: (string: string) => void
}

type SortOption = 'level' | 'name' | 'power' | 'toughness' | 'agility' | 'intelligence' | 'gathering' | 'luck'
type SortDirection = 'asc' | 'desc'

function CreatureSummon({ state, dispatch, selected, onSelect }: Props) {
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [animatingImage, setAnimatingImage] = useState<string | null>(null)
    const [filterTier, setFilterTier] = useState<number | null>(null)
    const [filterTypes, setFilterTypes] = useState<Set<'Water' | 'Fire' | 'Earth' | 'Wind'>>(new Set())
    const [filterTrait, setFilterTrait] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<SortOption>('level')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const [filterUnawakened, setFilterUnawakened] = useState(false)
    const [filterNotBusy, setFilterNotBusy] = useState(false)
    const [traitDropdownOpen, setTraitDropdownOpen] = useState(false)
    const [jobDropdownOpen, setJobDropdownOpen] = useState(false)
    const [tierDropdownOpen, setTierDropdownOpen] = useState(false)
    const [typeDropdownOpen, setTypeDropdownOpen] = useState(false)
    const traitDropdownRef = useRef<HTMLDivElement>(null)
    const jobDropdownRef = useRef<HTMLDivElement>(null)
    const tierDropdownRef = useRef<HTMLDivElement>(null)
    const typeDropdownRef = useRef<HTMLDivElement>(null)
    const itemsPerPage = 9

    const creaturesOnExpeditions = new Set(getCreatureIdsOnExpeditions(state.activeExpeditions || []))
    const creaturesInDungeons = new Set(getCreatureIdsInDungeons(state.dungeons?.activeDungeons || []))
    const helperSpecies = new Set(state.helpers.map((h) => h.creatureId))
    const sanctuarySpecies = new Set(state.sanctuary || [])
    const machineSpecies = new Set(
        Object.values(state.machines?.machines || {})
            .filter((m) => m.assignedCreatureId)
            .map((m) => {
                const creature = state.creatures.find((c) => c.id === m.assignedCreatureId)
                return creature?.species
            })
            .filter((speciesId): speciesId is string => speciesId !== undefined)
    )

    const creatureExpeditionMap = new Map<string, string>()
    ;(state.activeExpeditions || []).forEach((exp) => {
        const expName = ExpeditionsContent.getById(exp.instance.expeditionTypeId)?.name || ''
        exp.creatures.forEach((cId) => creatureExpeditionMap.set(cId, expName))
    })

    const allTraits = Array.from(new Set(CreaturesContent.get.map((c) => c.trait))).sort((a, b) => {
        const nameA = TraitsContent.getById(a)?.name || a
        const nameB = TraitsContent.getById(b)?.name || b
        return nameA.localeCompare(nameB)
    })

    let filteredCreatures = CreaturesContent.get
        .filter((creature) => {
            // Must be owned
            if (!state.creatures.some((c) => c.species === creature.id)) return false

            // Search filter
            if (search && !creature.name.toLowerCase().includes(search.toLowerCase())) return false

            // Tier filter
            if (filterTier !== null && creature.tier !== filterTier) return false

            // Trait filter
            if (filterTrait && creature.trait !== filterTrait) return false

            // Type filter
            if (
                filterTypes.size > 0 &&
                !creature.types.some((t: string) => filterTypes.has(t as 'Water' | 'Fire' | 'Earth' | 'Wind'))
            )
                return false

            // Unawakened filter
            if (filterUnawakened) {
                const instance = state.creatures.find((c) => c.species === creature.id)
                if (instance?.awakened) return false
            }

            // Not busy filter
            if (filterNotBusy) {
                const instance = state.creatures.find((c) => c.species === creature.id)
                if (
                    instance &&
                    (creaturesOnExpeditions.has(instance.id) ||
                        creaturesInDungeons.has(instance.id) ||
                        helperSpecies.has(creature.id) ||
                        sanctuarySpecies.has(creature.id) ||
                        machineSpecies.has(creature.id))
                )
                    return false
            }

            return true
        })
        .map((creature) => ({
            content: creature,
            instance: state.creatures.find((c) => c.species === creature.id)!,
        }))

    // Sort
    filteredCreatures = [...filteredCreatures].sort((a, b) => {
        const levelA = getCreatureLevel(a.instance)
        const levelB = getCreatureLevel(b.instance)

        let comparison = 0

        switch (sortBy) {
            case 'level':
                comparison = levelA - levelB
                break
            case 'name':
                comparison = a.content.name.localeCompare(b.content.name)
                break
            case 'power':
            case 'toughness':
            case 'agility':
            case 'intelligence':
            case 'gathering':
            case 'luck': {
                const statA = (a.content.stats[sortBy as keyof Stats] || 0) * levelA
                const statB = (b.content.stats[sortBy as keyof Stats] || 0) * levelB
                comparison = statA - statB
                break
            }
        }

        return sortDirection === 'asc' ? comparison : -comparison
    })

    const totalPages = Math.ceil(filteredCreatures.length / itemsPerPage)
    const creatures = filteredCreatures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const isStatSort = ['power', 'toughness', 'agility', 'intelligence', 'gathering', 'luck'].includes(sortBy)

    const handleSortClick = (newSortBy: SortOption) => {
        if (sortBy === newSortBy) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(newSortBy)
            setSortDirection('desc')
        }
        setCurrentPage(1)
    }

    const getStatShortName = (stat: SortOption): string => {
        const shortNames: Record<SortOption, string> = {
            level: 'LVL',
            name: 'NAME',
            power: 'POW',
            toughness: 'GRT',
            agility: 'AGI',
            intelligence: 'SMT',
            gathering: 'LOT',
            luck: 'LCK',
        }
        return shortNames[stat]
    }

    const getStatDisplayName = (stat: SortOption): string => {
        const displayNames: Record<SortOption, string> = {
            level: 'Level',
            name: 'Name',
            power: 'Power',
            toughness: 'Grit',
            agility: 'Agility',
            intelligence: 'Smarts',
            gathering: 'Looting',
            luck: 'Luck',
        }
        return displayNames[stat]
    }

    const closeAllDropdownsExcept = (keep?: string) => {
        if (keep !== 'tier') setTierDropdownOpen(false)
        if (keep !== 'type') setTypeDropdownOpen(false)
        if (keep !== 'trait') setTraitDropdownOpen(false)
        if (keep !== 'stat') setJobDropdownOpen(false)
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (traitDropdownRef.current && !traitDropdownRef.current.contains(event.target as Node)) {
                setTraitDropdownOpen(false)
            }
            if (jobDropdownRef.current && !jobDropdownRef.current.contains(event.target as Node)) {
                setJobDropdownOpen(false)
            }
            if (tierDropdownRef.current && !tierDropdownRef.current.contains(event.target as Node)) {
                setTierDropdownOpen(false)
            }
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
                setTypeDropdownOpen(false)
            }
        }

        if (traitDropdownOpen || jobDropdownOpen || tierDropdownOpen || typeDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [traitDropdownOpen, jobDropdownOpen, tierDropdownOpen, typeDropdownOpen])

    return (
        <div>
            <h3>Creatures</h3>
            <Input
                placeholder="Search your creatures..."
                style={{ marginBottom: '4px', marginTop: '4px' }}
                radius={0}
                size="xs"
                onChange={(e) => {
                    setCurrentPage(1)
                    setSearch(e.target.value)
                }}
            />

            {/* Tier dropdown + Type dropdown */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                <div style={{ flex: 1.25, position: 'relative' }} ref={tierDropdownRef}>
                    <button
                        onClick={() => {
                            Sounds.play('click.wav')
                            closeAllDropdownsExcept('tier')
                            setTierDropdownOpen(!tierDropdownOpen)
                        }}
                        style={{
                            padding: '0px 8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            textAlign: 'left',
                        }}
                    >
                        <span>{filterTier !== null ? `Tier ${filterTier + 1}` : 'All Tiers'}</span>
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
                    </button>
                    {tierDropdownOpen && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderTop: 'none',
                                zIndex: 1000,
                                maxHeight: '200px',
                                overflowY: 'auto',
                                marginTop: '1px',
                            }}
                        >
                            <div
                                onClick={() => {
                                    Sounds.play('click.wav')
                                    setFilterTier(null)
                                    setCurrentPage(1)
                                    setTierDropdownOpen(false)
                                }}
                                style={{
                                    padding: '0px 12px',
                                    backgroundColor: filterTier === null ? 'rgba(100, 181, 246, 0.3)' : 'transparent',
                                    color: 'white',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                                onMouseEnter={(e) => {
                                    if (filterTier !== null) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    if (filterTier !== null) e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                All
                            </div>
                            {[0, 1, 2, 3, 4, 5].map((tier) => {
                                const isSelected = filterTier === tier
                                return (
                                    <div
                                        key={tier}
                                        onClick={() => {
                                            Sounds.play('click.wav')
                                            setFilterTier(tier)
                                            setCurrentPage(1)
                                            setTierDropdownOpen(false)
                                        }}
                                        style={{
                                            padding: '0px 12px',
                                            backgroundColor: isSelected ? 'rgba(100, 181, 246, 0.3)' : 'transparent',
                                            color: 'white',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                                        }}
                                    >
                                        Tier {tier + 1}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div style={{ flex: 2, position: 'relative' }} ref={typeDropdownRef}>
                    <button
                        onClick={() => {
                            Sounds.play('click.wav')
                            closeAllDropdownsExcept('type')
                            setTypeDropdownOpen(!typeDropdownOpen)
                        }}
                        style={{
                            padding: '0px 8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            textAlign: 'left',
                        }}
                    >
                        <span>{filterTypes.size === 0 ? 'All Types' : Array.from(filterTypes).join(', ')}</span>
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
                    </button>
                    {typeDropdownOpen && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderTop: 'none',
                                zIndex: 1000,
                                maxHeight: '200px',
                                overflowY: 'auto',
                                marginTop: '1px',
                            }}
                        >
                            <div
                                onClick={() => {
                                    Sounds.play('click.wav')
                                    setFilterTypes(new Set())
                                    setCurrentPage(1)
                                    setTypeDropdownOpen(false)
                                }}
                                style={{
                                    padding: '0px 12px',
                                    backgroundColor: filterTypes.size === 0 ? 'rgba(100, 181, 246, 0.3)' : 'transparent',
                                    color: 'white',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                                onMouseEnter={(e) => {
                                    if (filterTypes.size > 0) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    if (filterTypes.size > 0) e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                All Types
                            </div>
                            {(['Water', 'Fire', 'Earth', 'Wind'] as const).map((type) => {
                                const isSelected = filterTypes.has(type)
                                return (
                                    <div
                                        key={type}
                                        onClick={() => {
                                            Sounds.play('click.wav')
                                            setFilterTypes((prev) => {
                                                const next = new Set(prev)
                                                if (next.has(type)) {
                                                    next.delete(type)
                                                } else {
                                                    next.add(type)
                                                }
                                                if (next.size >= 4) return new Set()
                                                return next
                                            })
                                            setCurrentPage(1)
                                        }}
                                        style={{
                                            padding: '0px 12px',
                                            backgroundColor: isSelected ? 'rgba(100, 181, 246, 0.3)' : 'transparent',
                                            color: 'white',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                                        }}
                                    >
                                        {type}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Trait dropdown (2/3) + Stat sort dropdown (1/3) */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                <div style={{ flex: 2, position: 'relative' }} ref={traitDropdownRef}>
                    <button
                        onClick={() => {
                            Sounds.play('click.wav')
                            closeAllDropdownsExcept('trait')
                            setTraitDropdownOpen(!traitDropdownOpen)
                        }}
                        style={{
                            padding: '0px 8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            textAlign: 'left',
                        }}
                    >
                        <span>{filterTrait ? TraitsContent.getById(filterTrait)?.name || filterTrait : 'All Traits'}</span>
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
                    </button>
                    {traitDropdownOpen && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderTop: 'none',
                                zIndex: 1000,
                                maxHeight: '200px',
                                overflowY: 'auto',
                                marginTop: '1px',
                            }}
                        >
                            <div
                                onClick={() => {
                                    Sounds.play('click.wav')
                                    setFilterTrait(null)
                                    setCurrentPage(1)
                                    setTraitDropdownOpen(false)
                                }}
                                style={{
                                    padding: '0px 12px',
                                    backgroundColor: filterTrait === null ? 'rgba(100, 181, 246, 0.3)' : 'transparent',
                                    color: 'white',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                                onMouseEnter={(e) => {
                                    if (filterTrait !== null) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (filterTrait !== null) {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                    }
                                }}
                            >
                                All Traits
                            </div>
                            {allTraits.map((traitId) => {
                                const trait = TraitsContent.getById(traitId)
                                const isSelected = filterTrait === traitId
                                return (
                                    <div
                                        key={traitId}
                                        onClick={() => {
                                            Sounds.play('click.wav')
                                            setFilterTrait(traitId)
                                            setCurrentPage(1)
                                            setTraitDropdownOpen(false)
                                        }}
                                        style={{
                                            padding: '0px 12px',
                                            backgroundColor: isSelected ? 'rgba(100, 181, 246, 0.3)' : 'transparent',
                                            color: 'white',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.backgroundColor = 'transparent'
                                            }
                                        }}
                                    >
                                        {trait?.name || traitId}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, position: 'relative' }} ref={jobDropdownRef}>
                    <button
                        onClick={() => {
                            Sounds.play('click.wav')
                            closeAllDropdownsExcept('stat')
                            setJobDropdownOpen(!jobDropdownOpen)
                        }}
                        style={{
                            padding: '0px 8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            textAlign: 'left',
                        }}
                    >
                        <span>{isStatSort ? getStatDisplayName(sortBy) : 'Stat'}</span>
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
                    </button>
                    {jobDropdownOpen && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderTop: 'none',
                                zIndex: 1000,
                                maxHeight: '200px',
                                overflowY: 'auto',
                                marginTop: '1px',
                            }}
                        >
                            <div
                                onClick={() => {
                                    Sounds.play('click.wav')
                                    if (isStatSort) setSortBy('level')
                                    setJobDropdownOpen(false)
                                    setCurrentPage(1)
                                }}
                                style={{
                                    padding: '0px 12px',
                                    backgroundColor: !isStatSort ? 'rgba(100, 181, 246, 0.3)' : 'transparent',
                                    color: 'white',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                                onMouseEnter={(e) => {
                                    if (isStatSort) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isStatSort) {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                    }
                                }}
                            >
                                No Stat
                            </div>
                            {(['power', 'toughness', 'agility', 'intelligence', 'gathering', 'luck'] as SortOption[]).map(
                                (option) => {
                                    const isSelected = sortBy === option
                                    return (
                                        <div
                                            key={option}
                                            onClick={() => {
                                                Sounds.play('click.wav')
                                                handleSortClick(option)
                                                setJobDropdownOpen(false)
                                            }}
                                            style={{
                                                padding: '0px 12px',
                                                backgroundColor: isSelected ? 'rgba(100, 181, 246, 0.3)' : 'transparent',
                                                color: 'white',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.backgroundColor = 'transparent'
                                                }
                                            }}
                                        >
                                            {getStatDisplayName(option)}
                                        </div>
                                    )
                                }
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Sort: LVL + NAME */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                <button
                    onClick={() => handleSortClick('level')}
                    style={{
                        flex: 1,
                        padding: '0px 8px',
                        backgroundColor: sortBy === 'level' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: '14px',
                        cursor: 'pointer',
                    }}
                >
                    Level
                </button>
                <button
                    onClick={() => handleSortClick('name')}
                    style={{
                        flex: 1,
                        padding: '0px 8px',
                        backgroundColor: sortBy === 'name' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: '14px',
                        cursor: 'pointer',
                    }}
                >
                    Name
                </button>
            </div>

            {/* Checkbox filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '14px',
                        color: 'white',
                        cursor: 'pointer',
                    }}
                >
                    <input
                        type="checkbox"
                        checked={filterUnawakened}
                        onChange={() => {
                            setFilterUnawakened(!filterUnawakened)
                            setCurrentPage(1)
                        }}
                        style={{ cursor: 'pointer' }}
                    />
                    Unawakened
                </label>
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '14px',
                        color: 'white',
                        cursor: 'pointer',
                    }}
                >
                    <input
                        type="checkbox"
                        checked={filterNotBusy}
                        onChange={() => {
                            setFilterNotBusy(!filterNotBusy)
                            setCurrentPage(1)
                        }}
                        style={{ cursor: 'pointer' }}
                    />
                    Not Busy
                </label>
            </div>

            <div style={{ height: '416px' }}>
                {creatures.length > 0 ? (
                    creatures.map(({ content: creature, instance: creatureInstance }) => {
                        const creatureLevel = getCreatureLevel(creatureInstance)

                        let displayText = `Lvl ${creatureLevel}`
                        if (isStatSort) {
                            const baseStat = creature.stats[sortBy as keyof Stats] ?? 0
                            const scaledStat = baseStat * creatureLevel
                            const fullStatName = getStatDisplayName(sortBy)
                            displayText = `${fullStatName} ${scaledStat}`
                        }

                        return (
                            <div
                                key={creature.id}
                                onClick={() => {
                                    Sounds.play('click.wav')
                                    setAnimatingImage(creature.id)
                                    setTimeout(() => setAnimatingImage(null), 400)
                                    onSelect(creature.id)
                                }}
                                className="skill-focus-btn"
                                style={{
                                    padding: '7.4px 2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    backgroundColor: selected === creature.id ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                    borderLeft:
                                        selected === creature.id ? '3px solid rgba(255, 255, 255, 0.5)' : '3px solid transparent',
                                    position: 'relative',
                                }}
                            >
                                <div
                                    className={`${creatureInstance.awakened ? 'creature-awakened' : ''} ${
                                        animatingImage === creature.id ? 'creature-bounce' : ''
                                    }`}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        marginRight: '8px',
                                        marginLeft: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {creatureInstance.awakened && <AwakenedShine image={creature.image} />}
                                    <img
                                        className="pixel"
                                        src={Images.get(creature.image)}
                                        alt="Skill Icon"
                                        style={{ width: '32px', height: '32px' }}
                                    />
                                </div>
                                <div
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <h3
                                        className={creatureInstance.awakened ? 'creature-name-awakened' : ''}
                                        style={{ fontSize: '16px', fontWeight: '400', marginLeft: '4px' }}
                                    >
                                        {creature.name}
                                    </h3>
                                    <div style={{ marginLeft: '-4px', marginBottom: '5px' }}>
                                        {(creaturesOnExpeditions.has(creatureInstance.id) ||
                                            creaturesInDungeons.has(creatureInstance.id) ||
                                            helperSpecies.has(creature.id) ||
                                            sanctuarySpecies.has(creature.id) ||
                                            machineSpecies.has(creature.id)) && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '6px' }}>
                                                {creaturesOnExpeditions.has(creatureInstance.id) && (
                                                    <Tooltip
                                                        inline
                                                        width="auto"
                                                        content={
                                                            <span style={{ fontSize: '18px', whiteSpace: 'nowrap' }}>
                                                                {creatureExpeditionMap.get(creatureInstance.id) ||
                                                                    'On Expedition'}
                                                            </span>
                                                        }
                                                    >
                                                        <img
                                                            src={Images.get('icons/expeditions.png')}
                                                            alt="On Expedition"
                                                            style={{ width: '14px', height: '14px', opacity: 0.7 }}
                                                        />
                                                    </Tooltip>
                                                )}
                                                {helperSpecies.has(creature.id) && (
                                                    <img
                                                        src={Images.get('icons/helpers.png')}
                                                        alt="Helper"
                                                        style={{ width: '14px', height: '14px', opacity: 0.7 }}
                                                    />
                                                )}
                                                {sanctuarySpecies.has(creature.id) && (
                                                    <img
                                                        src={Images.get('icons/sanctuary.png')}
                                                        alt="In Sanctuary"
                                                        style={{ width: '14px', height: '14px', opacity: 0.7 }}
                                                    />
                                                )}
                                                {machineSpecies.has(creature.id) && (
                                                    <img
                                                        src={Images.get('icons/machines.png')}
                                                        alt="On Machine"
                                                        style={{ width: '14px', height: '14px', opacity: 0.7 }}
                                                    />
                                                )}
                                                {creaturesInDungeons.has(creatureInstance.id) && (
                                                    <img
                                                        src={Images.get('icons/dungeons.png')}
                                                        alt="In Dungeon"
                                                        style={{ width: '14px', height: '14px', opacity: 0.7 }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }} />
                                    <div
                                        style={{
                                            paddingRight: '8px',
                                            fontSize: '16px',
                                            fontWeight: '400',
                                            display: 'flex',
                                            justifyContent: 'space-evenly',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        {creatureInstance.awakened && (
                                            <span style={{ color: '#ff1493', fontSize: '16px' }}>★</span>
                                        )}
                                        <span style={{ fontSize: '16px', fontWeight: '400', textAlign: 'right' }}>
                                            {displayText}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 4,
                                            right: 8,
                                            height: '4px',
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${(() => {
                                                    const level = getCreatureLevel(creatureInstance)
                                                    const maxLevel = creatureInstance.awakened ? 120 : 70
                                                    if (level >= maxLevel) return 100
                                                    if (state.settings.creatureProgressTowardsCap)
                                                        return Math.min(level / maxLevel, 1) * 100
                                                    const xpCurrentLevel = getCreatureXpForLevel(level)
                                                    const xpNextLevel = getCreatureXpForLevel(level + 1)
                                                    return Math.min(
                                                        ((creatureInstance.experience - xpCurrentLevel) /
                                                            (xpNextLevel - xpCurrentLevel)) *
                                                            100,
                                                        100
                                                    )
                                                })()}%`,
                                                backgroundColor:
                                                    creatureInstance.awakened && getCreatureLevel(creatureInstance) >= 120
                                                        ? '#ff1493'
                                                        : !creatureInstance.awakened && getCreatureLevel(creatureInstance) >= 70
                                                          ? '#ffd700'
                                                          : 'white',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No creatures found</div>
                )}
            </div>
            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
        </div>
    )
}

export default CreatureSummon

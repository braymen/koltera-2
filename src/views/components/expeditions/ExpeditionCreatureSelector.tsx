import { StateProps } from '@engine/types'
import CreaturesContent from '@data/creatures'
import Images from '@utils/images'
import { getCreatureIdsOnExpeditions, generateExpedition } from '@modules/expeditions/helpers'
import { getCreatureIdsInDungeons } from '@modules/dungeons/helpers'
import { Input } from '@mantine/core'
import { useState, useMemo, useRef, useEffect } from 'react'
import Pagination from '../common/Pagination'
import Sounds from '@utils/sounds'
import SkillContent from '@data/skills'
import Tooltip from '../common/Tooltip'
import { Stats } from '@modules/creatures/types'
import CreatureTooltip from '../creatures/CreatureTooltip'
import ExpeditionsContent from '@data/expeditions'
import TraitsContent from '@data/traits'
import { getCreatureLevel, getCreatureXpForLevel } from '@modules/creatures/helpers'
import AwakenedShine from '@components/creatures/AwakenedShine'

interface Props extends StateProps {
    onSelect: (creatureId: string) => void
    selectedExpeditionTypeId: string | null | undefined
    selectedSlot: number | null
    currentPartyCreatureIds: (string | null)[]
}

type ElementType = 'Water' | 'Fire' | 'Earth' | 'Wind'
type FilterTrait = string | null

type SortOption = 'level' | 'power' | 'toughness' | 'agility' | 'intelligence' | 'gathering' | 'luck'
type SortDirection = 'asc' | 'desc'

function ExpeditionCreatureSelector({ state, onSelect, selectedExpeditionTypeId, selectedSlot, currentPartyCreatureIds }: Props) {
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [animatingImage, setAnimatingImage] = useState<string | null>(null)
    const [filterTypes, setFilterTypes] = useState<Set<ElementType>>(new Set())
    const [filterTrait, setFilterTrait] = useState<FilterTrait>(null)
    const [sortBy, setSortBy] = useState<SortOption>('level')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const [traitDropdownOpen, setTraitDropdownOpen] = useState(false)
    const traitDropdownRef = useRef<HTMLDivElement>(null)
    const itemsPerPage = 9

    const expeditionType = selectedExpeditionTypeId ? ExpeditionsContent.getById(selectedExpeditionTypeId) : null

    const selectedTier = (selectedExpeditionTypeId && state.expeditionTierSelections?.[selectedExpeditionTypeId]) || 1

    const expeditionInstance = useMemo(() => {
        if (!expeditionType) return null

        const activeExpedition = (state.activeExpeditions || []).find(
            (exp) => exp.instance.expeditionTypeId === selectedExpeditionTypeId && !exp.completed
        )

        if (activeExpedition) {
            return activeExpedition.instance
        }

        return selectedExpeditionTypeId ? generateExpedition(selectedTier, selectedExpeditionTypeId) : null
    }, [expeditionType, selectedExpeditionTypeId, selectedTier, state.activeExpeditions])

    const creaturesOnExpeditions = getCreatureIdsOnExpeditions(state.activeExpeditions || [])
    const creaturesOnExpeditionsSet = new Set(creaturesOnExpeditions)

    const creaturesInDungeons = getCreatureIdsInDungeons(state.dungeons?.activeDungeons || [])
    const creaturesInDungeonsSet = new Set(creaturesInDungeons)

    const helperMap = new Map<string, { skillId: string }>()
    state.helpers.forEach((helper) => {
        helperMap.set(helper.creatureId, { skillId: helper.skillId })
    })

    const sanctuarySpeciesIds = new Set(state.sanctuary)

    const machineCreatureIds = new Set(
        Object.values(state.machines?.machines || {})
            .filter((m) => m.assignedCreatureId)
            .map((m) => m.assignedCreatureId!)
    )

    const partyCreatureIds = currentPartyCreatureIds.filter((id): id is string => id !== null)
    const allCreatures = state.creatures.filter((creature) => {
        const isInParty = partyCreatureIds.includes(creature.id)
        return !isInParty
    })

    let filteredCreatures = allCreatures.filter((creature) => {
        const creatureContent = CreaturesContent.getById(creature.species)

        // Search filter
        if (search && !creatureContent.name.toLowerCase().includes(search.toLowerCase())) {
            return false
        }

        // Type filter (multi-select: creature must match at least one selected type)
        if (filterTypes.size > 0 && !creatureContent.types.some((t: string) => filterTypes.has(t as ElementType))) {
            return false
        }

        // Trait filter
        if (filterTrait && creatureContent.trait !== filterTrait) {
            return false
        }

        return true
    })

    filteredCreatures = [...filteredCreatures].sort((a, b) => {
        const creatureContentA = CreaturesContent.getById(a.species)
        const creatureContentB = CreaturesContent.getById(b.species)

        if (!creatureContentA && !creatureContentB) return 0
        if (!creatureContentA) return 1
        if (!creatureContentB) return -1

        const levelA = getCreatureLevel(a)
        const levelB = getCreatureLevel(b)

        let comparison = 0

        switch (sortBy) {
            case 'level':
                comparison = levelA - levelB
                break
            case 'power': {
                const statA = (creatureContentA.stats.power || 0) * levelA
                const statB = (creatureContentB.stats.power || 0) * levelB
                comparison = statA - statB
                break
            }
            case 'toughness': {
                const statA = (creatureContentA.stats.toughness || 0) * levelA
                const statB = (creatureContentB.stats.toughness || 0) * levelB
                comparison = statA - statB
                break
            }
            case 'agility': {
                const statA = (creatureContentA.stats.agility || 0) * levelA
                const statB = (creatureContentB.stats.agility || 0) * levelB
                comparison = statA - statB
                break
            }
            case 'intelligence': {
                const statA = (creatureContentA.stats.intelligence || 0) * levelA
                const statB = (creatureContentB.stats.intelligence || 0) * levelB
                comparison = statA - statB
                break
            }
            case 'gathering': {
                const statA = (creatureContentA.stats.gathering || 0) * levelA
                const statB = (creatureContentB.stats.gathering || 0) * levelB
                comparison = statA - statB
                break
            }
            case 'luck': {
                const statA = (creatureContentA.stats.luck || 0) * levelA
                const statB = (creatureContentB.stats.luck || 0) * levelB
                comparison = statA - statB
                break
            }
        }

        const statComparison = sortDirection === 'asc' ? comparison : -comparison
        const aUnavailable = creaturesOnExpeditionsSet.has(a.id) || creaturesInDungeonsSet.has(a.id) || helperMap.has(a.species) || sanctuarySpeciesIds.has(a.species) || machineCreatureIds.has(a.id)
        const bUnavailable = creaturesOnExpeditionsSet.has(b.id) || creaturesInDungeonsSet.has(b.id) || helperMap.has(b.species) || sanctuarySpeciesIds.has(b.species) || machineCreatureIds.has(b.id)
        if (aUnavailable !== bUnavailable) return Number(aUnavailable) - Number(bUnavailable)
        return statComparison
    })

    const totalPages = Math.ceil(filteredCreatures.length / itemsPerPage)
    const displayedCreatures = filteredCreatures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const allTypes: ('Water' | 'Fire' | 'Earth' | 'Wind')[] = ['Water', 'Fire', 'Earth', 'Wind']
    const allTraits = Array.from(new Set(CreaturesContent.get.map((c) => c.trait))).sort((a, b) => {
        const nameA = TraitsContent.getById(a)?.name || a
        const nameB = TraitsContent.getById(b)?.name || b
        return nameA.localeCompare(nameB)
    })

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (traitDropdownRef.current && !traitDropdownRef.current.contains(event.target as Node)) {
                setTraitDropdownOpen(false)
            }
        }

        if (traitDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [traitDropdownOpen])

    const isStatSort = ['power', 'toughness', 'agility', 'intelligence', 'gathering', 'luck'].includes(sortBy)

    if (!selectedExpeditionTypeId) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3>Select Creature</h3>
                <div
                    style={{
                        color: '#888',
                        textAlign: 'center',
                        padding: '20px',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                    }}
                >
                    Select an expedition and a party slot to choose creatures.
                </div>
            </div>
        )
    }

    // Check if party is full (all slots filled)
    const isPartyFull = currentPartyCreatureIds.every((id) => id !== null)

    if (isPartyFull) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3>Select Creature</h3>
                <div
                    style={{
                        color: '#888',
                        textAlign: 'center',
                        padding: '20px',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                    }}
                >
                    Party is full. Remove a Creature in your party to make room.
                </div>
            </div>
        )
    }

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
            power: 'Power',
            toughness: 'Grit',
            agility: 'Agility',
            intelligence: 'Smarts',
            gathering: 'Looting',
            luck: 'Luck',
        }
        return displayNames[stat]
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3>Select Creature</h3>
            <Input
                placeholder="Search creatures..."
                style={{ marginBottom: '8px', marginTop: '8px' }}
                radius={0}
                onChange={(e) => {
                    setCurrentPage(1)
                    setSearch(e.target.value)
                }}
            />

            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => {
                        Sounds.play('click.wav')
                        setFilterTypes(new Set())
                        setCurrentPage(1)
                    }}
                    style={{
                        flex: 1,
                        padding: '0px 8px',
                        backgroundColor: filterTypes.size === 0 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: '16px',
                        cursor: 'pointer',
                    }}
                >
                    All
                </button>
                {allTypes.map((type) => (
                    <button
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
                                return next
                            })
                            setCurrentPage(1)
                        }}
                        style={{
                            flex: 1,
                            padding: '0px 8px',
                            backgroundColor: filterTypes.has(type) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div style={{ marginBottom: '8px', position: 'relative' }} ref={traitDropdownRef}>
                <button
                    onClick={() => {
                        Sounds.play('click.wav')
                        setTraitDropdownOpen(!traitDropdownOpen)
                    }}
                    style={{
                        padding: '0px 8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: '16px',
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
                                fontSize: '16px',
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
                                        fontSize: '16px',
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

            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => handleSortClick('level')}
                    style={{
                        flex: 1,
                        padding: '4px 8px',
                        backgroundColor: sortBy === 'level' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: '16px',
                        cursor: 'pointer',
                    }}
                >
                    LVL
                </button>
                {(['power', 'toughness', 'agility', 'intelligence', 'gathering', 'luck'] as SortOption[]).map((option) => (
                    <button
                        key={option}
                        onClick={() => handleSortClick(option)}
                        style={{
                            flex: 1,
                            padding: '4px 8px',
                            backgroundColor: sortBy === option ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                    >
                        {getStatShortName(option)}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                {displayedCreatures.length > 0 ? (
                    displayedCreatures.map((creature) => {
                        const creatureContent = CreaturesContent.getById(creature.species)
                        const creatureLevel = getCreatureLevel(creature)
                        const helperInfo = helperMap.get(creature.species)
                        const isHelper = !!helperInfo
                        const isOnExpedition = creaturesOnExpeditionsSet.has(creature.id)
                        const isInDungeon = creaturesInDungeonsSet.has(creature.id)
                        const isInSanctuary = sanctuarySpeciesIds.has(creature.species)
                        const skillData = helperInfo ? SkillContent.getById(helperInfo.skillId) : null
                        const isOnMachine = machineCreatureIds.has(creature.id)
                        const isUnavailable = isHelper || isOnExpedition || isInDungeon || isInSanctuary || isOnMachine

                        let displayText = `Level ${creatureLevel}`
                        if (isOnExpedition) {
                            displayText = 'On Expedition'
                        } else if (isInDungeon) {
                            displayText = 'In Dungeon'
                        } else if (isHelper && skillData) {
                            displayText = `Helping: ${skillData.id}`
                        } else if (isInSanctuary) {
                            displayText = 'In Sanctuary'
                        } else if (isOnMachine) {
                            displayText = 'On Machine'
                        } else if (isStatSort && !isUnavailable) {
                            const baseStat = creatureContent.stats[sortBy as keyof Stats] ?? 0
                            const scaledStat = baseStat * creatureLevel
                            const fullStatName = getStatDisplayName(sortBy)
                            displayText = `${fullStatName} ${scaledStat}`
                        }
                        const showAwakenedStar = !isUnavailable && creature.awakened

                        return (
                            <Tooltip
                                key={creature.id}
                                content={
                                    <CreatureTooltip
                                        creature={creature}
                                        creatureContent={creatureContent}
                                        expeditionType={expeditionType}
                                        expeditionInstance={expeditionInstance}
                                    />
                                }
                            >
                                <div
                                    onClick={() => {
                                        if (!isUnavailable) {
                                            setAnimatingImage(creature.id)
                                            setTimeout(() => setAnimatingImage(null), 400)
                                            Sounds.play('click.wav')
                                            onSelect(creature.id)
                                        }
                                    }}
                                    className="skill-focus-btn"
                                    style={{
                                        padding: '8px 2px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: isUnavailable ? 0.5 : 1,
                                        cursor: isUnavailable ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    <div
                                        className={`${creature.awakened ? 'creature-awakened' : ''} ${
                                            animatingImage === creature.id ? 'creature-bounce' : ''
                                        }`}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            marginRight: '8px',
                                            marginLeft: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {creature.awakened && <AwakenedShine image={creatureContent.image} />}
                                        <img
                                            className="pixel"
                                            src={Images.get(creatureContent.image)}
                                            alt="Creature"
                                            style={{ width: '24px', height: '24px' }}
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
                                            className={creature.awakened ? 'creature-name-awakened' : ''}
                                            style={{ flexGrow: 1, fontSize: '16px', fontWeight: '400' }}
                                        >
                                            {creatureContent.name}
                                        </h3>
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
                                            {showAwakenedStar && <span style={{ color: '#ff1493', fontSize: '16px' }}>★</span>}
                                            <span style={{ fontSize: '16px', fontWeight: '400', textAlign: 'right' }}>
                                                {displayText}
                                            </span>
                                        </div>
                                        {!isUnavailable && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 8,
                                                    height: '4px',
                                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        height: '100%',
                                                        width: `${(() => {
                                                            const maxLevel = creature.awakened ? 120 : 70
                                                            if (creatureLevel >= maxLevel) return 100
                                                            if (state.settings.creatureProgressTowardsCap)
                                                                return Math.min(creatureLevel / maxLevel, 1) * 100
                                                            const xpCurrentLevel = getCreatureXpForLevel(creatureLevel)
                                                            const xpNextLevel = getCreatureXpForLevel(creatureLevel + 1)
                                                            return Math.min(
                                                                ((creature.experience - xpCurrentLevel) /
                                                                    (xpNextLevel - xpCurrentLevel)) *
                                                                    100,
                                                                100
                                                            )
                                                        })()}%`,
                                                        backgroundColor:
                                                            creature.awakened && creatureLevel >= 120
                                                                ? '#ff1493'
                                                                : !creature.awakened && creatureLevel >= 70
                                                                  ? '#ffd700'
                                                                  : 'white',
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Tooltip>
                        )
                    })
                ) : (
                    <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                        {allCreatures.length === 0
                            ? 'No available creatures. All creatures are either on expeditions, assigned as helpers, or in sanctuary.'
                            : 'No creatures found'}
                    </div>
                )}
            </div>
            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
        </div>
    )
}

export default ExpeditionCreatureSelector

import { StateProps } from '@engine/types'
import CreaturesContent from '@data/creatures'
import Images from '@utils/images'
import { getCreatureIdsOnExpeditions } from '@modules/expeditions/helpers'
import { getCreatureIdsInDungeons } from '@modules/dungeons/helpers'
import { Input } from '@mantine/core'
import { useState, useMemo } from 'react'
import Pagination from '../common/Pagination'
import Sounds from '@utils/sounds'
import SkillContent from '@data/skills'
import Tooltip from '../common/Tooltip'
import CreatureTooltip from '../creatures/CreatureTooltip'
import { getCreatureLevel, getCreatureXpForLevel } from '@modules/creatures/helpers'
import AwakenedShine from '@components/creatures/AwakenedShine'
import { calculateStatScore } from '@modules/expeditions/helpers'
import DungeonConfig from '@configs/dungeons'

interface Props extends StateProps {
    onSelect: (creatureId: string) => void
    selectedSlot: number | null
    currentPartyCreatureIds: (string | null)[]
}

type SortOption = 'level' | 'combat' | 'gathering'
type SortDirection = 'asc' | 'desc'

function DungeonCreatureSelector({ state, onSelect, selectedSlot, currentPartyCreatureIds }: Props) {
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [animatingImage, setAnimatingImage] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<SortOption>('level')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const itemsPerPage = 11

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

    const combatWeights = DungeonConfig.STAT_WEIGHTS['combat']
    const gatheringWeights = DungeonConfig.STAT_WEIGHTS['gathering']

    const getCreatureCombatScore = (creature: (typeof allCreatures)[0]) => {
        const creatureContent = CreaturesContent.getById(creature.species)
        if (!creatureContent) return 0
        return calculateStatScore(creatureContent, getCreatureLevel(creature), combatWeights)
    }

    const getCreatureGatheringScore = (creature: (typeof allCreatures)[0]) => {
        const creatureContent = CreaturesContent.getById(creature.species)
        if (!creatureContent) return 0
        return calculateStatScore(creatureContent, getCreatureLevel(creature), gatheringWeights)
    }

    let filteredCreatures = allCreatures.filter((creature) => {
        const creatureContent = CreaturesContent.getById(creature.species)
        if (search && !creatureContent.name.toLowerCase().includes(search.toLowerCase())) {
            return false
        }
        return true
    })

    filteredCreatures = [...filteredCreatures].sort((a, b) => {
        let comparison = 0

        switch (sortBy) {
            case 'level':
                comparison = getCreatureLevel(a) - getCreatureLevel(b)
                break
            case 'combat':
                comparison = getCreatureCombatScore(a) - getCreatureCombatScore(b)
                break
            case 'gathering':
                comparison = getCreatureGatheringScore(a) - getCreatureGatheringScore(b)
                break
        }

        const statComparison = sortDirection === 'asc' ? comparison : -comparison
        const aUnavailable =
            creaturesOnExpeditionsSet.has(a.id) ||
            creaturesInDungeonsSet.has(a.id) ||
            helperMap.has(a.species) ||
            sanctuarySpeciesIds.has(a.species) ||
            machineCreatureIds.has(a.id)
        const bUnavailable =
            creaturesOnExpeditionsSet.has(b.id) ||
            creaturesInDungeonsSet.has(b.id) ||
            helperMap.has(b.species) ||
            sanctuarySpeciesIds.has(b.species) ||
            machineCreatureIds.has(b.id)
        if (aUnavailable !== bUnavailable) return Number(aUnavailable) - Number(bUnavailable)
        return statComparison
    })

    const totalPages = Math.ceil(filteredCreatures.length / itemsPerPage)
    const displayedCreatures = filteredCreatures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
                        fontSize: '18px',
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

            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {(['level', 'combat', 'gathering'] as SortOption[]).map((option) => (
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
                            textTransform: 'capitalize',
                        }}
                    >
                        {option}
                        {/* {sortBy === option && (
                            <span style={{ marginLeft: '4px', fontSize: '12px', opacity: 0.7 }}>
                                {sortDirection === 'desc' ? 'v' : '^'}
                            </span>
                        )} */}
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
                        } else if (sortBy === 'combat') {
                            displayText = `Combat ${getCreatureCombatScore(creature)}`
                        } else if (sortBy === 'gathering') {
                            displayText = `Gathering ${getCreatureGatheringScore(creature)}`
                        }
                        const showAwakenedStar = !isUnavailable && creature.awakened

                        return (
                            <Tooltip
                                key={creature.id}
                                content={<CreatureTooltip creature={creature} creatureContent={creatureContent} />}
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
                                            {showAwakenedStar && <span style={{ color: '#ff1493', fontSize: '16px' }}>*</span>}
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
                    <div style={{ color: '#888', textAlign: 'center', padding: '20px', fontSize: '16px' }}>
                        {allCreatures.length === 0 ? 'No available creatures. All creatures are busy.' : 'No creatures found'}
                    </div>
                )}
            </div>
            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
        </div>
    )
}

export default DungeonCreatureSelector

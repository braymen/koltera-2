import { StateProps } from '@engine/types'
import { Input } from '@mantine/core'
import { useState } from 'react'
import Pagination from '../common/Pagination'
import CreaturesContent from '@data/creatures'
import Images from '@utils/images'
import { getCreatureIdsOnExpeditions } from '@modules/expeditions/helpers'
import { getCreatureIdsInDungeons } from '@modules/dungeons/helpers'
import Tooltip from '../common/Tooltip'
import CreatureJobTooltip from './CreatureJobTooltip'
import Sounds from '@utils/sounds'
import { getCreatureLevel, getCreatureXpForLevel } from '@modules/creatures/helpers'
import AwakenedShine from '@components/creatures/AwakenedShine'

interface Props extends StateProps {
    selected?: string
    onSelect: (string: string) => void
}

const gatheringSkills = ['Chopping', 'Mining', 'Exploring', 'Digging', 'Fishing', 'Farming']

function CreatureHelperInventory({ state, selected, onSelect }: Props) {
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [animatingImage, setAnimatingImage] = useState<string | null>(null)
    const [jobFilter, setJobFilter] = useState<string | null>(null)
    const itemsPerPage = 12

    const creatureInstanceIdsOnExpeditions = getCreatureIdsOnExpeditions(state.activeExpeditions || [])

    const creatureInstanceIdsWithUncollectedRewards = (state.activeExpeditions || [])
        .filter((expedition) => expedition.completed)
        .flatMap((expedition) => expedition.creatures)

    const speciesIdsOnExpeditions = new Set(
        creatureInstanceIdsOnExpeditions
            .map((instanceId) => {
                const creature = state.creatures.find((c) => c.id === instanceId)
                return creature?.species
            })
            .filter((speciesId): speciesId is string => speciesId !== undefined)
    )

    const speciesIdsWithUncollectedRewards = new Set(
        creatureInstanceIdsWithUncollectedRewards
            .map((instanceId) => {
                const creature = state.creatures.find((c) => c.id === instanceId)
                return creature?.species
            })
            .filter((speciesId): speciesId is string => speciesId !== undefined)
    )

    const creatureInstanceIdsInDungeons = getCreatureIdsInDungeons(state.dungeons?.activeDungeons || [])
    const speciesIdsInDungeons = new Set(
        creatureInstanceIdsInDungeons
            .map((instanceId) => state.creatures.find((c) => c.id === instanceId)?.species)
            .filter((speciesId): speciesId is string => speciesId !== undefined)
    )

    const speciesIdsInSanctuary = new Set(state.sanctuary)

    const speciesIdsOnMachines = new Set(
        Object.values(state.machines?.machines || {})
            .filter((m) => m.assignedCreatureId)
            .map((m) => {
                const creature = state.creatures.find((c) => c.id === m.assignedCreatureId)
                return creature?.species
            })
            .filter((speciesId): speciesId is string => speciesId !== undefined)
    )

    const unavailableSpeciesIds = new Set([
        ...speciesIdsOnExpeditions,
        ...speciesIdsWithUncollectedRewards,
        ...speciesIdsInSanctuary,
        ...speciesIdsOnMachines,
        ...speciesIdsInDungeons,
    ])

    const filteredCreatures = CreaturesContent.get
        .filter((creature) => {
            const creatureMeta = CreaturesContent.getById(creature.id)
            return !search || creatureMeta?.name.toLowerCase().includes(search.toLowerCase())
        })
        .filter((creature) => state.creatures.some((c) => c.species === creature.id))
        .filter((creature) => !state.helpers.find((helper) => helper.creatureId === creature.id))
        .sort((a, b) => {
            const aUnavailable = unavailableSpeciesIds.has(a.id)
            const bUnavailable = unavailableSpeciesIds.has(b.id)
            if (aUnavailable !== bUnavailable) return Number(aUnavailable) - Number(bUnavailable)
            if (jobFilter) {
                const jobKey = jobFilter.toLowerCase()
                const aJob = a.jobs[jobKey] || 0
                const bJob = b.jobs[jobKey] || 0
                return bJob - aJob
            }
            return 0
        })

    const totalPages = Math.ceil(filteredCreatures.length / itemsPerPage)
    const creatures = filteredCreatures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div>
            <h3>Creatures</h3>
            <Input
                placeholder="Search your creatures..."
                style={{ marginBottom: '8px', marginTop: '8px' }}
                radius={0}
                onChange={(e) => {
                    setCurrentPage(1)
                    setSearch(e.target.value)
                }}
            />
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {gatheringSkills.map((skill) => (
                    <button
                        key={skill}
                        onClick={() => {
                            Sounds.play('click.wav')
                            setJobFilter(jobFilter === skill ? null : skill)
                            setCurrentPage(1)
                        }}
                        style={{
                            flex: 1,
                            padding: '0px 8px',
                            backgroundColor: jobFilter === skill ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer',
                        }}
                    >
                        {skill}
                    </button>
                ))}
            </div>
            <div style={{ height: '485px' }}>
                {creatures.map((creature) => {
                    const creatureInstance = state.creatures.find((c) => c.species === creature.id)
                    if (!creatureInstance) {
                        return null
                    }

                    const isUnavailable = unavailableSpeciesIds.has(creature.id)

                    const isOnExpedition = speciesIdsOnExpeditions.has(creature.id)
                    const hasUncollectedRewards = speciesIdsWithUncollectedRewards.has(creature.id) && !isOnExpedition
                    const isInSanctuary = speciesIdsInSanctuary.has(creature.id) && !isOnExpedition && !hasUncollectedRewards
                    const isOnMachine = speciesIdsOnMachines.has(creature.id) && !isOnExpedition && !hasUncollectedRewards && !isInSanctuary
                    const isInDungeon =
                        speciesIdsInDungeons.has(creature.id) &&
                        !isOnExpedition &&
                        !hasUncollectedRewards &&
                        !isInSanctuary &&
                        !isOnMachine

                    let unavailableReason = ''
                    if (isOnExpedition) {
                        unavailableReason = 'On Expedition'
                    } else if (hasUncollectedRewards) {
                        unavailableReason = 'Uncollected Rewards'
                    } else if (isInSanctuary) {
                        unavailableReason = 'In Sanctuary'
                    } else if (isOnMachine) {
                        unavailableReason = 'On Machine'
                    } else if (isInDungeon) {
                        unavailableReason = 'In Dungeon'
                    }

                    const creatureContent = CreaturesContent.getById(creature.id)

                    return (
                        <Tooltip
                            key={creature.id}
                            content={
                                creatureContent ? (
                                    <CreatureJobTooltip creature={creatureInstance} creatureContent={creatureContent} />
                                ) : null
                            }
                        >
                            <div
                                onClick={() => {
                                    if (!isUnavailable) {
                                        Sounds.play('click.wav')
                                        setAnimatingImage(creature.id)
                                        setTimeout(() => setAnimatingImage(null), 400)
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
                                    backgroundColor: selected === creature.id ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                    borderLeft:
                                        selected === creature.id ? '3px solid rgba(255, 255, 255, 0.5)' : '3px solid transparent',
                                }}
                            >
                                <div
                                    className={`${creatureInstance.awakened ? 'creature-awakened' : ''} ${
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
                                        style={{ flexGrow: 1, fontSize: '18px', fontWeight: '400', marginLeft: '4px' }}
                                    >
                                        {creature.name}
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
                                        {!isUnavailable && creatureInstance.awakened && (
                                            <span style={{ color: '#ff1493', fontSize: '16px' }}>★</span>
                                        )}
                                        <span style={{ fontSize: '16px', fontWeight: '400', textAlign: 'right' }}>
                                            {isUnavailable
                                                ? unavailableReason
                                                : jobFilter
                                                  ? `${jobFilter} ${creature.jobs[jobFilter.toLowerCase()] || 0}`
                                                  : `Level ${getCreatureLevel(creatureInstance)}`}
                                        </span>
                                    </div>
                                    {!isUnavailable && (
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
                                                            : !creatureInstance.awakened &&
                                                                getCreatureLevel(creatureInstance) >= 70
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
                })}
            </div>
            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
        </div>
    )
}

export default CreatureHelperInventory

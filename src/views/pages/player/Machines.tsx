import { StateProps } from '@engine/types'
import { useState, useEffect } from 'react'
import Panel from '@components/common/Panel'
import Button from '@components/common/Button'
import Images from '@utils/images'
import Sounds from '@utils/sounds'
import MachinesConfig from '@configs/machines'
import { MachineId, MachineDefinition } from '@modules/machines/types'
import { isMachineOperating, getMachineInterval, getNextSmeltAllRecipe } from '@modules/machines/helpers'
import * as MachinesDispatch from '@modules/machines/dispatch'
import ItemsContent from '@data/items'
import CreaturesContent from '@data/creatures'
import { getCreatureLevel } from '@modules/creatures/helpers'
import { getCreatureIdsOnExpeditions } from '@modules/expeditions/helpers'
import { getCreatureIdsInDungeons } from '@modules/dungeons/helpers'
import Pagination from '@components/common/Pagination'
import { Input } from '@mantine/core'
import SkillingHelpers from '@modules/skilling/helpers'
import { ChoppingSkill } from '@data/skills/skilling/chopping'
import { FarmingSkill } from '@data/skills/skilling/farming'

const TOOL_TIER_NAMES: Record<number, string> = {
    0: 'Base',
    1: 'Copper',
    2: 'Tin',
    3: 'Iron',
    4: 'Silver',
    5: 'Gold',
    6: 'Platinum',
    7: 'Adamantite',
    8: 'Runic',
    9: 'Solarite',
    10: 'Arcanum',
}

function Machines({ state, dispatch }: StateProps) {
    const [selectedMachineId, setSelectedMachineId] = useState<MachineId | null>(null)
    const [now, setNow] = useState(Date.now() / 1000)

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now() / 1000), 1000)
        return () => clearInterval(timer)
    }, [])

    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 7

    const allDefinitions = MachinesConfig.MACHINE_DEFINITIONS
    const selectedDef = selectedMachineId ? MachinesConfig.getById(selectedMachineId) : null
    const selectedMachine = selectedMachineId ? state.machines?.machines[selectedMachineId] : null

    // Creature availability
    const creaturesOnExpeditions = new Set(getCreatureIdsOnExpeditions(state.activeExpeditions || []))
    const creaturesInDungeons = new Set(getCreatureIdsInDungeons(state.dungeons?.activeDungeons || []))
    const helperSpeciesIds = new Set(state.helpers.map((h) => h.creatureId))
    const sanctuarySpeciesIds = new Set(state.sanctuary)
    const machineCreatureIds = new Set(
        Object.values(state.machines?.machines || {})
            .filter((m) => m.assignedCreatureId)
            .map((m) => m.assignedCreatureId!)
    )

    const isCreatureUnavailable = (creature: { id: string; species: string }) => {
        if (creaturesOnExpeditions.has(creature.id)) return 'On Expedition'
        if (creaturesInDungeons.has(creature.id)) return 'In Dungeon'
        if (helperSpeciesIds.has(creature.species)) return 'Helping'
        if (sanctuarySpeciesIds.has(creature.species)) return 'In Sanctuary'
        if (machineCreatureIds.has(creature.id) && selectedMachine?.assignedCreatureId !== creature.id) return 'On Machine'
        return null
    }

    // Filter creatures for the selector

    // Auto-filter by machine's required type
    const requiredTypes = selectedDef?.creatureTypeRequired ?? null

    let filteredCreatures = state.creatures.filter((creature) => {
        const content = CreaturesContent.getById(creature.species)
        if (!content) return false
        if (search && !content.name.toLowerCase().includes(search.toLowerCase())) return false
        if (requiredTypes && !content.types.some((t: string) => requiredTypes.includes(t as any))) return false
        return true
    })

    // Sort: available first, then by level desc
    filteredCreatures = [...filteredCreatures].sort((a, b) => {
        const aUnavail = isCreatureUnavailable(a) !== null ? 1 : 0
        const bUnavail = isCreatureUnavailable(b) !== null ? 1 : 0
        if (aUnavail !== bUnavail) return aUnavail - bUnavail
        return getCreatureLevel(b) - getCreatureLevel(a)
    })

    const totalPages = Math.ceil(filteredCreatures.length / itemsPerPage)
    const displayedCreatures = filteredCreatures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const formatTime = (seconds: number): string => {
        if (seconds >= 60) {
            const m = Math.floor(seconds / 60)
            const s = seconds % 60
            return s > 0 ? `${m}m ${s}s` : `${m}m`
        }
        return `${seconds}s`
    }

    const renderMachineCard = (def: MachineDefinition) => {
        const machine = state.machines?.machines[def.id]
        const purchased = machine?.purchased ?? false
        const level = machine?.level ?? 0
        const isMax = level >= MachinesConfig.MAX_MACHINE_LEVEL
        const isSelected = selectedMachineId === def.id
        const operating = purchased && isMachineOperating(state, def.id)
        const interval = getMachineInterval(def.id, level)

        // Get assigned creature info
        const assignedCreature = machine?.assignedCreatureId
            ? state.creatures.find((c) => c.id === machine.assignedCreatureId)
            : null
        const assignedCreatureContent = assignedCreature ? CreaturesContent.getById(assignedCreature.species) : null

        // Output item info
        let outputItem = def.outputItemId ? ItemsContent.getById(def.outputItemId) : null
        if (def.machineType === 'processor' && machine?.selectedRecipeId) {
            if (machine.selectedRecipeId === 'all') {
                const currentRecipe = getNextSmeltAllRecipe(state, def.id)
                outputItem = currentRecipe ? ItemsContent.getById(currentRecipe.outputItemId) : null
            } else {
                const recipe = MachinesConfig.getRecipe(def.id, machine.selectedRecipeId)
                if (recipe) outputItem = ItemsContent.getById(recipe.outputItemId)
            }
        }

        // Purchase cost
        const playerGold = state.inventory.find((i) => i.id === 'gold')?.amount || 0
        const canAffordPurchase = playerGold >= def.cost

        // Status indicator: green = operating, yellow = creature assigned but not operating, red = no creature
        let statusColor: string | null = null
        if (purchased && def.requiresCreature) {
            if (operating) {
                statusColor = 'rgb(0, 220, 40)' // green
            } else if (machine?.assignedCreatureId) {
                statusColor = 'rgb(255, 200, 0)' // yellow — creature assigned but no recipe or out of resources
            } else {
                statusColor = 'rgb(220, 40, 40)' // red — no creature
            }
        }

        return (
            <div
                key={def.id}
                onClick={() => {
                    Sounds.play('click.wav')
                    setSelectedMachineId(def.id)
                }}
                style={{
                    border: isSelected ? '1px solid rgba(255, 187, 0, 0.7)' : '1px solid rgba(255,255,255,0.2)',
                    padding: '10px',
                    backgroundColor: isSelected ? 'rgba(255, 187, 0, 0.08)' : 'rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    position: 'relative',
                    height: '150px',
                }}
            >
                {/* Status indicator circle */}
                {statusColor && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: statusColor,
                        }}
                    />
                )}

                {/* Top section: Progress bar + content */}
                <div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
                    {/* Vertical Progress Bar */}
                    {purchased && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column-reverse',
                                gap: '2px',
                                width: '6px',
                                flexShrink: 0,
                                marginRight: '10px',
                            }}
                        >
                            {Array.from({ length: MachinesConfig.MAX_MACHINE_LEVEL }, (_, i) => {
                                const tickLevel = i + 1
                                const filled = tickLevel <= level
                                return (
                                    <div
                                        key={tickLevel}
                                        style={{
                                            flex: 1,
                                            width: '100%',
                                            backgroundColor: filled ? 'rgb(255, 255, 255)' : 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                        }}
                                    />
                                )
                            })}
                        </div>
                    )}

                    {/* Card Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center' }}>
                        {/* Machine Name */}
                        <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.95)', marginBottom: '-4px' }}>{def.name}</div>

                        {/* Description */}
                        {!purchased && (
                            <div
                                style={{
                                    fontSize: '16px',
                                    color: 'rgba(255,255,255,0.6)',
                                    textAlign: 'center',
                                    marginBottom: '6px',
                                    lineHeight: '16px',
                                }}
                            >
                                {def.description}
                            </div>
                        )}

                        {purchased ? (
                            <>
                                {/* Level */}
                                <div
                                    style={{
                                        fontSize: '15px',
                                        color: isMax ? 'rgb(255, 0, 204)' : 'rgb(255, 187, 0)',
                                        marginBottom: '0px',
                                        marginTop: '-4px',
                                    }}
                                >
                                    {isMax ? 'MAX LEVEL' : `Level ${level}`}
                                </div>

                                {/* Output & Speed */}
                                <div
                                    style={{
                                        fontSize: '16px',
                                        color: 'rgba(255,255,255,1)',
                                        marginBottom: '2px',
                                    }}
                                >
                                    {def.machineType === 'processor' && !machine?.selectedRecipeId && (
                                        <div style={{ fontSize: '14px' }}>No Recipe</div>
                                    )}
                                    {outputItem ? (
                                        <div>
                                            <span
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '14px',
                                                }}
                                            >
                                                <img
                                                    className="pixel"
                                                    src={Images.get(outputItem.image)}
                                                    alt=""
                                                    style={{ width: '14px', height: '14px' }}
                                                />
                                                {outputItem.name}
                                            </span>
                                            <div
                                                style={{ textAlign: 'center', color: 'rgba(255,255,255,.6)', marginTop: '-8px' }}
                                            >
                                                Every {formatTime(interval)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.6)', marginTop: '-8px' }}>
                                            Every {formatTime(interval)}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Purchase info */}
                                <div style={{ marginTop: 'auto', width: '100%' }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0 2px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <img
                                                className="pixel"
                                                src={Images.get('items/gold.png')}
                                                alt="Gold"
                                                style={{ width: '16px', height: '16px' }}
                                            />
                                            <span style={{ fontSize: '16px' }}>Gold</span>
                                        </div>
                                        <span
                                            style={{
                                                fontSize: '16px',
                                                color: canAffordPurchase ? 'lime' : 'red',
                                            }}
                                        >
                                            {def.cost.toLocaleString()}
                                        </span>
                                    </div>
                                    <Button
                                        onClick={() => MachinesDispatch.purchaseMachine(dispatch, def.id)}
                                        disabled={!canAffordPurchase}
                                    >
                                        Purchase
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Progress bar + Creature row at bottom of card */}
                {purchased && (
                    <div
                        style={{
                            marginTop: '6px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                fontSize: '16px',
                                color: 'rgba(255,255,255,1)',
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                paddingTop: '6px',
                            }}
                        >
                            {assignedCreatureContent ? (
                                <>
                                    <img
                                        className="pixel"
                                        src={Images.get(assignedCreatureContent.image)}
                                        alt=""
                                        style={{ width: '24px', height: '24px' }}
                                    />
                                    {assignedCreatureContent.name}
                                </>
                            ) : (
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>No creature assigned</span>
                            )}
                        </div>
                        {/* Cycle progress bar */}
                        {operating && machine?.lastGenerationTime && (
                            <div
                                style={{
                                    width: '100%',
                                    height: '2px',
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                    marginBottom: '0px',
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${Math.min(100, ((now - machine.lastGenerationTime) / interval) * 100)}%`,
                                        backgroundColor: 'rgb(255, 255, 255)',
                                    }}
                                />
                            </div>
                        )}
                        {!operating && <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', height: '2px' }}></div>}
                    </div>
                )}
            </div>
        )
    }

    const renderUpgradePanel = () => {
        if (!selectedDef || !selectedMachine?.purchased) {
            return (
                <div
                    style={{
                        color: 'rgba(255,255,255,0.4)',
                        textAlign: 'center',
                        padding: '20px',
                        fontSize: '18px',
                    }}
                >
                    {selectedDef ? 'Purchase this machine to upgrade.' : 'Select a machine to upgrade.'}
                </div>
            )
        }

        const level = selectedMachine.level
        const isMax = level >= MachinesConfig.MAX_MACHINE_LEVEL
        const upgradeCost = !isMax ? MachinesConfig.getUpgradeCost(level) : null
        const upgradeCostBarItem = upgradeCost ? ItemsContent.getById(upgradeCost.barId) : null
        const planksItem = ItemsContent.getById('planks')
        const playerBars = upgradeCost ? state.inventory.find((i) => i.id === upgradeCost.barId)?.amount || 0 : 0
        const playerPlanks = state.inventory.find((i) => i.id === 'planks')?.amount || 0
        const canAffordBars = upgradeCost ? playerBars >= upgradeCost.barAmount : false
        const canAffordPlanks = upgradeCost ? playerPlanks >= upgradeCost.planksAmount : false
        const canAffordUpgrade = canAffordBars && canAffordPlanks

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3 style={{ margin: '0 0 0px 0' }}>{selectedDef.name}</h3>

                {/* Upgrade section */}
                {!isMax && upgradeCost && upgradeCostBarItem && planksItem && (
                    <div style={{ marginTop: 'auto' }}>
                        {/* Duration change preview */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '8px',
                                fontSize: '18px',
                                color: 'rgba(255,255,255,0.7)',
                                marginBottom: '0px',
                            }}
                        >
                            <span>Duration Changes: {formatTime(MachinesConfig.getInterval(selectedDef.id, level))}</span>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>→</span>
                            <span style={{ color: 'rgb(0, 220, 40)' }}>
                                {formatTime(MachinesConfig.getInterval(selectedDef.id, level + 1))}
                            </span>
                        </div>

                        {/* Bar cost */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 2px',
                                marginBottom: '2px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img
                                    className="pixel"
                                    src={Images.get(upgradeCostBarItem.image)}
                                    alt=""
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontSize: '18px' }}>{upgradeCostBarItem.name}</span>
                            </div>
                            <span style={{ fontSize: '18px', color: canAffordBars ? 'lime' : 'red' }}>
                                {Math.min(playerBars, upgradeCost.barAmount)}/{upgradeCost.barAmount}
                            </span>
                        </div>

                        {/* Planks cost */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 2px',
                                marginBottom: '4px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img
                                    className="pixel"
                                    src={Images.get(planksItem.image)}
                                    alt=""
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontSize: '18px' }}>Planks</span>
                            </div>
                            <span style={{ fontSize: '18px', color: canAffordPlanks ? 'lime' : 'red' }}>
                                {Math.min(playerPlanks, upgradeCost.planksAmount)}/{upgradeCost.planksAmount}
                            </span>
                        </div>

                        <Button
                            onClick={() => MachinesDispatch.upgradeMachine(dispatch, selectedDef.id)}
                            disabled={!canAffordUpgrade}
                        >
                            Upgrade
                        </Button>
                    </div>
                )}

                {isMax && (
                    <div
                        style={{
                            color: 'rgb(255, 0, 204)',
                            fontSize: '16px',
                            textAlign: 'center',
                            marginTop: 'auto',
                        }}
                    >
                        Maximum level reached!
                    </div>
                )}
            </div>
        )
    }

    const renderMachineActions = () => {
        if (!selectedDef || !selectedMachine?.purchased) {
            return (
                <div
                    style={{
                        color: 'rgba(255,255,255,0.4)',
                        textAlign: 'center',
                        padding: '20px',
                        fontSize: '18px',
                    }}
                >
                    {selectedDef ? 'Purchase this machine first.' : 'Select a machine to view actions.'}
                </div>
            )
        }

        // Filter recipes by skill level for processors
        const furnaceXp = state.skills.find((s) => s.id === 'Furnace')?.xp || 0
        const furnaceLevel = SkillingHelpers.getLevel(furnaceXp)
        const choppingXp = state.skills.find((s) => s.id === 'Chopping')?.xp || 0
        const choppingLevel = SkillingHelpers.getLevel(choppingXp)
        const farmingXp = state.skills.find((s) => s.id === 'Farming')?.xp || 0
        const farmingLevel = SkillingHelpers.getLevel(farmingXp)
        const availableRecipes =
            selectedDef.machineType === 'processor'
                ? selectedDef.recipes.filter((recipe) => {
                      // Smelter: check output item's Furnace recipe level
                      const outputItem = ItemsContent.getById(recipe.outputItemId)
                      const furnaceRecipe = outputItem?.recipes?.find((r) => r.workstation === 'Furnace')
                      if (furnaceRecipe) return furnaceLevel >= furnaceRecipe.levelRequirement

                      // Sawmill: check input log's Chopping activity level
                      const choppingActivity = (ChoppingSkill.activities || []).find((a) =>
                          a.output.some((o) => o.id === recipe.inputItemId)
                      )
                      if (choppingActivity) return choppingLevel >= choppingActivity.levelRequirement

                      // Greenhouse: check Farming activity level for the output item
                      const farmingActivity = (FarmingSkill.activities || []).find((a) =>
                          a.output.some((o) => o.id === recipe.outputItemId)
                      )
                      if (farmingActivity) return farmingLevel >= farmingActivity.levelRequirement

                      return true
                  })
                : []
        const hasRecipes = availableRecipes.length > 0
        const hasCreature = !!selectedMachine.assignedCreatureId

        if (!hasRecipes && !hasCreature) {
            return (
                <div
                    style={{
                        color: 'rgba(255,255,255,0.4)',
                        textAlign: 'center',
                        padding: '20px',
                        fontSize: '18px',
                        height: '224px',
                    }}
                >
                    No actions available.
                </div>
            )
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '224px' }}>
                {/* Recipe selector for processors */}
                {hasRecipes && (
                    <div style={{ marginBottom: '8px' }}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                maxHeight: selectedDef.id === 'smelter' || selectedDef.id === 'sawmill' || selectedDef.id === 'cooker' ? '140px' : '180px',
                                overflowY: 'auto',
                            }}
                        >
                            {availableRecipes.map((recipe) => {
                                const inputItem = ItemsContent.getById(recipe.inputItemId)
                                const outputItem = ItemsContent.getById(recipe.outputItemId)
                                const secondaryItem = recipe.secondaryInputItemId
                                    ? ItemsContent.getById(recipe.secondaryInputItemId)
                                    : undefined
                                const isActive = selectedMachine.selectedRecipeId === recipe.inputItemId
                                const playerInput = state.inventory.find((i) => i.id === recipe.inputItemId)?.amount || 0

                                return (
                                    <div
                                        key={recipe.inputItemId}
                                        onClick={() => {
                                            Sounds.play('click.wav')
                                            MachinesDispatch.selectRecipe(
                                                dispatch,
                                                selectedDef.id,
                                                isActive ? null : recipe.inputItemId
                                            )
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '4px 8px',
                                            backgroundColor: isActive ? 'rgba(255, 187, 0, 0.15)' : 'rgba(255,255,255,0.05)',
                                            border: isActive
                                                ? '1px solid rgba(255, 187, 0, 0.5)'
                                                : '1px solid rgba(255,255,255,0.1)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {recipe.inputAmount > 0 ? (
                                                <>
                                                    {inputItem && (
                                                        <img
                                                            className="pixel"
                                                            src={Images.get(inputItem.image)}
                                                            alt=""
                                                            style={{ width: '16px', height: '16px' }}
                                                        />
                                                    )}
                                                    <span style={{ fontSize: '16px' }}>
                                                        {' '}
                                                        {selectedMachine.id === 'refinery' ? (
                                                            <>{recipe.inputAmount}</>
                                                        ) : (
                                                            <>
                                                                {recipe.inputAmount} {inputItem?.name}
                                                            </>
                                                        )}
                                                    </span>
                                                    {secondaryItem && (
                                                        <>
                                                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>
                                                                +
                                                            </span>
                                                            <img
                                                                className="pixel"
                                                                src={Images.get(secondaryItem.image)}
                                                                alt=""
                                                                style={{ width: '16px', height: '16px' }}
                                                            />
                                                            <span style={{ fontSize: '16px' }}>
                                                                {selectedMachine.id === 'refinery' ? (
                                                                    <>{recipe.secondaryInputAmount}</>
                                                                ) : (
                                                                    <>
                                                                        {recipe.secondaryInputAmount} {secondaryItem.name}
                                                                    </>
                                                                )}
                                                            </span>
                                                        </>
                                                    )}
                                                    {recipe.extraInputs?.map((extra) => {
                                                        const extraItem = ItemsContent.getById(extra.itemId)
                                                        return extraItem ? (
                                                            <span key={extra.itemId} style={{ display: 'contents' }}>
                                                                <span
                                                                    style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}
                                                                >
                                                                    +
                                                                </span>
                                                                <img
                                                                    className="pixel"
                                                                    src={Images.get(extraItem.image)}
                                                                    alt=""
                                                                    style={{ width: '16px', height: '16px' }}
                                                                />
                                                                <span style={{ fontSize: '16px' }}>
                                                                    {selectedMachine.id === 'refinery' ? (
                                                                        <>{extra.amount}</>
                                                                    ) : (
                                                                        <>
                                                                            {extra.amount} {extraItem.name}
                                                                        </>
                                                                    )}
                                                                </span>
                                                            </span>
                                                        ) : null
                                                    })}
                                                    <span
                                                        style={{
                                                            color: 'rgba(255,255,255,0.6)',
                                                            fontSize: '16px',
                                                        }}
                                                    >
                                                        =
                                                    </span>
                                                    {outputItem && (
                                                        <img
                                                            className="pixel"
                                                            src={Images.get(outputItem.image)}
                                                            alt=""
                                                            style={{ width: '16px', height: '16px' }}
                                                        />
                                                    )}
                                                    <span style={{ fontSize: '16px' }}>{outputItem?.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    {outputItem && (
                                                        <img
                                                            className="pixel"
                                                            src={Images.get(outputItem.image)}
                                                            alt=""
                                                            style={{ width: '16px', height: '16px' }}
                                                        />
                                                    )}
                                                    <span style={{ fontSize: '16px' }}>{outputItem?.name}</span>
                                                </>
                                            )}
                                        </div>
                                        {recipe.inputAmount > 0 && (
                                            <span
                                                style={{
                                                    fontSize: '16px',
                                                    color: 'rgba(255,255,255,1)',
                                                }}
                                            >
                                                {playerInput}
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Process All button for smelter/sawmill/cooker */}
                        {(selectedDef.id === 'smelter' || selectedDef.id === 'sawmill' || selectedDef.id === 'cooker') && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                <div
                                    onClick={() => {
                                        Sounds.play('click.wav')
                                        MachinesDispatch.selectRecipe(
                                            dispatch,
                                            selectedDef.id,
                                            selectedMachine.selectedRecipeId === 'all' ? null : 'all'
                                        )
                                    }}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '4px 8px',
                                        backgroundColor:
                                            selectedMachine.selectedRecipeId === 'all'
                                                ? 'rgba(255, 187, 0, 0.15)'
                                                : 'rgba(255,255,255,0.05)',
                                        border:
                                            selectedMachine.selectedRecipeId === 'all'
                                                ? '1px solid rgba(255, 187, 0, 0.5)'
                                                : '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                    }}
                                >
                                    {selectedDef.id === 'smelter' ? 'Smelt All' : selectedDef.id === 'cooker' ? 'Cook All' : 'Cut All'}
                                </div>
                                {selectedMachine.selectedRecipeId === 'all' && (
                                    <div
                                        onClick={() => {
                                            Sounds.play('click.wav')
                                            MachinesDispatch.toggleSmeltAllDirection(dispatch, selectedDef.id)
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '4px 8px',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {selectedMachine.smeltAllReversed ? '↓ Top to Bottom' : '↑ Bottom to Top'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Unassign creature button */}
                {hasCreature && (
                    <div style={{ marginTop: hasRecipes ? '0' : 'auto' }}>
                        <Button
                            onClick={() => MachinesDispatch.unassignCreature(dispatch, selectedDef.id)}
                            style={{ backgroundColor: '#6b2a2a' }}
                        >
                            Unassign Creature
                        </Button>
                    </div>
                )}
            </div>
        )
    }

    const renderCreatureSelector = () => {
        if (!selectedDef || !selectedMachine?.purchased) {
            return (
                <div
                    style={{
                        color: 'rgba(255,255,255,0.4)',
                        textAlign: 'center',
                        padding: '40px',
                        fontSize: '18px',
                    }}
                >
                    {selectedDef && !selectedMachine?.purchased
                        ? 'Purchase this machine first.'
                        : 'Select a purchased machine to assign a creature.'}
                </div>
            )
        }

        if (!selectedDef.requiresCreature) {
            return (
                <div
                    style={{
                        color: 'rgba(255,255,255,0.4)',
                        textAlign: 'center',
                        padding: '40px',
                        fontSize: '18px',
                    }}
                >
                    This machine does not require a creature.
                </div>
            )
        }

        const typeLabel = selectedDef.creatureTypeRequired ? selectedDef.creatureTypeRequired.join(' / ') : 'Any'

        return (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '380px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>Assign Creature ({typeLabel})</h3>

                <Input
                    placeholder="Search creatures..."
                    style={{ marginBottom: '8px' }}
                    radius={0}
                    onChange={(e) => {
                        setCurrentPage(1)
                        setSearch(e.target.value)
                    }}
                />

                {/* Creature list */}
                <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                    {displayedCreatures.length > 0 ? (
                        displayedCreatures.map((creature) => {
                            const content = CreaturesContent.getById(creature.species)
                            if (!content) return null
                            const level = getCreatureLevel(creature)
                            const unavailReason = isCreatureUnavailable(creature)
                            const cantUse = unavailReason !== null

                            return (
                                <div
                                    key={creature.id}
                                    onClick={() => {
                                        if (!cantUse) {
                                            Sounds.play('click.wav')
                                            MachinesDispatch.assignCreature(dispatch, selectedDef.id, creature.id)
                                        }
                                    }}
                                    className="skill-focus-btn"
                                    style={{
                                        padding: '6px 4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: cantUse ? 0.4 : 1,
                                        cursor: cantUse ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    <img
                                        className="pixel"
                                        src={Images.get(content.image)}
                                        alt=""
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            marginRight: '8px',
                                            marginLeft: '4px',
                                        }}
                                    />
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                        <span style={{ flexGrow: 1, fontSize: '16px', fontWeight: '400' }}>{content.name}</span>
                                        <span
                                            style={{
                                                fontSize: '14px',
                                                color: 'rgba(255,255,255,0.5)',
                                                paddingRight: '8px',
                                            }}
                                        >
                                            {unavailReason || `Lv ${level}`}
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No creatures found.</div>
                    )}
                </div>
                <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '970px', margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
                {/* Left: Machine Grid + Upgrade */}
                <div style={{ width: '55%', display: 'flex', flexDirection: 'column' }}>
                    <Panel>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '4px',
                            }}
                        >
                            {allDefinitions.map((def) => renderMachineCard(def))}
                            {/* Fill remaining slots for 9 total */}
                            {Array.from({ length: Math.max(0, 9 - allDefinitions.length) }, (_, i) => (
                                <div
                                    key={`empty-${i}`}
                                    style={{
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        padding: '10px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '150px',
                                        color: 'rgba(255,255,255,0.15)',
                                        fontSize: '16px',
                                    }}
                                ></div>
                            ))}
                        </div>
                    </Panel>

                    {/* Upgrade Panel */}
                    <Panel style={{ flex: 1 }}>{renderUpgradePanel()}</Panel>
                </div>

                {/* Right: Actions + Creature Selector */}
                <div style={{ width: '45%', display: 'flex', flexDirection: 'column' }}>
                    {/* Actions Panel (recipe, unassign) */}
                    <Panel>{renderMachineActions()}</Panel>

                    {/* Creature Selector Panel */}
                    <Panel style={{ flex: 1 }}>{renderCreatureSelector()}</Panel>
                </div>
            </div>
        </div>
    )
}

export default Machines

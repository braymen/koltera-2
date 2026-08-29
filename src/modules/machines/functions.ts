import { State } from '@engine/types'
import { changeInventory } from '@modules/inventory/functions'
import { MachineId } from './types'
import MachinesConfig from '@configs/machines'
import CreaturesContent from '@data/creatures'
import { getCreatureIdsOnExpeditions } from '@modules/expeditions/helpers'
import { getCreatureIdsInDungeons } from '@modules/dungeons/helpers'
import { resetMachineCounter } from './updates'

export type PurchaseMachinePayload = {
    machineId: MachineId
}

export const purchaseMachine = (state: State, payload: PurchaseMachinePayload): State => {
    const { machineId } = payload
    const definition = MachinesConfig.getById(machineId)
    if (!definition) return state

    // Check if already purchased
    const machine = state.machines.machines[machineId]
    if (machine?.purchased) return state

    // Check if player has enough gold
    const gold = state.inventory.find((item) => item.id === 'gold')
    if (!gold || gold.amount < definition.cost) return state

    // Deduct gold
    state = changeInventory(state, {
        resources: [{ id: 'gold', amount: -definition.cost }],
    })

    // Create machine instance
    state.machines.machines[machineId] = {
        id: machineId,
        purchased: true,
        level: 0,
        assignedCreatureId: null,
        lastGenerationTime: null,
        selectedRecipeId: null,
    }

    return state
}

export type UpgradeMachinePayload = {
    machineId: MachineId
}

export const upgradeMachine = (state: State, payload: UpgradeMachinePayload): State => {
    const { machineId } = payload
    const machine = state.machines.machines[machineId]
    if (!machine || !machine.purchased) return state

    // Check max level
    if (machine.level >= MachinesConfig.MAX_MACHINE_LEVEL) return state

    // Check material cost (bars + planks)
    const upgradeCost = MachinesConfig.getUpgradeCost(machine.level)
    if (!upgradeCost) return state

    const bars = state.inventory.find((item) => item.id === upgradeCost.barId)
    const planks = state.inventory.find((item) => item.id === 'planks')
    if (!bars || bars.amount < upgradeCost.barAmount) return state
    if (!planks || planks.amount < upgradeCost.planksAmount) return state

    // Deduct materials
    state = changeInventory(state, {
        resources: [
            { id: upgradeCost.barId, amount: -upgradeCost.barAmount },
            { id: 'planks', amount: -upgradeCost.planksAmount },
        ],
    })

    machine.level++
    return state
}

export type AssignCreaturePayload = {
    machineId: MachineId
    creatureId: string // creature instance id
}

export const assignCreature = (state: State, payload: AssignCreaturePayload): State => {
    const { machineId, creatureId } = payload
    const definition = MachinesConfig.getById(machineId)
    if (!definition) return state

    const machine = state.machines.machines[machineId]
    if (!machine || !machine.purchased) return state
    if (!definition.requiresCreature) return state

    // Verify creature exists
    const creature = state.creatures.find((c) => c.id === creatureId)
    if (!creature) return state

    // Check creature type requirement
    if (definition.creatureTypeRequired) {
        const content = CreaturesContent.getById(creature.species)
        if (!content) return state
        const hasRequiredType = definition.creatureTypeRequired.some((t) => content.types.includes(t))
        if (!hasRequiredType) return state
    }

    // Check creature isn't already assigned to another machine
    for (const [id, m] of Object.entries(state.machines.machines)) {
        if (id !== machineId && m.assignedCreatureId === creatureId) return state
    }

    // Check creature isn't on an expedition
    const creaturesOnExpeditions = new Set(getCreatureIdsOnExpeditions(state.activeExpeditions || []))
    if (creaturesOnExpeditions.has(creatureId)) return state

    // Check creature isn't assigned as a helper
    const isHelper = state.helpers.some((h) => h.creatureId === creature.species)
    if (isHelper) return state

    // Check creature isn't in sanctuary
    const sanctuarySpeciesIds = new Set(state.sanctuary)
    if (sanctuarySpeciesIds.has(creature.species)) return state

    // Check creature isn't in a dungeon
    const creaturesInDungeons = new Set(getCreatureIdsInDungeons(state.dungeons?.activeDungeons || []))
    if (creaturesInDungeons.has(creatureId)) return state

    // Assign creature and start the generation timer
    machine.assignedCreatureId = creatureId
    if (machine.lastGenerationTime === null) {
        machine.lastGenerationTime = Date.now() / 1000
        resetMachineCounter(machineId)
    }

    return state
}

export type UnassignCreaturePayload = {
    machineId: MachineId
}

export const unassignCreature = (state: State, payload: UnassignCreaturePayload): State => {
    const { machineId } = payload
    const machine = state.machines.machines[machineId]
    if (!machine || !machine.purchased) return state

    machine.assignedCreatureId = null
    machine.lastGenerationTime = null
    resetMachineCounter(machineId)

    return state
}

export type SelectRecipePayload = {
    machineId: MachineId
    inputItemId: string | null // null to deselect
}

export const selectRecipe = (state: State, payload: SelectRecipePayload): State => {
    const { machineId, inputItemId } = payload
    const machine = state.machines.machines[machineId]
    if (!machine || !machine.purchased) return state

    const definition = MachinesConfig.getById(machineId)
    if (!definition || definition.machineType !== 'processor') return state

    if (inputItemId === null) {
        machine.selectedRecipeId = null
        machine.lastGenerationTime = null
        resetMachineCounter(machineId)
        return state
    }

    // "Smelt All" mode
    if (inputItemId === 'all') {
        machine.selectedRecipeId = 'all'
        machine.lastGenerationTime = Date.now() / 1000
        resetMachineCounter(machineId)
        return state
    }

    // Validate recipe exists for this machine
    const recipe = MachinesConfig.getRecipe(machineId, inputItemId)
    if (!recipe) return state

    machine.selectedRecipeId = inputItemId

    // Reset generation timer when switching recipes
    machine.lastGenerationTime = Date.now() / 1000
    resetMachineCounter(machineId)

    return state
}

export type ToggleSmeltAllDirectionPayload = {
    machineId: MachineId
}

export const toggleSmeltAllDirection = (state: State, payload: ToggleSmeltAllDirectionPayload): State => {
    const { machineId } = payload
    const machine = state.machines.machines[machineId]
    if (!machine || !machine.purchased) return state

    machine.smeltAllReversed = !machine.smeltAllReversed
    return state
}

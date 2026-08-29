import { State } from '@engine/types'
import { CrafterState } from '@modules/crafting/types'
import { combineInventoryWithDiscovery } from '@modules/inventory/helpers'
import { addExperience } from '@modules/skilling/functions'
import { changeInventory } from '@modules/inventory/functions'
import SkillContent from '@data/skills'
import { ItemInstance } from '@modules/inventory/types'
import { NAVIGATION_MAP } from './navigation'
import { getSelectedRecipe } from '@modules/crafting/helpers'
import CreaturesContent from '@data/creatures'
import SanctuaryHelpers from '@modules/sanctuary/helpers'
import * as UpgradeHelpers from '@modules/upgrades/helpers'
import { FLOWER_TO_ITEM } from '@modules/garden/helpers'
import {
    getExpeditionRewards,
    generatePartyScore,
    generateExpedition,
    calculateExpeditionDuration,
} from '@modules/expeditions/helpers'
import ExpeditionsContent from '@data/expeditions'
import { getCreatureMaxXp } from '@modules/creatures/helpers'
import SkillingConfig from '@configs/skilling'
import * as BonusHelpers from '@modules/bonuses/helpers'
import { Creature } from '@modules/creatures/types'
import { FABRICATION_INTERVAL_SECONDS } from '@modules/fabrication/helpers'
import MachinesConfig from '@configs/machines'
import { isMachineOperating, getMachineInterval, getNextSmeltAllRecipe } from '@modules/machines/helpers'
import { MachineId } from '@modules/machines/types'
import DungeonConfig from '@configs/dungeons'
import { getDungeonGrade, getDungeonRewards, calculateDungeonPartyScore } from '@modules/dungeons/helpers'

const MAX_OFFLINE_HOURS = 24 * 3
const MAX_OFFLINE_SECONDS = MAX_OFFLINE_HOURS * 60 * 60

export interface OfflineProgressResult {
    simulatedTimeSeconds: number
    items: Array<{ id: string; amount: number }>
    workstationsCompleted: number
    gatheringCyclesCompleted: number
    helperCyclesCompleted: number
    experienceEarned: number
    gatheringSkillId: string | null
}

export const calculateOfflineProgress = (state: State): OfflineProgressResult | null => {
    const currentTime = Date.now() / 1000

    // If no last save time, this is a new game - set it and return
    if (!state.lastSaveTime) {
        state.lastSaveTime = currentTime
        return null
    }

    const timeSinceLastSave = currentTime - state.lastSaveTime

    // Cap at max offline time
    const simulatedTime = Math.min(timeSinceLastSave, MAX_OFFLINE_SECONDS)

    // Track offline time separately
    if (typeof (state as any).offlinePlaytime === 'undefined') {
        ;(state as any).offlinePlaytime = 0
    }
    if (typeof (state as any).onlinePlaytime === 'undefined') {
        ;(state as any).onlinePlaytime = state.totalPlaytime || 0
    }

    ;(state as any).offlinePlaytime += simulatedTime
    // Update total playtime as sum of online and offline
    state.totalPlaytime = (state as any).onlinePlaytime + (state as any).offlinePlaytime

    // If less than 1 second, skip (but still update lastSaveTime)
    if (simulatedTime < 1) {
        state.lastSaveTime = currentTime
        return null
    }

    const result: OfflineProgressResult = {
        simulatedTimeSeconds: simulatedTime,
        items: [],
        workstationsCompleted: 0,
        gatheringCyclesCompleted: 0,
        helperCyclesCompleted: 0,
        experienceEarned: 0,
        gatheringSkillId: null,
    }

    // Track items gained for summary
    const itemsGained = new Map<string, number>()

    // Track experience earned before processing offline progress
    const experienceBefore = new Map<string, number>()
    state.skills.forEach((skill) => {
        experienceBefore.set(skill.id, skill.xp)
    })

    // Process workstations (active or with items in queue)
    const workstationTabs = NAVIGATION_MAP.find((section) => section.section === 'Workstations')?.tabs || []
    for (const tab of workstationTabs) {
        const workstationKey = tab.id.toLowerCase().replace(' ', '') as keyof State
        const workstationState = state[workstationKey] as CrafterState | undefined

        // Process if active or has items in queue
        if (workstationState && (workstationState.isActive || (workstationState.queue && workstationState.queue.length > 0))) {
            const progress = processWorkstationOffline(
                state,
                workstationState,
                tab.id,
                simulatedTime,
                itemsGained,
                state.lastSaveTime
            )
            result.workstationsCompleted += progress.completed
        }
    }

    // Process gathering skills
    if (state.progress.skilling.id && state.progress.skilling.activity && state.progress.skilling.startTime) {
        result.gatheringSkillId = state.progress.skilling.id
        const cycles = processGatheringOffline(state, simulatedTime, itemsGained, state.lastSaveTime)
        result.gatheringCyclesCompleted = cycles
    }

    // Process helpers
    let totalHelperCycles = 0
    for (const helper of state.helpers) {
        const cycles = processHelperOffline(state, helper, simulatedTime, itemsGained, state.lastSaveTime)
        totalHelperCycles += cycles
    }
    result.helperCyclesCompleted = totalHelperCycles

    // Process gold generation from awakened creatures (1 gold per minute per awakened creature + upgrades)
    const awakenedCreatures = state.creatures.filter((creature) => creature.awakened)
    const awakenGoldBonus = UpgradeHelpers.getAwakenGoldBonus(state.purchasedUpgrades)
    const goldPerMinute = awakenedCreatures.length * (1 + awakenGoldBonus)
    if (goldPerMinute > 0) {
        const minutesElapsed = simulatedTime / 60
        const goldGenerated = Math.floor(minutesElapsed * goldPerMinute)
        if (goldGenerated > 0) {
            const goldItem = state.inventory.find((item) => item.id === 'gold')
            if (goldItem) {
                goldItem.amount += goldGenerated
            } else {
                state.inventory.push({ id: 'gold', amount: goldGenerated })
            }

            // Track gold earned for statistics
            if (state.statistics) {
                if (typeof state.statistics.totalGoldEarned !== 'number') {
                    state.statistics.totalGoldEarned = 0
                }
                state.statistics.totalGoldEarned += goldGenerated

                // Track total items gained (gold is an item)
                if (typeof state.statistics.totalItemsGained !== 'number') {
                    state.statistics.totalItemsGained = 0
                }
                state.statistics.totalItemsGained += goldGenerated
            }

            const currentAmount = itemsGained.get('gold') || 0
            itemsGained.set('gold', currentAmount + goldGenerated)
        }
    }

    // Process fabrication generation (1 resource per prestige point per 2 minutes)
    if (state.fabrication && Object.keys(state.fabrication.allocations).length > 0) {
        const lastGenTime = state.fabrication.lastGenerationTime || state.lastSaveTime || Date.now() / 1000
        const genElapsed = state.lastSaveTime && lastGenTime <= state.lastSaveTime ? state.lastSaveTime - lastGenTime : 0
        const timeSinceLastGen = simulatedTime + genElapsed
        const cyclesCompleted = Math.floor(timeSinceLastGen / FABRICATION_INTERVAL_SECONDS)

        if (cyclesCompleted > 0) {
            const resources: { id: string; amount: number }[] = []
            for (const [itemId, points] of Object.entries(state.fabrication.allocations)) {
                if (points > 0) {
                    const totalAmount = points * cyclesCompleted
                    resources.push({ id: itemId, amount: totalAmount })
                    const currentAmount = itemsGained.get(itemId) || 0
                    itemsGained.set(itemId, currentAmount + totalAmount)
                }
            }

            if (resources.length > 0) {
                changeInventory(state, { resources })
            }

            state.fabrication.lastGenerationTime = Math.min(
                lastGenTime + cyclesCompleted * FABRICATION_INTERVAL_SECONDS,
                Date.now() / 1000
            )
        }
    }

    // Process garden cycles (60 second cycles)
    if (state.garden && state.garden.flowers && state.garden.flowers.length > 0) {
        const GARDEN_CYCLE_INTERVAL = 60 // seconds

        // Calculate time since last cycle
        const lastCycleTime = state.garden.lastCycleTime || state.lastSaveTime || Date.now() / 1000
        const gardenElapsed = state.lastSaveTime && lastCycleTime <= state.lastSaveTime ? state.lastSaveTime - lastCycleTime : 0
        const timeSinceLastCycle = simulatedTime + gardenElapsed

        // Calculate how many complete cycles occurred
        const cyclesCompleted = Math.floor(timeSinceLastCycle / GARDEN_CYCLE_INTERVAL)

        if (cyclesCompleted > 0) {
            // Count flowers by type and level
            const essenceCounts: Record<string, number> = {}

            state.garden.flowers.forEach((flower: any) => {
                // Map known flowers to specific essences; fall back to Natural Essence for unmapped flowers
                const essenceId = FLOWER_TO_ITEM[flower.flowerId]
                // Yield equals the flower's level (level 1 = 1, level 2 = 2, etc.)
                const yieldAmount = flower.level || 1
                essenceCounts[essenceId] = (essenceCounts[essenceId] || 0) + yieldAmount
            })

            // Multiply by number of cycles
            const loot: Array<{ id: string; amount: number }> = []
            Object.entries(essenceCounts).forEach(([essenceId, amount]) => {
                if (amount > 0) {
                    const totalAmount = amount * cyclesCompleted
                    loot.push({ id: essenceId, amount: totalAmount })

                    const currentAmount = itemsGained.get(essenceId) || 0
                    itemsGained.set(essenceId, currentAmount + totalAmount)
                }
            })

            if (loot.length > 0) {
                changeInventory(state, { resources: loot })
            }

            // Update last cycle time (clamped to now to handle rewound lastSaveTime, e.g. offline potion)
            const nowTs = Date.now() / 1000
            const newLastCycleTime = Math.min(lastCycleTime + cyclesCompleted * GARDEN_CYCLE_INTERVAL, nowTs)
            state.garden.lastCycleTime = newLastCycleTime
        } else {
            // No complete cycles, but update lastCycleTime to account for partial progress
            const nowTs = Date.now() / 1000
            state.garden.lastCycleTime = Math.min(lastCycleTime + timeSinceLastCycle, nowTs)
        }
    }

    // Process expeditions (including repeating ones)
    processExpeditionsOffline(state, simulatedTime, itemsGained, state.lastSaveTime)

    // Process dungeons (including looping ones)
    processDungeonsOffline(state, simulatedTime, itemsGained, state.lastSaveTime)

    // Process machines (passive resource generation and processing)
    if (state.machines?.machines) {
        for (const [machineId, machine] of Object.entries(state.machines.machines)) {
            if (!machine.purchased) continue
            if (!isMachineOperating(state, machineId as MachineId)) continue

            const definition = MachinesConfig.getById(machineId as MachineId)
            if (!definition) continue

            const interval = getMachineInterval(machineId as MachineId, machine.level)
            const lastGenTime = machine.lastGenerationTime || state.lastSaveTime || Date.now() / 1000
            const genElapsed = state.lastSaveTime && lastGenTime <= state.lastSaveTime ? state.lastSaveTime - lastGenTime : 0
            const timeSinceLastGen = simulatedTime + genElapsed
            const cyclesCompleted = Math.floor(timeSinceLastGen / interval)

            if (cyclesCompleted > 0) {
                if (definition.machineType === 'generator') {
                    const totalAmount = cyclesCompleted
                    changeInventory(state, {
                        resources: [{ id: definition.outputItemId!, amount: totalAmount }],
                    })

                    const currentAmount = itemsGained.get(definition.outputItemId!) || 0
                    itemsGained.set(definition.outputItemId!, currentAmount + totalAmount)
                } else if (definition.machineType === 'processor' && machine.selectedRecipeId) {
                    if (machine.selectedRecipeId === 'all') {
                        // Smelt All: cycle-by-cycle since recipe can change as ores deplete
                        for (let i = 0; i < cyclesCompleted; i++) {
                            const recipe = getNextSmeltAllRecipe(state, machineId as MachineId)
                            if (!recipe) break
                            changeInventory(state, {
                                resources: [
                                    { id: recipe.inputItemId, amount: -recipe.inputAmount },
                                    { id: recipe.outputItemId, amount: recipe.outputAmount },
                                ],
                            })
                            const currentAmount = itemsGained.get(recipe.outputItemId) || 0
                            itemsGained.set(recipe.outputItemId, currentAmount + recipe.outputAmount)
                        }
                    } else {
                        const recipe = MachinesConfig.getRecipe(machineId as MachineId, machine.selectedRecipeId)
                        if (recipe) {
                            // Cap cycles by available input materials
                            const input = state.inventory.find((item) => item.id === recipe.inputItemId)
                            const availableInput = input?.amount ?? 0
                            const maxCycles = Math.floor(availableInput / recipe.inputAmount)
                            const actualCycles = Math.min(cyclesCompleted, maxCycles)

                            if (actualCycles > 0) {
                                changeInventory(state, {
                                    resources: [
                                        { id: recipe.inputItemId, amount: -(recipe.inputAmount * actualCycles) },
                                        { id: recipe.outputItemId, amount: recipe.outputAmount * actualCycles },
                                    ],
                                })

                                const currentAmount = itemsGained.get(recipe.outputItemId) || 0
                                itemsGained.set(recipe.outputItemId, currentAmount + recipe.outputAmount * actualCycles)
                            }
                        }
                    }
                }

                machine.lastGenerationTime = Math.min(lastGenTime + cyclesCompleted * interval, Date.now() / 1000)
            }
        }
    }

    // Grant XP to sanctuary creatures (0.5 XP per second)
    if (state.sanctuary && state.sanctuary.length > 0) {
        for (const speciesId of state.sanctuary) {
            const creature = state.creatures.find((c: Creature) => c.species === speciesId)
            if (creature) {
                const maxXp = getCreatureMaxXp(creature)
                creature.experience = Math.min(creature.experience + 0.5 * simulatedTime, maxXp)
            }
        }
    }

    // Grant XP to machine-assigned creatures (0.5 XP per second)
    if (state.machines?.machines) {
        for (const [, machine] of Object.entries(state.machines.machines)) {
            if (!machine.purchased || !machine.assignedCreatureId) continue
            const creature = state.creatures.find((c: Creature) => c.id === machine.assignedCreatureId)
            if (creature) {
                const maxXp = getCreatureMaxXp(creature)
                creature.experience = Math.min(creature.experience + 0.5 * simulatedTime, maxXp)
            }
        }
    }

    // Calculate total experience earned across all skills
    state.skills.forEach((skill) => {
        const before = experienceBefore.get(skill.id) || 0
        const after = skill.xp
        result.experienceEarned += after - before
    })

    // Convert items map to array
    itemsGained.forEach((amount, id) => {
        result.items.push({ id, amount })
    })

    // Update last save time to now
    state.lastSaveTime = currentTime

    return result.items.length > 0 ||
        result.workstationsCompleted > 0 ||
        result.gatheringCyclesCompleted > 0 ||
        result.helperCyclesCompleted > 0
        ? result
        : null
}

const processWorkstationOffline = (
    state: State,
    workstationState: CrafterState,
    workstationName: string,
    simulatedTime: number,
    itemsGained: Map<string, number>,
    lastSaveTime: number | null
): { completed: number } => {
    let remainingSimulatedTime = simulatedTime
    let totalCompleted = 0

    // Initialize queue if it doesn't exist
    if (!workstationState.queue) {
        workstationState.queue = []
    }

    // Process jobs in queue until we run out of simulated time or queue is empty
    while (
        remainingSimulatedTime > 0 &&
        (workstationState.isActive || (workstationState.queue && workstationState.queue.length > 0))
    ) {
        // If workstation is not active but queue has items, start the next job
        if (!workstationState.isActive && workstationState.queue && workstationState.queue.length > 0) {
            const nextJob = workstationState.queue[0]
            const currentTime = Date.now() / 1000
            workstationState.isActive = true
            workstationState.item = nextJob.item
            workstationState.progress = 0
            workstationState.duration = nextJob.totalDuration
            workstationState.singleItemDuration = nextJob.singleItemDuration
            // Set startTime to account for simulated time that has already passed
            workstationState.startTime = currentTime - (simulatedTime - remainingSimulatedTime)
            workstationState.amount = nextJob.amount
            workstationState.completedItems = 0
        }

        // If still not active, break
        if (!workstationState.isActive || !workstationState.item) {
            break
        }

        const recipe = getSelectedRecipe(workstationState.item.id, workstationName)
        if (!recipe) {
            break
        }

        const amount = workstationState.amount
        const singleItemDuration = workstationState.singleItemDuration || workstationState.duration / amount
        const completedItems = workstationState.completedItems || 0
        const remainingItems = amount - completedItems

        // Calculate how much time was already elapsed from when crafting started until last save time
        // For jobs that started during offline processing, elapsedBefore will be 0
        const elapsedBefore =
            workstationState.startTime && lastSaveTime && workstationState.startTime <= lastSaveTime
                ? lastSaveTime - workstationState.startTime
                : 0

        // Calculate how many items were completed before going offline
        const itemsCompletedBefore = Math.floor(elapsedBefore / singleItemDuration)
        const itemsToCompleteOffline = Math.min(
            Math.floor((elapsedBefore + remainingSimulatedTime) / singleItemDuration) - itemsCompletedBefore,
            remainingItems
        )

        if (itemsToCompleteOffline > 0) {
            // Apply workstation XP (includes upgrades, player level, and tool bonuses), and recovery
            const workstationXpBonus = BonusHelpers.getWorkstationXpBonus(state, workstationName)
            const recoveryChance = UpgradeHelpers.getWorkstationRecoveryChance(state.purchasedUpgrades, workstationName as any)

            // Calculate output for items completed during offline time
            const outputAmount = recipe.recipe.outputAmount * itemsToCompleteOffline
            const experienceGained = Math.floor(recipe.recipe.experience * itemsToCompleteOffline * workstationXpBonus.multiplier)

            // Add completed items to inventory
            const outputItem = {
                id: recipe.id,
                amount: outputAmount,
            }
            combineInventoryWithDiscovery(state, [outputItem])

            // Recovery: chance to return ingredients per item crafted
            if (recoveryChance > 0) {
                for (let i = 0; i < itemsToCompleteOffline; i++) {
                    if (Math.random() * 100 < recoveryChance) {
                        const recoveredIngredients = recipe.recipe.ingredients.map((ingredient) => ({
                            id: ingredient.id,
                            amount: ingredient.amount,
                        }))
                        combineInventoryWithDiscovery(state, recoveredIngredients)
                    }
                }
            }

            addExperience(state, { skillId: workstationName as any, xp: experienceGained })

            const currentAmount = itemsGained.get(outputItem.id) || 0
            itemsGained.set(outputItem.id, currentAmount + outputItem.amount)

            // Update completed items count
            workstationState.completedItems = completedItems + itemsToCompleteOffline

            // Track items crafted for statistics
            if (state.statistics?.itemsCrafted) {
                const workstationKey = workstationName as keyof typeof state.statistics.itemsCrafted
                if (workstationKey === 'Stove' || workstationKey === 'Workbench' || workstationKey === 'Furnace') {
                    if (typeof state.statistics.itemsCrafted[workstationKey] === 'number') {
                        state.statistics.itemsCrafted[workstationKey] += itemsToCompleteOffline
                    }
                    if (typeof state.statistics.itemsCrafted.total === 'number') {
                        state.statistics.itemsCrafted.total += itemsToCompleteOffline
                    }
                }
            }

            // Calculate time used for completed items
            const timeUsedForCompletedItems = itemsToCompleteOffline * singleItemDuration
            remainingSimulatedTime -= timeUsedForCompletedItems

            // Check if all items in current job are complete
            if (workstationState.completedItems >= amount) {
                // Remove completed job from queue
                if (workstationState.queue && workstationState.queue.length > 0) {
                    workstationState.queue.shift()
                }

                // Reset workstation state
                workstationState.isActive = false
                workstationState.item = null
                workstationState.progress = 0
                workstationState.duration = 0
                workstationState.startTime = null
                workstationState.amount = 0
                workstationState.completedItems = 0
                workstationState.singleItemDuration = 0

                totalCompleted++
                // Continue loop to process next job in queue if available
            } else {
                // Current job not complete — set startTime so online updateCrafting
                // sees elapsed time consistent with completedItems (prevents double-counting)
                const correctElapsed =
                    workstationState.completedItems * singleItemDuration +
                    ((elapsedBefore + (simulatedTime - remainingSimulatedTime)) % singleItemDuration)
                workstationState.startTime = Date.now() / 1000 - correctElapsed
                workstationState.progress = Math.min(1, correctElapsed / workstationState.duration)
                break
            }
        } else {
            // No items completed in this iteration, just advance progress and break
            const correctElapsed =
                (workstationState.completedItems || 0) * singleItemDuration +
                ((elapsedBefore + remainingSimulatedTime) % singleItemDuration)
            workstationState.startTime = Date.now() / 1000 - correctElapsed
            workstationState.progress = Math.min(1, correctElapsed / workstationState.duration)
            break
        }
    }

    return { completed: totalCompleted }
}

const processGatheringOffline = (
    state: State,
    simulatedTime: number,
    itemsGained: Map<string, number>,
    lastSaveTime: number | null
): number => {
    const skill = state.progress.skilling
    const skillData = SkillContent.getById(skill.id)
    const activity = skillData?.activities?.find((a) => a.id === skill.activity)

    if (!activity) {
        return 0
    }

    // Apply sanctuary and upgrade duration reduction
    const jobKey = skill.id.toLowerCase() as keyof ReturnType<typeof SanctuaryHelpers.calculateJobTiers>
    const jobTiers = SanctuaryHelpers.calculateJobTiers(state)
    const jobBenefits = SanctuaryHelpers.getJobBenefits(jobTiers[jobKey])
    const upgradeDurationReduction = UpgradeHelpers.getSkillDurationReduction(state.purchasedUpgrades, skill.id as any)
    const totalDurationReduction = jobBenefits.durationReduction + Math.abs(upgradeDurationReduction) // upgradeDurationReduction is negative
    const durationMultiplier = Math.max(0.01, 1 - totalDurationReduction / 100)
    const adjustedDuration = Math.max(1, activity.duration * durationMultiplier)

    // Calculate elapsed time from when the skill started until the last save time (when player went offline)
    // This tells us how much progress was already made on the current cycle when they went offline
    const elapsedBefore = skill.startTime && lastSaveTime && skill.startTime <= lastSaveTime ? lastSaveTime - skill.startTime : 0
    const remainingTime = Math.max(0, adjustedDuration - elapsedBefore)

    let cyclesCompleted = 0

    // If the cycle will complete during offline time
    if (remainingTime <= simulatedTime) {
        // Complete the current cycle
        processGatheringCycle(state, activity, itemsGained, skill.id)
        cyclesCompleted++

        // Calculate how much time is left after completing the current cycle
        const remainingSimulatedTime = simulatedTime - remainingTime

        // Process additional complete cycles
        const additionalCycles = Math.floor(remainingSimulatedTime / adjustedDuration)

        for (let i = 0; i < additionalCycles; i++) {
            processGatheringCycle(state, activity, itemsGained, skill.id)
            cyclesCompleted++
        }

        // Set up for the next cycle with any remaining partial time
        const finalRemainingTime = remainingSimulatedTime - additionalCycles * adjustedDuration
        skill.startTime = Date.now() / 1000 - finalRemainingTime
        skill.progress = finalRemainingTime / adjustedDuration
    } else {
        // Current cycle not complete, just advance progress
        // We need to adjust startTime backwards to account for the simulated time
        skill.startTime = (skill.startTime || Date.now() / 1000) - simulatedTime
        skill.progress = Math.min(1, (Date.now() / 1000 - skill.startTime) / adjustedDuration)
    }

    return cyclesCompleted
}

const processGatheringCycle = (state: State, activity: any, itemsGained: Map<string, number>, skillId: string): void => {
    // Apply sanctuary and upgrade benefits
    const jobKey = skillId.toLowerCase() as keyof ReturnType<typeof SanctuaryHelpers.calculateJobTiers>
    const jobTiers = SanctuaryHelpers.calculateJobTiers(state)
    const jobBenefits = SanctuaryHelpers.getJobBenefits(jobTiers[jobKey])
    const upgradeYieldBonus = UpgradeHelpers.getSkillYieldBonus(state.purchasedUpgrades, skillId as any)

    const loot: ItemInstance[] = []

    // Multiple loot logic
    for (const item of activity.output) {
        if (Math.random() < item.chance) {
            const baseAmount = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min
            const finalAmount = baseAmount + jobBenefits.yieldBonus + upgradeYieldBonus
            loot.push({ id: item.id, amount: finalAmount })

            const currentAmount = itemsGained.get(item.id) || 0
            itemsGained.set(item.id, currentAmount + finalAmount)
        }
    }

    // Add experience with sanctuary, upgrade, player level, and tool bonuses
    const gatheringXpBonus = BonusHelpers.getGatheringXpBonus(state, skillId, jobTiers)
    const finalXp = Math.floor(activity.xpRate * gatheringXpBonus.multiplier)

    addExperience(state, {
        skillId: skillId,
        xp: finalXp,
    })

    // Add to inventory
    if (loot.length > 0) {
        changeInventory(state, {
            resources: loot,
        })

        // Track discovered items
        loot.forEach((item) => {
            if (!state.collections.items.includes(item.id)) {
                state.collections.items.push(item.id)
            }
        })
    }

    // Track skilling cycle completion for statistics
    const gatheringSkillIds = ['Chopping', 'Mining', 'Digging', 'Farming', 'Fishing', 'Exploring']
    if (gatheringSkillIds.includes(skillId) && state.statistics?.skillingCycles) {
        const skillKey = skillId as keyof typeof state.statistics.skillingCycles
        if (typeof state.statistics.skillingCycles[skillKey] === 'number') {
            state.statistics.skillingCycles[skillKey]++
        }
    }
}

const processHelperOffline = (
    state: State,
    helper: { startTime: number; creatureId: string; skillId: string; activityId: string; progress: number },
    simulatedTime: number,
    itemsGained: Map<string, number>,
    lastSaveTime: number | null
): number => {
    const skillMeta = SkillContent.getById(helper.skillId)
    const activityMeta = skillMeta?.activities?.find((activity) => activity.id === helper.activityId)
    const creatureMeta = CreaturesContent.getById(helper.creatureId)

    if (!activityMeta || !creatureMeta || !skillMeta) {
        return 0
    }

    const jobLevel = creatureMeta.jobs[helper.skillId.toLowerCase()]
    const slowestMultiplier = SkillingConfig.HELPERS.HELPER_SLOWEST_MULTIPLIER
    let duration = activityMeta.duration * Math.pow(slowestMultiplier, (10 - jobLevel) / 9)

    // Apply sanctuary and upgrade duration reduction (helpers also benefit from sanctuary and upgrades)
    const jobKey = helper.skillId.toLowerCase() as keyof ReturnType<typeof SanctuaryHelpers.calculateJobTiers>
    const jobTiers = SanctuaryHelpers.calculateJobTiers(state)
    const jobBenefits = SanctuaryHelpers.getJobBenefits(jobTiers[jobKey])
    const upgradeDurationReduction = UpgradeHelpers.getSkillDurationReduction(state.purchasedUpgrades, helper.skillId as any)
    const totalDurationReduction = jobBenefits.durationReduction + Math.abs(upgradeDurationReduction) // upgradeDurationReduction is negative
    const durationMultiplier = Math.max(0.01, 1 - totalDurationReduction / 100)
    duration = Math.max(1, duration * durationMultiplier)

    // Grant creature XP based on total simulated time (not per cycle)
    const activityIndex = skillMeta.activities?.indexOf(activityMeta) ?? 0
    const baseXpPerSecond = 0.4 + 0.05 * activityIndex
    const helperXpBonus = BonusHelpers.getHelperXpBonus(state, helper.skillId, jobTiers)
    const xpPerSecond = baseXpPerSecond * helperXpBonus.multiplier
    const totalCreatureXp = xpPerSecond * simulatedTime

    const helperCreature = state.creatures.find((c: Creature) => c.species === helper.creatureId)
    if (helperCreature) {
        const maxXp = getCreatureMaxXp(helperCreature)
        helperCreature.experience = Math.min(helperCreature.experience + totalCreatureXp, maxXp)
    }

    // Calculate elapsed time from when the helper started until the last save time
    const elapsedBefore =
        helper.startTime && lastSaveTime && helper.startTime <= lastSaveTime ? lastSaveTime - helper.startTime : 0
    const remainingTime = Math.max(0, duration - elapsedBefore)

    let cyclesCompleted = 0

    // If the cycle will complete during offline time
    if (remainingTime <= simulatedTime) {
        // Complete the current cycle
        processHelperCycle(state, helper, activityMeta, itemsGained)
        cyclesCompleted++

        // Calculate how much time is left after completing the current cycle
        const remainingSimulatedTime = simulatedTime - remainingTime

        // Process additional complete cycles
        const additionalCycles = Math.floor(remainingSimulatedTime / duration)

        for (let i = 0; i < additionalCycles; i++) {
            processHelperCycle(state, helper, activityMeta, itemsGained)
            cyclesCompleted++
        }

        // Set up for the next cycle with any remaining partial time
        const finalRemainingTime = remainingSimulatedTime - additionalCycles * duration
        helper.startTime = Date.now() / 1000 - finalRemainingTime
        helper.progress = finalRemainingTime / duration
    } else {
        // Current cycle not complete, just advance progress
        helper.startTime = (helper.startTime || Date.now() / 1000) - simulatedTime
        helper.progress = Math.min(1, (Date.now() / 1000 - helper.startTime) / duration)
    }

    return cyclesCompleted
}

const processHelperCycle = (
    state: State,
    helper: { skillId: string; creatureId: string },
    activity: any,
    itemsGained: Map<string, number>
): void => {
    // Apply sanctuary and upgrade benefits
    const jobKey = helper.skillId.toLowerCase() as keyof ReturnType<typeof SanctuaryHelpers.calculateJobTiers>
    const jobTiers = SanctuaryHelpers.calculateJobTiers(state)
    const jobBenefits = SanctuaryHelpers.getJobBenefits(jobTiers[jobKey])
    const upgradeYieldBonus = UpgradeHelpers.getSkillYieldBonus(state.purchasedUpgrades, helper.skillId as any)

    const loot: ItemInstance[] = []

    // Multiple loot logic
    for (const item of activity.output) {
        if (Math.random() < item.chance) {
            const baseAmount = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min
            const finalAmount = baseAmount + jobBenefits.yieldBonus + upgradeYieldBonus
            loot.push({ id: item.id, amount: finalAmount })

            const currentAmount = itemsGained.get(item.id) || 0
            itemsGained.set(item.id, currentAmount + finalAmount)
        }
    }

    // Add to inventory
    if (loot.length > 0) {
        changeInventory(state, {
            resources: loot,
        })

        // Track discovered items
        loot.forEach((item) => {
            if (!state.collections.items.includes(item.id)) {
                state.collections.items.push(item.id)
            }
        })
    }

    // Track helper cycle completion for statistics
    const gatheringSkillIds = ['Chopping', 'Mining', 'Digging', 'Farming', 'Fishing', 'Exploring']
    if (gatheringSkillIds.includes(helper.skillId) && state.statistics?.helperCycles) {
        const skillKey = helper.skillId as keyof typeof state.statistics.helperCycles
        if (typeof state.statistics.helperCycles[skillKey] === 'number') {
            state.statistics.helperCycles[skillKey]++
        }
    }
}

const processExpeditionsOffline = (
    state: State,
    simulatedTime: number,
    itemsGained: Map<string, number>,
    lastSaveTime: number | null
): void => {
    if (!state.activeExpeditions || state.activeExpeditions.length === 0) {
        return
    }

    const currentTime = Date.now() / 1000

    // Process each expedition
    for (const expedition of state.activeExpeditions) {
        // Skip if already completed (for non-repeating expeditions)
        if (expedition.completed && !expedition.repeatExpedition) {
            continue
        }

        // Calculate elapsed time from when expedition started until last save time
        const elapsedBefore = lastSaveTime && expedition.startTime <= lastSaveTime ? lastSaveTime - expedition.startTime : 0
        let remainingDuration = Math.max(0, expedition.duration - elapsedBefore)

        // If expedition is repeating, simulate multiple completions
        if (expedition.repeatExpedition) {
            let remainingSimulatedTime = simulatedTime
            let currentRemainingDuration = remainingDuration
            let completedAtLeastOnce = false

            // Process repeating expeditions: complete, collect rewards, restart, repeat
            while (remainingSimulatedTime > 0 && currentRemainingDuration <= remainingSimulatedTime) {
                completedAtLeastOnce = true
                const rewards = getExpeditionRewards(expedition.instance, expedition.creatures.length, expedition.loopCount || 1)

                // Collect item rewards
                if (rewards.items.length > 0) {
                    combineInventoryWithDiscovery(state, rewards.items)
                    rewards.items.forEach((item) => {
                        const currentAmount = itemsGained.get(item.id) || 0
                        itemsGained.set(item.id, currentAmount + item.amount)
                    })
                }

                // Grant XP to each creature at completion (with sword/expedition tool bonus)
                if (rewards.creatureExperience > 0) {
                    const expeditionBonus = BonusHelpers.getExpeditionXpBonus(state)
                    const perCreatureXP = Math.floor(rewards.creatureExperience * expeditionBonus.multiplier)
                    let totalXpGiven = 0
                    for (const creatureId of expedition.creatures) {
                        const creature = state.creatures.find((c) => c.id === creatureId)
                        if (creature) {
                            const maxXp = getCreatureMaxXp(creature)
                            const xpBefore = creature.experience
                            creature.experience = Math.min(creature.experience + perCreatureXP, maxXp)
                            totalXpGiven += creature.experience - xpBefore
                        }
                    }
                    if (totalXpGiven > 0 && state.statistics) {
                        if (typeof state.statistics.totalCreatureXP !== 'number') {
                            state.statistics.totalCreatureXP = 0
                        }
                        state.statistics.totalCreatureXP += totalXpGiven
                    }
                }

                // Track expedition completion
                if (!state.expeditionCompletions) {
                    state.expeditionCompletions = {}
                }
                const expeditionTypeId = expedition.instance.expeditionTypeId
                const tier = expedition.instance.tier
                if (!state.expeditionCompletions[expeditionTypeId]) {
                    state.expeditionCompletions[expeditionTypeId] = {}
                }
                const currentCount = state.expeditionCompletions[expeditionTypeId][tier] || 0
                state.expeditionCompletions[expeditionTypeId][tier] = currentCount + 1

                // Track expedition statistics
                if (state.statistics?.expeditions) {
                    state.statistics.expeditions.total++
                    state.statistics.expeditions.successful++
                }

                // Update remaining simulated time
                remainingSimulatedTime -= currentRemainingDuration

                // Restart expedition with updated creatures (levels may have changed)
                const creatureIds = [...expedition.creatures]
                const creatures: Creature[] = state.creatures.filter((creature) => creatureIds.includes(creature.id))
                const newExpeditionInstance = generateExpedition(tier, expeditionTypeId)
                const partyScore = generatePartyScore(creatures, newExpeditionInstance)
                const expeditionTypeContent = ExpeditionsContent.getById(newExpeditionInstance.expeditionTypeId)
                const newDuration = calculateExpeditionDuration(expeditionTypeContent, newExpeditionInstance, partyScore)

                // Update expedition with new instance and duration
                expedition.instance = newExpeditionInstance
                expedition.duration = newDuration
                expedition.completed = false
                expedition.success = null
                expedition.rewards = null
                expedition.loopCount = (expedition.loopCount || 1) + 1

                // Set remaining duration for next iteration (new expedition starts fresh)
                currentRemainingDuration = newDuration
            }

            // Update expedition start time based on remaining simulated time
            if (completedAtLeastOnce) {
                expedition.startTime = currentTime - remainingSimulatedTime
            } else {
                expedition.startTime = currentTime - (elapsedBefore + remainingSimulatedTime)
            }
        } else {
            // Regular expedition: just check if it completes during offline time
            if (remainingDuration <= simulatedTime) {
                // Complete the expedition — XP will be granted when player collects
                const rewards = getExpeditionRewards(expedition.instance, expedition.creatures.length)

                expedition.completed = true
                expedition.success = true
                expedition.rewards = rewards

                // Track expedition statistics
                if (state.statistics?.expeditions) {
                    state.statistics.expeditions.total++
                    state.statistics.expeditions.successful++

                    // Calculate and track highest party score
                    try {
                        const creatures = state.creatures.filter((c) => expedition.creatures.includes(c.id))
                        if (creatures.length > 0) {
                            const partyScore = generatePartyScore(creatures, expedition.instance)
                            if (partyScore > state.statistics.expeditions.highestPartyScore) {
                                state.statistics.expeditions.highestPartyScore = partyScore
                            }
                        }
                    } catch (error) {
                        // Skip if calculation fails
                    }
                }
            }
            // If not complete, do nothing — no partial XP, progress is implicit from startTime vs duration
        }
    }
}

const processDungeonsOffline = (
    state: State,
    simulatedTime: number,
    itemsGained: Map<string, number>,
    lastSaveTime: number | null
): void => {
    if (!state.dungeons?.activeDungeons || state.dungeons.activeDungeons.length === 0) {
        return
    }

    const currentTime = Date.now() / 1000

    // Process each dungeon — iterate backwards since we may remove entries
    for (let i = state.dungeons.activeDungeons.length - 1; i >= 0; i--) {
        const dungeon = state.dungeons.activeDungeons[i]

        if (dungeon.completed && !dungeon.loop) continue

        const elapsedBefore =
            lastSaveTime && dungeon.startTime <= lastSaveTime ? lastSaveTime - dungeon.startTime : 0
        let remainingDuration = Math.max(0, dungeon.duration - elapsedBefore)

        if (dungeon.loop) {
            let remainingSimulatedTime = simulatedTime
            let currentRemainingDuration = remainingDuration
            let completedAtLeastOnce = false

            while (remainingSimulatedTime > 0 && currentRemainingDuration <= remainingSimulatedTime) {
                completedAtLeastOnce = true

                // Generate and collect rewards
                const grade = getDungeonGrade(dungeon.partyScore, dungeon.tier)
                const rewards = getDungeonRewards(dungeon.tier, dungeon.focus, grade, dungeon.gatheringSkill)

                if (rewards.items.length > 0) {
                    combineInventoryWithDiscovery(state, rewards.items)
                    rewards.items.forEach((item) => {
                        const currentAmount = itemsGained.get(item.id) || 0
                        itemsGained.set(item.id, currentAmount + item.amount)
                    })
                }

                // Grant creature XP
                if (rewards.creatureExperience > 0) {
                    let totalXpGiven = 0
                    for (const creatureId of dungeon.creatures) {
                        const creature = state.creatures.find((c) => c.id === creatureId)
                        if (creature) {
                            const maxXp = getCreatureMaxXp(creature)
                            const xpBefore = creature.experience
                            creature.experience = Math.min(creature.experience + rewards.creatureExperience, maxXp)
                            totalXpGiven += creature.experience - xpBefore
                        }
                    }
                    if (totalXpGiven > 0 && state.statistics) {
                        if (typeof state.statistics.totalCreatureXP !== 'number') {
                            state.statistics.totalCreatureXP = 0
                        }
                        state.statistics.totalCreatureXP += totalXpGiven
                    }
                }

                // Track completion
                if (!state.dungeons.completions) state.dungeons.completions = {}
                state.dungeons.completions[dungeon.tier] = (state.dungeons.completions[dungeon.tier] || 0) + 1

                remainingSimulatedTime -= currentRemainingDuration

                // Check armor for next run
                const armorItem = state.inventory.find((item) => item.id === DungeonConfig.ARMOR_ITEM_ID)
                if (!armorItem || armorItem.amount < dungeon.creatures.length) {
                    // Not enough armor — stop looping
                    dungeon.loop = false
                    dungeon.completed = true
                    dungeon.rewards = rewards
                    dungeon.startTime = currentTime - remainingSimulatedTime
                    break
                }

                // Consume armor for next run
                changeInventory(state, {
                    resources: [{ id: DungeonConfig.ARMOR_ITEM_ID, amount: -dungeon.creatures.length }],
                })

                // Recalculate score (creatures may have leveled)
                const creatures = state.creatures.filter((c) => dungeon.creatures.includes(c.id))
                dungeon.partyScore = calculateDungeonPartyScore(creatures, dungeon.focus)
                dungeon.grade = getDungeonGrade(dungeon.partyScore, dungeon.tier)
                dungeon.loopCount++
                dungeon.completed = false
                dungeon.rewards = null

                currentRemainingDuration = DungeonConfig.DURATION
            }

            if (completedAtLeastOnce && !dungeon.completed) {
                dungeon.startTime = currentTime - remainingSimulatedTime
            } else if (!completedAtLeastOnce) {
                dungeon.startTime = currentTime - (elapsedBefore + simulatedTime)
            }
        } else {
            // Non-looping: check if it completes during offline time
            if (remainingDuration <= simulatedTime) {
                const grade = getDungeonGrade(dungeon.partyScore, dungeon.tier)
                const rewards = getDungeonRewards(dungeon.tier, dungeon.focus, grade, dungeon.gatheringSkill)

                dungeon.completed = true
                dungeon.rewards = rewards
                dungeon.grade = grade

                // Auto-collect rewards
                if (rewards.items.length > 0) {
                    combineInventoryWithDiscovery(state, rewards.items)
                    rewards.items.forEach((item) => {
                        const currentAmount = itemsGained.get(item.id) || 0
                        itemsGained.set(item.id, currentAmount + item.amount)
                    })
                }

                // Grant creature XP
                if (rewards.creatureExperience > 0) {
                    let totalXpGiven = 0
                    for (const creatureId of dungeon.creatures) {
                        const creature = state.creatures.find((c) => c.id === creatureId)
                        if (creature) {
                            const maxXp = getCreatureMaxXp(creature)
                            const xpBefore = creature.experience
                            creature.experience = Math.min(creature.experience + rewards.creatureExperience, maxXp)
                            totalXpGiven += creature.experience - xpBefore
                        }
                    }
                    if (totalXpGiven > 0 && state.statistics) {
                        if (typeof state.statistics.totalCreatureXP !== 'number') {
                            state.statistics.totalCreatureXP = 0
                        }
                        state.statistics.totalCreatureXP += totalXpGiven
                    }
                }

                // Track completion
                if (!state.dungeons.completions) state.dungeons.completions = {}
                state.dungeons.completions[dungeon.tier] = (state.dungeons.completions[dungeon.tier] || 0) + 1

                // Remove from active
                state.dungeons.activeDungeons.splice(i, 1)
            }
        }
    }
}

export const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`
    } else {
        return `${secs}s`
    }
}

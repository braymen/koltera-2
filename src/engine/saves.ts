import cloneDeep from 'lodash.clonedeep'
import * as V0 from './versions/v0'
import * as V1 from './versions/v1'
import { State } from './types'
import ItemsContent from '@data/items'
import CreaturesContent from '@data/creatures'

const gameLog = (message: string) => {
    window.api?.log?.('info', message)?.catch(() => {})
}
const gameLogError = (message: string) => {
    window.api?.log?.('error', message)?.catch(() => {})
}

export const CURRENT_VERSION = V1
export const DEFAULT_SAVE: State = CURRENT_VERSION.DefaultSave
export type DEFAULT_SAVE_TYPE = V1.StateV1

export const load = (): Promise<State> => {
    return new Promise<State>((res, rej) => {
        gameLog('Saves.load: requesting save data from main process')
        window.api
            .load()
            .then((json: object) => {
                if (json) {
                    gameLog('Saves.load: save data received, running version migration')
                    try {
                        const versioned = version(json as State)
                        gameLog('Saves.load: version migration complete, patching with defaults')
                        const patched = patch(versioned, DEFAULT_SAVE as object) as State
                        gameLog('Saves.load: patch complete, save loaded successfully')
                        return res(patched)
                    } catch (err) {
                        gameLogError('Saves.load: error during version/patch: ' + String(err))
                        return res(cloneDeep(DEFAULT_SAVE))
                    }
                }
                gameLog('Saves.load: no save data found, using default save')
                res(cloneDeep(DEFAULT_SAVE))
            })
            .catch((err: any) => {
                gameLogError('Saves.load: failed to load save data: ' + String(err))
                res(cloneDeep(DEFAULT_SAVE))
            })
    })
}

export const save = (state: State): void => {
    window.api.save(state)
}

export const remove = () => {
    window.api.remove()
}

export const patch = (json: object, defaultJSON: object): object => {
    function isObject(item: any) {
        return item && typeof item === 'object' && !Array.isArray(item)
    }

    function isEmptyObject(obj: any): boolean {
        return isObject(obj) && Object.keys(obj).length === 0
    }

    for (let key in json) {
        if (!defaultJSON.hasOwnProperty(key)) {
            delete json[key as keyof object]
        } else if (isObject(json[key as keyof object]) && isObject(defaultJSON[key as keyof object])) {
            // Only recursively patch if the default object is not empty
            // Empty default objects (like {}) should preserve all keys from saved data
            if (!isEmptyObject(defaultJSON[key as keyof object])) {
                patch(json[key as keyof object], defaultJSON[key as keyof object])
            }
        }
    }

    for (let key in defaultJSON) {
        if (!json.hasOwnProperty(key)) {
            json[key as keyof object] = defaultJSON[key as keyof object]
        } else if (isObject(json[key as keyof object]) && isObject(defaultJSON[key as keyof object])) {
            // Only recursively patch if the default object is not empty
            // Empty default objects (like {}) should preserve all keys from saved data
            if (!isEmptyObject(defaultJSON[key as keyof object])) {
                patch(json[key as keyof object], defaultJSON[key as keyof object])
            }
        }
    }
    return json
}

export const version = (json: State): State => {
    let state = json
    gameLog('version: current save version is ' + state.version)

    // Version 0 to 1
    if (state.version === 0) {
        state = cloneDeep(V1.convertPreviousVersion(state as V0.State))
    }

    // Version 1 to 2
    if (state.version === 1) {
        state.version = 2
        // const gold = state.inventory.find((item) => item.id === 'gold')
        // const totalCollectibles = state.collections!.collectibles!.length
        // if (gold) {
        //     gold.amount += totalCollectibles * 25000
        // } else {
        //     state.inventory.push({
        //         id: 'gold',
        //         amount: totalCollectibles * 25000,
        //     })
        // }
    }

    // Version 2 to 3
    if (state.version === 2) {
        state.version = 3
        state.garden.flowers = state.garden.flowers.filter((flower) => flower.flowerId !== 'wildflower')
    }

    // Version 3 to 4
    if (state.version === 3) {
        state.version = 4
    }

    // Version 4 to 5
    if (state.version === 4) {
        state.version = 5
        state.story.unlockedTabs = [...state.story.unlockedTabs, 'Digging', 'Fishing', 'Farming', 'Stove']
        if (state.inventory.find((i) => i.id === 'awaken-points'))
            state.story.unlockedTabs = [...state.story.unlockedTabs, 'Sanctuary', 'Awaken Tree']
        state.inventory.push({ id: 'braymens-letter', amount: 1 })
        state.garden.flowers = state.garden.flowers.filter((flower) => flower.flowerId !== 'life-flower')
        state.garden.flowers = state.garden.flowers.filter((flower) => flower.flowerId !== 'wildflower')
    }

    // Version 5 to 6
    if (state.version === 5) {
        state.version = 6
        // Refund charms for tier0 and tier1 creatures
        for (const creature of state.creatures) {
            const content = CreaturesContent.getById(creature.species)
            if (!content) continue
            const charmCost = content.summoningCost.find((c) => c.id.endsWith('-charm'))
            if (!charmCost) continue
            let refund = 0
            if (content.tier === 0) refund = 20
            else if (content.tier === 1) refund = 25
            if (refund > 0) {
                const existing = state.inventory.find((i) => i.id === charmCost.id)
                if (existing) existing.amount += refund
                else state.inventory.push({ id: charmCost.id, amount: refund })
            }
        }

        // Add charm crates from tutorial
        const charmCrates = state.inventory.find((i) => i.id === 'charm-crate')
        if (charmCrates) charmCrates.amount += 4
        else state.inventory.push({ id: 'charm-crate', amount: 4 })
    }

    // Version 6 to 7
    if (state.version === 6) {
        state.version = 7
        const charmCrates = state.inventory.find((i) => i.id === 'task-board-reset-potion')
        if (charmCrates) charmCrates.amount += 1
        else state.inventory.push({ id: 'task-board-reset-potion', amount: 1 })
    }

    // Version 7 to 8
    if (state.version === 7) {
        state.version = 8
        const item = state.inventory.find((i) => i.id === 'treasure-chest')
        if (item) item.amount += 25
        else state.inventory.push({ id: 'treasure-chest', amount: 25 })

        // Cancel dungeon-key crafting from all workstations and refund ingredients (recipe removed)
        const dungeonKeyIngredients = [
            { id: 'key-fragment', amount: 128 },
            { id: 'legacy-fragment', amount: 128 },
            { id: 'arcanum-bar', amount: 8 },
            { id: 'dungeon-core', amount: 32 },
            { id: 'armor-set', amount: 1 },
        ]
        const refundIngredients = (ingredients: { id: string; amount: number }[], multiplier: number) => {
            for (const ing of ingredients) {
                const refundAmount = ing.amount * multiplier
                const existing = state.inventory.find((i) => i.id === ing.id)
                if (existing) existing.amount += refundAmount
                else state.inventory.push({ id: ing.id, amount: refundAmount })
            }
        }
        const workstations = ['furnace', 'stove', 'workbench'] as const
        for (const ws of workstations) {
            const crafter = state[ws]
            // Refund and cancel active dungeon-key crafting
            if (crafter.item?.id === 'dungeon-key') {
                const remaining = crafter.amount - (crafter.completedItems || 0)
                const activeJob = crafter.queue?.[0]
                const ingredients =
                    activeJob?.itemId === 'dungeon-key' && activeJob?.recipe?.ingredients
                        ? activeJob.recipe.ingredients
                        : dungeonKeyIngredients
                if (remaining > 0) refundIngredients(ingredients, remaining)
                // Remove active job from queue
                if (crafter.queue?.length > 0 && crafter.queue[0].itemId === 'dungeon-key') {
                    crafter.queue.shift()
                }
                crafter.isActive = false
                crafter.item = null
                crafter.progress = 0
                crafter.duration = 0
                crafter.startTime = null
                crafter.amount = 0
                crafter.completedItems = 0
                crafter.singleItemDuration = 0
            }
            // Refund and remove dungeon-key from queue (non-active jobs)
            for (const job of crafter.queue?.filter((j: any) => j.itemId === 'dungeon-key') || []) {
                const ingredients = job.recipe?.ingredients || dungeonKeyIngredients
                refundIngredients(ingredients, job.amount)
            }
            crafter.queue = crafter.queue.filter((job: any) => job.itemId !== 'dungeon-key')
        }
    }

    // Version 8 to 9
    if (state.version === 8) {
        state.version = 9
        // Convert workstation yield upgrades to recovery upgrades
        const yieldToRecovery: Record<string, string> = {
            'workbench-yield-i': 'workbench-recovery-i',
            'workbench-yield-ii': 'workbench-recovery-ii',
            'furnace-yield-i': 'furnace-recovery-i',
            'furnace-yield-ii': 'furnace-recovery-ii',
            'stove-yield-i': 'stove-recovery-i',
            'stove-yield-ii': 'stove-recovery-ii',
        }
        state.purchasedUpgrades = state.purchasedUpgrades.map((id) => yieldToRecovery[id] || id)
    }

    // Version 9 to 10
    if (state.version === 9) {
        state.version = 10
        // Convert merchantDailyPurchases to merchantWeeklyPurchases
        const oldData = (state as any).merchantDailyPurchases
        if (oldData) {
            state.merchantWeeklyPurchases = {
                resetTimestamp: 0,
                purchases: {},
            }
            delete (state as any).merchantDailyPurchases
        }
    }

    // Version 10 to 11
    if (state.version === 10) {
        state.version = 11
        if (!state.story!.unlockedTabs.find((s) => s === 'Awaken Tree')) state.story!.unlockedTabs.push('Awaken Tree')
        const charmCrates = state.inventory.find((i) => i.id === 'awaken-tree-reset-potion')
        if (charmCrates) charmCrates.amount += 1
        else state.inventory.push({ id: 'awaken-tree-reset-potion', amount: 1 })
    }

    // Verison 11 to 12
    if (state.version === 11) {
        state.version = 12
        if (!state.story!.unlockedTabs.find((s) => s === 'Awaken Tree')) state.story!.unlockedTabs.push('Awaken Tree')
    }

    // Version 12 to 13 — Expedition system overhaul: clear active expeditions (XP model changed)
    if (state.version === 12) {
        state.version = 13
        state.activeExpeditions = []
    }

    // Version 13 to 14 — Expedition system overhaul: clear active expeditions (XP model changed)
    if (state.version === 13) {
        state.version = 14
        state.activeExpeditions = []
        const charmCrates = state.inventory.find((i) => i.id === 'awaken-tree-reset-potion')
        if (charmCrates) charmCrates.amount += 1
        else state.inventory.push({ id: 'awaken-tree-reset-potion', amount: 1 })
        // REFUND 1 water vial per water bucket a player has
        const waterBuckets = state.inventory.find((i) => i.id === 'water-bucket')
        if (waterBuckets && waterBuckets.amount > 0) {
            const existing = state.inventory.find((i) => i.id === 'water-vial')
            if (existing) existing.amount += waterBuckets.amount
            else state.inventory.push({ id: 'water-vial', amount: waterBuckets.amount })
        }
        // REFUND 2 hide per leather a player has
        const leather = state.inventory.find((i) => i.id === 'leather')
        if (leather && leather.amount > 0) {
            const existing = state.inventory.find((i) => i.id === 'hide')
            if (existing) existing.amount += leather.amount * 2
            else state.inventory.push({ id: 'hide', amount: leather.amount * 2 })
        }
    }

    // Version 14 to 15 — Unlock Machines tab for existing players
    if (state.version === 14) {
        state.version = 15
        if (!state.story!.unlockedTabs.includes('Machines')) {
            state.story!.unlockedTabs.push('Machines')
        }
        if (!state.story!.unlockedTabs.includes('Dungeons')) {
            state.story!.unlockedTabs.push('Dungeons')
        }
        if (!state.story!.unlockedTabs.includes('Tools')) {
            state.story!.unlockedTabs.push('Tools')
        }

        // Unlock Milestones tab for existing players
        if (!state.story!.unlockedTabs.includes('Milestones')) {
            state.story!.unlockedTabs.push('Milestones')
        }

        // Unlock Tools tab for existing players
        if (!state.story!.unlockedTabs.includes('Tools')) {
            state.story!.unlockedTabs.push('Tools')
        }

        // Unlock Tools tab for existing players
        // if (!state.story!.unlockedTabs.includes('Fabrication')) {
        //     state.story!.unlockedTabs.push('Fabrication')
        // }

        // Helper to add items to inventory
        const addItem = (id: string, amount: number) => {
            if (amount <= 0) return
            const existing = state.inventory.find((i) => i.id === id)
            if (existing) existing.amount += amount
            else state.inventory.push({ id, amount })
        }

        // Refunds for food summons per creature summoned
        const foodRefundPerTier: Record<number, number> = { 2: 300, 3: 300, 4: 400, 5: 400 }
        const foodItemIds = new Set([
            'cooked-meat',
            'cooked-fish',
            'cheese',
            'meat-stew',
            'bread',
            'cheeseburger',
            'canned-food',
            'cooked-crab',
            'carrot-cake',
        ])
        for (const creature of state.creatures) {
            const content = CreaturesContent.getById(creature.species)
            if (!content) continue
            const refundAmount = foodRefundPerTier[content.tier]
            if (!refundAmount) continue
            const foodCost = content.summoningCost.find((c) => foodItemIds.has(c.id))
            if (foodCost) {
                addItem(foodCost.id, refundAmount)
            }
        }

        // Refund 4 onions per veggie mix and 8 onions per meat stew
        const veggieMix = state.inventory.find((i) => i.id === 'veggie-mix')
        if (veggieMix && veggieMix.amount > 0) {
            addItem('onion', veggieMix.amount * 4)
        }
        const meatStew = state.inventory.find((i) => i.id === 'meat-stew')
        if (meatStew && meatStew.amount > 0) {
            addItem('onion', meatStew.amount * 8)
        }

        // Refund 1 empty can per veggie mix and 1 empty can per meat stew
        if (veggieMix && veggieMix.amount > 0) {
            addItem('empty-can', veggieMix.amount)
        }
        if (meatStew && meatStew.amount > 0) {
            addItem('empty-can', meatStew.amount)
        }

        // Refund for each furnace bar they have, 8 of that ore
        const barToOre: Record<string, string> = {
            'copper-bar': 'copper-ore',
            'tin-bar': 'tin-ore',
            'iron-bar': 'iron-ore',
            'silver-bar': 'silver-ore',
            'gold-bar': 'gold-ore',
            'platinum-bar': 'platinum-ore',
            'adamantite-bar': 'adamantite-ore',
            'runic-bar': 'runic-ore',
            'solarite-bar': 'solarite-ore',
            'arcanum-bar': 'arcanum-ore',
        }
        for (const [barId, oreId] of Object.entries(barToOre)) {
            const bar = state.inventory.find((i) => i.id === barId)
            if (bar && bar.amount > 0) {
                addItem(oreId, bar.amount * 8)
            }
        }

        // Refund 1 leather for each flour, 2 leather for each bread, 4 leather each cheeseburger
        const flour = state.inventory.find((i) => i.id === 'flour')
        if (flour && flour.amount > 0) {
            addItem('leather', flour.amount)
        }
        const bread = state.inventory.find((i) => i.id === 'bread')
        if (bread && bread.amount > 0) {
            addItem('leather', bread.amount * 2)
        }
        const cheeseburger = state.inventory.find((i) => i.id === 'cheeseburger')
        if (cheeseburger && cheeseburger.amount > 0) {
            addItem('leather', cheeseburger.amount * 4)
        }
    }

    // Version 15 to 16 — Unlock Machines tab for existing players
    if (state.version === 15) {
        state.version = 16
        if (!state.story!.unlockedTabs.includes('Fabrication')) {
            state.story!.unlockedTabs.push('Fabrication')
        }
        const charmCrates = state.inventory.find((i) => i.id === 'awaken-tree-reset-potion')
        if (charmCrates) charmCrates.amount += 1
        else state.inventory.push({ id: 'awaken-tree-reset-potion', amount: 1 })
    }

    if (state.version === 16) {
        state.version = 17

        const addItem = (id: string, amount: number) => {
            if (amount <= 0) return
            const existing = state.inventory.find((i) => i.id === id)
            if (existing) existing.amount += amount
            else state.inventory.push({ id, amount })
        }

        // Grant new bar rewards for already-claimed item milestones
        const itemMilestoneRewards: Record<string, { itemId: string; amount: number }> = {
            'items-1': { itemId: 'copper-bar', amount: 100 },
            'items-2': { itemId: 'tin-bar', amount: 200 },
            'items-3': { itemId: 'iron-bar', amount: 300 },
            'items-4': { itemId: 'silver-bar', amount: 400 },
            'items-5': { itemId: 'gold-bar', amount: 500 },
            'items-6': { itemId: 'platinum-bar', amount: 600 },
            'items-7': { itemId: 'adamantite-bar', amount: 700 },
            'items-8': { itemId: 'runic-bar', amount: 800 },
            'items-9': { itemId: 'solarite-bar', amount: 900 },
            'items-10': { itemId: 'arcanum-bar', amount: 1000 },
        }

        for (const [milestoneId, reward] of Object.entries(itemMilestoneRewards)) {
            if (state.milestones?.includes(milestoneId)) {
                addItem(reward.itemId, reward.amount)
            }
        }

        // Grant gold difference for already-claimed creature milestones
        const creatureGoldDiffs: Record<string, number> = {
            'creatures-2': 10000,
            'creatures-3': 20000,
            'creatures-4': 30000,
            'creatures-5': 40000,
            'creatures-6': 50000,
            'creatures-7': 60000,
            'creatures-8': 70000,
            'creatures-9': 80000,
        }

        for (const [milestoneId, goldDiff] of Object.entries(creatureGoldDiffs)) {
            if (state.milestones?.includes(milestoneId)) {
                addItem('gold', goldDiff)
            }
        }
    }

    if (state.version === 17) {
        state.version = 18

        // Refund stone for type stones (128 stone each, previously free → 896 per stone = 128 * 7 refund difference)
        const typeStones = ['fire-stone', 'water-stone', 'earth-stone', 'wind-stone']
        let stoneRefund = 0
        for (const stoneId of typeStones) {
            const item = state.inventory.find((i) => i.id === stoneId)
            if (item && item.amount > 0) {
                stoneRefund += item.amount * 896
            }
        }
        // Refund stone for infinity stones (4 type stones * 896 = 3584 per infinity stone)
        const infinityStone = state.inventory.find((i) => i.id === 'infinity-stone')
        if (infinityStone && infinityStone.amount > 0) {
            stoneRefund += infinityStone.amount * 3584
        }
        if (stoneRefund > 0) {
            const existing = state.inventory.find((i) => i.id === 'stone')
            if (existing) existing.amount += stoneRefund
            else state.inventory.push({ id: 'stone', amount: stoneRefund })
        }
    }

    if (state.version === 18) {
        state.version = 19
        if (!state.story!.unlockedTabs.includes('Dirt to Riches')) {
            state.story!.unlockedTabs.push('Dirt to Riches')
        }
    }

    // Version 19 to 20 — Rebalance: refund old summoning food costs for changed creatures
    if (state.version === 19) {
        state.version = 20

        const addItem = (id: string, amount: number) => {
            if (amount <= 0) return
            const existing = state.inventory.find((i) => i.id === id)
            if (existing) existing.amount += amount
            else state.inventory.push({ id, amount })
        }

        // Tier 2 (code): cooked-meat → cheese — refund 600 cooked-meat each
        const oldCookedMeatT2 = new Set(['koral', 'mooyak', 'peak', 'corala', 'kroko', 'peach'])
        // Tier 3 (code): cheese → canned-food — refund 1000 cheese each
        const oldCheeseT3 = new Set(['porkie', 'mantis', 'pandy', 'nutty', 'diamond', 'skipper'])
        // Tier 3 (code): meat-stew → cooked-crab — refund 1000 meat-stew each
        const oldMeatStewT3 = new Set(['rumble', 'snooze', 'pudge', 'rookie', 'wally', 'twilight'])
        // Tier 4 (code): canned-food → carrot-cake — refund 1400 canned-food each
        const oldCannedFoodT4 = new Set(['astra', 'shelldon', 'ruff', 'porkchop', 'wooly', 'scruff', 'zorb', 'snowby'])
        // Tier 5 (code): cooked-crab → meat-stew/fish-dinner — refund 1800 cooked-crab each
        const oldCookedCrabT5 = new Set([
            'ivan',
            'clad',
            'kong',
            'rusty',
            'firebelly',
            'midnight',
            'cackle',
            'hedge',
            'sarge',
            'tooth',
            'gale',
            'lilith',
        ])
        // Tier 5 (code): carrot-cake → meat-stew/fish-dinner — refund 1800 carrot-cake each
        const oldCarrotCakeT5 = new Set(['kragg', 'blitz', 'ravager', 'pippy', 'quill', 'coralite', 'orango', 'rocket'])

        for (const creature of state.creatures) {
            const id = creature.species
            if (oldCookedMeatT2.has(id)) {
                addItem('cooked-meat', 600)
            } else if (oldCheeseT3.has(id)) {
                addItem('cheese', 1000)
            } else if (oldMeatStewT3.has(id)) {
                addItem('meat-stew', 1000)
            } else if (oldCannedFoodT4.has(id)) {
                addItem('canned-food', 1400)
            } else if (oldCookedCrabT5.has(id)) {
                addItem('cooked-crab', 1800)
            } else if (oldCarrotCakeT5.has(id)) {
                addItem('carrot-cake', 1800)
            }
        }

        // Refund tool upgrade cost differences (old costs were double the new costs)
        // Old: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
        // New: [50, 100, 150, 200, 250, 300, 350, 400, 450, 500]
        // Diff per level: [50, 100, 150, 200, 250, 300, 350, 400, 450, 500]
        const toolBarIds = [
            'copper-bar',
            'tin-bar',
            'iron-bar',
            'silver-bar',
            'gold-bar',
            'platinum-bar',
            'adamantite-bar',
            'runic-bar',
            'solarite-bar',
            'arcanum-bar',
        ]
        const toolDiffs = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500]
        const toolIds = [
            'axe',
            'pickaxe',
            'machete',
            'shovel',
            'fishing-pole',
            'pitchfork',
            'sword',
            'staff',
            'hammer',
            'saw',
            'knife',
        ]
        for (const toolId of toolIds) {
            const level = (state.tools as any)?.[toolId] || 0
            for (let i = 0; i < level && i < toolDiffs.length; i++) {
                addItem(toolBarIds[i], toolDiffs[i])
            }
        }

        // Refund machine upgrade cost differences (200 bar + 200 planks per level)
        // Old: [300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200] (bar + planks each)
        // New: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
        // Diff per level: 200 of corresponding bar + 200 planks
        const machines = (state.machines as any)?.machines || {}
        for (const machineId of Object.keys(machines)) {
            const machine = machines[machineId]
            if (!machine?.purchased) continue
            const level = machine.level || 0
            for (let i = 0; i < level && i < toolBarIds.length; i++) {
                addItem(toolBarIds[i], 200)
                addItem('planks', 200)
            }
        }

        const workstationKeys = ['furnace', 'stove', 'workbench'] as const
        for (const ws of workstationKeys) {
            const crafter = state[ws]
            if (crafter?.queue) {
                for (const job of crafter.queue) {
                    if (!job.id) {
                        job.id = Date.now().toString(36) + Math.random().toString(36).slice(2)
                    }
                }
            }
        }
    }

    // Version 20 to 21 — Retroactive hide refunds for leather-based recipes and creature summons
    if (state.version === 20) {
        state.version = 21

        const addItem = (id: string, amount: number) => {
            if (amount <= 0) return
            const existing = state.inventory.find((i) => i.id === id)
            if (existing) existing.amount += amount
            else state.inventory.push({ id, amount })
        }

        // Refund hides for inventory items in the leather dependency chain
        // leather = 1 hide, flour = 1 leather, bread = 2 flour, fish-dinner = 2 flour,
        // carrot-cake = 4 flour, cheeseburger = 2 bread = 4 flour
        const hideRefundPerItem: Record<string, number> = {
            leather: 1,
            flour: 1,
            bread: 2,
            'fish-dinner': 2,
            'carrot-cake': 4,
            cheeseburger: 4,
        }
        for (const [itemId, hidesPerItem] of Object.entries(hideRefundPerItem)) {
            const item = state.inventory.find((i) => i.id === itemId)
            if (item && item.amount > 0) {
                addItem('hide', item.amount * hidesPerItem)
            }
        }

        // Refund hides for summoned creatures that consumed leather-chain items
        // T3: 1000 bread × 2 hides = 2000 hides per creature
        const breadT3 = new Set(['terra', 'joeyroo', 'chomp', 'rascal', 'chonk', 'finn', 'nari', 'prism'])
        // T4: 1400 cheeseburger × 4 hides = 5600 hides per creature
        const cheeseburgerT4 = new Set([
            'kango',
            'brunk',
            'skitter',
            'naria',
            'fleece',
            'bram',
            'bandit',
            'bill',
            'floe',
            'blorp',
            'twitch',
            'mothie',
        ])
        // T4: 1400 carrot-cake × 4 hides = 5600 hides per creature
        const carrotCakeT4 = new Set(['astra', 'shelldon', 'ruff', 'porkchop', 'wooly', 'scruff', 'zorb', 'snowby'])
        // T5: 1800 fish-dinner × 2 hides = 3600 hides per creature
        const fishDinnerT5 = new Set(['clad', 'rusty', 'ravager', 'midnight', 'hedge', 'tooth', 'lilith', 'rocket'])

        for (const creature of state.creatures) {
            const id = creature.species
            if (breadT3.has(id)) {
                addItem('hide', 2000)
            } else if (cheeseburgerT4.has(id)) {
                addItem('hide', 5600)
            } else if (carrotCakeT4.has(id)) {
                addItem('hide', 5600)
            } else if (fishDinnerT5.has(id)) {
                addItem('hide', 3600)
            }
        }

        // Refund 1 hammer per armor-set in inventory (recipe no longer requires hammer)
        const armorSets = state.inventory.find((i) => i.id === 'armor-set')
        if (armorSets && armorSets.amount > 0) {
            addItem('hammer', armorSets.amount)
        }

        // Refund bar/plank differences for armor recipe rebalance:
        // - helmet: 16 bars -> 1 bar (refund 15 per helmet)
        // - chestplate: 32 bars -> 2 bars (refund 30 per chestplate)
        // - boots: 16 bars -> 1 bar (refund 15 per boots)
        // - armor-set planks: 16 -> 4 (refund 12 planks per armor-set)
        // Since we don't know which bar tier was used, refund as iron-bar (neutral middle).
        const helmetInv = state.inventory.find((i) => i.id === 'helmet')
        if (helmetInv && helmetInv.amount > 0) {
            addItem('iron-bar', helmetInv.amount * 15)
        }
        const chestplateInv = state.inventory.find((i) => i.id === 'chestplate')
        if (chestplateInv && chestplateInv.amount > 0) {
            addItem('iron-bar', chestplateInv.amount * 30)
        }
        const bootsInv = state.inventory.find((i) => i.id === 'boots')
        if (bootsInv && bootsInv.amount > 0) {
            addItem('iron-bar', bootsInv.amount * 15)
        }
        // Armor-sets embed a helmet+chestplate+boots that were already crafted (consumed)
        // plus 16 planks (now 4). Refund component bar diffs (15+30+15 = 60 iron-bar) + 12 planks.
        if (armorSets && armorSets.amount > 0) {
            addItem('iron-bar', armorSets.amount * 60)
            addItem('planks', armorSets.amount * 12)
        }

        // Refund 1 veggie-mix per meat-stew in inventory (recipe changed from 2 to 1 veggie-mix)
        const meatStewInv = state.inventory.find((i) => i.id === 'meat-stew')
        if (meatStewInv && meatStewInv.amount > 0) {
            addItem('veggie-mix', meatStewInv.amount)
        }

        // Refund 1 veggie-mix per meat-stew consumed by summoned creatures (1800 meat-stew each)
        const meatStewCreatures = new Set([
            'ivan',
            'kragg',
            'kong',
            'blitz',
            'firebelly',
            'pippy',
            'cackle',
            'quill',
            'sarge',
            'coralite',
            'gale',
            'orango',
        ])
        for (const creature of state.creatures) {
            if (meatStewCreatures.has(creature.species)) {
                addItem('veggie-mix', 1800)
            }
        }

        // Refund 100 of the food item per summoned t5 creature (tier4.ts)
        const t5FoodMap: Record<string, string> = {
            kango: 'cheeseburger',
            brunk: 'cheeseburger',
            skitter: 'cheeseburger',
            naria: 'cheeseburger',
            fleece: 'cheeseburger',
            bram: 'cheeseburger',
            bandit: 'cheeseburger',
            bill: 'cheeseburger',
            floe: 'cheeseburger',
            blorp: 'cheeseburger',
            twitch: 'cheeseburger',
            mothie: 'cheeseburger',
            astra: 'carrot-cake',
            shelldon: 'carrot-cake',
            ruff: 'carrot-cake',
            porkchop: 'carrot-cake',
            wooly: 'carrot-cake',
            scruff: 'carrot-cake',
            zorb: 'carrot-cake',
            snowby: 'carrot-cake',
        }
        for (const creature of state.creatures) {
            const foodId = t5FoodMap[creature.species]
            if (foodId) addItem(foodId, 100)
        }

        // Refund 300 of the food item per summoned t6 creature (tier5.ts)
        const t6FoodMap: Record<string, string> = {
            ivan: 'meat-stew',
            kragg: 'meat-stew',
            kong: 'meat-stew',
            blitz: 'meat-stew',
            firebelly: 'meat-stew',
            pippy: 'meat-stew',
            cackle: 'meat-stew',
            quill: 'meat-stew',
            sarge: 'meat-stew',
            coralite: 'meat-stew',
            gale: 'meat-stew',
            orango: 'meat-stew',
            clad: 'fish-dinner',
            rusty: 'fish-dinner',
            ravager: 'fish-dinner',
            midnight: 'fish-dinner',
            hedge: 'fish-dinner',
            tooth: 'fish-dinner',
            lilith: 'fish-dinner',
            rocket: 'fish-dinner',
        }
        for (const creature of state.creatures) {
            const foodId = t6FoodMap[creature.species]
            if (foodId) addItem(foodId, 300)
        }

        if (!state.story!.unlockedTabs.includes('Dungeons')) {
            state.story!.unlockedTabs.push('Dungeons')
        }
    }

    // Remove non-existent items from inventory
    state.inventory = state.inventory.filter((item) => ItemsContent.getById(item.id))
    state.collections.items = state.collections.items.filter((item) => ItemsContent.getById(item))

    return state
}

const Saves = {
    load,
    save,
    remove,
}

export default Saves

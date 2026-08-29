import { MachineDefinition, MachineId, MachineRecipe } from '@modules/machines/types'

// All 10 ore-to-bar smelting recipes (8 ore → 1 bar, no coal or hammers)
const SMELTER_RECIPES: MachineRecipe[] = [
    { inputItemId: 'copper-ore', inputAmount: 8, outputItemId: 'copper-bar', outputAmount: 1 },
    { inputItemId: 'tin-ore', inputAmount: 8, outputItemId: 'tin-bar', outputAmount: 1 },
    { inputItemId: 'iron-ore', inputAmount: 8, outputItemId: 'iron-bar', outputAmount: 1 },
    { inputItemId: 'silver-ore', inputAmount: 8, outputItemId: 'silver-bar', outputAmount: 1 },
    { inputItemId: 'gold-ore', inputAmount: 8, outputItemId: 'gold-bar', outputAmount: 1 },
    { inputItemId: 'platinum-ore', inputAmount: 8, outputItemId: 'platinum-bar', outputAmount: 1 },
    { inputItemId: 'adamantite-ore', inputAmount: 8, outputItemId: 'adamantite-bar', outputAmount: 1 },
    { inputItemId: 'runic-ore', inputAmount: 8, outputItemId: 'runic-bar', outputAmount: 1 },
    { inputItemId: 'solarite-ore', inputAmount: 8, outputItemId: 'solarite-bar', outputAmount: 1 },
    { inputItemId: 'arcanum-ore', inputAmount: 8, outputItemId: 'arcanum-bar', outputAmount: 1 },
]

// Greenhouse: selectable generator for farming items + herbs (no input required)
const GREENHOUSE_RECIPES: MachineRecipe[] = [
    { inputItemId: 'basil', inputAmount: 0, outputItemId: 'basil', outputAmount: 1 },
    { inputItemId: 'rosemary', inputAmount: 0, outputItemId: 'rosemary', outputAmount: 1 },
    { inputItemId: 'thyme', inputAmount: 0, outputItemId: 'thyme', outputAmount: 1 },
    { inputItemId: 'grass', inputAmount: 0, outputItemId: 'grass', outputAmount: 1 },
    { inputItemId: 'wheat', inputAmount: 0, outputItemId: 'wheat', outputAmount: 1 },
    { inputItemId: 'carrot', inputAmount: 0, outputItemId: 'carrot', outputAmount: 1 },
    { inputItemId: 'tomato', inputAmount: 0, outputItemId: 'tomato', outputAmount: 1 },
    { inputItemId: 'lettuce', inputAmount: 0, outputItemId: 'lettuce', outputAmount: 1 },
    { inputItemId: 'potato', inputAmount: 0, outputItemId: 'potato', outputAmount: 1 },
    { inputItemId: 'corn', inputAmount: 0, outputItemId: 'corn', outputAmount: 1 },
    { inputItemId: 'eggplant', inputAmount: 0, outputItemId: 'eggplant', outputAmount: 1 },
    { inputItemId: 'onion', inputAmount: 0, outputItemId: 'onion', outputAmount: 1 },
    { inputItemId: 'pepper', inputAmount: 0, outputItemId: 'pepper', outputAmount: 1 },
    { inputItemId: 'pineapple', inputAmount: 0, outputItemId: 'pineapple', outputAmount: 1 },
    { inputItemId: 'mango', inputAmount: 0, outputItemId: 'mango', outputAmount: 1 },
]

// Refinery: processes essences through three tiers (raw→pure, pure→stone, stone→infinity)
const REFINERY_RECIPES: MachineRecipe[] = [
    // Raw → Pure (512 raw → 1 pure, same amounts as Workbench)
    { inputItemId: 'raw-fire-essence', inputAmount: 512, outputItemId: 'pure-fire-essence', outputAmount: 1 },
    { inputItemId: 'raw-water-essence', inputAmount: 512, outputItemId: 'pure-water-essence', outputAmount: 1 },
    { inputItemId: 'raw-earth-essence', inputAmount: 512, outputItemId: 'pure-earth-essence', outputAmount: 1 },
    { inputItemId: 'raw-wind-essence', inputAmount: 512, outputItemId: 'pure-wind-essence', outputAmount: 1 },
    // Pure → Stone (16 pure + 128 stone → 1 elemental stone)
    {
        inputItemId: 'pure-fire-essence',
        inputAmount: 16,
        secondaryInputItemId: 'stone',
        secondaryInputAmount: 128,
        outputItemId: 'fire-stone',
        outputAmount: 1,
    },
    {
        inputItemId: 'pure-water-essence',
        inputAmount: 16,
        secondaryInputItemId: 'stone',
        secondaryInputAmount: 128,
        outputItemId: 'water-stone',
        outputAmount: 1,
    },
    {
        inputItemId: 'pure-earth-essence',
        inputAmount: 16,
        secondaryInputItemId: 'stone',
        secondaryInputAmount: 128,
        outputItemId: 'earth-stone',
        outputAmount: 1,
    },
    {
        inputItemId: 'pure-wind-essence',
        inputAmount: 16,
        secondaryInputItemId: 'stone',
        secondaryInputAmount: 128,
        outputItemId: 'wind-stone',
        outputAmount: 1,
    },
    // Stone → Infinity (1 of each stone, no night-shards)
    // {
    //     inputItemId: 'fire-stone',
    //     inputAmount: 1,
    //     secondaryInputItemId: 'water-stone',
    //     secondaryInputAmount: 1,
    //     extraInputs: [
    //         { itemId: 'earth-stone', amount: 1 },
    //         { itemId: 'wind-stone', amount: 1 },
    //     ],
    //     outputItemId: 'infinity-stone',
    //     outputAmount: 1,
    // },
]

// Bakery: flour + egg → bread without water-bucket or coal
const BAKERY_RECIPES: MachineRecipe[] = [
    {
        inputItemId: 'wheat',
        inputAmount: 4,
        secondaryInputItemId: 'leather',
        secondaryInputAmount: 1,
        outputItemId: 'flour',
        outputAmount: 1,
    },
    {
        inputItemId: 'flour',
        inputAmount: 2,
        secondaryInputItemId: 'egg',
        secondaryInputAmount: 1,
        outputItemId: 'bread',
        outputAmount: 1,
    },
]

// Cooker: meat → cooked meat without knives or charcoal
const COOKER_RECIPES: MachineRecipe[] = [
    { inputItemId: 'meat', inputAmount: 1, outputItemId: 'cooked-meat', outputAmount: 1 },
    { inputItemId: 'minnow', inputAmount: 1, outputItemId: 'cooked-fish', outputAmount: 1 },
    { inputItemId: 'trout', inputAmount: 1, outputItemId: 'cooked-fish', outputAmount: 1 },
    { inputItemId: 'bass', inputAmount: 1, outputItemId: 'cooked-fish', outputAmount: 1 },
    { inputItemId: 'walleye', inputAmount: 1, outputItemId: 'cooked-fish', outputAmount: 1 },
    { inputItemId: 'salmon', inputAmount: 1, outputItemId: 'cooked-fish', outputAmount: 1 },
    { inputItemId: 'carp', inputAmount: 1, outputItemId: 'cooked-fish', outputAmount: 1 },
    { inputItemId: 'magical-carp', inputAmount: 1, outputItemId: 'cooked-fish', outputAmount: 1 },
    { inputItemId: 'redfish', inputAmount: 1, outputItemId: 'cooked-fish', outputAmount: 1 },
    { inputItemId: 'rainbow-fish', inputAmount: 1, outputItemId: 'cooked-fish', outputAmount: 1 },
    { inputItemId: 'emberfish', inputAmount: 1, outputItemId: 'cooked-fish', outputAmount: 1 },
    { inputItemId: 'crab', inputAmount: 1, outputItemId: 'cooked-crab', outputAmount: 1 },
]

// All 11 log-to-plank sawmill recipes (4 logs → 1 plank, no saw required)
const SAWMILL_RECIPES: MachineRecipe[] = [
    { inputItemId: 'pine-log', inputAmount: 4, outputItemId: 'planks', outputAmount: 1 },
    { inputItemId: 'birch-log', inputAmount: 4, outputItemId: 'planks', outputAmount: 1 },
    { inputItemId: 'oak-log', inputAmount: 4, outputItemId: 'planks', outputAmount: 1 },
    { inputItemId: 'maple-log', inputAmount: 4, outputItemId: 'planks', outputAmount: 1 },
    { inputItemId: 'cedar-log', inputAmount: 4, outputItemId: 'planks', outputAmount: 1 },
    { inputItemId: 'ash-log', inputAmount: 4, outputItemId: 'planks', outputAmount: 1 },
    { inputItemId: 'spruce-log', inputAmount: 4, outputItemId: 'planks', outputAmount: 1 },
    { inputItemId: 'willow-log', inputAmount: 4, outputItemId: 'planks', outputAmount: 1 },
    { inputItemId: 'runic-log', inputAmount: 4, outputItemId: 'planks', outputAmount: 1 },
    { inputItemId: 'elder-log', inputAmount: 4, outputItemId: 'planks', outputAmount: 1 },
    { inputItemId: 'arcanum-log', inputAmount: 4, outputItemId: 'planks', outputAmount: 1 },
]

const MACHINE_DEFINITIONS: MachineDefinition[] = [
    {
        id: 'stone-quarry',
        name: 'Stone Quarry',
        description: 'Passively generates stone over time.',
        cost: 100000,
        machineType: 'generator',
        outputItemId: 'stone',
        baseInterval: 60, // 1 stone per 60 seconds
        requiresCreature: true,
        creatureTypeRequired: null, // Any creature
        recipes: [],
    },
    {
        id: 'stick-finder',
        name: 'Stick Finder',
        description: 'Passively generates twigs over time.',
        cost: 100000,
        machineType: 'generator',
        outputItemId: 'twig',
        baseInterval: 60,
        requiresCreature: true,
        creatureTypeRequired: null,
        recipes: [],
    },
    {
        id: 'coal-miner',
        name: 'Coal Miner',
        description: 'Passively generates coal over time.',
        cost: 200000,
        machineType: 'generator',
        outputItemId: 'coal',
        baseInterval: 60,
        requiresCreature: true,
        creatureTypeRequired: null,
        recipes: [],
    },
    {
        id: 'smelter',
        name: 'Smelter',
        description: 'Smelts ore without coal or hammers.',
        cost: 400000,
        machineType: 'processor',
        outputItemId: null, // Determined by selected recipe
        baseInterval: 120, // 2 minutes per bar
        requiresCreature: true,
        creatureTypeRequired: ['Fire'],
        recipes: SMELTER_RECIPES,
    },
    {
        id: 'sawmill',
        name: 'Sawmill',
        description: 'Cuts logs into planks without a saw.',
        cost: 400000,
        machineType: 'processor',
        outputItemId: null,
        baseInterval: 120,
        requiresCreature: true,
        creatureTypeRequired: ['Wind'],
        recipes: SAWMILL_RECIPES,
    },
    {
        id: 'cooker',
        name: 'Cooker',
        description: 'Cooks meat without knives or charcoal.',
        cost: 400000,
        machineType: 'processor',
        outputItemId: null,
        baseInterval: 120,
        requiresCreature: true,
        creatureTypeRequired: ['Fire'],
        recipes: COOKER_RECIPES,
    },
    {
        id: 'greenhouse',
        name: 'Greenhouse',
        description: 'Grows herbs and crops passively.',
        cost: 200000,
        machineType: 'processor',
        outputItemId: null,
        baseInterval: 60,
        requiresCreature: true,
        creatureTypeRequired: ['Earth'],
        recipes: GREENHOUSE_RECIPES,
    },
    {
        id: 'bakery',
        name: 'Bakery',
        description: 'Bakes bread from flour and eggs.',
        cost: 600000,
        machineType: 'processor',
        outputItemId: null,
        baseInterval: 120,
        requiresCreature: true,
        creatureTypeRequired: ['Water'],
        recipes: BAKERY_RECIPES,
    },
    {
        id: 'refinery',
        name: 'Refinery',
        description: 'Refines essences quicker in all forms.',
        cost: 800000,
        machineType: 'processor',
        outputItemId: null,
        baseInterval: 120,
        requiresCreature: true,
        creatureTypeRequired: null,
        recipes: REFINERY_RECIPES,
    },
]

// Speed multiplier per upgrade level (each level reduces interval by ~10%)
const UPGRADE_SPEED_MULTIPLIERS: number[] = [
    1.0, // Level 0 (base)
    0.9, // Level 1
    0.8, // Level 2
    0.72, // Level 3
    0.64, // Level 4
    0.56, // Level 5
    0.5, // Level 6
    0.44, // Level 7
    0.38, // Level 8
    0.33, // Level 9
    0.28, // Level 10
]

// Material costs per upgrade level (level 1 = copper, level 10 = arcanum)
// Each level requires a specific bar type + planks, same progression as Tools
export const UPGRADE_COSTS: { barId: string; barAmount: number; planksAmount: number }[] = [
    { barId: 'copper-bar', barAmount: 100, planksAmount: 100 },
    { barId: 'tin-bar', barAmount: 200, planksAmount: 200 },
    { barId: 'iron-bar', barAmount: 300, planksAmount: 300 },
    { barId: 'silver-bar', barAmount: 400, planksAmount: 400 },
    { barId: 'gold-bar', barAmount: 500, planksAmount: 500 },
    { barId: 'platinum-bar', barAmount: 600, planksAmount: 600 },
    { barId: 'adamantite-bar', barAmount: 700, planksAmount: 700 },
    { barId: 'runic-bar', barAmount: 800, planksAmount: 800 },
    { barId: 'solarite-bar', barAmount: 900, planksAmount: 900 },
    { barId: 'arcanum-bar', barAmount: 1000, planksAmount: 1000 },
]

const MAX_MACHINE_LEVEL = 10

const definitionsById = MACHINE_DEFINITIONS.reduce(
    (acc, def) => {
        acc[def.id] = def
        return acc
    },
    {} as Record<string, MachineDefinition>
)

const MachinesConfig = {
    MACHINE_DEFINITIONS,
    UPGRADE_SPEED_MULTIPLIERS,
    UPGRADE_COSTS,
    MAX_MACHINE_LEVEL,
    getById: (id: MachineId): MachineDefinition | undefined => definitionsById[id],
    getRecipe: (machineId: MachineId, inputItemId: string): MachineRecipe | undefined => {
        const def = definitionsById[machineId]
        if (!def) return undefined
        return def.recipes.find((r) => r.inputItemId === inputItemId)
    },
    getUpgradeCost: (level: number): { barId: string; barAmount: number; planksAmount: number } | undefined =>
        UPGRADE_COSTS[level], // level 0 machine needs UPGRADE_COSTS[0] to go to level 1
    getSpeedMultiplier: (level: number): number =>
        UPGRADE_SPEED_MULTIPLIERS[Math.min(level, UPGRADE_SPEED_MULTIPLIERS.length - 1)],
    getInterval: (machineId: MachineId, level: number): number => {
        const def = definitionsById[machineId]
        if (!def) return 60
        const multiplier = UPGRADE_SPEED_MULTIPLIERS[Math.min(level, UPGRADE_SPEED_MULTIPLIERS.length - 1)]
        return Math.max(1, Math.floor(def.baseInterval * multiplier))
    },
}

export default MachinesConfig

import { Item } from '@modules/inventory/types'
import { WORKSTATION_CONFIGS } from './WORKSTATION_CONFIGS'

export const FurnaceItems: Item[] = [
    {
        id: 'hammer',
        name: 'Hammer',
        type: 'Refined',
        description: 'Smashy looking tool, used in the Furnace',
        image: 'items/hammer.png',
        buyValue: 50,
        sellValue: 5,
        recipes: [
            {
                workstation: 'Workbench',
                levelRequirement: 1,
                ingredients: [
                    { id: 'twig', amount: 4 },
                    { id: 'stone', amount: 4 },
                ],
                outputAmount: 1,
                craftTime: 4,
                experience: 4,
            },
        ],
    },
    {
        id: 'copper-bar',
        name: 'Copper Bar',
        type: 'Refined',
        description: 'A refined copper bar smelted from copper ore and coal.',
        image: 'items/copper-bar.png',
        sellValue: 10,
        recipes: [
            {
                workstation: 'Furnace',
                levelRequirement: 1,
                ingredients: [
                    { id: 'copper-ore', amount: 8 },
                    { id: 'coal', amount: 4 },
                    { id: 'hammer', amount: 1 },
                ],
                outputAmount: 1,
                craftTime: 60,
                experience: 60,
            },
        ],
    },
    {
        id: 'tin-bar',
        name: 'Tin Bar',
        type: 'Refined',
        description: 'A refined tin bar smelted from tin ore and coal.',
        image: 'items/tin-bar.png',
        sellValue: 15,
        recipes: [
            {
                workstation: 'Furnace',
                levelRequirement: 5,
                ingredients: [
                    { id: 'tin-ore', amount: 8 },
                    { id: 'coal', amount: 4 },
                    { id: 'hammer', amount: 1 },
                ],
                outputAmount: 1,
                craftTime: 60,
                experience: 66,
            },
        ],
    },
    {
        id: 'iron-bar',
        name: 'Iron Bar',
        type: 'Refined',
        description: 'A refined iron bar smelted from iron ore and coal.',
        image: 'items/iron-bar.png',
        sellValue: 20,
        recipes: [
            {
                workstation: 'Furnace',
                levelRequirement: 10,
                ingredients: [
                    { id: 'iron-ore', amount: 8 },
                    { id: 'coal', amount: 4 },
                    { id: 'hammer', amount: 1 },
                ],
                outputAmount: 1,
                craftTime: 60,
                experience: 72,
            },
        ],
    },
    {
        id: 'silver-bar',
        name: 'Silver Bar',
        type: 'Refined',
        description: 'A refined silver bar smelted from silver ore and coal.',
        image: 'items/silver-bar.png',
        sellValue: 25,
        recipes: [
            {
                workstation: 'Furnace',
                levelRequirement: 15,
                ingredients: [
                    { id: 'silver-ore', amount: 8 },
                    { id: 'coal', amount: 4 },
                    { id: 'hammer', amount: 1 },
                ],
                outputAmount: 1,
                craftTime: 60,
                experience: 84,
            },
        ],
    },
    {
        id: 'gold-bar',
        name: 'Gold Bar',
        type: 'Refined',
        description: 'A refined gold bar smelted from gold ore and coal.',
        image: 'items/gold-bar.png',
        sellValue: 30,
        recipes: [
            {
                workstation: 'Furnace',
                levelRequirement: 20,
                ingredients: [
                    { id: 'gold-ore', amount: 8 },
                    { id: 'coal', amount: 4 },
                    { id: 'hammer', amount: 1 },
                ],
                outputAmount: 1,
                craftTime: 60,
                experience: 108,
            },
        ],
    },
    {
        id: 'platinum-bar',
        name: 'Platinum Bar',
        type: 'Refined',
        description: 'A refined platinum bar smelted from platinum ore and coal.',
        image: 'items/platinum-bar.png',
        sellValue: 40,
        recipes: [
            {
                workstation: 'Furnace',
                levelRequirement: 25,
                ingredients: [
                    { id: 'platinum-ore', amount: 8 },
                    { id: 'coal', amount: 4 },
                    { id: 'hammer', amount: 1 },
                ],
                outputAmount: 1,
                craftTime: 60,
                experience: 144,
            },
        ],
    },
    {
        id: 'adamantite-bar',
        name: 'Adamantite Bar',
        type: 'Refined',
        description: 'A refined adamantite bar smelted from adamantite ore and coal.',
        image: 'items/adamantite-bar.png',
        sellValue: 60,
        recipes: [
            {
                workstation: 'Furnace',
                levelRequirement: 30,
                ingredients: [
                    { id: 'adamantite-ore', amount: 8 },
                    { id: 'coal', amount: 4 },
                    { id: 'hammer', amount: 1 },
                ],
                outputAmount: 1,
                craftTime: 60,
                experience: 192,
            },
        ],
    },
    {
        id: 'runic-bar',
        name: 'Runic Bar',
        type: 'Refined',
        description: 'A refined runic bar smelted from runic ore and coal.',
        image: 'items/runic-bar.png',
        sellValue: 80,
        recipes: [
            {
                workstation: 'Furnace',
                levelRequirement: 40,
                ingredients: [
                    { id: 'runic-ore', amount: 8 },
                    { id: 'coal', amount: 4 },
                    { id: 'hammer', amount: 1 },
                ],
                outputAmount: 1,
                craftTime: 60,
                experience: 252,
            },
        ],
    },
    {
        id: 'solarite-bar',
        name: 'Solarite Bar',
        type: 'Refined',
        description: 'A refined solarite bar smelted from solarite ore and coal.',
        image: 'items/solarite-bar.png',
        sellValue: 120,
        recipes: [
            {
                workstation: 'Furnace',
                levelRequirement: 50,
                ingredients: [
                    { id: 'solarite-ore', amount: 8 },
                    { id: 'coal', amount: 4 },
                    { id: 'hammer', amount: 1 },
                ],
                outputAmount: 1,
                craftTime: 60,
                experience: 380,
            },
        ],
    },
    {
        id: 'arcanum-bar',
        name: 'Arcanum Bar',
        type: 'Refined',
        description: 'A refined arcanum bar smelted from arcanum ore and coal.',
        image: 'items/arcanum-bar.png',
        sellValue: 180,
        recipes: [
            {
                workstation: 'Furnace',
                levelRequirement: 60,
                ingredients: [
                    { id: 'arcanum-ore', amount: 8 },
                    { id: 'coal', amount: 4 },
                    { id: 'hammer', amount: 1 },
                ],
                outputAmount: 1,
                craftTime: 60,
                experience: 420,
            },
        ],
    },
]

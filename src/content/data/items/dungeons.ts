import { Item } from '@modules/inventory/types'
import { WORKSTATION_CONFIGS } from './workstations/WORKSTATION_CONFIGS'

export const DungeonItems: Item[] = [
    {
        id: 'dungeon-rune',
        name: 'Chronicle Rune',
        type: 'Refined',
        description: 'A rune forged with the dust of the past',
        image: 'items/dungeon-rune.png',
        recipes: [
            {
                workstation: 'Workbench',
                levelRequirement: 60,
                ingredients: [
                    { id: 'dungeon-dust', amount: 32 },
                    { id: 'stone', amount: 64 },
                    { id: 'memory-orb', amount: 32 },
                ],
                outputAmount: 1,
                craftTime: 64,
                experience: 64 * 4,
            },
        ],
    },
    {
        id: 'infinity-stone',
        name: 'Infinity Stone',
        type: 'Refined',
        description: 'The most powerful stone in Koltera',
        image: 'items/infinity-stone.png',
        recipes: [
            {
                workstation: 'Workbench',
                levelRequirement: 80,
                ingredients: [
                    { id: 'wind-stone', amount: 1 },
                    { id: 'fire-stone', amount: 1 },
                    { id: 'earth-stone', amount: 1 },
                    { id: 'water-stone', amount: 1 },
                    { id: 'night-shard', amount: 64 },
                ],
                outputAmount: 1,
                craftTime: 1024,
                experience: 8192,
            },
        ],
    },
]

import { Item } from '@modules/inventory/types'

export const CurrencyItems: Item[] = [
    {
        id: 'gold',
        name: 'Gold',
        type: 'Currency',
        description: 'Description to be written...',
        image: 'items/gold.png',
        recipes: [],
    },
    {
        id: 'awaken-points',
        name: 'Awaken Points',
        type: 'Currency',
        description: 'Description to be written...',
        image: 'items/awaken-points.png',
        recipes: [],
    },
    {
        id: 'prestige-points',
        sellValue: 10000,
        name: 'Prestige Points',
        type: 'Currency',
        description: 'Description to be written...',
        image: 'items/prestige-points.png',
        recipes: [],
    },
    // {
    //     id: 'Dirt Credits',
    //     name: 'Dirt Credits',
    //     type: 'Currency',
    //     description: 'Description to be written...',
    //     image: 'items/dirt-credits.png',
    //     recipes: [],
    // },
]

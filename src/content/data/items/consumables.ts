import { Item } from '@modules/inventory/types'

export const Consumables: Item[] = [
    {
        id: 'task-board-reset-potion',
        name: 'Task Board Potion',
        type: 'Consumable',
        buyValue: 40000,
        weeklyLimit: 7,
        description: 'A potion that allows you to reset every task board quest instantly. Can be bought at the Merchant.',
        image: 'items/task-board-potion.png',
        recipes: [],
    },
    {
        id: 'awaken-tree-reset-potion',
        name: 'Awaken Tree Potion',
        type: 'Consumable',
        buyValue: 250000,
        weeklyLimit: 1,
        description: 'A potion that resets the Awaken Tree, refunding all spent Awaken Points. Can be bought at the Merchant.',
        image: 'items/awaken-potion.png',
        recipes: [],
    },
    {
        id: 'offline-progress-potion',
        name: 'One Hour Offline Potion',
        type: 'Consumable',
        buyValue: 100000,
        weeklyLimit: 3,
        description: 'A potion that simulates 1 hour of offline progress instantly. Can be bought at the Merchant.',
        image: 'items/offline-potion.png',
        recipes: [],
    },
]

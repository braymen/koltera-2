import { Item } from '@modules/inventory/types'

export const SellableItems: Item[] = [
    {
        id: 'relic',
        name: 'Relic',
        type: 'Gathered',
        description: 'Found while Mining.',
        image: 'items/relic.png',
        recipes: [],
        sellValue: 5,
    },
    {
        id: 'braymens-letter',
        name: "Braymen's Letter",
        type: 'Gathered',
        description:
            'You are probably wondering how this got in here... A magician never reveals their secrets! Nevertheless, thank you for joining Koltera. I appreciate your support and if you need any help, feel free to jump in the discord (found in the navigation)! Oh, and you should probably sell this letter... I think you will need all the gold you can get.',
        sellValue: 5000,
        image: 'items/mail.png',
        recipes: [],
    },
]

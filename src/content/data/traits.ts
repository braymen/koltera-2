import { ExpeditionTraitContent } from '@modules/expeditions/types'

const get: ExpeditionTraitContent[] = [
    {
        id: 'night-vision',
        name: 'Night Vision',
        description: 'You can see in the dark.',
        image: 'items/placeholder.png',
    },
    {
        id: 'camouflage',
        name: 'Camouflage',
        description: 'You are more difficult to see.',
        image: 'items/placeholder.png',
    },
    {
        id: 'lucky',
        name: 'Lucky',
        description: 'You are more likely to find good loot.',
        image: 'items/placeholder.png',
    },
    {
        id: 'hard-shell',
        name: 'Hard Shell',
        description: 'You are more resistant to damage.',
        image: 'items/placeholder.png',
    },
    {
        id: 'regeneration',
        name: 'Regeneration',
        description: 'You regenerate health faster.',
        image: 'items/placeholder.png',
    },
    {
        id: 'poison-resistance',
        name: 'Poison Resist',
        description: 'You are more resistant to poison.',
        image: 'items/placeholder.png',
    },
    {
        id: 'water-breathing',
        name: 'Water Breathing',
        description: 'You can breathe underwater.',
        image: 'items/placeholder.png',
    },
    {
        id: 'cold-resistance',
        name: 'Cold Resist',
        description: 'You are more resistant to cold.',
        image: 'items/placeholder.png',
    },
    {
        id: 'heat-resistance',
        name: 'Heat Resist',
        description: 'You are more resistant to heat.',
        image: 'items/placeholder.png',
    },
    {
        id: 'scouting',
        name: 'Scouting',
        description: 'You are better at scouting.',
        image: 'items/placeholder.png',
    },
    {
        id: 'tracking',
        name: 'Tracking',
        description: 'You are better at tracking.',
        image: 'items/placeholder.png',
    },
    {
        id: 'gatherer',
        name: 'Gatherer',
        description: 'You are better at gathering.',
        image: 'items/placeholder.png',
    },
    {
        id: 'learner',
        name: 'Learner',
        description: 'You are better at learning.',
        image: 'items/placeholder.png',
    },
] satisfies ExpeditionTraitContent[]

const Lookup: Record<string, ExpeditionTraitContent> = {}
get.forEach((trait) => {
    Lookup[trait.id] = trait
})

const getById = (id: string) => Lookup[id]

const TraitsContent = {
    get,
    getById,
}

export default TraitsContent

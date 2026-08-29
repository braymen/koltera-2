import { ExpeditionBiomeContent } from '@modules/expeditions/types'

const get: ExpeditionBiomeContent[] = [
    {
        id: 'forest',
        name: 'Forest',
        description: 'A dense forest with tall trees and undergrowth.',
        image: 'items/placeholder.png',
        advantage: ['Wind'],
        disadvantage: ['Earth'],
    },
    {
        id: 'desert',
        name: 'Desert',
        description: 'A harsh desert with extreme temperatures.',
        image: 'items/placeholder.png',
        advantage: ['Fire', 'Earth'],
        disadvantage: ['Water'],
    },
    {
        id: 'mountain',
        name: 'Mountain',
        description: 'Rugged mountain terrain with high altitude.',
        image: 'items/placeholder.png',
        advantage: ['Earth'],
        disadvantage: ['Wind'],
    },
    {
        id: 'cave',
        name: 'Cave',
        description: 'Dark underground caves with limited visibility.',
        image: 'items/placeholder.png',
        advantage: ['Water', 'Fire'],
        disadvantage: ['Wind'],
    },
    {
        id: 'swamp',
        name: 'Swamp',
        description: 'Muddy wetlands with difficult terrain.',
        image: 'items/placeholder.png',
        advantage: ['Water'],
        disadvantage: ['Fire', 'Wind'],
    },
    {
        id: 'plains',
        name: 'Plains',
        description: 'Open grasslands with good visibility.',
        image: 'items/placeholder.png',
        advantage: ['Wind'],
        disadvantage: ['Water'],
    },
    {
        id: 'lake',
        name: 'Lake',
        description: 'A large body of water with fish and other aquatic life.',
        image: 'items/placeholder.png',
        advantage: ['Water'],
        disadvantage: ['Fire', 'Earth'],
    },
] satisfies ExpeditionBiomeContent[]

const Lookup: Record<string, ExpeditionBiomeContent> = {}
get.forEach((biome) => {
    Lookup[biome.id] = biome
})

const getById = (id: string) => Lookup[id]

const BiomesContent = {
    get,
    getById,
}

export default BiomesContent

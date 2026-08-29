// Creature content that is used to create a new creature
export interface CreatureContent {
    id: string
    name: string
    trait:
        | 'night-vision'
        | 'camouflage'
        | 'lucky'
        | 'hard-shell'
        | 'regeneration'
        | 'poison-resistance'
        | 'water-breathing'
        | 'cold-resistance'
        | 'heat-resistance'
        | 'scouting'
        | 'tracking'
        | 'gatherer'
        | 'learner'
    types: Types[]
    description: string
    image: string
    tier: number
    stats: Stats
    jobs: Jobs
    summoningCost: CreatureSummoningCost[]
    mainJob: 'Mining' | 'Chopping' | 'Digging' | 'Exploring' | 'Farming' | 'Fishing' | 'All'
}

// Creature summoning cost that is used to summon a creature
export interface CreatureSummoningCost {
    id: string
    amount: number
}

// Creature instance that keeps track of the creature state
export interface Creature {
    id: string
    species: string
    experience: number
    awakened?: boolean
    prestigeCount?: number
}

// Jobs that the creature can do
export interface Jobs {
    chopping: number
    mining: number
    digging: number
    exploring: number
    fishing: number
    farming: number
    [key: string]: number
}

// Stats that the creature has
export interface Stats {
    power: number
    toughness: number
    agility: number
    intelligence: number
    gathering: number
    luck: number
    [key: string]: number
}

// Types will be used to determine which elements the creature is weak to or strong against
export type Types = 'Water' | 'Fire' | 'Earth' | 'Wind'

export interface CollectionItem {
    id: string
    name: string
    description: string
    image: string
}

export type CollectionTypes = 'items' | 'achievements' | 'creatures'

export type Collection = {
    items: string[]
    achievements: string[]
    creatures: string[]
}

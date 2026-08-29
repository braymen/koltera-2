import { MilestoneDefinition, MilestoneTrackId } from '@modules/milestones/types'

// ─── Track metadata ───

export const MILESTONE_TRACKS: {
    id: MilestoneTrackId
    name: string
    description: string
    image: string
    label: string // What the progress numbers represent (e.g. "creatures summoned")
    isPrimary: boolean
}[] = [
    {
        id: 'creatures',
        name: 'Summoning Creatures',
        description: 'Summon creatures and bring them back to Koltera. This is the main objective of the game.',
        image: 'icons/milestones.png',
        label: 'creatures summoned',
        isPrimary: true,
    },
    {
        id: 'items',
        name: 'Discovering Items & Resources',
        description: 'Discover new items through gathering, crafting, and various other places. This helps discover new summons.',
        image: 'icons/milestones.png',
        label: 'items discovered',
        isPrimary: false,
    },
    {
        id: 'skills',
        name: 'Leveling your Skills',
        description:
            'Level up your skills to unlock new activities and become more efficient. This also helps discover new summons.',
        image: 'icons/milestones.png',
        label: 'total levels',
        isPrimary: false,
    },
]

// ─── Milestone definitions ───
// ~10 milestones per track, roughly 10% increments

// Creatures: 120 total
// 12, 24, 36, 48, 60, 72, 84, 96, 108, 120
export const CREATURE_MILESTONES: MilestoneDefinition[] = [
    {
        id: 'creatures-1',
        trackId: 'creatures',
        threshold: 12,
        title: 'Budding Summoner',
        description: "You've begun your journey as a summoner.",
        rewards: [{ itemId: 'gold', amount: 20000 }],
    },
    {
        id: 'creatures-2',
        trackId: 'creatures',
        threshold: 24,
        title: 'Creature Caller',
        description: 'Word is spreading of your ability to summon creatures.',
        rewards: [{ itemId: 'gold', amount: 40000 }],
    },
    {
        id: 'creatures-3',
        trackId: 'creatures',
        threshold: 36,
        title: 'Pack Leader',
        description: 'A sizable group of creatures now call you their summoner.',
        rewards: [{ itemId: 'gold', amount: 60000 }],
    },
    {
        id: 'creatures-4',
        trackId: 'creatures',
        threshold: 48,
        title: 'Menagerie Keeper',
        description: 'Your collection is becoming impressive.',
        rewards: [{ itemId: 'gold', amount: 80000 }],
    },
    {
        id: 'creatures-5',
        trackId: 'creatures',
        threshold: 60,
        title: 'Beast Warden',
        description: 'Half of all known creatures have answered your call.',
        rewards: [{ itemId: 'gold', amount: 100000 }],
    },
    {
        id: 'creatures-6',
        trackId: 'creatures',
        threshold: 72,
        title: 'Arcane Binder',
        description: 'Even rare creatures seek you out.',
        rewards: [{ itemId: 'gold', amount: 120000 }],
    },
    {
        id: 'creatures-7',
        trackId: 'creatures',
        threshold: 84,
        title: 'Soul Shepherd',
        description: 'Your bond with the creature world grows ever stronger.',
        rewards: [{ itemId: 'gold', amount: 140000 }],
    },
    {
        id: 'creatures-8',
        trackId: 'creatures',
        threshold: 96,
        title: 'Legend of the Wild',
        description: 'Only the most elusive creatures remain uncalled.',
        rewards: [{ itemId: 'gold', amount: 160000 }],
    },
    {
        id: 'creatures-9',
        trackId: 'creatures',
        threshold: 108,
        title: 'Mythic Summoner',
        description: 'Your name echoes across every biome.',
        rewards: [{ itemId: 'gold', amount: 180000 }],
    },
    {
        id: 'creatures-10',
        trackId: 'creatures',
        threshold: 120,
        title: 'Master of All Creatures',
        description: 'Every creature in the world has been summoned. You are the ultimate summoner.',
        rewards: [{ itemId: 'gold', amount: 200000 }],
    },
]

// Items: 192 total
// ~19 per step: 19, 38, 58, 77, 96, 115, 134, 154, 173, 192
export const ITEM_MILESTONES: MilestoneDefinition[] = [
    {
        id: 'items-1',
        trackId: 'items',
        threshold: 19,
        title: 'Curious Collector',
        description: "You've started cataloguing the items of this world.",
        rewards: [{ itemId: 'copper-bar', amount: 100 }],
    },
    {
        id: 'items-2',
        trackId: 'items',
        threshold: 38,
        title: 'Keen Eye',
        description: 'Your eye for new finds is sharpening.',
        rewards: [{ itemId: 'tin-bar', amount: 200 }],
    },
    {
        id: 'items-3',
        trackId: 'items',
        threshold: 58,
        title: 'Resourceful',
        description: 'You know where to find what you need.',
        rewards: [{ itemId: 'iron-bar', amount: 300 }],
    },
    {
        id: 'items-4',
        trackId: 'items',
        threshold: 77,
        title: 'Seasoned Gatherer',
        description: 'Few items escape your attention.',
        rewards: [{ itemId: 'silver-bar', amount: 400 }],
    },
    {
        id: 'items-5',
        trackId: 'items',
        threshold: 96,
        title: 'Walking Codex',
        description: "You've discovered half of everything there is to find.",
        rewards: [{ itemId: 'gold-bar', amount: 500 }],
    },
    {
        id: 'items-6',
        trackId: 'items',
        threshold: 115,
        title: 'Item Scholar',
        description: 'Your knowledge of materials rivals the finest craftsmen.',
        rewards: [{ itemId: 'platinum-bar', amount: 600 }],
    },
    {
        id: 'items-7',
        trackId: 'items',
        threshold: 134,
        title: 'Relic Hunter',
        description: 'The rarest materials are within your reach.',
        rewards: [{ itemId: 'adamantite-bar', amount: 700 }],
    },
    {
        id: 'items-8',
        trackId: 'items',
        threshold: 154,
        title: 'Master Cataloguer',
        description: 'Your item codex is nearly complete.',
        rewards: [{ itemId: 'runic-bar', amount: 800 }],
    },
    {
        id: 'items-9',
        trackId: 'items',
        threshold: 173,
        title: 'Archivist',
        description: 'Only the most obscure items elude your collection.',
        rewards: [{ itemId: 'solarite-bar', amount: 900 }],
    },
    {
        id: 'items-10',
        trackId: 'items',
        threshold: 192,
        title: 'Omniscient Collector',
        description: 'Every item in the world has been discovered. Nothing is unknown to you.',
        rewards: [{ itemId: 'arcanum-bar', amount: 1000 }],
    },
]

// Skills: 9 skills × 99 max = 891 total levels. Start at 9 (all level 1).
// ~89 per step: 90, 180, 270, 360, 450, 540, 630, 720, 810, 891
export const SKILL_MILESTONES: MilestoneDefinition[] = [
    {
        id: 'skills-1',
        trackId: 'skills',
        threshold: 90,
        title: 'Apprentice',
        description: "You're getting the hang of the basics.",
        rewards: [
            { itemId: 'knife', amount: 25 },
            { itemId: 'hammer', amount: 25 },
            { itemId: 'saw', amount: 25 },
        ],
    },
    {
        id: 'skills-2',
        trackId: 'skills',
        threshold: 180,
        title: 'Journeyman',
        description: 'Your skills are developing nicely across the board.',
        rewards: [
            { itemId: 'knife', amount: 50 },
            { itemId: 'hammer', amount: 50 },
            { itemId: 'saw', amount: 50 },
        ],
    },
    {
        id: 'skills-3',
        trackId: 'skills',
        threshold: 270,
        title: 'Skilled Worker',
        description: 'You can handle most tasks with confidence.',
        rewards: [
            { itemId: 'knife', amount: 75 },
            { itemId: 'hammer', amount: 75 },
            { itemId: 'saw', amount: 75 },
        ],
    },
    {
        id: 'skills-4',
        trackId: 'skills',
        threshold: 360,
        title: 'Expert',
        description: 'Your expertise is hard to match.',
        rewards: [
            { itemId: 'knife', amount: 100 },
            { itemId: 'hammer', amount: 100 },
            { itemId: 'saw', amount: 100 },
        ],
    },
    {
        id: 'skills-5',
        trackId: 'skills',
        threshold: 450,
        title: 'Adept',
        description: "You've reached the halfway mark of total mastery.",
        rewards: [
            { itemId: 'knife', amount: 125 },
            { itemId: 'hammer', amount: 125 },
            { itemId: 'saw', amount: 125 },
        ],
    },
    {
        id: 'skills-6',
        trackId: 'skills',
        threshold: 540,
        title: 'Virtuoso',
        description: 'Your prowess across all disciplines is remarkable.',
        rewards: [
            { itemId: 'knife', amount: 150 },
            { itemId: 'hammer', amount: 150 },
            { itemId: 'saw', amount: 150 },
        ],
    },
    {
        id: 'skills-7',
        trackId: 'skills',
        threshold: 630,
        title: 'Master Artisan',
        description: 'Few can claim the breadth of skill you possess.',
        rewards: [
            { itemId: 'knife', amount: 175 },
            { itemId: 'hammer', amount: 175 },
            { itemId: 'saw', amount: 175 },
        ],
    },
    {
        id: 'skills-8',
        trackId: 'skills',
        threshold: 720,
        title: 'Grand Master',
        description: 'Your name is synonymous with excellence.',
        rewards: [
            { itemId: 'knife', amount: 200 },
            { itemId: 'hammer', amount: 200 },
            { itemId: 'saw', amount: 200 },
        ],
    },
    {
        id: 'skills-9',
        trackId: 'skills',
        threshold: 810,
        title: 'Sage',
        description: 'Wisdom flows through every action you take.',
        rewards: [
            { itemId: 'knife', amount: 225 },
            { itemId: 'hammer', amount: 225 },
            { itemId: 'saw', amount: 225 },
        ],
    },
    {
        id: 'skills-10',
        trackId: 'skills',
        threshold: 891,
        title: 'Transcendent',
        description: 'Every skill has been mastered to perfection. You have transcended all limits.',
        rewards: [
            { itemId: 'knife', amount: 250 },
            { itemId: 'hammer', amount: 250 },
            { itemId: 'saw', amount: 250 },
        ],
    },
]

// All milestones combined
export const ALL_MILESTONES: MilestoneDefinition[] = [...CREATURE_MILESTONES, ...ITEM_MILESTONES, ...SKILL_MILESTONES]

// Lookup
const MilestoneLookup: Record<string, MilestoneDefinition> = {}
ALL_MILESTONES.forEach((m) => {
    MilestoneLookup[m.id] = m
})

const MilestonesConfig = {
    MILESTONE_TRACKS,
    ALL_MILESTONES,
    CREATURE_MILESTONES,
    ITEM_MILESTONES,
    SKILL_MILESTONES,
    getById: (id: string) => MilestoneLookup[id],
    getByTrack: (trackId: MilestoneTrackId) => ALL_MILESTONES.filter((m) => m.trackId === trackId),
}

export default MilestonesConfig

import { CreatureContent } from '@modules/creatures/types'
import { Tier0Creatures } from './creatures/tier0'
import { Tier1Creatures } from './creatures/tier1'
import { Tier2Creatures } from './creatures/tier2'
import { Tier3Creatures } from './creatures/tier3'
import { Tier4Creatures } from './creatures/tier4'
import { Tier5Creatures } from './creatures/tier5'

// Tier Chart
// 0 - Stats: 20 (1 Good) | Jobs: 0-1 (1 job)   1-2 costs       |                                   CHARM, RESOURCE
// 1 - Stats: 30 (1-2 Good) | Jobs: 2-3 (2 jobs)   2-3 costs    |   Raw Essence                     CHARM, RESOURCE, EXPEDITION
// 2 - Stats: 40 (2-3 Good) | Jobs: 4-5 (3 jobs)   3-4 costs    |   Pure Essence                    CHARM, RESOURCE, REFINED, EXPEDITION
// 3 - Stats: 60 (3 Good) | Jobs: 6-7 (3 jobs)    4-5 costs     |   Pure Essence, Dunegeon Runes    CHARM, RESOURCE, REFINED, EXPEDITION
// 4 - Stats: 80 (3-4 Good) | Jobs: 8-9 (4 jobs)   5-6 costs    |   Stones, Dungeon Runes           CHARM, RESOURCE, REFINED, EXPEDITION
// 5 - Stats: 100 (4-5 Good) | Jobs: 10 (5 jobs)  6 costs       |   Infinity Stone                  CHARM, RESOURCE, REFINED, REFINED, EXPEDITION

/**
 * Scrap Metal
 * Water Vials
 * Dungeon Core
 * Empty Can
 * Box of Fish
 */

/**
 * Tier 1
 * - knowledge-orb
 * - web
 * - gemstone
 *
 * Tier 2
 * - kelp
 * - cloth
 * - night-shard
 *
 * Tier 3
 * - pearl
 * - scale
 * - ancient-tome
 *
 * Tier 4
 * - poison-vial
 * - coral
 * - night-feather
 *
 * Tier 5
 * - artifact
 * - skull
 * - blood-vial
 *
 */

/**
 * Data
 */
const get: CreatureContent[] = [
    ...Tier0Creatures,
    ...Tier1Creatures,
    ...Tier2Creatures,
    ...Tier3Creatures,
    ...Tier4Creatures,
    ...Tier5Creatures,
]

/**
 * Lookup Function
 */
const Lookup: { [key: string]: CreatureContent } = {}
get.forEach((item: CreatureContent) => {
    Lookup[item.id] = item
})

const getById = (id: string) => {
    return Lookup[id]
}

const CreaturesContent = {
    get,
    getById,
}

export default CreaturesContent

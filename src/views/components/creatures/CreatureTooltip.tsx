import CreaturesContent from '@data/creatures'
import Images from '@utils/images'
import { Creature } from '@modules/creatures/types'
import { ExpeditionTypeContent, ExpeditionInstance } from '@modules/expeditions/types'
import BiomesContent from '@data/biomes'
import TraitsContent from '@data/traits'
import { getCreatureLevel, getCreatureXpForLevel } from '@modules/creatures/helpers'
import CreatureConfig from '@configs/creatures'
import AwakenedShine from '@components/creatures/AwakenedShine'

const CREATURE_STAT_TO_ALIAS: Record<string, string> = {
    power: 'power',
    toughness: 'grit',
    agility: 'agility',
    intelligence: 'smarts',
    gathering: 'looting',
    luck: 'luck',
}

interface CreatureTooltipProps {
    creature: Creature
    creatureContent: ReturnType<typeof CreaturesContent.getById>
    expeditionType?: ExpeditionTypeContent | null
    expeditionInstance?: ExpeditionInstance | null
    dungeonStats?: readonly string[]
    dungeonTypeAdvantage?: readonly string[]
    dungeonTypeDisadvantage?: readonly string[]
}

function CreatureTooltip({
    creature,
    creatureContent,
    expeditionType,
    expeditionInstance,
    dungeonStats,
    dungeonTypeAdvantage,
    dungeonTypeDisadvantage,
}: CreatureTooltipProps) {
    const creatureLevel = getCreatureLevel(creature)
    const xpForNextLevel = getCreatureXpForLevel(creatureLevel + 1)
    const xpToNextLevel = xpForNextLevel - creature.experience
    const scaledStats = {
        power: creatureContent.stats.power * creatureLevel,
        toughness: creatureContent.stats.toughness * creatureLevel,
        agility: creatureContent.stats.agility * creatureLevel,
        intelligence: creatureContent.stats.intelligence * creatureLevel,
        gathering: creatureContent.stats.gathering * creatureLevel,
        luck: creatureContent.stats.luck * creatureLevel,
    }

    const getStatColor = (statName: keyof typeof scaledStats) => {
        if (dungeonStats) {
            const alias = CREATURE_STAT_TO_ALIAS[statName]
            return dungeonStats.includes(alias) ? '#ffd700' : '#888'
        }
        if (!expeditionType) return '#888'
        let expeditionStatName: string
        if (statName === 'gathering') {
            expeditionStatName = 'looting'
        } else if (statName === 'toughness') {
            expeditionStatName = 'grit'
        } else if (statName === 'intelligence') {
            expeditionStatName = 'smarts'
        } else {
            expeditionStatName = statName
        }
        const weight = expeditionType.statWeights[expeditionStatName as keyof typeof expeditionType.statWeights]
        return weight > 0 ? 'orange' : '#888'
    }

    const getTypeColor = (type: string) => {
        if (dungeonTypeAdvantage || dungeonTypeDisadvantage) {
            if (dungeonTypeAdvantage?.includes(type)) return '#4ade80'
            if (dungeonTypeDisadvantage?.includes(type)) return '#f87171'
            return '#888'
        }
        if (!expeditionType || !expeditionType.biome) return '#888'
        const biome = BiomesContent.getById(expeditionType.biome)
        if (!biome) return '#888'

        if (biome.advantage && biome.advantage.includes(type)) {
            return '#4ade80'
        }
        // Check if this type has disadvantage
        if (biome.disadvantage && biome.disadvantage.includes(type)) {
            return '#f87171'
        }
        return '#888'
    }

    const getTraitColor = () => {
        if (!expeditionType || !expeditionType.trait) return '#888'
        if (creatureContent.trait === expeditionType.trait) return '#4ade80'
        return '#888'
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0' }}>
                <div
                    className={creature.awakened ? 'creature-awakened' : ''}
                    style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {creature.awakened && <AwakenedShine image={creatureContent.image} />}
                    <img
                        src={Images.get(creatureContent.image)}
                        alt={creatureContent.name}
                        style={{ width: '32px', height: '32px' }}
                    />
                </div>
                <div>
                    <h4
                        className={creature.awakened ? 'creature-name-awakened' : ''}
                        style={{ fontSize: '18px', fontWeight: '400', margin: 0, marginBottom: '-8px' }}
                    >
                        {creatureContent.name}
                    </h4>
                    <div
                        style={{
                            fontSize: '16px',
                            color: '#888',
                            margin: 0,
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        {creature.awakened && <span style={{ color: '#ff1493', fontSize: '16px' }}>★</span>}
                        Level {creatureLevel}
                    </div>
                </div>
            </div>

            <div style={{ fontSize: '16px', marginBottom: '0' }}>
                <div>
                    Type:{' '}
                    {creatureContent.types.map((type, index) => (
                        <span key={type} style={{ color: getTypeColor(type) }}>
                            {type}
                            {index < creatureContent.types.length - 1 ? ', ' : ''}
                        </span>
                    ))}
                </div>
                <div>
                    Trait: <span style={{ color: getTraitColor() }}>{TraitsContent.getById(creatureContent.trait)?.name}</span>
                </div>
                <div>
                    XP to Next Level: <span style={{ color: '#888' }}>{creatureLevel >= (creature.awakened ? CreatureConfig.LEVELING.MAX_LEVEL_AWAKENED : CreatureConfig.LEVELING.MAX_LEVEL) ? 'Max Level' : Math.floor(xpToNextLevel).toLocaleString()}</span>
                </div>
            </div>
            <div>
                <div
                    style={{
                        fontSize: '16px',
                        color: '#fff',
                        marginBottom: '0',
                        marginTop: '8px',
                    }}
                >
                    Expedition Stats (Scaled)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 12px', fontSize: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: getStatColor('power') }}>Power:</span>
                        <span style={{ color: getStatColor('power') }}>{scaledStats.power} <span style={{ color: '#666' }}>({creatureContent.stats.power})</span></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: getStatColor('toughness') }}>Grit:</span>
                        <span style={{ color: getStatColor('toughness') }}>{scaledStats.toughness} <span style={{ color: '#666' }}>({creatureContent.stats.toughness})</span></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: getStatColor('agility') }}>Agility:</span>
                        <span style={{ color: getStatColor('agility') }}>{scaledStats.agility} <span style={{ color: '#666' }}>({creatureContent.stats.agility})</span></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: getStatColor('intelligence') }}>Smarts:</span>
                        <span style={{ color: getStatColor('intelligence') }}>{scaledStats.intelligence} <span style={{ color: '#666' }}>({creatureContent.stats.intelligence})</span></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: getStatColor('gathering') }}>Looting:</span>
                        <span style={{ color: getStatColor('gathering') }}>{scaledStats.gathering} <span style={{ color: '#666' }}>({creatureContent.stats.gathering})</span></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: getStatColor('luck') }}>Luck:</span>
                        <span style={{ color: getStatColor('luck') }}>{scaledStats.luck} <span style={{ color: '#666' }}>({creatureContent.stats.luck})</span></span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreatureTooltip

import CreaturesContent from '@data/creatures'
import Images from '@utils/images'
import { Creature } from '@modules/creatures/types'
import { getCreatureLevel } from '@modules/creatures/helpers'
import AwakenedShine from '@components/creatures/AwakenedShine'

interface CreatureJobTooltipProps {
    creature: Creature
    creatureContent: ReturnType<typeof CreaturesContent.getById>
}

function CreatureJobTooltip({ creature, creatureContent }: CreatureJobTooltipProps) {
    const creatureLevel = getCreatureLevel(creature)

    // Job proficiencies
    const jobs = creatureContent.jobs

    const getJobProficiencyColor = (value: number): string => {
        const clamped = Math.max(1, Math.min(10, value))
        const normalized = (clamped - 1) / 9

        let red: number
        let green: number
        let blue: number

        if (normalized < 0.5) {
            const t = normalized * 2
            red = 255
            green = Math.round(255 * t)
            blue = 0
        } else {
            const t = (normalized - 0.5) * 2
            red = Math.round(255 * (1 - t))
            green = 255
            blue = 0
        }

        return `rgb(${red}, ${green}, ${blue})`
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

            <div>
                <div
                    style={{
                        fontSize: '16px',
                        color: '#fff',
                        marginBottom: '0',
                        marginTop: '8px',
                    }}
                >
                    Job Proficiencies
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 12px', fontSize: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#888' }}>Chopping:</span>
                        <span style={{ color: getJobProficiencyColor(jobs.chopping) }}>{jobs.chopping}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#888' }}>Mining:</span>
                        <span style={{ color: getJobProficiencyColor(jobs.mining) }}>{jobs.mining}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#888' }}>Digging:</span>
                        <span style={{ color: getJobProficiencyColor(jobs.digging) }}>{jobs.digging}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#888' }}>Exploring:</span>
                        <span style={{ color: getJobProficiencyColor(jobs.exploring) }}>{jobs.exploring}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#888' }}>Fishing:</span>
                        <span style={{ color: getJobProficiencyColor(jobs.fishing) }}>{jobs.fishing}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#888' }}>Farming:</span>
                        <span style={{ color: getJobProficiencyColor(jobs.farming) }}>{jobs.farming}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreatureJobTooltip

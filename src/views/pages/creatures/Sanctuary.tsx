import { useState } from 'react'
import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import Images from '@utils/images'
import { CloseButton, Text } from '@mantine/core'
import CreaturesContent from '@data/creatures'
import SanctuaryCreatureSelector from '@components/creatures/SanctuaryCreatureSelector'
import Sanctuary from '@modules/sanctuary/dispatch'
import SanctuaryHelpers from '@modules/sanctuary/helpers'
import SanctuaryConfig from '@configs/sanctuary'
import Tooltip from '@components/common/Tooltip'
import CreatureJobTooltip from '@components/creatures/CreatureJobTooltip'
import AwakenedShine from '@components/creatures/AwakenedShine'

const gatheringJobs = ['Chopping', 'Mining', 'Digging', 'Exploring', 'Fishing', 'Farming'] as const

// Job colors matching the creature details page
const jobColors: Record<string, string> = {
    chopping: '#59e843',
    mining: '#c9c9c9',
    digging: '#e89643',
    exploring: '#fc1717',
    fishing: '#43c7e8',
    farming: '#fce917',
}

const getTierBenefit = (tierNum: number, job: string): { prefix: string; skill: string; suffix: string } => {
    switch (tierNum) {
        case 1:
            return { prefix: '+20% ', skill: job, suffix: ' XP' }
        case 2:
            return { prefix: '-10% ', skill: job, suffix: ' Duration' }
        case 3:
            return { prefix: '+20% ', skill: job, suffix: ' XP' }
        case 4:
            return { prefix: '-10% ', skill: job, suffix: ' Duration' }
        case 5:
            return { prefix: '+1 ', skill: job, suffix: ' Yield' }
        default:
            return { prefix: '', skill: '', suffix: '' }
    }
}

// Helper function to convert hex to rgba with opacity
function hexToRgba(hex: string, opacity: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function SanctuaryPage({ state, dispatch }: StateProps) {
    const [creatureSelected, setCreatureSelected] = useState<string>('')

    const jobScores = SanctuaryHelpers.calculateJobScores(state)
    const jobTiers = SanctuaryHelpers.calculateJobTiers(state)

    const gridSlots = Array.from({ length: 8 }, (_, i) => i)

    const handleCreatureSelect = (creature: string) => {
        if (creature === creatureSelected || state.sanctuary.includes(creature)) {
            setCreatureSelected('')
            return
        }
        if (state.sanctuary.length < 8) {
            Sanctuary.addCreature(dispatch, creature)
            setCreatureSelected('')
        } else {
            setCreatureSelected(creature)
        }
    }

    return (
        <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '1400px' }}>
                <Panel>
                    <h3>Active Creatures</h3>
                    <p style={{ marginBottom: '0px' }}>
                        Add creatures to boost your gathering skills. Each creature contributes all of their job proficiencies and
                        if you earn enough points, unlock bonuses for your gathering ability and your helpers. Creatures gain 0.5
                        XP per second.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        {gridSlots.map((slotIndex) => {
                            const creatureSpeciesId = state.sanctuary[slotIndex]
                            const hasCreature = creatureSpeciesId !== undefined
                            const creatureMeta = hasCreature ? CreaturesContent.getById(creatureSpeciesId) : null
                            const creatureInstance = creatureMeta
                                ? state.creatures.find((c) => c.species === creatureMeta.id)
                                : null
                            const isAwakened = creatureInstance?.awakened || false
                            const animationDelay = creatureMeta ? ((creatureMeta.id.charCodeAt(0) + slotIndex) % 3000) / 1000 : 0

                            return (
                                <Panel key={slotIndex}>
                                    {hasCreature && (
                                        <CloseButton
                                            style={{ position: 'absolute', top: '4px', right: '4px', color: 'red' }}
                                            size="24"
                                            onClick={() => Sanctuary.removeCreature(dispatch, creatureSpeciesId)}
                                        />
                                    )}
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            width: '100%',
                                            minHeight: '104px',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {creatureInstance && creatureMeta ? (
                                            <Tooltip
                                                content={
                                                    <CreatureJobTooltip
                                                        creature={creatureInstance}
                                                        creatureContent={creatureMeta}
                                                    />
                                                }
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div
                                                        className={`${isAwakened ? 'creature-awakened' : ''} creature-float-minimal`}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            margin: 'auto',
                                                            width: '78px',
                                                            height: '78px',
                                                            animationDelay: `${animationDelay}s`,
                                                        }}
                                                    >
                                                        {isAwakened && <AwakenedShine image={creatureMeta.image} />}
                                                        <img
                                                            className="pixel"
                                                            src={Images.get(creatureMeta.image)}
                                                            alt="Creature"
                                                            style={{ width: '78px', height: '78px' }}
                                                        />
                                                    </div>
                                                    <h3
                                                        className={isAwakened ? 'creature-name-awakened' : ''}
                                                        style={{
                                                            fontSize: '14px',
                                                            marginTop: '0px',
                                                            textAlign: 'center',
                                                            marginBottom: '0px',
                                                        }}
                                                    >
                                                        {creatureMeta.name}
                                                    </h3>
                                                </div>
                                            </Tooltip>
                                        ) : null}
                                        {!hasCreature && !creatureSelected && (
                                            <Text size="sm" c="rgba(255,255,255,0.5)" ta="center" style={{ marginTop: '80px' }}>
                                                Empty Slot
                                            </Text>
                                        )}
                                    </div>
                                </Panel>
                            )
                        })}
                    </div>
                </Panel>

                {/* Display tier levels for each job */}
                <Panel style={{ paddingBottom: '30px' }}>
                    <h3>Gathering Skill Benefits</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        {gatheringJobs.map((job) => {
                            const jobKey = job.toLowerCase() as keyof typeof jobTiers
                            const tier = jobTiers[jobKey]
                            const score = jobScores[jobKey]
                            const jobColor = jobColors[jobKey] || 'white'

                            return (
                                <Panel key={job}>
                                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                        <h4
                                            style={{
                                                fontSize: '18px',
                                                fontWeight: '400',
                                                marginBottom: '0px',
                                                textAlign: 'center',
                                                marginTop: '0',
                                            }}
                                        >
                                            {job}
                                        </h4>

                                        {/* Tier rectangles */}
                                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                                            {[1, 2, 3, 4, 5].map((tierNum) => {
                                                const isReached = tier >= tierNum
                                                return (
                                                    <Tooltip
                                                        key={tierNum}
                                                        content={
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <div
                                                                    style={{
                                                                        fontSize: '20px',
                                                                        fontWeight: '500',
                                                                        marginBottom: '-8px',
                                                                        color: 'white',
                                                                    }}
                                                                >
                                                                    Tier {tierNum} {isReached ? '' : '(Locked)'}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: '20px',
                                                                        color: 'rgba(255,255,255,0.5)',
                                                                        marginTop: '4px',
                                                                    }}
                                                                >
                                                                    {(() => {
                                                                        const b = getTierBenefit(tierNum, job)
                                                                        return (
                                                                            <>
                                                                                {b.prefix}
                                                                                <span style={{ color: jobColor }}>{b.skill}</span>
                                                                                {b.suffix}
                                                                            </>
                                                                        )
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                flex: 1,
                                                                height: '20px',
                                                                backgroundColor: isReached ? jobColor : hexToRgba(jobColor, 0.15),
                                                                cursor: 'pointer',
                                                            }}
                                                        />
                                                    </Tooltip>
                                                )
                                            })}
                                        </div>

                                        <Text size="sm" c="rgba(255,255,255,0.4)" ta="center" style={{ fontSize: '15px' }}>
                                            {(() => {
                                                const { TIER_THRESHOLDS, SCORE_DIVISOR } = SanctuaryConfig.JOB_SCORING
                                                const nextThresholdIndex = TIER_THRESHOLDS.findIndex(
                                                    (t) => score < t * SCORE_DIVISOR
                                                )
                                                if (nextThresholdIndex === -1)
                                                    return <span style={{ color: jobColor }}>Max Tier!</span>
                                                const pointsNeeded =
                                                    Math.ceil(TIER_THRESHOLDS[nextThresholdIndex] * SCORE_DIVISOR) - score
                                                return (
                                                    <>
                                                        <span style={{ color: jobColor }}>{pointsNeeded} points</span> to next
                                                        tier
                                                    </>
                                                )
                                            })()}
                                        </Text>
                                    </div>
                                </Panel>
                            )
                        })}
                    </div>
                </Panel>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Panel>
                    <SanctuaryCreatureSelector state={state} dispatch={dispatch} onSelect={handleCreatureSelect} />
                </Panel>
            </div>
        </div>
    )
}

export default SanctuaryPage

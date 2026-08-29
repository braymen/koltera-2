import ItemsContent from '@data/items'
import { StateProps } from '@engine/types'
import Images from '@utils/images'
import CreaturesContent from '@data/creatures'
import Button from '@components/common/Button'
import CreaturesActions from '@modules/creatures/dispatch'
import TraitsContent from '@data/traits'
import CollectionActions from '@modules/collections/dispatch'
import Sounds from '@utils/sounds'
import { getCreatureLevel, getCreatureXpForLevel } from '@modules/creatures/helpers'
import CreatureConfig from '@configs/creatures'
import { ResponsiveRadar } from '@nivo/radar'
import AwakenedShine from '@components/creatures/AwakenedShine'
import { useEffect } from 'react'
import Tooltip from '@components/common/Tooltip'

interface Props extends StateProps {
    creature: string
    showSummon: boolean
    showEquipment: boolean
    setSelectedCreature?: (creature: string) => void
}

function CreatureDetails({ state, dispatch, creature, showSummon, setSelectedCreature }: Props) {
    const creatureMeta = CreaturesContent.getById(creature)
    const creatureInstance = state.creatures.find((c) => c.species === creature)

    useEffect(() => {
        if (creature && creatureMeta) {
            CollectionActions.markCreatureSeen(dispatch, creature)
        }
    }, [creature, creatureMeta, dispatch])
    const canAffordSummon = creatureMeta
        ? creatureMeta.summoningCost.every((cost) => {
              const itemInstance = state.inventory.find((item) => item.id === cost.id)
              return itemInstance ? itemInstance.amount >= cost.amount : false
          })
        : false

    const maxStats = {
        power: Math.max(...CreaturesContent.get.map((c) => c.stats.power)),
        toughness: Math.max(...CreaturesContent.get.map((c) => c.stats.toughness)),
        agility: Math.max(...CreaturesContent.get.map((c) => c.stats.agility)),
        intelligence: Math.max(...CreaturesContent.get.map((c) => c.stats.intelligence)),
        gathering: Math.max(...CreaturesContent.get.map((c) => c.stats.gathering)),
        luck: Math.max(...CreaturesContent.get.map((c) => c.stats.luck)),
    }

    const creatureLevel = creatureInstance ? getCreatureLevel(creatureInstance) : 1
    const maxLevel = creatureInstance?.awakened ? 120 : 99
    const scaledStats = creatureMeta
        ? {
              power: creatureMeta.stats.power * creatureLevel,
              toughness: creatureMeta.stats.toughness * creatureLevel,
              agility: creatureMeta.stats.agility * creatureLevel,
              intelligence: creatureMeta.stats.intelligence * creatureLevel,
              gathering: creatureMeta.stats.gathering * creatureLevel,
              luck: creatureMeta.stats.luck * creatureLevel,
          }
        : null
    const maxScaledStats = {
        power: maxStats.power * maxLevel,
        toughness: maxStats.toughness * maxLevel,
        agility: maxStats.agility * maxLevel,
        intelligence: maxStats.intelligence * maxLevel,
        gathering: maxStats.gathering * maxLevel,
        luck: maxStats.luck * maxLevel,
    }

    const maxJobProficiency = 10

    return (
        <div style={{ position: 'relative', minHeight: '632px' }}>
            <div
                style={{
                    flex: '0 0 180px',
                    minWidth: '200px',
                    height: '170px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'absolute',
                    right: '-20px',
                    top: '-10px',
                }}
            >
                {creatureMeta && (
                    <div style={{ flex: 1, width: '100%', height: '100%' }}>
                        <ResponsiveRadar
                            data={[
                                {
                                    stat: 'Power',
                                    creature: creatureMeta.stats.power,
                                    max: maxStats.power,
                                },
                                {
                                    stat: 'Grit',
                                    creature: creatureMeta.stats.toughness,
                                    max: maxStats.toughness,
                                },
                                {
                                    stat: 'Agility',
                                    creature: creatureMeta.stats.agility,
                                    max: maxStats.agility,
                                },
                                {
                                    stat: 'Smarts',
                                    creature: creatureMeta.stats.intelligence,
                                    max: maxStats.intelligence,
                                },
                                {
                                    stat: 'Looting',
                                    creature: creatureMeta.stats.gathering,
                                    max: maxStats.gathering,
                                },
                                {
                                    stat: 'Luck',
                                    creature: creatureMeta.stats.luck,
                                    max: maxStats.luck,
                                },
                            ]}
                            keys={['creature']}
                            indexBy="stat"
                            valueFormat=" >-.0f"
                            margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
                            borderColor={{ from: 'color' }}
                            gridLabelOffset={8}
                            dotSize={3}
                            dotColor={{ theme: 'background' }}
                            dotBorderWidth={1}
                            colors={['rgba(255, 255, 255, 0.8)']}
                            fillOpacity={0.3}
                            blendMode="normal"
                            motionConfig="wobbly"
                            maxValue={Math.max(
                                maxStats.power,
                                maxStats.toughness,
                                maxStats.agility,
                                maxStats.intelligence,
                                maxStats.gathering,
                                maxStats.luck
                            )}
                            theme={{
                                background: 'transparent',
                                text: {
                                    fontSize: 9,
                                    fill: 'rgba(255, 255, 255, 0.7)',
                                    outlineWidth: 0,
                                    outlineColor: 'transparent',
                                },
                                grid: {
                                    line: {
                                        stroke: 'rgba(255, 255, 255, 0.2)',
                                        strokeWidth: 1,
                                    },
                                },
                                axis: {
                                    domain: {
                                        line: {
                                            stroke: 'rgba(255, 255, 255, 0.3)',
                                            strokeWidth: 1,
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                )}
            </div>
            <h3>Creature Details</h3>
            {creatureMeta ? (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        paddingTop: '8px',
                        position: 'relative',
                        minHeight: '612px',
                    }}
                >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', width: '500px' }}>
                        <div
                            className={`${creatureInstance?.awakened ? 'creature-awakened' : ''} creature-float`}
                            style={{
                                width: '98px',
                                height: '98px',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {creatureInstance?.awakened && <AwakenedShine image={creatureMeta.image} />}
                            <img
                                className="pixel"
                                src={Images.get(creatureMeta.image)}
                                alt="item art"
                                style={{
                                    width: '98px',
                                    height: '98px',
                                    imageRendering: 'pixelated',
                                }}
                            />
                        </div>
                        <div
                            style={{
                                flex: 1,
                                display: 'grid',
                                gridTemplateColumns: '0.6fr 0.6fr .8fr 1fr',
                                gap: '12px 4px',
                                minWidth: 0,
                            }}
                        >
                            <InfoBlock
                                label="Name"
                                value={creatureMeta.name}
                                valueClassName={creatureInstance?.awakened ? 'creature-name-awakened' : ''}
                            />
                            <InfoBlock label="Tier" value={`Tier ${creatureMeta.tier + (creatureMeta.id === 'moss' ? 0 : 1)}`} />
                            <InfoBlock label="Type" value={creatureMeta.types.join(', ')} />
                            <InfoBlock label="Trait" value={TraitsContent.getById(creatureMeta.trait)?.name} />
                            <InfoBlock
                                label="Level"
                                value={creatureInstance ? getCreatureLevel(creatureInstance).toString() : '1'}
                            />
                            <InfoBlock
                                label="XP"
                                value={creatureInstance ? Math.floor(creatureInstance.experience).toString() : '0'}
                            />
                            <InfoBlock
                                label="Next Level"
                                value={
                                    creatureInstance
                                        ? getCreatureLevel(creatureInstance) >=
                                          (creatureInstance.awakened
                                              ? CreatureConfig.LEVELING.MAX_LEVEL_AWAKENED
                                              : CreatureConfig.LEVELING.MAX_LEVEL)
                                            ? 'Max Level'
                                            : Math.floor(
                                                  getCreatureXpForLevel(getCreatureLevel(creatureInstance) + 1) -
                                                      creatureInstance.experience
                                              ).toString() + ' XP'
                                        : '0 XP'
                                }
                            />
                            {creatureInstance?.awakened && (
                                <InfoBlock label="Prestiges" value={(creatureInstance.prestigeCount ?? 0).toString()} />
                            )}
                        </div>
                    </div>

                    <div>
                        {/* <h3 style={{ fontWeight: '400', marginBottom: '0' }}>Description</h3>
                        <p style={{ color: 'rgba(255,255,255,.7)', margin: 0, padding: 0 }}>{creatureMeta.description}</p> */}
                        <h3 style={{ fontWeight: '400', marginBottom: '8px', marginTop: '8px' }}>Expedition Stats</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' }}>
                            <CombinedStatBlock
                                label="Power"
                                baseValue={creatureMeta.stats.power}
                                scaledValue={scaledStats?.power}
                                maxBaseValue={maxStats.power}
                            />
                            <CombinedStatBlock
                                label="Grit"
                                baseValue={creatureMeta.stats.toughness}
                                scaledValue={scaledStats?.toughness}
                                maxBaseValue={maxStats.toughness}
                            />
                            <CombinedStatBlock
                                label="Agility"
                                baseValue={creatureMeta.stats.agility}
                                scaledValue={scaledStats?.agility}
                                maxBaseValue={maxStats.agility}
                            />
                            <CombinedStatBlock
                                label="Smarts"
                                baseValue={creatureMeta.stats.intelligence}
                                scaledValue={scaledStats?.intelligence}
                                maxBaseValue={maxStats.intelligence}
                            />
                            <CombinedStatBlock
                                label="Looting"
                                baseValue={creatureMeta.stats.gathering}
                                scaledValue={scaledStats?.gathering}
                                maxBaseValue={maxStats.gathering}
                            />
                            <CombinedStatBlock
                                label="Luck"
                                baseValue={creatureMeta.stats.luck}
                                scaledValue={scaledStats?.luck}
                                maxBaseValue={maxStats.luck}
                            />
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontWeight: '400', marginBottom: '8px' }}>
                            Job Proficiencies <span style={{ color: 'gray' }}>(Do not change with level)</span>
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                            <RadialProgressBar
                                label="Chopping"
                                value={creatureMeta.jobs.chopping}
                                maxValue={maxJobProficiency}
                                disabled={creatureMeta.jobs.chopping === 0}
                                color="#59e843"
                            />
                            <RadialProgressBar
                                label="Mining"
                                value={creatureMeta.jobs.mining}
                                maxValue={maxJobProficiency}
                                disabled={creatureMeta.jobs.mining === 0}
                                color="#c9c9c9"
                            />
                            <RadialProgressBar
                                label="Exploring"
                                value={creatureMeta.jobs.exploring}
                                maxValue={maxJobProficiency}
                                disabled={creatureMeta.jobs.exploring === 0}
                                color="#fc1717"
                            />
                            <RadialProgressBar
                                label="Digging"
                                value={creatureMeta.jobs.digging}
                                maxValue={maxJobProficiency}
                                disabled={creatureMeta.jobs.digging === 0}
                                color="#e89643"
                            />
                            <RadialProgressBar
                                label="Fishing"
                                value={creatureMeta.jobs.fishing}
                                maxValue={maxJobProficiency}
                                disabled={creatureMeta.jobs.fishing === 0}
                                color="#43c7e8"
                            />
                            <RadialProgressBar
                                label="Farming"
                                value={creatureMeta.jobs.farming}
                                maxValue={maxJobProficiency}
                                disabled={creatureMeta.jobs.farming === 0}
                                color="#fce917"
                            />
                        </div>
                    </div>

                    {showSummon && (
                        <div style={{ marginTop: 'auto' }}>
                            <h3 style={{ fontWeight: '400', marginBottom: '4px' }}>Summoning Cost</h3>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '8px',
                                }}
                            >
                                {creatureMeta.summoningCost.map((cost) => {
                                    const itemMeta = ItemsContent.getById(cost.id)
                                    const itemInstance = state.inventory.find((item) => item.id === cost.id)
                                    const haveEnough = itemInstance ? itemInstance.amount >= cost.amount : false
                                    const color = haveEnough ? 'lime' : 'red'
                                    const amount = itemInstance?.amount ?? 0
                                    return (
                                        <Tooltip
                                            key={cost.id}
                                            center={true}
                                            content={
                                                <div
                                                    style={{
                                                        position: 'relative',
                                                        display: 'flex',
                                                        gap: '12px',
                                                        alignItems: 'flex-start',
                                                        width: '100%',
                                                    }}
                                                >
                                                    <img
                                                        className="pixel"
                                                        src={Images.get(itemMeta.image)}
                                                        alt={itemMeta.name}
                                                        style={{
                                                            width: '38px',
                                                            height: '38px',
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <h1
                                                            style={{
                                                                fontSize: '18px',
                                                                color: 'white',
                                                                margin: 0,
                                                                padding: 0,
                                                                marginTop: '-10px',
                                                            }}
                                                        >
                                                            {itemMeta.name}
                                                        </h1>
                                                        <p
                                                            style={{
                                                                fontSize: '18px',
                                                                color: 'rgba(255,255,255,0.8)',
                                                                marginTop: '-6px',
                                                                padding: 0,
                                                                lineHeight: '0.9',
                                                            }}
                                                        >
                                                            {itemMeta.description || ''}
                                                        </p>
                                                    </div>
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: '-6px',
                                                            right: 0,
                                                            fontSize: '16px',
                                                            color: 'rgba(255,255,255,0.9)',
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        {amount.toLocaleString()} Owned
                                                    </div>
                                                </div>
                                            }
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '4px 8px',
                                                    paddingBottom: '7px',
                                                    cursor: 'pointer',
                                                    backgroundColor: 'rgb(16,16,16)',
                                                    borderRadius: '0px',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <img
                                                    className="pixel"
                                                    src={Images.get(itemMeta.image)}
                                                    alt="item art"
                                                    style={{ width: '16px', height: '16px' }}
                                                />
                                                <p style={{ color: color, margin: 0 }}>
                                                    {cost.amount}x {itemMeta.name}
                                                </p>
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        left: 0,
                                                        height: '3px',
                                                        width: `${Math.min(amount / cost.amount, 1) * 100}%`,
                                                        backgroundColor: haveEnough ? 'lime' : 'red',
                                                    }}
                                                />
                                            </div>
                                        </Tooltip>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {showSummon && (
                        <Button
                            disabled={!canAffordSummon}
                            onClick={() => {
                                CollectionActions.addToCollection(dispatch, 'creatures', creatureMeta.id)
                                CreaturesActions.summonCreature(dispatch, creatureMeta.id)
                                if (setSelectedCreature) {
                                    setSelectedCreature('')
                                }
                            }}
                            style={{
                                alignSelf: 'flex-start',
                                marginTop: '4px',
                                backgroundColor: canAffordSummon ? '#5e3569' : 'rgba(255,255,255,.1)',
                            }}
                        >
                            Summon
                        </Button>
                    )}

                    {creatureInstance && !creatureInstance.awakened && (
                        <div style={{ marginTop: 'auto' }}>
                            {(() => {
                                const canAwaken = creatureLevel >= 70 && !creatureInstance.awakened
                                const awakenPointsItem = ItemsContent.getById('awaken-points')
                                return (
                                    <>
                                        <h3 style={{ margin: 0, padding: 0, marginBottom: '4px' }}>
                                            The Awakening{' '}
                                            <span style={{ fontWeight: '400', color: 'rgba(255,255,255,.4)' }}>
                                                (Unlocks at Level 70)
                                            </span>
                                        </h3>
                                        <p style={{ color: 'rgba(255,255,255,.7)', margin: 0, padding: 0 }}>
                                            Awakening resets a creatures level to 1 and raises their level cap from 70 to 120. You
                                            will earn 1 Awakening Point, which are used in the Awakening Tree for various
                                            upgrades. Each creature can only be awakened once. Additionally, you gain +1
                                            gold/minute, for each awakened creature.
                                        </p>
                                        <div
                                            onClick={() => {
                                                if (canAwaken) {
                                                    Sounds.play('click.wav')
                                                    if (creatureInstance) {
                                                        CreaturesActions.awakenCreature(dispatch, creatureInstance.id)
                                                    }
                                                }
                                            }}
                                            style={{
                                                marginTop: '8px',
                                                backgroundColor: canAwaken ? '#7a324b' : 'rgba(100, 100, 100, 0.5)',
                                                color: canAwaken ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                                padding: '8px 16px',
                                                borderRadius: '0',
                                                fontSize: '18px',
                                                fontWeight: '400',
                                                cursor: canAwaken ? 'pointer' : 'not-allowed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                width: '100%',
                                                opacity: canAwaken ? 1 : 0.6,
                                            }}
                                        >
                                            <span>Awaken and gain +1</span>
                                            {awakenPointsItem && (
                                                <img
                                                    className="pixel"
                                                    src={Images.get(awakenPointsItem.image)}
                                                    alt="Awaken Point"
                                                    style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        opacity: canAwaken ? 1 : 0.5,
                                                    }}
                                                />
                                            )}
                                            <span>Awaken Point</span>
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    )}

                    {creatureInstance && creatureInstance.awakened && (
                        <div style={{ marginTop: 'auto' }}>
                            {(() => {
                                const canPrestige = creatureLevel >= CreatureConfig.LEVELING.MAX_LEVEL_AWAKENED
                                const prestigePointsItem = ItemsContent.getById('prestige-points')
                                return (
                                    <>
                                        <h3 style={{ margin: 0, padding: 0, marginBottom: '4px' }}>
                                            Prestige{' '}
                                            <span style={{ fontWeight: '400', color: 'rgba(255,255,255,.4)' }}>
                                                (Unlocks at Level 120)
                                            </span>
                                        </h3>
                                        <p style={{ color: 'rgba(255,255,255,.7)', margin: 0, padding: 0 }}>
                                            Prestiging resets a creatures level to 1 and you earn 1 prestige point. This is used
                                            in the Fabrication tab for various upgrades. Each creature can be prestiged infinitely
                                            and you will each time gain 1 prestige point. The creature will still be awakened when
                                            prestiged.
                                        </p>
                                        <div
                                            onClick={() => {
                                                if (canPrestige) {
                                                    Sounds.play('click.wav')
                                                    if (creatureInstance) {
                                                        CreaturesActions.prestigeCreature(dispatch, creatureInstance.id)
                                                    }
                                                }
                                            }}
                                            style={{
                                                marginTop: '8px',
                                                backgroundColor: canPrestige ? '#2d8a3e' : 'rgba(100, 100, 100, 0.5)',
                                                color: canPrestige ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                                padding: '8px 16px',
                                                borderRadius: '0',
                                                fontSize: '18px',
                                                fontWeight: '400',
                                                cursor: canPrestige ? 'pointer' : 'not-allowed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                width: '100%',
                                                opacity: canPrestige ? 1 : 0.6,
                                            }}
                                        >
                                            <span>Prestige and gain +1</span>
                                            {prestigePointsItem && (
                                                <img
                                                    className="pixel"
                                                    src={Images.get(prestigePointsItem.image)}
                                                    alt="Prestige Point"
                                                    style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        opacity: canPrestige ? 1 : 0.5,
                                                    }}
                                                />
                                            )}
                                            <span>Prestige Point</span>
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    )}
                </div>
            ) : (
                <p style={{ fontSize: '20px', color: 'rgba(255,255,255,.5)' }}>Select a creature to view details.</p>
            )}
        </div>
    )
}

interface CombinedStatBlockProps {
    label: string
    baseValue: number
    scaledValue?: number
    maxBaseValue: number
}

function CombinedStatBlock({ label, baseValue, scaledValue, maxBaseValue }: CombinedStatBlockProps) {
    const progress = maxBaseValue > 0 ? (baseValue / maxBaseValue) * 100 : 0

    return (
        <div
            style={{
                padding: '4px 8px',
                backgroundColor: 'rgb(40,40,40)',
                borderRadius: '0px',
            }}
        >
            <h3
                style={{
                    margin: 0,
                    marginBottom: '0px',
                    color: 'rgba(255,255,255,.6)',
                    fontSize: '16px',
                    letterSpacing: '0.05em',
                }}
            >
                {label}
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                {scaledValue !== undefined && (
                    <>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,.9)', fontSize: '20px', fontWeight: '500' }}>
                            {scaledValue}
                        </p>
                    </>
                )}
                <p style={{ margin: 0, color: 'rgba(255,255,255,.7)', fontSize: '12px', textTransform: 'uppercase' }}>
                    ({baseValue} base)
                </p>
                {scaledValue === undefined && (
                    <p style={{ margin: 0, color: 'rgba(255,255,255,.9)', fontSize: '16px', fontWeight: '500' }}>{baseValue}</p>
                )}
            </div>
        </div>
    )
}

interface StatBlockProps {
    label: string
    value: number | string
    maxValue?: number
    disabled?: boolean
}

function StatBlock({ label, value, maxValue, disabled = false }: StatBlockProps) {
    const numericValue = typeof value === 'number' ? value : parseFloat(value.toString())
    const progress = maxValue && maxValue > 0 ? (numericValue / maxValue) * 100 : 0

    return (
        <div
            style={{
                padding: '4px 8px',
                backgroundColor: 'rgb(40,40,40)',
                borderRadius: '0px',
                opacity: disabled ? 0.3 : 1,
            }}
        >
            <p
                style={{
                    margin: 0,
                    color: 'rgba(255,255,255,.6)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}
            >
                {label}
            </p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,.9)', fontSize: '16px' }}>{value}</p>
            {maxValue !== undefined && (
                <div
                    style={{
                        height: '4px',
                        width: '100%',
                        position: 'relative',
                        backgroundColor: 'rgba(255,255,255,.25)',
                        marginTop: '4px',
                        borderRadius: '0px',
                        marginBottom: '4px',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 100 - progress + '%',
                            top: 0,
                            bottom: 0,
                            backgroundColor: 'white',
                            borderRadius: '0px',
                        }}
                    ></div>
                </div>
            )}
        </div>
    )
}

interface InfoBlockProps {
    label: string
    value: string
    valueClassName?: string
}

function InfoBlock({ label, value, valueClassName }: InfoBlockProps) {
    return (
        <div>
            <h3 style={{ fontWeight: '400', marginBottom: '4px' }}>{label}</h3>
            <p className={valueClassName} style={{ color: 'rgba(255,255,255,.8)', margin: 0 }}>
                {value}
            </p>
        </div>
    )
}

interface RadialProgressBarProps {
    label: string
    value: number
    maxValue: number
    disabled?: boolean
    color?: string
}

function RadialProgressBar({ label, value, maxValue, disabled = false, color = 'white' }: RadialProgressBarProps) {
    const size = 80
    const strokeWidth = 6
    const radius = (size - strokeWidth) / 2
    const center = size / 2
    const numSegments = maxValue
    const totalGap = 0.3
    const segmentAngle = (2 * Math.PI - totalGap * numSegments) / numSegments

    const createSegmentPath = (segmentIndex: number) => {
        const gapOffset = totalGap / 2
        const startAngle = segmentIndex * (segmentAngle + totalGap) + gapOffset - Math.PI / 2
        const endAngle = startAngle + segmentAngle
        const startX = center + radius * Math.cos(startAngle)
        const startY = center + radius * Math.sin(startAngle)
        const endX = center + radius * Math.cos(endAngle)
        const endY = center + radius * Math.sin(endAngle)
        const largeArcFlag = segmentAngle > Math.PI ? 1 : 0

        return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`
    }

    return (
        <div
            style={{
                padding: '4px 8px',
                backgroundColor: 'rgb(40,40,40)',
                borderRadius: '0px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: disabled ? 0.3 : 1,
            }}
        >
            <h3
                style={{
                    margin: 0,
                    marginBottom: '8px',
                    color: 'rgba(255,255,255,.6)',
                    fontSize: '16px',
                    letterSpacing: '0.05em',
                }}
            >
                {label}
            </h3>
            <div style={{ position: 'relative', width: size, height: size, marginBottom: '8px' }}>
                <svg width={size} height={size}>
                    {/* Background segments */}
                    {Array.from({ length: numSegments }, (_, i) => (
                        <path
                            key={`bg-${i}`}
                            d={createSegmentPath(i)}
                            fill="none"
                            stroke="rgba(255,255,255,0.25)"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                        />
                    ))}
                    {/* Filled segments */}
                    {Array.from({ length: numSegments }, (_, i) => {
                        const isFilled = i < value
                        if (!isFilled) return null
                        return (
                            <path
                                key={`fill-${i}`}
                                d={createSegmentPath(i)}
                                fill="none"
                                stroke={color}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                            />
                        )
                    })}
                </svg>
                {/* Center text */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                    }}
                >
                    <p style={{ margin: 0, color: 'rgba(255,255,255,.9)', fontSize: '20px', fontWeight: '500' }}>{value}</p>
                </div>
            </div>
        </div>
    )
}

export default CreatureDetails

import Panel from '@components/common/Panel'
import ActivitySelection from '@components/gathering/ActivitySelection'
import GatheringProgressPanel from '@components/panels/GatheringProgressPanel'
import LootTablePanel from '@components/panels/LootTablePanel'
import SkillLevelPanel from '@components/panels/SkillLevelPanel'
import { StateProps } from '@engine/types'
import { Skills } from '@modules/skilling/types'
import { useState, useEffect } from 'react'
import SkillContent from '@data/skills'
import Images from '@utils/images'
import CreaturesContent from '@data/creatures'
import ItemsContent from '@data/items'
import Tooltip from '@components/common/Tooltip'
import { Group, Select, Text } from '@mantine/core'
import AwakenedShine from '@components/creatures/AwakenedShine'
import Skilling from '@modules/skilling/dispatch'
import SkillingHelpers from '@modules/skilling/helpers'

interface Props extends StateProps {
    skill: Skills
}

function GatheringLayout({ state, dispatch, skill }: Props) {
    const activities = SkillContent.getById(skill).activities || []

    const getInitialSelectedActivity = (): string | null => {
        if (state.progress.skilling.id === skill && state.progress.skilling.activity) {
            const activeActivity = activities.find((a) => a.id === state.progress.skilling.activity)
            if (activeActivity) {
                return state.progress.skilling.activity
            }
        }
        return activities.length > 0 ? activities[0].id : null
    }

    const [selectedActivity, setSelectedActivity] = useState<string | null>(getInitialSelectedActivity())

    useEffect(() => {
        const currentActive = state.progress.skilling.id === skill ? state.progress.skilling.activity : null
        if (currentActive && activities.find((a) => a.id === currentActive)) {
            setSelectedActivity(currentActive)
        } else if (!selectedActivity && activities.length > 0) {
            setSelectedActivity(activities[0].id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skill, state.progress.skilling.id, state.progress.skilling.activity])

    const helperData = state.helpers.find((helper) => helper.skillId === skill)
    const creatureMeta = helperData ? CreaturesContent.getById(helperData.creatureId) : null
    const creatureInstance = creatureMeta ? state.creatures.find((c) => c.species === creatureMeta.id) : null
    const isAwakened = creatureInstance?.awakened || false
    const skillLevel = SkillingHelpers.getLevel(state.skills.find((s) => s.id === skill)?.xp || 0)
    const accessibleActivities = activities.filter((activity) => activity.levelRequirement <= skillLevel)

    const animationDelay = creatureMeta && helperData ? ((creatureMeta.id.charCodeAt(0) + skill.charCodeAt(0)) % 3000) / 1000 : 0

    return (
        <>
            <SkillLevelPanel state={state} dispatch={dispatch} skill={skill} />
            <div style={{ display: 'flex', gap: '0', alignItems: 'stretch', minHeight: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: 0 }}>
                    <GatheringProgressPanel state={state} dispatch={dispatch} skill={skill} />
                    <div style={{ marginTop: '0px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <LootTablePanel state={state} dispatch={dispatch} skill={skill} selectedActivity={selectedActivity} />
                    </div>
                    <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <h3>Helper</h3>
                        {helperData && creatureMeta ? (
                            <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
                                {/* Left side: Creature only (bigger) */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '200px',
                                        flexShrink: 0,
                                    }}
                                >
                                    <div
                                        className={`${isAwakened ? 'creature-awakened' : ''} creature-float-minimal`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '12px',
                                            animationDelay: `${animationDelay}s`,
                                        }}
                                    >
                                        {isAwakened && <AwakenedShine image={creatureMeta.image} />}
                                        <img
                                            className="pixel"
                                            src={Images.get(creatureMeta.image)}
                                            alt="Creature"
                                            style={{
                                                width: '120px',
                                                height: '120px',
                                            }}
                                        />
                                    </div>
                                    <h3
                                        className={isAwakened ? 'creature-name-awakened' : ''}
                                        style={{
                                            fontSize: '18px',
                                            marginTop: '0px',
                                            marginBottom: '0px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {creatureMeta.name}
                                    </h3>
                                </div>

                                {/* Right side: Items and activity selector */}
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                    {/* Items they find */}
                                    <div style={{ marginBottom: '0px' }}>
                                        <h4
                                            style={{
                                                fontSize: '16px',
                                                marginBottom: '0px',
                                                marginTop: '-8px',
                                                paddingTop: 0,
                                                fontWeight: '400',
                                                color: 'white',
                                            }}
                                        >
                                            Items Found
                                        </h4>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '3px',
                                                minHeight: '34px',
                                            }}
                                        >
                                            {helperData.activityId &&
                                                (() => {
                                                    const currentActivity = activities.find((a) => a.id === helperData.activityId)
                                                    const outputItems = currentActivity?.output || []
                                                    const uniqueItemIds = Array.from(new Set(outputItems.map((item) => item.id)))

                                                    return uniqueItemIds.map((itemId) => {
                                                        const item = ItemsContent.getById(itemId)
                                                        if (!item) return null
                                                        const inventoryItem = state.inventory.find(
                                                            (invItem) => invItem.id === itemId
                                                        )
                                                        const currentAmount = inventoryItem?.amount || 0
                                                        return (
                                                            <div
                                                                key={itemId}
                                                                style={{
                                                                    width: '30px',
                                                                    height: '30px',
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                <Tooltip
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
                                                                                src={Images.get(item.image)}
                                                                                alt={item.name}
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
                                                                                    {item.name}
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
                                                                                    {item.description}
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
                                                                                {currentAmount.toLocaleString()} Owned
                                                                            </div>
                                                                        </div>
                                                                    }
                                                                >
                                                                    <div
                                                                        style={{
                                                                            width: '30px',
                                                                            height: '30px',
                                                                            border: '1px solid rgba(255,255,255,0.2)',
                                                                            backgroundColor: 'rgba(0,0,0,0.3)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            cursor: 'pointer',
                                                                            transition: 'border-color 0.2s',
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.borderColor = 'white'
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.borderColor =
                                                                                'rgba(255,255,255,0.2)'
                                                                        }}
                                                                    >
                                                                        <img
                                                                            className="pixel"
                                                                            src={Images.get(item.image)}
                                                                            alt={item.name}
                                                                            style={{
                                                                                width: '26px',
                                                                                height: '26px',
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </Tooltip>
                                                            </div>
                                                        )
                                                    })
                                                })()}
                                        </div>
                                    </div>

                                    {/* Activity selector */}
                                    <div style={{ marginBottom: '0' }}>
                                        <h4
                                            style={{
                                                fontSize: '14px',
                                                marginBottom: '0px',
                                                marginTop: '0px',
                                                paddingTop: 0,
                                                fontWeight: '400',
                                                color: 'white',
                                            }}
                                        >
                                            Activity Focus
                                        </h4>
                                        <Select
                                            placeholder={accessibleActivities.length ? 'Select an activity' : 'No activities'}
                                            data={accessibleActivities.map((activity) => {
                                                const mainOutput = activity.output.find((o) => o.chance === 1)
                                                const mainItem = mainOutput ? ItemsContent.getById(mainOutput.id) : null
                                                return {
                                                    value: activity.id,
                                                    label: mainItem?.name || activity.name,
                                                }
                                            })}
                                            value={
                                                helperData.activityId &&
                                                accessibleActivities.some((activity) => activity.id === helperData.activityId)
                                                    ? helperData.activityId
                                                    : null
                                            }
                                            onChange={(value) => {
                                                if (value) {
                                                    Skilling.changeHelperActivity(dispatch, creatureMeta.id, value)
                                                }
                                            }}
                                            leftSection={(() => {
                                                if (!helperData.activityId) return null
                                                const currentActivity = accessibleActivities.find(
                                                    (a) => a.id === helperData.activityId
                                                )
                                                if (!currentActivity) return null
                                                const mainOutput = currentActivity.output.find((o) => o.chance === 1)
                                                const mainItem = mainOutput ? ItemsContent.getById(mainOutput.id) : null
                                                if (!mainItem) return null
                                                return (
                                                    <img
                                                        className="pixel"
                                                        src={Images.get(mainItem.image)}
                                                        alt={mainItem.name}
                                                        style={{ width: '20px', height: '20px' }}
                                                    />
                                                )
                                            })()}
                                            renderOption={({ option }) => {
                                                const activity = accessibleActivities.find((a) => a.id === option.value)
                                                const mainOutput = activity?.output.find((o) => o.chance === 1)
                                                const mainItem = mainOutput ? ItemsContent.getById(mainOutput.id) : null
                                                return (
                                                    <Group gap="8px">
                                                        <img
                                                            className="pixel"
                                                            src={Images.get(mainItem?.image || 'items/placeholder.png')}
                                                            alt={mainItem?.name || ''}
                                                            style={{ width: '20px', height: '20px', flexShrink: 0 }}
                                                        />
                                                        <Text size="sm" style={{ fontSize: '14px' }}>
                                                            {mainItem?.name || option.label}
                                                        </Text>
                                                    </Group>
                                                )
                                            }}
                                            nothingFoundMessage="No activities unlocked"
                                            disabled={!accessibleActivities.length}
                                            comboboxProps={{ withinPortal: false }}
                                            size="sm"
                                            styles={{
                                                input: {
                                                    backgroundColor: 'rgba(0,0,0,0.35)',
                                                    color: 'rgba(255,255,255,0.9)',
                                                },
                                                dropdown: {
                                                    backgroundColor: 'rgba(0,0,0,1)',
                                                    borderColor: 'rgba(255,255,255,0.25)',
                                                },
                                                option: {
                                                    padding: '8px 12px',
                                                },
                                            }}
                                        />
                                    </div>

                                    {/* Activity progress display (moved below Activity Focus) */}
                                    {helperData.activityId &&
                                        (() => {
                                            const currentActivity = activities.find((a) => a.id === helperData.activityId)
                                            if (!currentActivity) return null

                                            return (
                                                <div style={{ paddingBottom: '4px', marginTop: '0px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <img
                                                            className="pixel"
                                                            src={Images.get(currentActivity.image || 'items/placeholder.png')}
                                                            alt={currentActivity.name}
                                                            style={{
                                                                width: '52px',
                                                                height: '52px',
                                                                marginRight: '8px',
                                                                padding: '4px',
                                                                borderRadius: '0px',
                                                                marginTop: '4px',
                                                            }}
                                                        />
                                                        <div style={{ width: '100%', position: 'relative' }}>
                                                            <h3
                                                                style={{
                                                                    fontSize: '16px',
                                                                    margin: '0 0 0px 0',
                                                                    marginBottom: '-4px',
                                                                    paddingBottom: '0px',
                                                                    fontWeight: '600',
                                                                }}
                                                            >
                                                                {skill}
                                                            </h3>
                                                            <p style={{ fontSize: '16px', margin: '0 0 0px 0', paddingTop: 0 }}>
                                                                {currentActivity.name}
                                                            </p>
                                                            <div
                                                                style={{
                                                                    height: '8px',
                                                                    width: '100%',
                                                                    position: 'relative',
                                                                    backgroundColor: 'rgba(255,255,255,.25)',
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        position: 'absolute',
                                                                        left: 0,
                                                                        right: (1 - helperData.progress) * 100 + '%',
                                                                        top: 0,
                                                                        bottom: 0,
                                                                        backgroundColor: 'white',
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flex: 1,
                                    color: 'rgba(255,255,255,0.5)',
                                    fontSize: '20px',
                                }}
                            >
                                No helper assigned for this skill
                            </div>
                        )}
                    </Panel>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: 0 }}>
                    <Panel style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <ActivitySelection
                            state={state}
                            dispatch={dispatch}
                            skill={skill}
                            selectedActivity={selectedActivity}
                            onActivitySelect={setSelectedActivity}
                        />
                    </Panel>
                </div>
            </div>
        </>
    )
}

export default GatheringLayout

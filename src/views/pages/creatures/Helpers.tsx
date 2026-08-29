import { useEffect, useState } from 'react'
import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import Images from '@utils/images'
import { CloseButton, Group, Select, Text } from '@mantine/core'
import SkillingHelpers from '@modules/skilling/helpers'
import SkillContent from '@data/skills'
import CreatureHelperInventory from '@components/creatures/CreatureHelperInventory'
import Button from '@components/common/Button'
import Skilling from '@modules/skilling/dispatch'
import CreaturesContent from '@data/creatures'
import ItemsContent from '@data/items'
import Tooltip from '@components/common/Tooltip'
import { isTabUnlocked } from '@modules/story/helpers'
import CreatureJobTooltip from '@components/creatures/CreatureJobTooltip'
import AwakenedShine from '@components/creatures/AwakenedShine'
import { getCreatureLevel, getCreatureXpForLevel } from '@modules/creatures/helpers'
import BonusHelpers from '@modules/bonuses/helpers'
import SkillingConfig from '@configs/skilling'
import SanctuaryHelpers from '@modules/sanctuary/helpers'
import ToolHelpers from '@modules/tools/helpers'

const gatheringSkills = ['Chopping', 'Mining', 'Exploring', 'Digging', 'Fishing', 'Farming']

function Helpers({ state, dispatch }: StateProps) {
    const [selectedActivities, setSelectedActivities] = useState<Record<string, string | null>>({})
    const [creatureSelected, setCreatureSelected] = useState<string>('')

    useEffect(() => {
        setSelectedActivities((prev) => {
            const updated = { ...prev }
            for (const helper of state.helpers) {
                updated[helper.skillId] = helper.activityId
            }
            return updated
        })
    }, [state.helpers])

    return (
        <>
            <div style={{ display: 'flex' }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '1400px' }}>
                    <Panel>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            {gatheringSkills.map((skill) => {
                                const xp = state.skills.find((s) => s.id === skill)?.xp || 0
                                const level = SkillingHelpers.getLevel(xp)
                                const skillData = SkillContent.getById(skill)
                                const activities = skillData?.activities ?? []
                                const accessibleActivities = activities.filter((activity) => activity.levelRequirement <= level)
                                const selectedValue = selectedActivities[skill] ?? null
                                const tabUnlocked = isTabUnlocked(state, skill)

                                const selectData = accessibleActivities.map((activity) => {
                                    const mainOutput = activity.output.find((o) => o.chance === 1)
                                    const mainItem = mainOutput ? ItemsContent.getById(mainOutput.id) : null
                                    return {
                                        value: activity.id,
                                        label: mainItem?.name || activity.name,
                                    }
                                })

                                const helperData = state.helpers.find((helper) => helper.skillId === skill)
                                const creatureMeta = CreaturesContent.getById(helperData?.creatureId!)
                                const hasCreature = helperData != null

                                // Generate a random animation delay based on creature ID and skill for consistency
                                const animationDelay =
                                    hasCreature && creatureMeta
                                        ? ((creatureMeta.id.charCodeAt(0) + skill.charCodeAt(0)) % 3000) / 1000
                                        : 0

                                return (
                                    <Panel
                                        key={skill}
                                        style={{
                                            minHeight: '308px',
                                            opacity: tabUnlocked ? 1 : 0.4,
                                            backgroundColor: tabUnlocked ? 'rgb(20,20,20)' : 'rgba(0,0,0,0.4)',
                                            backgroundImage: 'none',
                                        }}
                                    >
                                        {hasCreature ? (
                                            <>
                                                <CloseButton
                                                    style={{ position: 'absolute', top: '4px', right: '4px', color: 'red' }}
                                                    size="24"
                                                    onClick={() => {
                                                        Skilling.removeHelper(dispatch, creatureMeta.id)
                                                    }}
                                                />
                                            </>
                                        ) : (
                                            <></>
                                        )}
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                width: '100%',
                                                minHeight: '188px',
                                                height: '100%',
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    fontSize: '20px',
                                                    fontWeight: '400',
                                                    marginTop: '0px',
                                                    marginBottom: '-6px',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {skill}
                                            </h3>
                                            {hasCreature ? (
                                                <>
                                                    {(() => {
                                                        const creatureInstance = state.creatures.find(
                                                            (c) => c.species === creatureMeta.id
                                                        )
                                                        const isAwakened = creatureInstance?.awakened || false
                                                        return (
                                                            <Tooltip
                                                                content={
                                                                    creatureInstance && creatureMeta ? (
                                                                        <CreatureJobTooltip
                                                                            creature={creatureInstance}
                                                                            creatureContent={creatureMeta}
                                                                        />
                                                                    ) : null
                                                                }
                                                            >
                                                                <div
                                                                    className={`${
                                                                        isAwakened ? 'creature-awakened' : ''
                                                                    } creature-float-minimal`}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        margin: 'auto',
                                                                        marginTop: '20px',
                                                                        animationDelay: `${animationDelay}s`,
                                                                        cursor: 'pointer',
                                                                    }}
                                                                >
                                                                    {isAwakened && <AwakenedShine image={creatureMeta.image} />}
                                                                    <img
                                                                        className="pixel"
                                                                        src={Images.get(creatureMeta.image)}
                                                                        alt="Creature"
                                                                        style={{
                                                                            width: '78px',
                                                                            height: '78px',
                                                                        }}
                                                                    />
                                                                </div>
                                                            </Tooltip>
                                                        )
                                                    })()}
                                                    {/* Creature level + progress bar */}
                                                    {(() => {
                                                        const creatureInstance = state.creatures.find(
                                                            (c) => c.species === creatureMeta.id
                                                        )
                                                        if (!creatureInstance) return null
                                                        const level = getCreatureLevel(creatureInstance)
                                                        const maxLevel = creatureInstance.awakened ? 120 : 70
                                                        const xpCurrentLevel = getCreatureXpForLevel(level)
                                                        const xpNextLevel = getCreatureXpForLevel(
                                                            Math.min(level + 1, maxLevel + 1)
                                                        )
                                                        const xpIntoLevel = creatureInstance.experience - xpCurrentLevel
                                                        const xpForLevel = xpNextLevel - xpCurrentLevel
                                                        const progress =
                                                            level >= maxLevel
                                                                ? 100
                                                                : state.settings.creatureProgressTowardsCap
                                                                  ? Math.min(level / maxLevel, 1) * 100
                                                                  : Math.min((xpIntoLevel / xpForLevel) * 100, 100)
                                                        const barColor =
                                                            creatureInstance.awakened && level >= 120
                                                                ? '#ff1493'
                                                                : !creatureInstance.awakened && level >= 70
                                                                  ? '#ffd700'
                                                                  : 'white'

                                                        // Calculate XP/sec for display using BonusHelpers
                                                        const skillData = SkillContent.getById(skill)
                                                        const currentActivity = skillData?.activities?.find(
                                                            (a) => a.id === helperData.activityId
                                                        )
                                                        const activityIndex = currentActivity
                                                            ? (skillData?.activities?.indexOf(currentActivity) ?? 0)
                                                            : 0
                                                        const baseXpPerSecond = 0.4 + 0.05 * activityIndex
                                                        const jobTiers = SanctuaryHelpers.calculateJobTiers(state)
                                                        const helperXpBreakdown = BonusHelpers.getHelperXpBonus(
                                                            state,
                                                            skill,
                                                            jobTiers
                                                        )
                                                        const xpPerSecond = baseXpPerSecond * helperXpBreakdown.multiplier

                                                        // Build tooltip showing bonus sources
                                                        // Break down the tool bonus into skill tool vs staff tool
                                                        const skillToolBonus = ToolHelpers.getToolXpBonusBySkillId(
                                                            state.tools,
                                                            skill
                                                        )
                                                        const staffToolBonus = ToolHelpers.getToolXpBonusBySkillId(
                                                            state.tools,
                                                            'Helpers'
                                                        )

                                                        const xpTooltipContent = (
                                                            <div>
                                                                <div
                                                                    style={{
                                                                        fontSize: '18px',
                                                                        fontWeight: 'bold',
                                                                        marginBottom: '-4px',
                                                                        color: 'white',
                                                                    }}
                                                                >
                                                                    Creature XP Breakdown
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: '0px',
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            fontSize: '16px',
                                                                        }}
                                                                    >
                                                                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                                                                            Base XP/sec
                                                                        </span>
                                                                        <span style={{ color: 'white' }}>
                                                                            {baseXpPerSecond.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                    {helperXpBreakdown.sanctuary > 0 && (
                                                                        <div
                                                                            style={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                fontSize: '16px',
                                                                            }}
                                                                        >
                                                                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                                                                                Sanctuary
                                                                            </span>
                                                                            <span style={{ color: '#4ade80' }}>
                                                                                +{helperXpBreakdown.sanctuary.toFixed(2)}%
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {helperXpBreakdown.upgrades > 0 && (
                                                                        <div
                                                                            style={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                fontSize: '16px',
                                                                            }}
                                                                        >
                                                                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                                                                                Awaken Tree
                                                                            </span>
                                                                            <span style={{ color: '#4ade80' }}>
                                                                                +{helperXpBreakdown.upgrades.toFixed(2)}%
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {skillToolBonus > 0 && (
                                                                        <div
                                                                            style={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                fontSize: '16px',
                                                                            }}
                                                                        >
                                                                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                                                                                Skill Tool
                                                                            </span>
                                                                            <span style={{ color: '#4ade80' }}>
                                                                                +{skillToolBonus.toFixed(2)}%
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {staffToolBonus > 0 && (
                                                                        <div
                                                                            style={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                fontSize: '16px',
                                                                            }}
                                                                        >
                                                                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                                                                                Staff Tool
                                                                            </span>
                                                                            <span style={{ color: '#4ade80' }}>
                                                                                +{staffToolBonus.toFixed(2)}%
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {helperXpBreakdown.total > 0 && (
                                                                        <div
                                                                            style={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                fontSize: '16px',
                                                                                borderTop: '1px solid rgba(255,255,255,0.15)',
                                                                                paddingTop: '4px',
                                                                                marginTop: '2px',
                                                                            }}
                                                                        >
                                                                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                                                                                Total Bonus
                                                                            </span>
                                                                            <span style={{ color: '#4ade80' }}>
                                                                                +{helperXpBreakdown.total.toFixed(2)}%
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div
                                                                        style={{
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            fontSize: '16px',
                                                                            borderTop: '1px solid rgba(255,255,255,0.15)',
                                                                            paddingTop: '4px',
                                                                            marginTop: '2px',
                                                                        }}
                                                                    >
                                                                        <span style={{ color: 'white' }}>Final XP/sec</span>
                                                                        <span style={{ color: 'white' }}>
                                                                            {xpPerSecond.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )

                                                        return (
                                                            <div style={{ width: '100%', marginTop: '0px', marginBottom: '2px' }}>
                                                                <div
                                                                    style={{
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        fontSize: '14px',
                                                                        color: 'rgba(255,255,255,0.7)',
                                                                        marginBottom: '-2px',
                                                                    }}
                                                                >
                                                                    <Tooltip
                                                                        content={xpTooltipContent}
                                                                        width="260px"
                                                                        center
                                                                        inline
                                                                    >
                                                                        <span style={{ cursor: 'pointer' }}>
                                                                            {xpPerSecond.toFixed(2)} XP/sec
                                                                        </span>
                                                                    </Tooltip>
                                                                    <span>Level {level}</span>
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        height: '4px',
                                                                        width: '100%',
                                                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            height: '100%',
                                                                            width: `${progress}%`,
                                                                            backgroundColor: barColor,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )
                                                    })()}

                                                    {/* Display items that can be found from the current activity */}
                                                    <div
                                                        style={{
                                                            minHeight: '56px', // Reserve space for 2 rows (24px + 4px gap + 24px + 4px margin)
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: '4px',
                                                            justifyContent: 'center',
                                                            marginTop: '4px',
                                                            marginBottom: '4px',
                                                        }}
                                                    >
                                                        {helperData.activityId &&
                                                            (() => {
                                                                const currentActivity = activities.find(
                                                                    (a) => a.id === helperData.activityId
                                                                )
                                                                const outputItems = currentActivity?.output || []
                                                                // Get unique item IDs (in case of universal drops being spread)
                                                                const uniqueItemIds = Array.from(
                                                                    new Set(outputItems.map((item) => item.id))
                                                                )

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
                                                                                width: '32px',
                                                                                height: '32px',
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
                                                                                        width: '32px',
                                                                                        height: '32px',
                                                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        cursor: 'pointer',
                                                                                        transition: 'border-color 0.2s',
                                                                                    }}
                                                                                    onMouseEnter={(e) => {
                                                                                        e.currentTarget.style.borderColor =
                                                                                            'white'
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
                                                                                            width: '28px',
                                                                                            height: '28px',
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </Tooltip>
                                                                        </div>
                                                                    )
                                                                })
                                                            })()}
                                                    </div>
                                                    {/* Cycle duration display */}
                                                    {(() => {
                                                        const currentActivity = activities.find(
                                                            (a) => a.id === helperData.activityId
                                                        )
                                                        if (!currentActivity) return null
                                                        const jobLevel = creatureMeta.jobs[skill.toLowerCase()] || 1
                                                        const slowestMultiplier = SkillingConfig.HELPERS.HELPER_SLOWEST_MULTIPLIER
                                                        let duration =
                                                            currentActivity.duration *
                                                            Math.pow(slowestMultiplier, (10 - jobLevel) / 9)
                                                        const durationReduction = BonusHelpers.getGatheringDurationReduction(
                                                            state,
                                                            skill
                                                        )
                                                        duration = Math.max(1, duration * durationReduction.multiplier)
                                                        return (
                                                            <Text
                                                                size="sm"
                                                                style={{
                                                                    textAlign: 'center',
                                                                    color: 'rgba(255,255,255,0.5)',
                                                                    fontSize: '16px',
                                                                    marginTop: '-24px',
                                                                    marginBottom: '0px',
                                                                }}
                                                            >
                                                                <span style={{ color: 'cyan'}}>{duration.toFixed(1)}s</span> per cycle
                                                            </Text>
                                                        )
                                                    })()}
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            width: '100%',
                                                            marginTop: 'auto',
                                                        }}
                                                    >
                                                        {(() => {
                                                            const creatureInstance = state.creatures.find(
                                                                (c) => c.species === creatureMeta.id
                                                            )
                                                            const isAwakened = creatureInstance?.awakened || false
                                                            return (
                                                                <h3
                                                                    className={isAwakened ? 'creature-name-awakened' : ''}
                                                                    style={{ fontSize: '18px', marginTop: '-5px' }}
                                                                >
                                                                    {creatureMeta.name}
                                                                    <span
                                                                        style={{
                                                                            fontSize: '18px',
                                                                            color: 'rgba(255,255,255,.8)',
                                                                            float: 'right',
                                                                            fontWeight: '400',
                                                                            textShadow: 'none',
                                                                        }}
                                                                    >
                                                                        {skill} {creatureMeta.jobs[skill.toLowerCase()]}
                                                                    </span>
                                                                </h3>
                                                            )
                                                        })()}
                                                        <div
                                                            style={{
                                                                height: '6px',
                                                                width: '100%',
                                                                position: 'relative',
                                                                backgroundColor: 'rgba(255,255,255,.25)',
                                                                marginBottom: '18px',
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
                                                    <Select
                                                        placeholder={
                                                            accessibleActivities.length ? 'Select an activity' : 'No activities'
                                                        }
                                                        data={selectData}
                                                        value={
                                                            selectedValue &&
                                                            selectData.some((activity) => activity.value === selectedValue)
                                                                ? selectedValue
                                                                : null
                                                        }
                                                        onChange={(value) => {
                                                            if (value)
                                                                Skilling.changeHelperActivity(dispatch, creatureMeta.id, value)
                                                            setSelectedActivities((prev) => ({
                                                                ...prev,
                                                                [skill]: value,
                                                            }))
                                                        }}
                                                        leftSection={(() => {
                                                            if (!selectedValue) return null
                                                            const currentActivity = accessibleActivities.find(
                                                                (a) => a.id === selectedValue
                                                            )
                                                            if (!currentActivity) return null
                                                            const mainOutput = currentActivity.output.find((o) => o.chance === 1)
                                                            const mainItem = mainOutput
                                                                ? ItemsContent.getById(mainOutput.id)
                                                                : null
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
                                                            const activity = accessibleActivities.find(
                                                                (a) => a.id === option.value
                                                            )
                                                            const mainOutput = activity?.output.find((o) => o.chance === 1)
                                                            const mainItem = mainOutput
                                                                ? ItemsContent.getById(mainOutput.id)
                                                                : null
                                                            return (
                                                                <Group gap="8px">
                                                                    <img
                                                                        className="pixel"
                                                                        src={Images.get(
                                                                            mainItem?.image || 'items/placeholder.png'
                                                                        )}
                                                                        alt={mainItem?.name || ''}
                                                                        style={{
                                                                            width: '20px',
                                                                            height: '20px',
                                                                            flexShrink: 0,
                                                                        }}
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
                                                </>
                                            ) : (
                                                <></>
                                            )}
                                            {!hasCreature && creatureSelected ? (
                                                <div style={{ marginTop: 'auto' }}>
                                                    <Button
                                                        onClick={() => {
                                                            if (tabUnlocked) {
                                                                const lastActivity = selectedActivities[skill]
                                                                const activityId =
                                                                    lastActivity &&
                                                                    accessibleActivities.some((a) => a.id === lastActivity)
                                                                        ? lastActivity
                                                                        : activities[0].id
                                                                Skilling.addHelper(dispatch, creatureSelected, skill, activityId)
                                                                setCreatureSelected('')
                                                            }
                                                        }}
                                                        disabled={!tabUnlocked}
                                                        style={{
                                                            opacity: tabUnlocked ? 1 : 0.8,
                                                            cursor: tabUnlocked ? 'pointer' : 'not-allowed',
                                                        }}
                                                    >
                                                        {tabUnlocked ? 'Add Creature' : 'Undiscovered'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <></>
                                            )}
                                        </div>
                                    </Panel>
                                )
                            })}
                        </div>
                    </Panel>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Panel>
                        <CreatureHelperInventory
                            state={state}
                            dispatch={dispatch}
                            selected={creatureSelected}
                            onSelect={(creature) => {
                                if (creature === creatureSelected) {
                                    setCreatureSelected('')
                                } else {
                                    setCreatureSelected(creature)
                                }
                            }}
                        />
                    </Panel>
                </div>
            </div>
        </>
    )
}

export default Helpers

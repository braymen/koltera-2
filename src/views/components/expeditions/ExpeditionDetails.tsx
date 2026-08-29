import { StateProps } from '@engine/types'
import ExpeditionsContent from '@data/expeditions'
import BiomesContent from '@data/biomes'
import Images from '@utils/images'
import ExpeditionConfig from '@configs/expeditions'
import AwakenedShine from '@components/creatures/AwakenedShine'
import {
    generatePartyScore,
    getCreatureExperienceReward,
    getExpeditionDurationLeft,
    isTierUnlocked,
    getRequiredCompletionsForTier,
    getTierCompletionCount,
    generateExpedition,
    isExpeditionTypeUnlocked,
    getLoopXpBonus,
} from '@modules/expeditions/helpers'
import { Creature } from '@modules/creatures/types'
import { useState, useMemo, useEffect, useRef } from 'react'
import ExpeditionsActions from '@modules/expeditions/dispatch'
import Button from '../common/Button'
import CreaturesContent from '@data/creatures'
import Sounds from '@utils/sounds'
import ItemsContent from '@data/items'
import TraitsContent from '@data/traits'
import Tooltip from '../common/Tooltip'
import CreatureTooltip from '../creatures/CreatureTooltip'
import { getCreatureLevel, getCreatureXpForLevel } from '@modules/creatures/helpers'
import Numbers from '@utils/numbers'
import ConfirmModal from '../common/ConfirmModal'
import BonusHelpers from '@modules/bonuses/helpers'

interface Props extends StateProps {
    selectedExpeditionTypeId: string | null
    onSlotSelect: (slotIndex: number | null) => void
    selectedSlot: number | null
    onCreatureSelectHandlerReady: (handler: (creatureId: string) => void) => void
    onPartyCreatureIdsChange: (creatureIds: (string | null)[]) => void
}

function ExpeditionDetails({
    state,
    dispatch,
    selectedExpeditionTypeId,
    onSlotSelect,
    selectedSlot,
    onCreatureSelectHandlerReady,
    onPartyCreatureIdsChange,
}: Props) {
    // Get expedition type from source of truth
    const expeditionType = selectedExpeditionTypeId ? ExpeditionsContent.getById(selectedExpeditionTypeId) : null

    // Check if expedition type is unlocked
    const isUnlocked = selectedExpeditionTypeId
        ? isExpeditionTypeUnlocked(selectedExpeditionTypeId, state.expeditionCompletions)
        : false

    // Get selected tier for this expedition type (default to 1)
    const selectedTier = (selectedExpeditionTypeId && state.expeditionTierSelections?.[selectedExpeditionTypeId]) || 1

    // Generate expedition instance on-demand
    const expeditionInstance = useMemo(() => {
        if (!expeditionType) return null

        // Check if there's an active expedition of this type
        const activeExpedition = (state.activeExpeditions || []).find(
            (exp) => exp.instance.expeditionTypeId === selectedExpeditionTypeId && !exp.completed
        )

        if (activeExpedition) {
            // Use the active expedition's instance
            return activeExpedition.instance
        }

        // Generate a new instance on-demand with the selected tier
        return selectedExpeditionTypeId ? generateExpedition(selectedTier, selectedExpeditionTypeId) : null
    }, [expeditionType, selectedExpeditionTypeId, selectedTier, state.activeExpeditions])
    const maxPartySize = 3

    const [selectedCreatureIds, setSelectedCreatureIds] = useState<(string | null)[]>(() => new Array(maxPartySize).fill(null))
    const [currentTime, setCurrentTime] = useState(Date.now() / 1000)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)

    const creaturesToPrefillRef = useRef<{ creatures: string[]; expeditionTypeId: string } | null>(null)
    const previousExpeditionIdRef = useRef<string | null>(null)

    // Update current time for progress bar
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now() / 1000)
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Find active expedition of the same type (in progress or completed but not collected)
    const activeExpeditionOfSameType = useMemo(() => {
        if (!expeditionInstance) return null
        return (state.activeExpeditions || []).find(
            (exp) => exp.instance.expeditionTypeId === expeditionInstance.expeditionTypeId
        )
    }, [state.activeExpeditions, expeditionInstance])

    // Check if there's an expedition in progress (not completed) of the same type
    const expeditionInProgress = useMemo(() => {
        if (!expeditionInstance) return false
        return (state.activeExpeditions || []).some(
            (exp) => exp.instance.expeditionTypeId === expeditionInstance.expeditionTypeId && !exp.completed
        )
    }, [state.activeExpeditions, expeditionInstance])

    // Separate effect to handle prefilling after rewards are collected
    // This runs after the expedition is removed and state has settled
    useEffect(() => {
        // Only prefill if:
        // 1. We have creatures to prefill
        // 2. There's no active expedition (rewards were just collected)
        // 3. We have a valid expedition type that matches the one we collected from
        if (
            creaturesToPrefillRef.current &&
            !activeExpeditionOfSameType &&
            expeditionType &&
            creaturesToPrefillRef.current.expeditionTypeId === expeditionType.id
        ) {
            const newSize = 3
            const newSelection = new Array(newSize).fill(null)
            for (let i = 0; i < Math.min(creaturesToPrefillRef.current.creatures.length, newSize); i++) {
                newSelection[i] = creaturesToPrefillRef.current.creatures[i]
            }
            // Use setTimeout to ensure this happens after all other effects have run
            const timeoutId = setTimeout(() => {
                setSelectedCreatureIds(newSelection)
                creaturesToPrefillRef.current = null // Clear the ref after using it
                onSlotSelect(null)
            }, 50) // Small delay to ensure all state updates have propagated
            return () => clearTimeout(timeoutId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeExpeditionOfSameType, expeditionType?.id, onSlotSelect, selectedExpeditionTypeId])

    // Reset creature selection when expedition changes (but not if it's active)
    useEffect(() => {
        // If expedition is active, don't reset - maintain the party selection
        if (activeExpeditionOfSameType) {
            previousExpeditionIdRef.current = selectedExpeditionTypeId
            return
        }

        // Don't reset if we're about to prefill for this expedition type (let the prefilling effect handle it)
        if (
            creaturesToPrefillRef.current &&
            expeditionType &&
            creaturesToPrefillRef.current.expeditionTypeId === expeditionType.id
        ) {
            previousExpeditionIdRef.current = selectedExpeditionTypeId
            return
        }

        // Clear prefilling ref if expedition actually changed to a different type
        if (
            previousExpeditionIdRef.current !== null &&
            previousExpeditionIdRef.current !== selectedExpeditionTypeId &&
            creaturesToPrefillRef.current &&
            expeditionType &&
            creaturesToPrefillRef.current.expeditionTypeId !== expeditionType.id
        ) {
            creaturesToPrefillRef.current = null
        }

        const newSize = 3
        setSelectedCreatureIds(new Array(newSize).fill(null))
        onSlotSelect(null)
        previousExpeditionIdRef.current = selectedExpeditionTypeId
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedExpeditionTypeId, expeditionType?.id, onSlotSelect, activeExpeditionOfSameType])

    // Notify parent of party creature IDs changes
    useEffect(() => {
        onPartyCreatureIdsChange(selectedCreatureIds)
    }, [selectedCreatureIds, onPartyCreatureIdsChange])

    // Sync selected creature slots from active expedition when viewing an expedition that is in progress
    // (fixes "My Rating" showing 0 when selecting an active expedition or switching back to it)
    useEffect(() => {
        if (!activeExpeditionOfSameType || !expeditionType) return
        const size = 3
        const fromActive = activeExpeditionOfSameType.creatures
        const newSelection: (string | null)[] = new Array(size).fill(null)
        for (let i = 0; i < Math.min(fromActive.length, size); i++) {
            const id = fromActive[i]
            if (id) newSelection[i] = id
        }
        setSelectedCreatureIds(newSelection)
    }, [activeExpeditionOfSameType, expeditionType])

    // Handle creature selection into a slot
    const handleCreatureSelectRef = useRef<(creatureId: string) => void>()

    useEffect(() => {
        handleCreatureSelectRef.current = (creatureId: string) => {
            const newSelection = [...selectedCreatureIds]
            if (selectedSlot !== null && selectedSlot >= 0 && selectedSlot < maxPartySize) {
                // If a specific slot is selected, place creature there
                newSelection[selectedSlot] = creatureId
                setSelectedCreatureIds(newSelection)
                onSlotSelect(null)
            } else {
                // Auto-assign to the first open slot
                const firstOpenSlot = newSelection.findIndex((id) => id === null)
                if (firstOpenSlot !== -1) {
                    newSelection[firstOpenSlot] = creatureId
                    setSelectedCreatureIds(newSelection)
                }
            }
        }
        onCreatureSelectHandlerReady((creatureId: string) => {
            handleCreatureSelectRef.current?.(creatureId)
        })
    }, [selectedSlot, selectedCreatureIds, maxPartySize, onSlotSelect, onCreatureSelectHandlerReady])

    // Get selected creatures (filter out nulls)
    const selectedCreatures = useMemo(() => {
        return selectedCreatureIds
            .filter((id): id is string => id !== null)
            .map((id) => state.creatures.find((c) => c.id === id))
            .filter((c): c is Creature => c !== undefined)
    }, [selectedCreatureIds, state.creatures])

    // Calculate party score
    const partyScore = useMemo(() => {
        if (!expeditionInstance || selectedCreatures.length === 0) return 0
        try {
            const score = generatePartyScore(selectedCreatures, expeditionInstance)
            return isNaN(score) || !isFinite(score) ? 0 : score
        } catch (error) {
            return 0
        }
    }, [expeditionInstance, selectedCreatures])

    // Calculate dynamic duration based on party score
    const calculatedDuration = useMemo(() => {
        if (!expeditionInstance || !expeditionType) return 0

        const minSeconds = ExpeditionConfig.DURATION_BOUNDS.MIN_SECONDS
        const maxSeconds = ExpeditionConfig.DURATION_BOUNDS.MAX_SECONDS
        const difficultyRating = expeditionInstance.difficultyRating

        // If no party members selected, show max duration
        if (selectedCreatures.length === 0) {
            return maxSeconds
        }

        // Linear interpolation: 100% score = min duration (5 min), 0% score = max duration (2 hr)
        const ratio = difficultyRating > 0 ? Math.min(partyScore / difficultyRating, 1) : 0
        const duration = maxSeconds - ratio * (maxSeconds - minSeconds)
        return Math.floor(Math.max(minSeconds, Math.min(duration, maxSeconds)))
    }, [expeditionInstance, expeditionType, selectedCreatures.length, partyScore])

    if (!selectedExpeditionTypeId || !expeditionInstance || !expeditionType) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
                <h3>Expedition Details</h3>
                <div
                    style={{
                        color: '#888',
                        textAlign: 'center',
                        padding: '20px',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    Select an expedition from the browser to view details and assemble your party.
                </div>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <h3>{expeditionType.name ?? 'Expedition Details'}</h3>
            <p style={{ fontSize: '18px', color: '#aaa', margin: '0', lineHeight: '1.3', height: '2.6em', overflow: 'hidden' }}>
                {expeditionType.description}
            </p>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', paddingTop: '0px', flexGrow: 1, minHeight: 0 }}>
                {/* Party Score Progress Bar and XP */}
                <div style={{ marginTop: '0px', marginBottom: '8px' }}>
                    {(() => {
                        const rating = expeditionInstance.difficultyRating
                        const ratio = rating > 0 ? partyScore / rating : 0
                        const fillPercent = Math.min(ratio * 100, 100)
                        const barColor =
                            ratio >= 1
                                ? '#4CAF50'
                                : ratio >= 0.75
                                  ? '#8BC34A'
                                  : ratio >= 0.5
                                    ? '#FFC107'
                                    : ratio >= 0.25
                                      ? '#FF9800'
                                      : '#F44336'
                        return (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <Tooltip
                                        inline
                                        content={
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ fontSize: '20px', fontWeight: '500', marginBottom: '-8px' }}>
                                                    Party Score
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '20px',
                                                        color: 'rgba(255,255,255,0.5)',
                                                        marginTop: '4px',
                                                    }}
                                                >
                                                    Total score of your party. Higher score means shorter expedition time. The
                                                    fastest expedition time is 5 minutes and the slowest is 60 minutes.
                                                </div>
                                            </div>
                                        }
                                    >
                                        <span
                                            style={{
                                                fontSize: '18px',
                                                color: barColor,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <img
                                                className="pixel"
                                                src={Images.get('icons/rating.png')}
                                                alt="Rating"
                                                style={{ width: '16px', height: '16px', display: 'block' }}
                                            />
                                            {partyScore}
                                        </span>
                                    </Tooltip>
                                    {(() => {
                                        const baseXpPerCreature = getCreatureExperienceReward(
                                            expeditionInstance,
                                            Math.max(1, selectedCreatures.length)
                                        )
                                        const xpBreakdown = BonusHelpers.getExpeditionXpBonus(state)
                                        const finalXpPerCreature =
                                            Math.round(baseXpPerCreature * xpBreakdown.multiplier * 100) / 100
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
                                                    XP Breakdown
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            fontSize: '16px',
                                                        }}
                                                    >
                                                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>Base XP</span>
                                                        <span style={{ color: 'white' }}>{baseXpPerCreature.toFixed(2)}</span>
                                                    </div>
                                                    {xpBreakdown.tool > 0 && (
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                fontSize: '16px',
                                                            }}
                                                        >
                                                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Tool</span>
                                                            <span style={{ color: '#4ade80' }}>
                                                                +{xpBreakdown.tool.toFixed(2)}%
                                                            </span>
                                                        </div>
                                                    )}
                                                    {xpBreakdown.total > 0 && (
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
                                                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Total Bonus</span>
                                                            <span style={{ color: '#4ade80' }}>
                                                                +{xpBreakdown.total.toFixed(2)}%
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
                                                        <span style={{ color: 'white' }}>Final XP</span>
                                                        <span style={{ color: 'white' }}>{finalXpPerCreature.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                        return (
                                            <Tooltip content={xpTooltipContent} width="240px" center inline>
                                                <span
                                                    style={{
                                                        fontSize: '18px',
                                                        color:
                                                            selectedCreatures.length <= 1
                                                                ? '#4CAF50'
                                                                : selectedCreatures.length === 2
                                                                  ? '#FFC107'
                                                                  : '#F44336',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {finalXpPerCreature.toFixed(2)} XP/Creature
                                                </span>
                                            </Tooltip>
                                        )
                                    })()}
                                </div>
                                <div
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '32px',
                                        backgroundColor: '#2a2a2a',
                                        borderRadius: '0',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${fillPercent}%`,
                                            height: '100%',
                                            backgroundColor: barColor,
                                            transition: 'width 0.3s ease, background-color 0.3s ease',
                                            borderRadius: '0',
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            fontWeight: '400',
                                            color: '#fff',
                                        }}
                                    >
                                        {calculatedDuration > 0 ? Math.floor(calculatedDuration / 60) : 0} min
                                    </div>
                                </div>
                            </div>
                        )
                    })()}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <Tooltip
                            inline
                            content={
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ fontSize: '20px', fontWeight: '500', marginBottom: '-8px' }}>
                                        Difficulty Rating
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '20px',
                                            color: 'rgba(255,255,255,0.5)',
                                            marginTop: '4px',
                                        }}
                                    >
                                        The expedition's difficulty target. Match or exceed this with your party score for the
                                        shortest expedition time.
                                    </div>
                                </div>
                            }
                        >
                            <span
                                style={{
                                    fontSize: '16px',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                <img
                                    className="pixel"
                                    src={Images.get('icons/rating.png')}
                                    alt="Rating"
                                    style={{ width: '16px', height: '16px' }}
                                />
                                {expeditionInstance.difficultyRating}
                            </span>
                        </Tooltip>
                        <Tooltip
                            inline
                            content={
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ fontSize: '20px', fontWeight: '500', marginBottom: '-8px' }}>XP Efficiency</div>
                                    <div
                                        style={{
                                            fontSize: '20px',
                                            color: 'rgba(255,255,255,0.5)',
                                            marginTop: '4px',
                                        }}
                                    >
                                        Experience earned per second per creature. Higher party score and fewer party members
                                        increases efficiency. But sometimes, more creatures can increase this despite splitting
                                        it.
                                    </div>
                                </div>
                            }
                        >
                            <span style={{ fontSize: '18px', color: 'orange', cursor: 'pointer' }}>
                                {calculatedDuration > 0
                                    ? (
                                          Math.round(
                                              getCreatureExperienceReward(
                                                  expeditionInstance,
                                                  Math.max(1, selectedCreatures.length)
                                              ) *
                                                  BonusHelpers.getExpeditionXpBonus(state).multiplier *
                                                  100
                                          ) /
                                          100 /
                                          calculatedDuration
                                      ).toFixed(2)
                                    : '0.00'}{' '}
                                XP/sec
                            </span>
                        </Tooltip>
                    </div>
                </div>

                {/* Expedition Basic Info */}
                <div>
                    {/* Tier Selector */}
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            {[1, 2, 3, 4, 5].map((tier) => {
                                const isUnlocked = isTierUnlocked(
                                    tier,
                                    expeditionInstance.expeditionTypeId,
                                    state.expeditionCompletions
                                )
                                const isSelected = expeditionInstance.tier === tier
                                const requiredCompletions = getRequiredCompletionsForTier(tier)
                                const isLocked = expeditionInProgress

                                // Map tiers to skull images
                                const skullImages: Record<number, string> = {
                                    1: 'items/common-skull.png',
                                    2: 'items/uncommon-skull.png',
                                    3: 'items/rare-skull.png',
                                    4: 'items/super-rare-skull.png',
                                    5: 'items/legendary-skull.png',
                                }

                                const skullImage = skullImages[tier]

                                const tierButton = (
                                    <div
                                        onClick={() => {
                                            if (!isLocked && isUnlocked && !isSelected && selectedExpeditionTypeId) {
                                                Sounds.play('click.wav')
                                                ExpeditionsActions.updateExpeditionTier(dispatch, {
                                                    expeditionTypeId: selectedExpeditionTypeId,
                                                    tier: tier,
                                                })
                                            }
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isUnlocked && !isLocked) {
                                                e.currentTarget.style.border = '2px solid rgba(254, 240, 138, 0.5)'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isUnlocked && !isLocked) {
                                                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'
                                            }
                                        }}
                                        style={{
                                            width: '42px',
                                            height: '42px',
                                            border: isSelected
                                                ? isLocked
                                                    ? '2px solid rgba(255, 165, 0, 0.8)'
                                                    : '2px solid rgba(255,255,255,0.8)'
                                                : isUnlocked
                                                  ? '1px solid rgba(255,255,255,0.3)'
                                                  : '1px solid rgba(255,255,255,0.1)',
                                            backgroundColor: isUnlocked
                                                ? isSelected
                                                    ? 'rgba(255,255,255,0.15)'
                                                    : 'rgba(255,255,255,0.05)'
                                                : 'rgba(0,0,0,0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: !isLocked && isUnlocked && !isSelected ? 'pointer' : 'not-allowed',
                                            opacity: isUnlocked ? 1 : 0.6,
                                            filter: isUnlocked ? 'none' : 'brightness(0.4)',
                                            position: 'relative',
                                        }}
                                    >
                                        <img
                                            className="pixel"
                                            src={Images.get(skullImage)}
                                            alt={`Tier ${tier}`}
                                            style={{ width: '36px', height: '36px' }}
                                        />
                                    </div>
                                )

                                // Always wrap in a consistent container div, then conditionally add Tooltip
                                const previousTier = tier - 1
                                const currentCompletions = getTierCompletionCount(
                                    previousTier,
                                    expeditionInstance.expeditionTypeId,
                                    state.expeditionCompletions
                                )
                                const remainingCompletions = Math.max(0, requiredCompletions - currentCompletions)

                                const tierDifficulty = Math.floor(
                                    (expeditionType?.baseRating || 0) *
                                        (ExpeditionConfig.TIER_MODIFIERS[tier as keyof typeof ExpeditionConfig.TIER_MODIFIERS]
                                            ?.difficultyModifier || 1)
                                )
                                return (
                                    <div key={tier} style={{ display: 'flex', flexShrink: 0 }}>
                                        {!isUnlocked ? (
                                            <Tooltip
                                                content={
                                                    <div>
                                                        Complete this expedition{' '}
                                                        <span style={{ color: '#fef08a' }}>
                                                            {remainingCompletions} more time
                                                            {remainingCompletions !== 1 ? 's' : ''}
                                                        </span>{' '}
                                                        in the previous tier to unlock
                                                    </div>
                                                }
                                            >
                                                {tierButton}
                                            </Tooltip>
                                        ) : (
                                            <Tooltip
                                                content={
                                                    <div>
                                                        Tier {tier} requires a party score of{' '}
                                                        <span style={{ color: '#fef08a' }}>{tierDifficulty}</span>
                                                    </div>
                                                }
                                            >
                                                {tierButton}
                                            </Tooltip>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Potential Rewards */}
                    {expeditionType &&
                        expeditionInstance &&
                        (() => {
                            // Get lootScale multiplier for the current tier
                            const tierKey = expeditionInstance.tier as keyof typeof ExpeditionConfig.TIER_MODIFIERS
                            const tierModifier = ExpeditionConfig.TIER_MODIFIERS[tierKey]
                            const lootScale = tierModifier?.lootScale || 1

                            // Multiply all rewards by lootScale
                            const allRewards: Array<{ itemId: string; amount: number }> = expeditionType.rewards.map(
                                (reward) => ({
                                    itemId: reward.itemId,
                                    amount: reward.amount * lootScale,
                                })
                            )

                            // Combine duplicates
                            const rewardMap = new Map<string, number>()
                            for (const reward of allRewards) {
                                const currentAmount = rewardMap.get(reward.itemId) || 0
                                rewardMap.set(reward.itemId, currentAmount + reward.amount)
                            }

                            const aggregatedRewards = Array.from(rewardMap.entries()).map(([itemId, amount]) => ({
                                itemId,
                                amount,
                            }))

                            if (aggregatedRewards.length === 0) return null

                            return (
                                <div>
                                    <h4 style={{ fontSize: '18px', fontWeight: '400', marginBottom: '-6px', marginTop: '-6px' }}>
                                        Rewards
                                    </h4>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                            marginTop: '8px',
                                        }}
                                    >
                                        {aggregatedRewards.map((reward, index) => {
                                            const itemMeta = ItemsContent.getById(reward.itemId)
                                            const itemColor = 'white'

                                            // Get current inventory count
                                            const inventoryItem = state.inventory.find((invItem) => invItem.id === reward.itemId)
                                            const currentAmount = inventoryItem?.amount || 0

                                            return (
                                                <Tooltip
                                                    key={`${reward.itemId}-${index}`}
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
                                                                src={Images.get(itemMeta?.image || 'items/placeholder.png')}
                                                                alt={itemMeta?.name || reward.itemId}
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
                                                                    {itemMeta?.name || reward.itemId}
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
                                                                    {itemMeta?.description || ''}
                                                                </p>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '-6px',
                                                                    right: 0,
                                                                    fontSize: '18px',
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
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding: '2px 4px',
                                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                                            cursor: 'pointer',
                                                            transition: 'background-color 0.2s',
                                                            marginBottom: '8px',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                                                        }}
                                                    >
                                                        <img
                                                            className="pixel"
                                                            src={Images.get(itemMeta?.image || 'items/placeholder.png')}
                                                            alt={itemMeta?.name || reward.itemId}
                                                            style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                marginRight: '8px',
                                                                marginLeft: '0px',
                                                            }}
                                                        />
                                                        <h3
                                                            style={{
                                                                flexGrow: 1,
                                                                fontSize: '16px',
                                                                fontWeight: '400',
                                                                color: itemColor,
                                                                transition: 'color 0.3s',
                                                                margin: 0,
                                                            }}
                                                        >
                                                            {itemMeta?.name || reward.itemId}{' '}
                                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '400' }}>
                                                                ({Numbers.whole(currentAmount)})
                                                            </span>
                                                        </h3>
                                                        <span style={{ fontSize: '16px', color: 'white', fontWeight: '400' }}>
                                                            {Numbers.whole(reward.amount)}
                                                        </span>
                                                    </div>
                                                </Tooltip>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })()}

                    {/* <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} /> */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '0px' }}>
                        {expeditionType?.biome &&
                            (() => {
                                // Always use the expedition type's biome for display (source of truth)
                                const biome = BiomesContent.getById(expeditionType.biome)
                                if (!biome) return null
                                const trait = expeditionType.trait ? TraitsContent.getById(expeditionType.trait) : null
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                                            <h4 style={{ fontSize: '18px', fontWeight: '400', margin: '0', lineHeight: '1.2' }}>
                                                Biome
                                            </h4>
                                            <Tooltip
                                                content={
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div
                                                            style={{ fontSize: '20px', fontWeight: '500', marginBottom: '-8px' }}
                                                        >
                                                            {biome.name}
                                                        </div>
                                                        <div
                                                            style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: '1fr 1fr',
                                                                gap: '2px',
                                                            }}
                                                        >
                                                            {['Fire', 'Water', 'Earth', 'Wind'].map((type) => {
                                                                const isAdvantage = (biome.advantage || []).includes(type)
                                                                const isDisadvantage = (biome.disadvantage || []).includes(type)
                                                                const multiplier = isAdvantage
                                                                    ? ExpeditionConfig.BIOME.ADVANTAGE_MULTIPLIER
                                                                    : isDisadvantage
                                                                      ? ExpeditionConfig.BIOME.DISADVANTAGE_MULTIPLIER
                                                                      : 1.0
                                                                const color = isAdvantage
                                                                    ? '#86efac'
                                                                    : isDisadvantage
                                                                      ? '#fca5a5'
                                                                      : 'rgba(255,255,255,0.35)'
                                                                return (
                                                                    <div
                                                                        key={type}
                                                                        style={{
                                                                            fontSize: '20px',
                                                                            opacity: !isAdvantage && !isDisadvantage ? 0.4 : 1,
                                                                        }}
                                                                    >
                                                                        <span style={{ color: '#888' }}>{type}: </span>
                                                                        <span style={{ color }}>{multiplier}x</span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: '20px',
                                                                color: 'rgba(255,255,255,0.5)',
                                                                marginTop: '4px',
                                                            }}
                                                        >
                                                            Multiplier applied to each creature's score based on their type.
                                                        </div>
                                                    </div>
                                                }
                                            >
                                                <div
                                                    style={{
                                                        fontSize: '20px',
                                                        margin: '0',
                                                        lineHeight: '1.2',
                                                        color: '#888',
                                                        cursor: 'pointer',
                                                        textDecoration: 'underline',
                                                        textDecorationStyle: 'dotted',
                                                        textDecorationColor: 'rgba(255,255,255,0.5)',
                                                        textUnderlineOffset: '3px',
                                                    }}
                                                >
                                                    {biome.name}
                                                </div>
                                            </Tooltip>
                                        </div>
                                        {trait && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                                                <h4
                                                    style={{
                                                        fontSize: '18px',
                                                        fontWeight: '400',
                                                        margin: '0',
                                                        lineHeight: '1.2',
                                                    }}
                                                >
                                                    Trait
                                                </h4>
                                                <Tooltip
                                                    content={
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <div
                                                                style={{
                                                                    fontSize: '20px',
                                                                    fontWeight: '500',
                                                                    marginBottom: '-8px',
                                                                }}
                                                            >
                                                                {trait.name}
                                                            </div>
                                                            <div style={{ fontSize: '20px' }}>
                                                                <span style={{ color: '#888' }}>Match Bonus: </span>
                                                                <span style={{ color: '#86efac' }}>
                                                                    {ExpeditionConfig.TRAIT.BONUS_MULTIPLIER}x
                                                                </span>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: '20px',
                                                                    color: 'rgba(255,255,255,0.5)',
                                                                    marginTop: '2px',
                                                                }}
                                                            >
                                                                Multiplier applied to a creature's score if they have this trait.
                                                                Stacks with biome modifier.
                                                            </div>
                                                        </div>
                                                    }
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: '20px',
                                                            margin: '0',
                                                            lineHeight: '1.2',
                                                            color: '#888',
                                                            cursor: 'pointer',
                                                            textDecoration: 'underline',
                                                            textDecorationStyle: 'dotted',
                                                            textDecorationColor: 'rgba(255,255,255,0.5)',
                                                            textUnderlineOffset: '3px',
                                                        }}
                                                    >
                                                        {trait.name}
                                                    </div>
                                                </Tooltip>
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}
                    </div>
                </div>

                {/* Experience Rewards
                {expeditionType && expeditionInstance && (
                    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginTop: '0px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '400', margin: '0', lineHeight: '1.2' }}>Creature XP</h4>
                            <div style={{ fontSize: '16px', margin: '0', lineHeight: '1.2', color: '#888' }}>
                                {getCreatureExperienceReward(expeditionInstance)} XP per creature
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '400', margin: '0', lineHeight: '1.2' }}>Expedition XP</h4>
                            <div style={{ fontSize: '16px', margin: '0', lineHeight: '1.2', color: '#888' }}>
                                {getExpeditionExperienceReward(expeditionInstance)} XP
                            </div>
                        </div>
                    </div>
                )} */}

                {/* Stat Weights */}
                {expeditionType && (
                    <div>
                        <h4 style={{ fontSize: '18px', fontWeight: '400', marginBottom: '-6px', marginTop: '8px' }}>
                            Stat Weights
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                            {(['power', 'grit', 'agility', 'smarts', 'looting', 'luck'] as const).map((stat) => {
                                const weight = expeditionType.statWeights[stat] || 0
                                const shortNames: Record<string, string> = {
                                    power: 'POW',
                                    grit: 'GRT',
                                    agility: 'AGI',
                                    smarts: 'SMT',
                                    looting: 'LOT',
                                    luck: 'LCK',
                                }
                                const fullNames: Record<string, string> = {
                                    power: 'Power',
                                    grit: 'Grit',
                                    agility: 'Agility',
                                    smarts: 'Smarts',
                                    looting: 'Looting',
                                    luck: 'Luck',
                                }
                                const displayName = shortNames[stat]
                                const fullName = fullNames[stat]
                                const isZero = weight === 0
                                return (
                                    <div key={stat} style={{ flexShrink: 0 }}>
                                        <Tooltip
                                            content={
                                                <span style={{ fontSize: '20px' }}>
                                                    <span style={{ color: 'orange' }}>{Math.round(weight * 100)}%</span> of your
                                                    Creature's{' '}
                                                    <span style={{ textDecoration: 'underline', color: 'cyan' }}>{fullName}</span>{' '}
                                                    stat contributes to the team score. This is the score in the top left, above
                                                    the progress bar.
                                                </span>
                                            }
                                        >
                                            <div
                                                style={{
                                                    fontSize: '18px',
                                                    cursor: 'pointer',
                                                    opacity: isZero ? 0.3 : 1,
                                                }}
                                            >
                                                <span style={{ color: '#888' }}>{displayName}: </span>
                                                <span>{Math.round(weight * 100)}%</span>
                                            </div>
                                        </Tooltip>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Party Selection Section - Hide when expedition is in progress */}
                {!activeExpeditionOfSameType && (
                    <div style={{ marginBottom: '-12px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '400', marginBottom: '-6px', marginTop: '6px' }}>
                            Party Selection
                        </h4>
                        <div
                            style={{
                                display: 'flex',
                                gap: '6px',
                                marginBottom: '12px',
                                padding: '4px',
                            }}
                        >
                            {Array.from({ length: 3 }, (_, i) => i).map((slotIndex) => {
                                const creatureId = selectedCreatureIds[slotIndex]
                                const creature = creatureId ? state.creatures.find((c) => c.id === creatureId) : null
                                const creatureContent = creature ? CreaturesContent.getById(creature.species) : null
                                const isSelected = selectedSlot === slotIndex

                                return (
                                    <div
                                        key={slotIndex}
                                        onClick={() => {
                                            Sounds.play('click.wav')
                                            onSlotSelect(isSelected ? null : slotIndex)
                                        }}
                                        style={{
                                            flex: 1,
                                            aspectRatio: '1',
                                            border: creature
                                                ? '1px solid rgba(255,255,255,0.2)'
                                                : isSelected
                                                  ? '1px solid rgba(255,255,255,0.2)'
                                                  : '1px dashed rgba(255,255,255,0.1)',
                                            backgroundColor: creature
                                                ? 'rgba(255,255,255,0.07)'
                                                : isSelected
                                                  ? 'rgba(255,255,255,0.07)'
                                                  : 'rgba(255,255,255,0.00)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            marginTop: '4px',
                                        }}
                                    >
                                        {creature && creatureContent ? (
                                            <>
                                                <Tooltip
                                                    content={
                                                        <CreatureTooltip
                                                            creature={creature}
                                                            creatureContent={creatureContent}
                                                            expeditionType={expeditionType}
                                                            expeditionInstance={expeditionInstance}
                                                        />
                                                    }
                                                >
                                                    <div
                                                        className={creature.awakened ? 'creature-awakened' : ''}
                                                        style={{
                                                            width: '100%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        {creature.awakened && <AwakenedShine image={creatureContent.image} />}
                                                        <img
                                                            className="pixel"
                                                            src={Images.get(creatureContent.image)}
                                                            alt={creatureContent.name}
                                                            style={{ width: '100%', height: '100%' }}
                                                        />
                                                    </div>
                                                </Tooltip>
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        Sounds.play('click.wav')
                                                        const newSelection = [...selectedCreatureIds]
                                                        newSelection[slotIndex] = null
                                                        setSelectedCreatureIds(newSelection)
                                                        if (selectedSlot === slotIndex) {
                                                            onSlotSelect(null)
                                                        }
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-4px',
                                                        right: '-4px',
                                                        width: '16px',
                                                        height: '16px',
                                                        backgroundColor: 'rgba(163, 70, 70, 0.9)',
                                                        border: '1px solid rgba(255,255,255,0.3)',
                                                        borderRadius: '0px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        color: 'white',
                                                        lineHeight: '1',
                                                        fontWeight: '400',
                                                    }}
                                                >
                                                    ×
                                                </div>
                                                {/* Level badge */}
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '0',
                                                        left: '0',
                                                        backgroundColor: 'rgba(0,0,0,0.7)',
                                                        color: 'white',
                                                        fontSize: '14px',
                                                        fontWeight: '400',
                                                        padding: '1px 4px',
                                                        lineHeight: '1.2',
                                                    }}
                                                >
                                                    Lv {getCreatureLevel(creature)}
                                                </div>
                                                {/* XP bar */}
                                                {(() => {
                                                    const level = getCreatureLevel(creature)
                                                    const currentLevelXp = getCreatureXpForLevel(level)
                                                    const nextLevelXp = getCreatureXpForLevel(level + 1)
                                                    const xpIntoLevel = creature.experience - currentLevelXp
                                                    const xpNeeded = nextLevelXp - currentLevelXp
                                                    const xpPercent =
                                                        xpNeeded > 0 ? Math.min((xpIntoLevel / xpNeeded) * 100, 100) : 100
                                                    return (
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: '0',
                                                                left: '0',
                                                                right: '0',
                                                                height: '3px',
                                                                backgroundColor: 'rgba(0,0,0,0.5)',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: `${xpPercent}%`,
                                                                    height: '100%',
                                                                    backgroundColor: '#4FC3F7',
                                                                    transition: 'width 0.3s ease',
                                                                }}
                                                            />
                                                        </div>
                                                    )
                                                })()}
                                            </>
                                        ) : (
                                            <div
                                                style={{
                                                    fontSize: '24px',
                                                    color: '#888',
                                                    textAlign: 'center',
                                                    lineHeight: '1',
                                                }}
                                            >
                                                +
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Bottom Section - Party, Progress, and Buttons */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0px' }}>
                    {/* Active Party (if expedition is active) */}
                    {activeExpeditionOfSameType && (
                        <div style={{ marginBottom: '0px' }}>
                            {/* Show creatures on the expedition */}
                            {expeditionType && (
                                <div>
                                    <div style={{ fontSize: '18px', color: 'white', marginBottom: '-6px', marginTop: '2px' }}>
                                        Party
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', padding: '4px' }}>
                                        {Array.from({ length: 3 }, (_, i) => i).map((slotIndex) => {
                                            const creatureId = activeExpeditionOfSameType.creatures[slotIndex]
                                            const creature = creatureId ? state.creatures.find((c) => c.id === creatureId) : null
                                            const creatureContent = creature ? CreaturesContent.getById(creature.species) : null

                                            return (
                                                <div
                                                    key={slotIndex}
                                                    style={{
                                                        flex: 1,
                                                        aspectRatio: '1',
                                                        border: creature
                                                            ? '1px solid rgba(255,255,255,0.2)'
                                                            : '1px dashed rgba(255,255,255,0.1)',
                                                        backgroundColor: creature
                                                            ? 'rgba(255,255,255,0.07)'
                                                            : 'rgba(255,255,255,0.00)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    {creature && creatureContent ? (
                                                        <>
                                                            <Tooltip
                                                                content={
                                                                    <CreatureTooltip
                                                                        creature={creature}
                                                                        creatureContent={creatureContent}
                                                                        expeditionType={expeditionType}
                                                                        expeditionInstance={activeExpeditionOfSameType.instance}
                                                                    />
                                                                }
                                                            >
                                                                <div
                                                                    className={creature.awakened ? 'creature-awakened' : ''}
                                                                    style={{
                                                                        width: '100%',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                    }}
                                                                >
                                                                    {creature.awakened && (
                                                                        <AwakenedShine image={creatureContent.image} />
                                                                    )}
                                                                    <img
                                                                        className="pixel"
                                                                        src={Images.get(creatureContent.image)}
                                                                        alt={creatureContent.name}
                                                                        style={{ width: '100%', height: '100%' }}
                                                                    />
                                                                </div>
                                                            </Tooltip>
                                                            {/* Level badge */}
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    bottom: '0',
                                                                    left: '0',
                                                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                                                    color: 'white',
                                                                    fontSize: '14px',
                                                                    fontWeight: '400',
                                                                    padding: '1px 4px',
                                                                    lineHeight: '1.2',
                                                                }}
                                                            >
                                                                Lv {getCreatureLevel(creature)}
                                                            </div>
                                                            {/* XP bar */}
                                                            {(() => {
                                                                const level = getCreatureLevel(creature)
                                                                const currentLevelXp = getCreatureXpForLevel(level)
                                                                const nextLevelXp = getCreatureXpForLevel(level + 1)
                                                                const xpIntoLevel = creature.experience - currentLevelXp
                                                                const xpNeeded = nextLevelXp - currentLevelXp
                                                                const xpPercent =
                                                                    xpNeeded > 0
                                                                        ? Math.min((xpIntoLevel / xpNeeded) * 100, 100)
                                                                        : 100
                                                                return (
                                                                    <div
                                                                        style={{
                                                                            position: 'absolute',
                                                                            bottom: '0',
                                                                            left: '0',
                                                                            right: '0',
                                                                            height: '3px',
                                                                            backgroundColor: 'rgba(0,0,0,0.5)',
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                width: `${xpPercent}%`,
                                                                                height: '100%',
                                                                                backgroundColor: '#4FC3F7',
                                                                                transition: 'width 0.3s ease',
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )
                                                            })()}
                                                        </>
                                                    ) : (
                                                        <div
                                                            style={{
                                                                fontSize: '24px',
                                                                color: '#888',
                                                                textAlign: 'center',
                                                                lineHeight: '1',
                                                            }}
                                                        ></div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Progress Bar (only show when in progress, not completed) */}
                            {!activeExpeditionOfSameType.completed && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                                    <div
                                        style={{
                                            height: '8px',
                                            width: '100%',
                                            position: 'relative',
                                            backgroundColor: 'rgba(255,255,255,0.25)',
                                            borderRadius: '0px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: 0,
                                                right:
                                                    (1 -
                                                        Math.min(
                                                            1,
                                                            (currentTime - activeExpeditionOfSameType.startTime) /
                                                                activeExpeditionOfSameType.duration
                                                        )) *
                                                        100 +
                                                    '%',
                                                top: 0,
                                                bottom: 0,
                                                backgroundColor: 'white',
                                                borderRadius: '0px',
                                            }}
                                        ></div>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginTop: '-4px',
                                        }}
                                    >
                                        {/* <div style={{ fontSize: '18px', color: '#888' }}>
                                            {Numbers.timeShort(
                                                getExpeditionDurationLeft(activeExpeditionOfSameType, currentTime)
                                            )}{' '}
                                            remaining
                                        </div> */}
                                        <div style={{ fontSize: '18px', color: '#71f3ff' }}>
                                            Loop {activeExpeditionOfSameType.loopCount || 1}
                                        </div>
                                        {(() => {
                                            const loopCount = activeExpeditionOfSameType.loopCount || 1
                                            const bonusPercent = Math.round(getLoopXpBonus(loopCount) * 100)
                                            const activePartySize = activeExpeditionOfSameType.creatures.length
                                            const boostedXpPerCreature =
                                                Math.round(
                                                    getCreatureExperienceReward(
                                                        activeExpeditionOfSameType.instance,
                                                        activePartySize,
                                                        loopCount
                                                    ) *
                                                        BonusHelpers.getExpeditionXpBonus(state).multiplier *
                                                        100
                                                ) / 100
                                            const boostedXpPerSec =
                                                activeExpeditionOfSameType.duration > 0
                                                    ? (boostedXpPerCreature / activeExpeditionOfSameType.duration).toFixed(2)
                                                    : '0.00'
                                            return (
                                                <Tooltip
                                                    inline
                                                    content={
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <div
                                                                style={{
                                                                    fontSize: '20px',
                                                                    fontWeight: '500',
                                                                    marginBottom: '-8px',
                                                                }}
                                                            >
                                                                Loop XP Bonus
                                                            </div>
                                                            <div style={{ fontSize: '20px' }}>
                                                                <span style={{ color: '#888' }}>Rate: </span>
                                                                <span style={{ color: '#ffcd71' }}>
                                                                    +{ExpeditionConfig.LOOP_XP_BONUS.RATE * 100}% every{' '}
                                                                    {ExpeditionConfig.LOOP_XP_BONUS.LOOPS_PER_BONUS} loops
                                                                </span>
                                                            </div>
                                                            <div style={{ fontSize: '20px' }}>
                                                                <span style={{ color: '#888' }}>Cap: </span>
                                                                <span style={{ color: '#ffcd71' }}>
                                                                    {ExpeditionConfig.LOOP_XP_BONUS.MAX_BONUS * 100}%
                                                                </span>
                                                            </div>
                                                            <div style={{ fontSize: '20px' }}>
                                                                <span style={{ color: '#888' }}>New XP Rate: </span>
                                                                <span style={{ color: 'orange' }}>
                                                                    {boostedXpPerSec} XP/sec per creature
                                                                </span>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: '20px',
                                                                    color: 'rgba(255,255,255,0.5)',
                                                                    marginTop: '4px',
                                                                }}
                                                            >
                                                                Bonus XP earned per creature for each expedition completion.
                                                                Resets when you cancel or change expeditions.
                                                            </div>
                                                        </div>
                                                    }
                                                >
                                                    <div style={{ fontSize: '18px', color: '#ffcd71', cursor: 'pointer' }}>
                                                        XP Bonus: {bonusPercent}%
                                                    </div>
                                                </Tooltip>
                                            )
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Buttons Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '0px' }}>
                        {activeExpeditionOfSameType ? (
                            activeExpeditionOfSameType.completed ? (
                                <Button
                                    onClick={() => {
                                        // Capture the creature IDs and expedition type ID before collecting rewards
                                        creaturesToPrefillRef.current = {
                                            creatures: [...activeExpeditionOfSameType.creatures],
                                            expeditionTypeId: activeExpeditionOfSameType.instance.expeditionTypeId,
                                        }
                                        ExpeditionsActions.collectExpeditionRewards(dispatch, {
                                            expeditionInstanceId: activeExpeditionOfSameType.instance.id,
                                        })
                                    }}
                                    style={{
                                        backgroundColor: '#26402a',
                                        marginTop: '0px',
                                    }}
                                >
                                    Collect Rewards
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        setShowCancelConfirm(true)
                                    }}
                                    style={{
                                        backgroundColor: '#6b2d2d',
                                    }}
                                >
                                    Cancel Expedition
                                </Button>
                            )
                        ) : (
                            <Button
                                style={{ width: '100%' }}
                                onClick={() => {
                                    const validCreatureIds = selectedCreatureIds.filter((id): id is string => id !== null)
                                    if (validCreatureIds.length > 0 && selectedExpeditionTypeId && expeditionInstance) {
                                        ExpeditionsActions.startExpedition(dispatch, {
                                            expeditionTypeId: selectedExpeditionTypeId,
                                            tier: selectedTier,
                                            creatureIds: validCreatureIds,
                                            itemIds: [], // Items not implemented yet
                                            repeatExpedition: true,
                                        })
                                    }
                                }}
                                disabled={
                                    selectedCreatures.length === 0 ||
                                    !selectedExpeditionTypeId ||
                                    !expeditionInstance ||
                                    !isUnlocked
                                }
                            >
                                Loop Expedition
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmModal
                opened={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={() => {
                    if (activeExpeditionOfSameType) {
                        ExpeditionsActions.cancelExpedition(dispatch, {
                            expeditionInstanceId: activeExpeditionOfSameType.instance.id,
                        })
                    }
                }}
                text="Canceling an expedition gives no items or experience. Do you still want to cancel the expedition?"
            />
        </div>
    )
}

export default ExpeditionDetails

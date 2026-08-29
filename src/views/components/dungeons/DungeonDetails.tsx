import { StateProps } from '@engine/types'
import Images from '@utils/images'
import DungeonConfig from '@configs/dungeons'
import AwakenedShine from '@components/creatures/AwakenedShine'
import {
    calculateDungeonPartyScore,
    getDungeonGrade,
    getDungeonGradeMultiplier,
    getDungeonDurationLeft,
} from '@modules/dungeons/helpers'
import { Creature } from '@modules/creatures/types'
import { useState, useMemo, useEffect, useRef } from 'react'
import DungeonsActions from '@modules/dungeons/dispatch'
import Button from '../common/Button'
import CreaturesContent from '@data/creatures'
import Sounds from '@utils/sounds'
import ItemsContent from '@data/items'
import Tooltip from '../common/Tooltip'
import CreatureTooltip from '../creatures/CreatureTooltip'
import { getCreatureLevel, getCreatureXpForLevel } from '@modules/creatures/helpers'
import Numbers from '@utils/numbers'
import ConfirmModal from '../common/ConfirmModal'
import { DungeonFocus, DungeonTier, GatheringSubFocus, DungeonGrade } from '@modules/dungeons/types'
import SkillingHelpers from '@modules/skilling/helpers'

const TIER_LEVEL_REQUIREMENTS: Record<DungeonFocus, Record<DungeonTier, number>> = {
    combat: { 1: 0, 2: 20, 3: 40, 4: 60, 5: 80 },
    gathering: { 1: 0, 2: 15, 3: 40, 4: 60, 5: 80 },
}

interface Props extends StateProps {
    onSlotSelect: (slotIndex: number | null) => void
    selectedSlot: number | null
    onCreatureSelectHandlerReady: (handler: (creatureId: string) => void) => void
    onPartyCreatureIdsChange: (creatureIds: (string | null)[]) => void
}

const TIER_LABELS = ['I', 'II', 'III', 'IV', 'V']
const GATHERING_SKILLS: GatheringSubFocus[] = ['Chopping', 'Mining', 'Digging', 'Farming', 'Fishing', 'Exploring']
const GRADE_COLORS: Record<DungeonGrade, string> = {
    S: '#ffd700',
    A: '#4CAF50',
    B: '#8BC34A',
    C: '#FFC107',
    F: '#F44336',
}

function DungeonDetails({
    state,
    dispatch,
    onSlotSelect,
    selectedSlot,
    onCreatureSelectHandlerReady,
    onPartyCreatureIdsChange,
}: Props) {
    const maxPartySize = DungeonConfig.MAX_CREATURES
    const playerLevel = SkillingHelpers.getPlayerLevel(state.skills)

    const [selectedTier, setSelectedTier] = useState<DungeonTier>(1)
    const [selectedFocus, setSelectedFocus] = useState<DungeonFocus>('combat')
    const [selectedGatheringSkill, setSelectedGatheringSkill] = useState<GatheringSubFocus>('Mining')
    const [selectedCreatureIds, setSelectedCreatureIds] = useState<(string | null)[]>(() => new Array(maxPartySize).fill(null))
    const [currentTime, setCurrentTime] = useState(Date.now() / 1000)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [cancelDungeonId, setCancelDungeonId] = useState<string | null>(null)
    const [loopEnabled, setLoopEnabled] = useState(true)

    // Update current time for progress bar
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now() / 1000)
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Find active dungeon
    const activeDungeon = useMemo(() => {
        if (!state.dungeons?.activeDungeons) return null
        return state.dungeons.activeDungeons[0] || null
    }, [state.dungeons?.activeDungeons])

    // Notify parent of party creature IDs changes
    useEffect(() => {
        onPartyCreatureIdsChange(selectedCreatureIds)
    }, [selectedCreatureIds, onPartyCreatureIdsChange])

    // Sync selected creature slots from active dungeon
    useEffect(() => {
        if (!activeDungeon) return
        const newSelection: (string | null)[] = new Array(maxPartySize).fill(null)
        for (let i = 0; i < Math.min(activeDungeon.creatures.length, maxPartySize); i++) {
            newSelection[i] = activeDungeon.creatures[i]
        }
        setSelectedCreatureIds(newSelection)
        setSelectedTier(activeDungeon.tier)
        setSelectedFocus(activeDungeon.focus)
        if (activeDungeon.gatheringSkill) {
            setSelectedGatheringSkill(activeDungeon.gatheringSkill)
        }
        setLoopEnabled(activeDungeon.loop)
    }, [activeDungeon, maxPartySize])

    // Handle creature selection into a slot
    const handleCreatureSelectRef = useRef<(creatureId: string) => void>()

    useEffect(() => {
        handleCreatureSelectRef.current = (creatureId: string) => {
            if (activeDungeon) return
            const newSelection = [...selectedCreatureIds]
            if (selectedSlot !== null && selectedSlot >= 0 && selectedSlot < maxPartySize) {
                newSelection[selectedSlot] = creatureId
                setSelectedCreatureIds(newSelection)
                onSlotSelect(null)
            } else {
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
    }, [selectedSlot, selectedCreatureIds, maxPartySize, onSlotSelect, onCreatureSelectHandlerReady, activeDungeon])

    // Get selected creatures
    const selectedCreatures = useMemo(() => {
        return selectedCreatureIds
            .filter((id): id is string => id !== null)
            .map((id) => state.creatures.find((c) => c.id === id))
            .filter((c): c is Creature => c !== undefined)
    }, [selectedCreatureIds, state.creatures])

    // Calculate party score
    const partyScore = useMemo(() => {
        if (selectedCreatures.length === 0) return 0
        return calculateDungeonPartyScore(selectedCreatures, selectedFocus)
    }, [selectedCreatures, selectedFocus])

    // Calculate grade
    const grade = useMemo(() => {
        if (partyScore === 0) return 'F' as DungeonGrade
        return getDungeonGrade(partyScore, selectedTier)
    }, [partyScore, selectedTier])

    // Get tier config
    const tierConfig = DungeonConfig.TIER_CONFIG[selectedTier]
    const baseRating = tierConfig?.baseRating || 0

    // Get rewards preview
    const rewards = useMemo(() => {
        if (selectedFocus === 'combat') {
            return DungeonConfig.COMBAT_REWARDS[selectedTier] || []
        } else {
            const skillTable = DungeonConfig.GATHERING_REWARDS[selectedGatheringSkill]
            return skillTable?.[selectedTier] || []
        }
    }, [selectedTier, selectedFocus, selectedGatheringSkill])

    // Armor check
    const armorItem = state.inventory.find((item) => item.id === DungeonConfig.ARMOR_ITEM_ID)
    const armorCount = armorItem?.amount || 0
    const armorNeeded = selectedCreatures.length

    // Grade ratio for progress bar
    const ratio = baseRating > 0 ? partyScore / baseRating : 0
    const fillPercent = Math.min((ratio / 2) * 100, 100)
    const barColor = '#2a5a2a'

    const gradeMultiplier = getDungeonGradeMultiplier(grade)

    const isLocked = !!activeDungeon

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '620px', overflow: 'hidden' }}>
            <h3>Dungeons</h3>

            {/* Tier + Focus on same row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '18px', color: '#aaa', marginBottom: '-4px' }}>Focus</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {(['combat', 'gathering'] as DungeonFocus[]).map((focus) => {
                            const isSelected = selectedFocus === focus
                            return (
                                <button
                                    key={focus}
                                    onClick={() => {
                                        if (!isLocked) {
                                            Sounds.play('click.wav')
                                            setSelectedFocus(focus)
                                            setSelectedTier(1)
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '4px 8px',
                                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                        border: isSelected
                                            ? '1px solid rgba(255, 255, 255, 0.4)'
                                            : '1px solid rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        fontSize: '16px',
                                        cursor: isLocked ? 'not-allowed' : 'pointer',
                                        opacity: isLocked && !isSelected ? 0.5 : 1,
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {focus}
                                </button>
                            )
                        })}
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '18px', color: '#aaa', marginBottom: '-4px' }}>Tier</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                        {([1, 2, 3, 4, 5] as DungeonTier[]).map((tier) => {
                            const isSelected = selectedTier === tier
                            const requiredLevel = TIER_LEVEL_REQUIREMENTS[selectedFocus][tier]
                            const gatheringSkillLevel =
                                selectedFocus === 'gathering'
                                    ? SkillingHelpers.getLevel(
                                          state.skills.find((s) => s.id === selectedGatheringSkill)?.xp || 0
                                      )
                                    : 0
                            const relevantLevel = selectedFocus === 'combat' ? playerLevel : gatheringSkillLevel
                            const isLevelLocked = relevantLevel < requiredLevel
                            const tierLocked = isLocked || isLevelLocked
                            const button = (
                                <button
                                    key={tier}
                                    onClick={() => {
                                        if (!tierLocked) {
                                            Sounds.play('click.wav')
                                            setSelectedTier(tier)
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '4px 8px',
                                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                        border: isSelected
                                            ? '1px solid rgba(255, 255, 255, 0.4)'
                                            : '1px solid rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        fontSize: '16px',
                                        cursor: tierLocked ? 'not-allowed' : 'pointer',
                                        opacity: tierLocked && !isSelected ? 0.5 : 1,
                                    }}
                                >
                                    {TIER_LABELS[tier - 1]}
                                </button>
                            )
                            if (isLevelLocked) {
                                return (
                                    <Tooltip
                                        key={tier}
                                        inline
                                        content={
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ fontSize: '18px', fontWeight: '500' }}>
                                                    Tier {TIER_LABELS[tier - 1]} Locked
                                                </div>
                                                <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)' }}>
                                                    {selectedFocus === 'combat'
                                                        ? `Requires player level ${requiredLevel} for combat dungeons.`
                                                        : `Requires ${selectedGatheringSkill} level ${requiredLevel}.`}
                                                </div>
                                            </div>
                                        }
                                    >
                                        {button}
                                    </Tooltip>
                                )
                            }
                            return button
                        })}
                    </div>
                </div>
            </div>

            {/* Gathering Skill Selector (only when gathering focus) */}
            {selectedFocus === 'gathering' && (
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '16px', color: '#aaa', marginBottom: '4px' }}>Gathering Skill</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {GATHERING_SKILLS.map((skill) => {
                            const isSelected = selectedGatheringSkill === skill
                            return (
                                <button
                                    key={skill}
                                    onClick={() => {
                                        if (!isLocked) {
                                            Sounds.play('click.wav')
                                            setSelectedGatheringSkill(skill)
                                            setSelectedTier(1)
                                        }
                                    }}
                                    style={{
                                        flex: '1 1 30%',
                                        padding: '4px 8px',
                                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                        border: isSelected
                                            ? '1px solid rgba(255, 255, 255, 0.4)'
                                            : '1px solid rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        fontSize: '16px',
                                        cursor: isLocked ? 'not-allowed' : 'pointer',
                                        opacity: isLocked && !isSelected ? 0.5 : 1,
                                    }}
                                >
                                    {skill}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Party Score Bar */}
            <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '-4px' }}>
                    <Tooltip
                        inline
                        content={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '-8px' }}>Duration</div>
                                <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)' }}>
                                    Each dungeon run takes 15 minutes to complete. This doesn't change
                                </div>
                            </div>
                        }
                    >
                        <span
                            style={{
                                fontSize: '18px',
                                color: '#aaa',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Duration: 15 min
                        </span>
                    </Tooltip>
                    <Tooltip
                        inline
                        content={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '-8px' }}>Grade</div>
                                <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)' }}>
                                    Your grade determines the reward multiplier. S = x2.0, A = x1.5, B = x1.0, C = x0.5, F =
                                    x0.25.
                                </div>
                            </div>
                        }
                    >
                        <span
                            style={{
                                fontSize: '18px',
                                color: GRADE_COLORS[activeDungeon ? activeDungeon.grade : grade],
                                cursor: 'pointer',
                                fontWeight: '500',
                            }}
                        >
                            Grade: {activeDungeon ? activeDungeon.grade : grade} (x{gradeMultiplier})
                        </span>
                    </Tooltip>
                </div>
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '28px',
                        backgroundColor: '#2a2a2a',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: `${activeDungeon ? Math.min((activeDungeon.partyScore / baseRating / 2) * 100, 100) : fillPercent}%`,
                            height: '100%',
                            backgroundColor: barColor,
                            transition: 'width 0.3s ease',
                        }}
                    />
                    <Tooltip
                        inline
                        content={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '-8px' }}>Party Score</div>
                                <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)' }}>
                                    Total score of your party based on creature stats and the selected focus. It takes the average
                                    of the stats.{' '}
                                    <span style={{ color: selectedFocus === 'combat' ? 'gold' : 'lime' }}>
                                        {selectedFocus === 'combat'
                                            ? ' Combat weighs Power, Grit, Agility, and Smarts equally.'
                                            : ' Gathering weighs Smarts, Looting, and Luck equally.'}
                                    </span>
                                </div>
                            </div>
                        }
                    >
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
                                fontSize: '16px',
                                fontWeight: '400',
                                color: '#fff',
                                cursor: 'pointer',
                                gap: '4px',
                            }}
                        >
                            <img
                                className="pixel"
                                src={Images.get('icons/rating.png')}
                                alt="Rating"
                                style={{ width: '16px', height: '16px', display: 'block' }}
                            />
                            {activeDungeon ? activeDungeon.partyScore : partyScore}
                        </div>
                    </Tooltip>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0px' }}>
                    <span style={{ fontSize: '18px', color: '#aaa' }}>Difficulty: {baseRating}</span>
                    <span style={{ fontSize: '18px', color: '#aaa' }}>
                        XP/Second: {((tierConfig?.xpReward || 0) / DungeonConfig.DURATION).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Rewards (expedition style) */}
            <div style={{ marginBottom: '8px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '400', marginBottom: '-6px', marginTop: '-6px' }}>Rewards</h4>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginTop: '8px',
                    }}
                >
                    {rewards.map((reward, index) => {
                        const itemMeta = ItemsContent.getById(reward.itemId)
                        const scaledAmount = Math.max(1, Math.floor(reward.amount * gradeMultiplier))
                        const currentAmount = state.inventory.find((i) => i.id === reward.itemId)?.amount || 0

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
                                        marginBottom: '0px',
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
                                            color: 'white',
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
                                        {Numbers.whole(scaledAmount)}
                                    </span>
                                </div>
                            </Tooltip>
                        )
                    })}
                </div>
            </div>

            {/* Party Slots (only when no active dungeon) */}
            {!activeDungeon && (
                <div
                    style={{
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '18px', color: '#aaa', marginBottom: '0px' }}>Party</div>
                        <div style={{ display: 'flex', gap: '6px', padding: '4px', marginLeft: '-4px' }}>
                            {Array.from({ length: maxPartySize }, (_, i) => i).map((slotIndex) => {
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
                                            width: '80px',
                                            height: '80px',
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
                                        }}
                                    >
                                        {creature && creatureContent ? (
                                            <>
                                                <Tooltip
                                                    content={
                                                        <CreatureTooltip creature={creature} creatureContent={creatureContent} />
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
                                                    x
                                                </div>
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '0',
                                                        left: '0',
                                                        backgroundColor: 'rgba(0,0,0,0.7)',
                                                        color: 'white',
                                                        fontSize: '16px',
                                                        fontWeight: '400',
                                                        padding: '1px 4px',
                                                        lineHeight: '1.2',
                                                    }}
                                                >
                                                    Lv {getCreatureLevel(creature)}
                                                </div>
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
                                                style={{ fontSize: '24px', color: '#888', textAlign: 'center', lineHeight: '1' }}
                                            >
                                                +
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '18px', color: '#aaa', marginBottom: '-4px' }}>Armor</div>
                        {(() => {
                            const armorItemData = ItemsContent.getById(DungeonConfig.ARMOR_ITEM_ID)
                            return (
                                <Tooltip
                                    inline
                                    content={
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ fontSize: '18px', fontWeight: '500' }}>Armor</div>
                                            <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)' }}>
                                                One armor set is consumed per creature sent on the dungeon.
                                            </div>
                                        </div>
                                    }
                                >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0', cursor: 'pointer' }}>
                                    <img
                                        className="pixel"
                                        src={Images.get(armorItemData?.image || 'items/placeholder.png')}
                                        alt="Armor Set"
                                        style={{ width: '24px', height: '24px' }}
                                    />
                                    <span
                                        style={{
                                            fontSize: '24px',
                                            color: armorCount >= armorNeeded ? 'white' : '#F44336',
                                        }}
                                    >
                                        {armorCount} / {armorNeeded || '?'}
                                    </span>
                                </div>
                                </Tooltip>
                            )
                        })()}
                    </div>
                </div>
            )}

            {/* Active Dungeon: Party + Progress */}
            {activeDungeon && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '18px', color: '#aaa', marginBottom: '0px' }}>Party</div>
                            <div style={{ display: 'flex', gap: '6px', padding: '4px', marginLeft: '-4px' }}>
                                {Array.from({ length: maxPartySize }, (_, i) => i).map((slotIndex) => {
                                    const creatureId = activeDungeon.creatures[slotIndex]
                                    const creature = creatureId ? state.creatures.find((c) => c.id === creatureId) : null
                                    const creatureContent = creature ? CreaturesContent.getById(creature.species) : null

                                    return (
                                        <div
                                            key={slotIndex}
                                            style={{
                                                width: '80px',
                                                height: '80px',
                                                border: creature
                                                    ? '1px solid rgba(255,255,255,0.2)'
                                                    : '1px dashed rgba(255,255,255,0.1)',
                                                backgroundColor: creature ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.00)',
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
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '0',
                                                            left: '0',
                                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                                            color: 'white',
                                                            fontSize: '16px',
                                                            fontWeight: '400',
                                                            padding: '1px 4px',
                                                            lineHeight: '1.2',
                                                        }}
                                                    >
                                                        Lv {getCreatureLevel(creature)}
                                                    </div>
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
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '18px', color: '#aaa', marginBottom: '-4px' }}>Armor</div>
                            {(() => {
                                const armorItemData = ItemsContent.getById(DungeonConfig.ARMOR_ITEM_ID)
                                return (
                                    <Tooltip
                                        inline
                                        content={
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ fontSize: '18px', fontWeight: '500' }}>Armor</div>
                                                <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)' }}>
                                                    One armor set is consumed per creature sent on the dungeon.
                                                </div>
                                            </div>
                                        }
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0', cursor: 'pointer' }}>
                                            <img
                                                className="pixel"
                                                src={Images.get(armorItemData?.image || 'items/placeholder.png')}
                                                alt="Armor Set"
                                                style={{ width: '24px', height: '24px' }}
                                            />
                                            <span style={{ fontSize: '24px', color: 'white' }}>{armorCount}</span>
                                        </div>
                                    </Tooltip>
                                )
                            })()}
                        </div>
                    </div>

                    {/* Progress Bar (no loop counter) */}
                    {!activeDungeon.completed && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                            <div
                                style={{
                                    height: '8px',
                                    width: '100%',
                                    position: 'relative',
                                    backgroundColor: 'rgba(255,255,255,0.25)',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        right:
                                            (1 - Math.min(1, (currentTime - activeDungeon.startTime) / activeDungeon.duration)) *
                                                100 +
                                            '%',
                                        top: 0,
                                        bottom: 0,
                                        backgroundColor: 'white',
                                    }}
                                />
                            </div>
                            <div style={{ fontSize: '16px', color: '#888', marginTop: '-4px' }}>
                                {Numbers.timeShort(getDungeonDurationLeft(activeDungeon, currentTime))} remaining
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Buttons */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
                {activeDungeon ? (
                    activeDungeon.completed ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                            <Button
                                onClick={() => {
                                    DungeonsActions.collectDungeonRewards(dispatch, activeDungeon.id)
                                }}
                                style={{ backgroundColor: '#26402a', flex: 1 }}
                            >
                                Collect Rewards
                            </Button>
                            {/* Loop checkbox */}
                            <div
                                onClick={() => {
                                    Sounds.play('click.wav')
                                    DungeonsActions.toggleDungeonLoop(dispatch, activeDungeon.id)
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '0px 8px',
                                    cursor: 'pointer',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                }}
                            >
                                <div
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '1px solid rgba(255,255,255,0.4)',
                                        backgroundColor: activeDungeon.loop ? '#2a5a2a' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                ></div>
                                <span style={{ fontSize: '16px', color: 'white', whiteSpace: 'nowrap' }}>Loop</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                            <Button
                                onClick={() => {
                                    setCancelDungeonId(activeDungeon.id)
                                    setShowCancelConfirm(true)
                                }}
                                style={{ backgroundColor: '#6b2d2d', flex: 1 }}
                            >
                                Cancel Dungeon
                            </Button>
                            {/* Loop checkbox */}
                            <div
                                onClick={() => {
                                    Sounds.play('click.wav')
                                    DungeonsActions.toggleDungeonLoop(dispatch, activeDungeon.id)
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '0px 8px',
                                    cursor: 'pointer',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                }}
                            >
                                <div
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '1px solid rgba(255,255,255,0.4)',
                                        backgroundColor: activeDungeon.loop ? '#2a5a2a' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                ></div>
                                <span style={{ fontSize: '16px', color: 'white', whiteSpace: 'nowrap' }}>Loop</span>
                            </div>
                        </div>
                    )
                ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                        <Button
                            style={{ flex: 1 }}
                            onClick={() => {
                                const validCreatureIds = selectedCreatureIds.filter((id): id is string => id !== null)
                                if (validCreatureIds.length > 0) {
                                    DungeonsActions.startDungeon(dispatch, {
                                        tier: selectedTier,
                                        focus: selectedFocus,
                                        creatureIds: validCreatureIds,
                                        loop: loopEnabled,
                                        gatheringSkill: selectedFocus === 'gathering' ? selectedGatheringSkill : undefined,
                                    })
                                }
                            }}
                            disabled={selectedCreatures.length === 0 || armorCount < armorNeeded}
                        >
                            Start Dungeon
                        </Button>
                        {/* Loop checkbox for pre-start */}
                        <div
                            onClick={() => {
                                Sounds.play('click.wav')
                                setLoopEnabled(!loopEnabled)
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '0px 8px',
                                cursor: 'pointer',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.2)',
                            }}
                        >
                            <div
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '1px solid rgba(255,255,255,0.4)',
                                    backgroundColor: loopEnabled ? '#2a5a2a' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            ></div>
                            <span style={{ fontSize: '16px', color: 'white', whiteSpace: 'nowrap' }}>Loop</span>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                opened={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={() => {
                    if (cancelDungeonId) {
                        DungeonsActions.cancelDungeon(dispatch, cancelDungeonId)
                        setCancelDungeonId(null)
                    }
                }}
                text="Canceling a dungeon gives no items or experience, but armor will be refunded. Do you still want to cancel?"
            />
        </div>
    )
}

export default DungeonDetails

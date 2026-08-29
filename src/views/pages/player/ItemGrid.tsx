import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import SkillContent from '@data/skills'
import ItemsContent from '@data/items'
import Images from '@utils/images'
import SkillingHelpers from '@modules/skilling/helpers'
import FabricationActions from '@modules/fabrication/dispatch'
import Sounds from '@utils/sounds'
import { FABRICATION_INTERVAL_SECONDS, MAX_ALLOCATION_PER_ITEM } from '@modules/fabrication/helpers'

const GATHERING_SKILLS = ['Chopping', 'Mining', 'Digging', 'Exploring', 'Fishing', 'Farming']

function ItemGrid({ state, dispatch }: StateProps) {
    const prestigePoints = state.inventory.find((item) => item.id === 'prestige-points')?.amount ?? 0
    const prestigePointsItem = ItemsContent.getById('prestige-points')
    const allocations = state.fabrication?.allocations ?? {}

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '950px', margin: 'auto' }}>
            <Panel>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-4px' }}>
                    <h3 style={{ margin: 0, fontWeight: '400', marginBottom: 0 }}>Fabrication</h3>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {prestigePointsItem && (
                            <img
                                className="pixel"
                                src={Images.get(prestigePointsItem.image)}
                                alt="Prestige Points"
                                style={{ width: '18px', height: '18px' }}
                            />
                        )}
                        <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)' }}>{prestigePoints} Available</span>
                    </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, marginBottom: '4px', fontSize: '16px' }}>
                    Allocate prestige points to passively generate resources. Each point generates 1 of that resource every{' '}
                    <span style={{ color: 'cyan' }}>{FABRICATION_INTERVAL_SECONDS} seconds</span>.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                    {GATHERING_SKILLS.map((skillId) => {
                        const skill = SkillContent.getById(skillId)
                        if (!skill || !skill.activities) return null

                        const playerXp = state.skills.find((s) => s.id === skillId)?.xp ?? 0
                        const playerLevel = SkillingHelpers.getLevel(playerXp)

                        return (
                            <div key={skillId} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {/* Skill header */}
                                <div
                                    style={{
                                        textAlign: 'center',
                                        padding: '0px 0px',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                >
                                    <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)' }}>{skillId}</span>
                                    <span style={{ fontSize: '14px', color: 'rgb(246, 255, 0)', marginLeft: '6px' }}>
                                        Lv.{playerLevel}
                                    </span>
                                </div>

                                {/* Activities */}
                                {skill.activities.map((activity) => {
                                    // Get primary output item (first with chance 1)
                                    const primaryOutput = activity.output.find((o) => o.chance === 1)
                                    if (!primaryOutput) return null

                                    const itemMeta = ItemsContent.getById(primaryOutput.id)
                                    if (!itemMeta) return null

                                    const isLocked = playerLevel < activity.levelRequirement
                                    const currentAlloc = allocations[primaryOutput.id] ?? 0
                                    const isMaxed = currentAlloc >= MAX_ALLOCATION_PER_ITEM
                                    const canAllocate = !isLocked && !isMaxed && prestigePoints > 0

                                    return (
                                        <FabricationSlot
                                            key={activity.id}
                                            itemImage={itemMeta.image}
                                            itemName={itemMeta.name}
                                            levelReq={activity.levelRequirement}
                                            isLocked={isLocked}
                                            allocation={currentAlloc}
                                            canAllocate={canAllocate}
                                            canDeallocate={currentAlloc > 0}
                                            onAllocate={() => {
                                                Sounds.play('click.wav')
                                                FabricationActions.allocatePrestigePoint(dispatch, primaryOutput.id)
                                            }}
                                            onDeallocate={() => {
                                                Sounds.play('click.wav')
                                                FabricationActions.deallocatePrestigePoint(dispatch, primaryOutput.id)
                                            }}
                                        />
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            </Panel>
        </div>
    )
}

interface FabricationSlotProps {
    itemImage: string
    itemName: string
    levelReq: number
    isLocked: boolean
    allocation: number
    canAllocate: boolean
    canDeallocate: boolean
    onAllocate: () => void
    onDeallocate: () => void
}

function FabricationSlot({
    itemImage,
    itemName,
    levelReq,
    isLocked,
    allocation,
    canAllocate,
    canDeallocate,
    onAllocate,
    onDeallocate,
}: FabricationSlotProps) {
    return (
        <div
            style={{
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '4px',
                display: 'flex',
                flexDirection: 'row',
                gap: '4px',
                opacity: isLocked ? 0.2 : 1,
                height: '42px',
            }}
        >
            {/* Vertical upgrade indicator — 5 ticks, filled from bottom */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    gap: '2px',
                    width: '8px',
                    flexShrink: 0,
                }}
            >
                {Array.from({ length: MAX_ALLOCATION_PER_ITEM }, (_, i) => {
                    const tickLevel = i + 1
                    const filled = tickLevel <= allocation
                    return (
                        <div
                            key={tickLevel}
                            style={{
                                flex: 1,
                                width: '100%',
                                backgroundColor: filled ? '#2d8a3e' : 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                            }}
                        />
                    )
                })}
            </div>

            {/* Content */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                {!isLocked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '-4px', marginTop: '-4px' }}>
                        <img
                            className="pixel"
                            src={Images.get(itemImage)}
                            alt={itemName}
                            style={{ width: '16px', height: '16px', flexShrink: 0 }}
                        />
                        <span
                            style={{
                                fontSize: '14px',
                                color: 'rgba(255,255,255,0.9)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {isLocked ? `Lv.${levelReq}` : itemName}
                        </span>
                    </div>
                )}

                {!isLocked && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: 'auto' }}>
                        <div
                            onClick={canDeallocate ? onDeallocate : undefined}
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                padding: '0px 0',
                                fontSize: '12px',
                                height: '16px',
                                backgroundColor: canDeallocate ? 'rgba(255,60,60,0.3)' : 'rgba(255,255,255,0.05)',
                                color: canDeallocate ? 'rgb(255,120,120)' : 'rgba(255,255,255,0.2)',
                                cursor: canDeallocate ? 'pointer' : 'not-allowed',
                                userSelect: 'none',
                            }}
                        >
                            -
                        </div>
                        <div
                            onClick={canAllocate ? onAllocate : undefined}
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                padding: '0px 0',
                                fontSize: '12px',
                                height: '16px',
                                backgroundColor: canAllocate ? 'rgba(45,138,62,0.3)' : 'rgba(255,255,255,0.05)',
                                color: canAllocate ? '#5cdb6a' : 'rgba(255,255,255,0.2)',
                                cursor: canAllocate ? 'pointer' : 'not-allowed',
                                userSelect: 'none',
                            }}
                        >
                            +
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ItemGrid

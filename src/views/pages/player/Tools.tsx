import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import Button from '@components/common/Button'
import Images from '@utils/images'
import ToolsConfig from '@configs/tools'
import ToolHelpers from '@modules/tools/helpers'
import * as ToolDispatch from '@modules/tools/dispatch'
import CraftingActions from '@modules/crafting/dispatch'
import ItemsContent from '@data/items'
import Tooltip from '@components/common/Tooltip'
import { Skills } from '@modules/skilling/types'

// Tool tier names based on level (0 = no tool, 1-10 = bar-themed names)
const TOOL_TIER_NAMES: Record<number, string> = {
    0: 'None',
    1: 'Copper',
    2: 'Tin',
    3: 'Iron',
    4: 'Silver',
    5: 'Gold',
    6: 'Platinum',
    7: 'Adamantite',
    8: 'Runic',
    9: 'Solarite',
    10: 'Arcanum',
}

function Tools({ state, dispatch }: StateProps) {
    const tools = ToolsConfig.TOOL_DEFINITIONS

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '970px', margin: 'auto' }}>
            <Panel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                    {tools.map((tool) => {
                        const level = ToolHelpers.getToolLevel(state.tools, tool.id)
                        const tierName = TOOL_TIER_NAMES[level]
                        const xpBonus = ToolHelpers.getToolXpBonus(state.tools, tool.id)
                        const isMax = level >= ToolsConfig.MAX_TOOL_LEVEL
                        const hasTool = level > 0
                        const cost = ToolHelpers.getUpgradeCost(state.tools, tool.id)
                        const canAfford = ToolHelpers.canAffordUpgrade(state.tools, tool.id, state.inventory)

                        // Cost item info
                        const costItem = cost ? ItemsContent.getById(cost.barId) : null
                        const playerAmount = cost ? state.inventory.find((i) => i.id === cost.barId)?.amount || 0 : 0

                        return (
                            <div
                                key={tool.id}
                                style={{
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    padding: '12px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    minHeight: '188px',
                                    position: 'relative',
                                }}
                            >
                                {tool.category === 'workstation' && hasTool && (() => {
                                    const wsName = tool.skillId as Skills
                                    const wsKey = wsName.toLowerCase() as 'furnace' | 'workbench' | 'stove'
                                    const speedMode = !!(state as any)[wsKey]?.speedMode
                                    const xpPct = level * ToolsConfig.XP_BONUS_PER_LEVEL
                                    const speedPct = level * 2
                                    return (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '6px',
                                                right: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '14px',
                                                color: 'rgba(255,255,255,0.85)',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                zIndex: 2,
                                            }}
                                            onClick={() =>
                                                CraftingActions.setWorkstationSpeedMode(dispatch, {
                                                    workstation: wsName,
                                                    enabled: !speedMode,
                                                })
                                            }
                                        >
                                            <Tooltip
                                                content={
                                                    <div style={{ fontSize: '18px', lineHeight: '1.2' }}>
                                                        <div>Toggle how this tool's bonus is applied at the {tool.skillId}.</div>
                                                        <div style={{ marginTop: '4px' }}>XP Mode: +{xpPct}% XP</div>
                                                        <div>Speed Mode: +{speedPct}% Speed</div>
                                                    </div>
                                                }
                                            >
                                                <span>Speed</span>
                                            </Tooltip>
                                            <input
                                                type="checkbox"
                                                checked={speedMode}
                                                onChange={(e) =>
                                                    CraftingActions.setWorkstationSpeedMode(dispatch, {
                                                        workstation: wsName,
                                                        enabled: e.target.checked,
                                                    })
                                                }
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </div>
                                    )
                                })()}
                                {/* Vertical Progress Bar — 10 ticks, filled from bottom */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column-reverse',
                                        gap: '2px',
                                        width: '10px',
                                        flexShrink: 0,
                                        marginRight: '10px',
                                    }}
                                >
                                    {Array.from({ length: ToolsConfig.MAX_TOOL_LEVEL }, (_, i) => {
                                        const tickLevel = i + 1
                                        const filled = tickLevel <= level
                                        return (
                                            <div
                                                key={tickLevel}
                                                style={{
                                                    flex: 1,
                                                    width: '100%',
                                                    backgroundColor: filled ? 'rgb(255, 255, 255)' : 'rgba(255,255,255,0.08)',
                                                    border: '1px solid rgba(255,255,255,0.12)',
                                                }}
                                            />
                                        )
                                    })}
                                </div>

                                {/* Card Content */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        flex: 1,
                                    }}
                                >
                                    {/* Tool Icon */}
                                    <img
                                        className="pixel"
                                        src={Images.get(tool.image)}
                                        alt={tool.name}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            marginBottom: '0',
                                            opacity: hasTool ? 1 : 0.1,
                                        }}
                                    />

                                    {/* Skill Label */}
                                    <div
                                        style={{
                                            fontSize: '18px',
                                            color: 'rgba(255,255,255,0.6)',
                                            marginBottom: '0px',
                                        }}
                                    >
                                        {tool.skillId}
                                    </div>

                                    {/* Tool Name */}
                                    <div
                                        style={{
                                            fontSize: '20px',
                                            color: 'rgba(255,255,255,0.95)',
                                            marginBottom: '4px',
                                            marginTop: '-14px',
                                        }}
                                    >
                                        {hasTool ? `${tierName} ${tool.name}` : 'No Tool'}
                                    </div>

                                    {/* Level & Bonus */}

                                    <div
                                        style={{
                                            fontSize: '16px',
                                            color: isMax
                                                ? 'rgb(255, 0, 204)'
                                                : hasTool
                                                  ? 'rgb(255, 187, 0)'
                                                  : 'rgba(255,255,255,.5)',
                                            marginTop: '-14px',
                                        }}
                                    >
                                        {(() => {
                                            const isWs = tool.category === 'workstation'
                                            const wsKey = isWs ? (tool.skillId.toLowerCase() as 'furnace' | 'workbench' | 'stove') : null
                                            const wsSpeedMode = wsKey ? !!(state as any)[wsKey]?.speedMode : false
                                            const bonusText = wsSpeedMode ? `+${level * 2}% Speed` : `+${xpBonus}% XP`
                                            return isMax ? `MAX LEVEL (${bonusText})` : `Level ${level} (${bonusText})`
                                        })()}
                                    </div>

                                    {/* Upgrade Cost + Button */}
                                    {!isMax && cost && costItem && (
                                        <div
                                            style={{
                                                marginTop: 'auto',
                                                paddingTop: '0px',
                                                width: '100%',
                                            }}
                                        >
                                            {/* Required Cost */}
                                            <Tooltip
                                                center
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
                                                            src={Images.get(costItem.image)}
                                                            alt={costItem.name}
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
                                                                {costItem.name}
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
                                                                {costItem.description || ''}
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
                                                            {playerAmount.toLocaleString()} Owned
                                                        </div>
                                                    </div>
                                                }
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        marginBottom: '0px',
                                                        padding: '0 2px',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <img
                                                            className="pixel"
                                                            src={Images.get(costItem.image)}
                                                            alt={costItem.name}
                                                            style={{ width: '16px', height: '16px' }}
                                                        />
                                                        <span style={{ fontSize: '16px' }}>{costItem.name}</span>
                                                    </div>
                                                    <span
                                                        style={{
                                                            fontSize: '16px',
                                                            color: canAfford ? 'lime' : 'red',
                                                        }}
                                                    >
                                                        {Math.min(playerAmount, cost.amount)}/{cost.amount}
                                                    </span>
                                                </div>
                                            </Tooltip>

                                            {/* Upgrade Button */}
                                            <Button
                                                onClick={() => ToolDispatch.upgradeTool(dispatch, tool.id)}
                                                disabled={!canAfford}
                                                style={{ marginTop: '1px' }}
                                            >
                                                {hasTool ? `Upgrade` : 'Craft'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Panel>
            <Panel>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,1)', textAlign: 'center' }}>
                    Each upgrade gives you a <span style={{ color: 'cyan' }}>5% boost</span> in that area of the game.
                </p>
            </Panel>
        </div>
    )
}

export default Tools

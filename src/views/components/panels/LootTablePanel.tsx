import Panel from '@components/common/Panel'
import ItemsContent from '@data/items'
import SkillContent from '@data/skills'
import { StateProps } from '@engine/types'
import Images from '@utils/images'
import SanctuaryHelpers from '@modules/sanctuary/helpers'
import * as UpgradeHelpers from '@modules/upgrades/helpers'
import Numbers from '@utils/numbers'
import Tooltip from '@components/common/Tooltip'

interface Props extends StateProps {
    skill: string
    selectedActivity: string | null
}

function LootTablePanel({ state, dispatch, skill, selectedActivity }: Props) {
    const activities = SkillContent.getById(skill).activities || []
    const activityMeta = selectedActivity ? activities.find((a) => a.id === selectedActivity) : null

    // Calculate sanctuary and upgrade yield bonuses
    const jobKey = skill.toLowerCase() as keyof ReturnType<typeof SanctuaryHelpers.calculateJobTiers>
    const jobTiers = SanctuaryHelpers.calculateJobTiers(state)
    const jobBenefits = SanctuaryHelpers.getJobBenefits(jobTiers[jobKey])
    const upgradeYieldBonus = UpgradeHelpers.getSkillYieldBonus(state.purchasedUpgrades, skill as any)
    const yieldBonus = jobBenefits.yieldBonus + upgradeYieldBonus

    // Sort items by chance (highest to lowest, so common items appear first)
    const sortedItems = activityMeta?.output ? [...activityMeta.output].sort((a, b) => b.chance - a.chance) : null

    return (
        <Panel style={{ height: '256px', display: 'flex', flexDirection: 'column' }}>
            <h3>Loot Table</h3>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {!activityMeta || !sortedItems ? (
                    <p style={{ fontSize: '20px', color: 'rgba(255,255,255,.5)' }}>Select an activity to see the loot table.</p>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                        }}
                    >
                        {Array.from({ length: 6 }).map((_, index) => {
                            const item = sortedItems[index]
                            const isEmpty = !item

                            if (isEmpty) {
                                // Empty slot - darker placeholder
                                return (
                                    <div
                                        key={`empty-${index}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '4px 12px',
                                            backgroundColor: 'rgba(255,255,255,0.02)',
                                            opacity: 0.8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                marginRight: '8px',
                                                marginLeft: '4px',
                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                opacity: 0,
                                            }}
                                        />
                                    </div>
                                )
                            }

                            const itemMeta = ItemsContent.getById(item.id)

                            // Always use white color
                            const itemColor = 'white'

                            const minAmount = item.min + yieldBonus
                            const maxAmount = item.max + yieldBonus

                            // Get current inventory count
                            const inventoryItem = state.inventory.find((invItem) => invItem.id === item.id)
                            const currentAmount = inventoryItem?.amount || 0

                            return (
                                <Tooltip
                                    key={`${item.id}-${index}`}
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
                                                alt={itemMeta?.name || item.id}
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
                                                    {itemMeta?.name || item.id}
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
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '4px 12px',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
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
                                            alt={itemMeta?.name || item.id}
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                marginRight: '8px',
                                                marginLeft: '4px',
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
                                            {itemMeta?.name || item.id}{' '}
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '400' }}>
                                                ({Numbers.whole(currentAmount)})
                                            </span>
                                        </h3>
                                        <div
                                            style={{
                                                paddingRight: '8px',
                                                fontSize: '16px',
                                                fontWeight: '400',
                                                display: 'flex',
                                                gap: '12px',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '16px',
                                                    fontWeight: '400',
                                                    color: 'rgba(255,255,255,0.5)',
                                                    minWidth: '50px',
                                                    textAlign: 'right',
                                                }}
                                            >
                                                {item.chance !== undefined ? `${(item.chance * 100) % 1 === 0 ? `${item.chance * 100}%` : `${(item.chance * 100).toFixed(2)}%`}` : '100%'}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '16px',
                                                    fontWeight: '400',
                                                    textAlign: 'right',
                                                    color: 'rgba(255,255,255,0.9)',
                                                    minWidth: '60px',
                                                }}
                                            >
                                                {item.max === 1 ? (
                                                    Numbers.whole(minAmount)
                                                ) : (
                                                    <>
                                                        {Numbers.whole(minAmount)}-{Numbers.whole(maxAmount)}
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </Tooltip>
                            )
                        })}
                    </div>
                )}
            </div>
        </Panel>
    )
}

export default LootTablePanel

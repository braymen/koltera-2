import { useMemo } from 'react'
import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import { Stack, Text, Group } from '@mantine/core'
import Images from '@utils/images'
import ItemsContent from '@data/items'
import { FLAT_NAVIGATION_MAP } from '@utils/navigation'
import { formatTime } from '@utils/offline-progress'

const GATHERING_SKILLS = ['Chopping', 'Mining', 'Digging', 'Farming', 'Fishing', 'Exploring'] as const
type GatheringSkill = (typeof GATHERING_SKILLS)[number]

const SKILL_LABELS: Record<GatheringSkill, string> = {
    Chopping: 'Chop',
    Mining: 'Mine',
    Digging: 'Dig',
    Farming: 'Farm',
    Fishing: 'Fish',
    Exploring: 'Explore',
}

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num)

const sectionHeadingStyle = {
    marginBottom: '4px',
    marginTop: '16px',
    fontSize: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
    paddingBottom: '2px',
}

function StatRow({ label, icon, value }: { label: string; icon?: string; value: number | string }) {
    const formatted = typeof value === 'number' ? formatNumber(value) : value
    return (
        <Group justify="space-between">
            <Text size="md">{label}</Text>
            {icon ? (
                <Group gap="4px" align="center">
                    <img className="pixel" src={Images.get(icon)} alt={label} style={{ width: '16px', height: '16px' }} />
                    <Text size="md" fw={500}>
                        {formatted}
                    </Text>
                </Group>
            ) : (
                <Text size="md" fw={500}>
                    {formatted}
                </Text>
            )}
        </Group>
    )
}

function Statistics({ state }: StateProps) {
    const navIcons = useMemo(
        () => Object.fromEntries(FLAT_NAVIGATION_MAP.map((tab) => [tab.id, tab.image || 'items/placeholder.png'])),
        []
    )

    const totalXP = useMemo(() => state.skills.reduce((total, skill) => total + (skill.xp || 0), 0), [state.skills])

    const skillingCycles = useMemo(
        () =>
            Object.fromEntries(
                GATHERING_SKILLS.map((skill) => [
                    skill,
                    state.statistics?.skillingCycles?.[skill as keyof typeof state.statistics.skillingCycles] || 0,
                ])
            ) as Record<GatheringSkill, number>,
        [state]
    )

    const helperCycles = useMemo(
        () =>
            Object.fromEntries(
                GATHERING_SKILLS.map((skill) => [
                    skill,
                    state.statistics?.helperCycles?.[skill as keyof typeof state.statistics.helperCycles] || 0,
                ])
            ) as Record<GatheringSkill, number>,
        [state]
    )

    const totalSkillingCycles = Object.values(skillingCycles).reduce((sum, n) => sum + n, 0)
    const totalHelperCycles = Object.values(helperCycles).reduce((sum, n) => sum + n, 0)

    const stats = state.statistics
    const expeditions = stats?.expeditions
    const itemsCrafted = stats?.itemsCrafted
    const goldIcon = ItemsContent.getById('gold')?.image || 'items/placeholder.png'

    const onlinePlaytime = (state as any).onlinePlaytime ?? 0
    const offlinePlaytime = (state as any).offlinePlaytime ?? 0
    const totalPlaytime = state.totalPlaytime ?? onlinePlaytime + offlinePlaytime

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '1000px', margin: '0 auto' }}>
            <Panel style={{ minHeight: '640px' }}>
                <Stack gap="xs">
                    <h2 style={{ marginTop: 0, marginBottom: '-6px', fontSize: '32px' }}>Statistics</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        {/* Left Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>
                                <h3 style={sectionHeadingStyle}>Skilling</h3>
                                <Stack gap="2px">
                                    {GATHERING_SKILLS.map((skill) => (
                                        <StatRow
                                            key={skill}
                                            label={`Total ${SKILL_LABELS[skill]} Cycles:`}
                                            icon={navIcons[skill]}
                                            value={skillingCycles[skill]}
                                        />
                                    ))}
                                    <StatRow label="Total Skilling Cycles:" value={totalSkillingCycles} />
                                </Stack>
                            </div>

                            <div>
                                <h3 style={sectionHeadingStyle}>Helpers</h3>
                                <Stack gap="2px">
                                    {GATHERING_SKILLS.map((skill) => (
                                        <StatRow
                                            key={skill}
                                            label={`Total ${SKILL_LABELS[skill]} Cycles:`}
                                            icon={navIcons[skill]}
                                            value={helperCycles[skill]}
                                        />
                                    ))}
                                    <StatRow label="Total Helper Cycles:" value={totalHelperCycles} />
                                </Stack>
                            </div>

                            <div>
                                <h3 style={sectionHeadingStyle}>Gold</h3>
                                <StatRow label="Total Gold Earned:" icon={goldIcon} value={stats?.totalGoldEarned || 0} />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>
                                <h3 style={sectionHeadingStyle}>Experience</h3>
                                <Stack gap="2px">
                                    <StatRow label="Total Skilling XP Earned:" value={totalXP} />
                                    <StatRow label="Total Creature XP Earned:" value={stats?.totalCreatureXP || 0} />
                                </Stack>
                            </div>

                            <div>
                                <h3 style={sectionHeadingStyle}>Time</h3>
                                <Stack gap="2px">
                                    <StatRow label="Online Playtime:" value={formatTime(onlinePlaytime)} />
                                    <StatRow label="Simulated Playtime:" value={formatTime(offlinePlaytime)} />
                                    <StatRow label="Total Playtime:" value={formatTime(totalPlaytime)} />
                                </Stack>
                            </div>

                            <div>
                                <h3 style={sectionHeadingStyle}>Expeditions</h3>
                                <Stack gap="2px">
                                    <StatRow
                                        label="Total Expeditions:"
                                        icon={navIcons['Expeditions']}
                                        value={expeditions?.total || 0}
                                    />
                                    <StatRow
                                        label="Highest Expedition Party Score:"
                                        value={expeditions?.highestPartyScore || 0}
                                    />
                                </Stack>
                            </div>

                            <div>
                                <h3 style={sectionHeadingStyle}>Items</h3>
                                <Stack gap="2px">
                                    <StatRow
                                        label="Total Items Gained:"
                                        icon={navIcons['Inventory']}
                                        value={stats?.totalItemsGained || 0}
                                    />
                                    <StatRow
                                        label="Items Crafted in Stove:"
                                        icon={navIcons['Stove']}
                                        value={itemsCrafted?.Stove || 0}
                                    />
                                    <StatRow
                                        label="Items Crafted in Workbench:"
                                        icon={navIcons['Workbench']}
                                        value={itemsCrafted?.Workbench || 0}
                                    />
                                    <StatRow
                                        label="Items Crafted in Furnace:"
                                        icon={navIcons['Furnace']}
                                        value={itemsCrafted?.Furnace || 0}
                                    />
                                    <StatRow label="Total Items Crafted:" value={itemsCrafted?.total || 0} />
                                </Stack>
                            </div>

                            <div>
                                <h3 style={sectionHeadingStyle}>Task Board</h3>
                                <StatRow
                                    label="Total Tasks Completed:"
                                    icon={navIcons['Task Board']}
                                    value={stats?.totalTasksCompleted || 0}
                                />
                            </div>
                        </div>
                    </div>
                </Stack>
            </Panel>
        </div>
    )
}

export default Statistics

import { StateProps } from '@engine/types'
import { Progress } from '@mantine/core'
import SkillingHelpers from '@modules/skilling/helpers'
import SkillContent from '@data/skills'
import Images from '@utils/images'
import { NavigationTab } from '@utils/navigation'
import Tooltip from '@components/common/Tooltip'

interface Props extends StateProps {
    tab: NavigationTab
    showEnding?: (show: boolean) => void
}

function LayoutContent({ state, dispatch, tab, showEnding }: Props) {
    if (!tab) return null

    const playerLevel = SkillingHelpers.getPlayerLevel(state.skills)
    const xpBonus = SkillingHelpers.getPlayerLevelXpBonus(state.skills)

    const allSkills = SkillContent.get
    const fractionalLevelSum = allSkills.reduce((sum, skill) => {
        const xp = state.skills.find((s) => s.id === skill.id)?.xp || 0
        return sum + SkillingHelpers.getLevel(xp) + SkillingHelpers.getNextLevelProgress(xp)
    }, 0)
    const playerLevelProgress = (fractionalLevelSum / allSkills.length) - playerLevel

    return (
        <>
            <div
                style={{
                    backgroundColor: tab.color,
                    borderBottom: '1px solid rgba(255,255,255,.2)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        maxWidth: '1000px',
                        margin: '0 auto',
                        padding: '4px 14px',
                        width: '100%',
                    }}
                >
                    <img
                        className="pixel"
                        src={Images.get(tab.image)}
                        alt={tab.id}
                        style={{
                            mixBlendMode: 'luminosity',
                            width: '36px',
                            marginRight: '14px',
                            backgroundColor: 'rgba(0,0,0,.4)',
                            padding: '4px',
                        }}
                    />
                    <h2>{tab.id}</h2>
                    <div style={{ marginLeft: 'auto', minWidth: '520px', maxWidth: '520px', marginRight: '8px' }}>
                        <Tooltip
                            center
                            width="300px"
                            content={
                                <div>
                                    <p style={{ margin: '0 0 6px 0', fontWeight: 600 }}>Player Level</p>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'rgba(255,255,255,0.7)' }}>
                                        Based on the average of all gathering and workstation skill levels.
                                    </p>
                                    <p
                                        style={{
                                            margin: '0',
                                            fontSize: '18px',
                                            color: 'rgba(255,255,255,0.7)',
                                            marginTop: '8px',
                                        }}
                                    >
                                        Applies a <span style={{ color: '#5f5' }}>+0.25%</span> XP bonus per level to all player
                                        skills.
                                    </p>
                                </div>
                            }
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '-4px',
                                    }}
                                >
                                    <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                                        Bonus Skilling XP:{' '}
                                        <span style={{ color: 'white' }}>
                                            +{xpBonus % 1 === 0 ? xpBonus : xpBonus.toFixed(2)}%
                                        </span>
                                    </span>
                                    <span style={{ fontSize: '18px', fontWeight: 400 }}>
                                        Player Level <span style={{ color: 'white' }}>{playerLevel}</span>
                                    </span>
                                </div>
                                <Progress
                                    styles={{
                                        section: { backgroundColor: 'rgba(255,255,255, 1)' },
                                        root: { backgroundColor: 'rgba(255,255,255, .25)' },
                                    }}
                                    value={playerLevelProgress * 100}
                                    style={{ height: '4px', width: '100%' }}
                                />
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </div>
            <div style={{ padding: '8px 16px', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
                {tab.component && <tab.component state={state} dispatch={dispatch} showEnding={showEnding} />}
            </div>
        </>
    )
}

export default LayoutContent

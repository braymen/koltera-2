import ActivitySelectionButton from '@components/gathering/ActionSelectorButton'
import SkillContent from '@data/skills'
import { StateProps } from '@engine/types'
import Skilling from '@modules/skilling/dispatch'
import SkillingHelpers from '@modules/skilling/helpers'
import { useState } from 'react'
import Pagination from '@components/common/Pagination'
import SanctuaryHelpers from '@modules/sanctuary/helpers'
import Sounds from '@utils/sounds'
import Button from '../common/Button'
import BonusHelpers from '@modules/bonuses/helpers'

interface Props extends StateProps {
    skill: string
    selectedActivity: string | null
    onActivitySelect: (activityId: string) => void
}

function ActivitySelection({ state, dispatch, skill, selectedActivity, onActivitySelect }: Props) {
    const skillLevel = SkillingHelpers.getLevel(state.skills.find((s) => s.id === skill)?.xp || 0)
    const [currentPage, setCurrentPage] = useState(1)
    const actionsPerPage = 12

    const jobTiers = SanctuaryHelpers.calculateJobTiers(state)

    const activities = SkillContent.getById(skill).activities || []
    const totalPages = Math.ceil(activities.length / actionsPerPage)
    const displayedActivities = activities.slice((currentPage - 1) * actionsPerPage, currentPage * actionsPerPage)

    const selectedActivityMeta = selectedActivity ? activities.find((a) => a.id === selectedActivity) : null

    const xpBreakdown = BonusHelpers.getGatheringXpBonus(state, skill, jobTiers)
    const durationBreakdown = BonusHelpers.getGatheringDurationReduction(state, skill, jobTiers)

    const handleStartActivity = () => {
        if (selectedActivity && selectedActivityMeta) {
            const unlocked = skillLevel >= selectedActivityMeta.levelRequirement
            if (unlocked) {
                Skilling.setSkill(dispatch, skill, selectedActivity)
            }
        }
    }

    return (
        <div>
            <h3>Actions</h3>
            <div style={{ height: '462px' }}>
                {displayedActivities.map((activity) => {
                    const unlocked = skillLevel >= activity.levelRequirement
                    const isActive = state.progress.skilling.id === skill && state.progress.skilling.activity === activity.id
                    const isSelected = selectedActivity === activity.id

                    const adjustedXp = activity.xpRate * xpBreakdown.multiplier
                    const adjustedDuration = Math.round(Math.max(1, activity.duration * durationBreakdown.multiplier) * 10) / 10

                    return (
                        <ActivitySelectionButton
                            key={activity.id}
                            state={state}
                            dispatch={dispatch}
                            image={activity.image}
                            label={activity.name}
                            xp={adjustedXp}
                            baseXp={activity.xpRate}
                            duration={adjustedDuration}
                            baseDuration={activity.duration}
                            levelRequirement={activity.levelRequirement}
                            onClick={() => onActivitySelect(activity.id)}
                            unlocked={unlocked}
                            selected={isSelected}
                            active={isActive}
                            xpBreakdown={xpBreakdown}
                        />
                    )
                })}
            </div>
            {selectedActivityMeta && (
                <div style={{ padding: '0px' }}>
                    <Button
                        onClick={handleStartActivity}
                        disabled={skillLevel < selectedActivityMeta.levelRequirement}
                        style={{
                            fontSize: '18px',
                            fontWeight: '400',
                            borderRadius: 0,
                            backgroundColor:
                                state.progress.skilling.id === skill && state.progress.skilling.activity === selectedActivity
                                    ? '#402626'
                                    : '#26402a',
                            cursor: skillLevel >= selectedActivityMeta.levelRequirement ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {state.progress.skilling.id === skill && state.progress.skilling.activity === selectedActivity
                            ? 'Stop Activity'
                            : 'Start Activity'}
                    </Button>
                </div>
            )}
            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
        </div>
    )
}

export default ActivitySelection

import Panel from '@components/common/Panel'
import SkillContent from '@data/skills'
import { StateProps } from '@engine/types'
import Images from '@utils/images'

interface Props extends StateProps {
    skill: string
}

function GatheringProgressPanel({ state, skill }: Props) {
    const activity =
        state.progress.skilling.id === skill
            ? SkillContent.getById(skill)?.activities?.find((activity) => activity.id === state.progress.skilling.activity)
            : null

    return (
        <Panel style={{ height: '100px' }}>
            <h3>Current Action</h3>
            {activity ? (
                <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '4px' }}>
                    <img
                        className="pixel"
                        src={Images.get(activity.image || 'items/placeholder.png')}
                        alt={activity.name}
                        style={{ width: '52px', height: '52px', marginRight: '8px', padding: '4px', marginTop: '5px' }}
                    />
                    <div style={{ width: '100%', position: 'relative' }}>
                        <h3>{skill}</h3>
                        <p>{activity.name}</p>
                        <div
                            style={{
                                height: '4px',
                                width: '100%',
                                position: 'relative',
                                backgroundColor: 'rgba(255,255,255,.25)',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: (1 - state.progress.skilling.progress) * 100 + '%',
                                    top: 0,
                                    bottom: 0,
                                    backgroundColor: 'white',
                                }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <p style={{ fontSize: '20px', color: 'rgba(255,255,255,.5)' }}>Select an activity to begin skilling.</p>
            )}
        </Panel>
    )
}

export default GatheringProgressPanel

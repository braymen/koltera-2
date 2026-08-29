import SkillContent from '@data/skills'
import { StateProps } from '@engine/types'
import Navigation from '@modules/navigation/dispatch'
import Images from '@utils/images'
import { FLAT_NAVIGATION_MAP } from '@utils/navigation'
import Sounds from '@utils/sounds'
import { isTabUnlocked } from '@modules/story/helpers'

function NavSkillProgress({ state, dispatch }: StateProps) {
    const inProgress = state.progress.skilling.id !== ''
    if (!inProgress) return null
    const skillData = SkillContent.getById(state.progress.skilling.id)
    if (!skillData) return null
    const tab = FLAT_NAVIGATION_MAP.find((tab) => tab.id === skillData.id)
    if (!tab) return null
    if (!isTabUnlocked(state, tab.id)) return null

    const currentActivity = skillData.activities?.find((a) => a.id === state.progress.skilling.activity)

    return (
        <div
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => {
                Sounds.play('click.wav')
                Navigation.tab(dispatch, skillData.id)
            }}
        >
            <div
                style={{
                    position: 'fixed',
                    height: '64px',
                    width: '280px',
                    backgroundColor: tab.color,
                    bottom: 0,
                    left: 0,
                    zIndex: 1000,
                    borderTop: '1px solid rgba(255,255,255,.2)',
                    borderRight: '1px solid rgba(255,255,255,.2)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 24px 4px',
                }}
            >
                <img
                    className="pixel"
                    src={Images.get(currentActivity?.image || 'items/placeholder.png')}
                    alt={currentActivity?.name || tab.id}
                    style={{
                        width: '52px',
                        marginRight: '14px',
                        backgroundColor: 'rgba(0,0,0,.4)',
                        padding: '4px',
                        marginTop: '5px',
                    }}
                />
                <div style={{ width: '100%' }}>
                    <h3>{tab.id}</h3>
                    <p>{currentActivity?.name}</p>
                    <div style={{ height: '4px', width: '100%', position: 'relative', backgroundColor: 'rgba(0,0,0,1)' }}>
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
        </div>
    )
}

export default NavSkillProgress

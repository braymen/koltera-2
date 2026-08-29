import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import { useState } from 'react'
import CreatureSummon from '@components/creatures/CreatureSummon'
import CreatureDetails from '@components/creatures/CreatureDetails'

function Summoning({ state, dispatch }: StateProps) {
    const [selectedCreature, setSelectedCreature] = useState('')

    return (
        <div style={{ display: 'flex', maxWidth: '940px', margin: 'auto' }}>
            <div style={{ width: '354px' }}>
                <Panel>
                    <CreatureSummon
                        state={state}
                        dispatch={dispatch}
                        selected={selectedCreature}
                        onSelect={setSelectedCreature}
                    />
                </Panel>
            </div>
            <div style={{ width: '100%' }}>
                <Panel>
                    <CreatureDetails
                        state={state}
                        dispatch={dispatch}
                        creature={selectedCreature}
                        showSummon
                        showEquipment={false}
                        setSelectedCreature={setSelectedCreature}
                    />
                </Panel>
            </div>
        </div>
    )
}

export default Summoning

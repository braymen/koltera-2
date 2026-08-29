import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import { useMemo, useState } from 'react'
import CreatureDetails from '@components/creatures/CreatureDetails'
import CreatureInventory from '@components/creatures/CreatureInventory'
import CreaturesContent from '@data/creatures'
import { getCreatureLevel } from '@modules/creatures/helpers'

function Creatures({ state, dispatch }: StateProps) {
    const firstCreatureId = useMemo(() => {
        const owned = CreaturesContent.get
            .filter((c) => state.creatures.some((sc) => sc.species === c.id))
            .map((c) => ({
                id: c.id,
                level: getCreatureLevel(state.creatures.find((sc) => sc.species === c.id)!),
            }))
            .sort((a, b) => b.level - a.level)
        return owned.length > 0 ? owned[0].id : ''
    }, [state.creatures])
    const [selectedCreature, setSelectedCreature] = useState(firstCreatureId)

    return (
        <div style={{ display: 'flex', maxWidth: '940px', margin: 'auto' }}>
            <div style={{ width: '354px' }}>
                <Panel>
                    <CreatureInventory
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
                        showSummon={false}
                        showEquipment
                    />
                </Panel>
            </div>
        </div>
    )
}

export default Creatures

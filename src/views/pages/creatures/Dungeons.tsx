import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import DungeonDetails from '@components/dungeons/DungeonDetails'
import DungeonCreatureSelector from '@components/dungeons/DungeonCreatureSelector'
import { useState, useRef } from 'react'

function Dungeons({ state, dispatch }: StateProps) {
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
    const [partyCreatureIds, setPartyCreatureIds] = useState<(string | null)[]>([null, null, null])
    const creatureSelectHandlerRef = useRef<((creatureId: string) => void) | null>(null)

    return (
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '66%', minHeight: 0 }}>
                <Panel style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <DungeonDetails
                        state={state}
                        dispatch={dispatch}
                        onSlotSelect={setSelectedSlot}
                        selectedSlot={selectedSlot}
                        onCreatureSelectHandlerReady={(handler) => {
                            creatureSelectHandlerRef.current = handler
                        }}
                        onPartyCreatureIdsChange={setPartyCreatureIds}
                    />
                </Panel>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', width: '34%', minHeight: 0 }}>
                <Panel style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <DungeonCreatureSelector
                        state={state}
                        dispatch={dispatch}
                        selectedSlot={selectedSlot}
                        currentPartyCreatureIds={partyCreatureIds}
                        onSelect={(creatureId) => creatureSelectHandlerRef.current?.(creatureId)}
                    />
                </Panel>
            </div>
        </div>
    )
}

export default Dungeons

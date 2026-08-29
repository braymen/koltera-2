import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import ExpeditionBrowser from '@components/expeditions/ExpeditionBrowser'
import ExpeditionDetails from '@components/expeditions/ExpeditionDetails'
import ExpeditionCreatureSelector from '@components/expeditions/ExpeditionCreatureSelector'
import { useState, useRef, useEffect } from 'react'
import ExpeditionsContent from '@data/expeditions'
import { isExpeditionTypeUnlocked } from '@modules/expeditions/helpers'

const getDefaultExpedition = (expeditionCompletions: Record<string, Record<number, number>>): string | null => {
    const sortedTypes = [...ExpeditionsContent.get].sort(
        (a, b) => a.requiredExpeditionCompletions - b.requiredExpeditionCompletions
    )
    const unlockedExpedition = sortedTypes.find((type) => isExpeditionTypeUnlocked(type.id, expeditionCompletions))
    return unlockedExpedition?.id || sortedTypes[0]?.id || null
}

function Expeditions({ state, dispatch }: StateProps) {
    const [selectedExpedition, setSelectedExpedition] = useState<string | null>(() =>
        getDefaultExpedition(state.expeditionCompletions)
    )
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
    const [partyCreatureIds, setPartyCreatureIds] = useState<(string | null)[]>([])
    const creatureSelectHandlerRef = useRef<((creatureId: string) => void) | null>(null)

    // Reset party when expedition changes
    useEffect(() => {
        setPartyCreatureIds([])
        setSelectedSlot(null)
    }, [selectedExpedition])

    return (
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '33%', minHeight: 0 }}>
                <Panel style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <ExpeditionBrowser
                        state={state}
                        dispatch={dispatch}
                        selectedExpeditionTypeId={selectedExpedition}
                        onSelect={(expeditionTypeId) => {
                            setSelectedExpedition(expeditionTypeId)
                            setSelectedSlot(null)
                        }}
                    />
                </Panel>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, minHeight: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '45%', minHeight: 0 }}>
                        <Panel style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <ExpeditionDetails
                                state={state}
                                dispatch={dispatch}
                                selectedExpeditionTypeId={selectedExpedition}
                                onSlotSelect={setSelectedSlot}
                                selectedSlot={selectedSlot}
                                onCreatureSelectHandlerReady={(handler) => {
                                    creatureSelectHandlerRef.current = handler
                                }}
                                onPartyCreatureIdsChange={setPartyCreatureIds}
                            />
                        </Panel>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '55%', minHeight: 0 }}>
                        <Panel style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <ExpeditionCreatureSelector
                                state={state}
                                dispatch={dispatch}
                                selectedExpeditionTypeId={selectedExpedition}
                                selectedSlot={selectedSlot}
                                currentPartyCreatureIds={partyCreatureIds}
                                onSelect={(creatureId) => creatureSelectHandlerRef.current?.(creatureId)}
                            />
                        </Panel>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Expeditions

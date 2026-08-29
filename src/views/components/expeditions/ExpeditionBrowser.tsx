import { StateProps } from '@engine/types'
import ExpeditionButton from './ExpeditionButton'
import ExpeditionsContent from '@data/expeditions'
import { Input } from '@mantine/core'
import { useState, useMemo } from 'react'
import Pagination from '../common/Pagination'
import { generateDifficultyRating, isExpeditionTypeUnlocked, getTotalCompletedExpeditions } from '@modules/expeditions/helpers'
import ExpeditionsActions from '@modules/expeditions/dispatch'
import Button from '../common/Button'
import ConfirmModal from '../common/ConfirmModal'

interface Props extends StateProps {
    selectedExpeditionTypeId?: string | null
    onSelect: (expeditionTypeId: string) => void
}

function ExpeditionBrowser({ state, dispatch, selectedExpeditionTypeId, onSelect }: Props) {
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const itemsPerPage = 14

    const allExpeditionTypes = ExpeditionsContent.get

    const sortedExpeditions = useMemo(() => {
        return [...allExpeditionTypes].sort((a, b) => {
            return a.requiredExpeditionCompletions - b.requiredExpeditionCompletions
        })
    }, [allExpeditionTypes])

    const filteredExpeditions = sortedExpeditions.filter((expeditionType) => {
        return !search || expeditionType.name.toLowerCase().includes(search.toLowerCase())
    })

    const totalPages = Math.ceil(filteredExpeditions.length / itemsPerPage)
    const displayedExpeditions = filteredExpeditions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Expeditions</h3>
                <Button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={!state.activeExpeditions || state.activeExpeditions.length === 0}
                    style={{ width: 'auto', fontSize: '16px', padding: '0px 6px', height: '24px' }}
                >
                    Unassign All
                </Button>
            </div>
            <Input
                placeholder="Search expeditions..."
                style={{ marginBottom: '8px', marginTop: '8px' }}
                radius={0}
                onChange={(e) => {
                    setCurrentPage(1)
                    setSearch(e.target.value)
                }}
            />
            <div style={{ flex: 1, overflow: 'hidden', minHeight: filteredExpeditions.length < 10 ? '454px' : '400px' }}>
                {displayedExpeditions.length > 0 ? (
                    displayedExpeditions.map((expeditionType) => {
                        const selectedTier = state.expeditionTierSelections?.[expeditionType.id] || 1
                        const difficultyRating = generateDifficultyRating(expeditionType.baseRating, selectedTier)
                        const isUnlocked = isExpeditionTypeUnlocked(expeditionType.id, state.expeditionCompletions)
                        const totalCompleted = getTotalCompletedExpeditions(state.expeditionCompletions)
                        const remaining = Math.max(0, expeditionType.requiredExpeditionCompletions - totalCompleted)

                        return (
                            <ExpeditionButton
                                key={expeditionType.id}
                                state={state}
                                dispatch={dispatch}
                                expeditionTypeId={expeditionType.id}
                                title={expeditionType.name}
                                difficultyRating={difficultyRating}
                                tier={selectedTier}
                                selected={expeditionType.id === selectedExpeditionTypeId}
                                onClick={onSelect}
                                isUnlocked={isUnlocked}
                                remainingExpeditions={remaining}
                            />
                        )
                    })
                ) : (
                    <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No expeditions available</div>
                )}
            </div>
            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
            <ConfirmModal
                opened={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={() => ExpeditionsActions.cancelAllExpeditions(dispatch)}
                text="This will cancel all active expeditions. No items or experience will be awarded. Are you sure?"
            />
        </div>
    )
}

export default ExpeditionBrowser

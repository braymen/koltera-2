import { Modal, Stack, Text, Group } from '@mantine/core'
import ItemsContent from '@data/items'
import Images from '@utils/images'
import { OfflineProgressResult, formatTime } from '@utils/offline-progress'

interface Props {
    opened: boolean
    onClose: () => void
    result: OfflineProgressResult | null
}

function OfflineProgressModal({ opened, onClose, result }: Props) {
    if (!result) {
        return null
    }

    return (
        <>
            {/* Backdrop overlay with blur */}
            {opened && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        zIndex: 100000000,
                        pointerEvents: 'none',
                    }}
                />
            )}
            <Modal
                opened={opened}
                onClose={onClose}
                title="Offline Progress"
                size="lg"
                zIndex={100000000}
                styles={{
                    header: {
                        backgroundColor: 'rgba(20,20,20,0)',
                        color: '#fff',
                    },
                    body: {
                        backgroundColor: 'rgba(20,20,20,1)',
                        color: '#fff',
                    },
                    content: {
                        backgroundColor: 'rgba(20,20,20,1)',
                        zIndex: 10000000001,
                    },
                    overlay: {
                        backgroundColor: 'transparent',
                        backdropFilter: 'none',
                    },
                }}
            >
                <Text style={{ fontSize: '20px', marginTop: '-24px' }} fw={500}>
                    Welcome back! You have <span style={{ color: 'cyan' }}>{formatTime(result.simulatedTimeSeconds)}</span> of
                    offline progress.
                </Text>

                {result.items.length > 0 && (
                    <Stack gap={4}>
                        {result.items.map((item) => {
                            const itemData = ItemsContent.getById(item.id)
                            if (!itemData) return
                            return (
                                <Group
                                    key={item.id}
                                    gap="sm"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.03)',
                                        padding: '1px 8px',
                                        borderRadius: '0px',
                                    }}
                                >
                                    <img
                                        className="pixel"
                                        src={Images.get(itemData.image)}
                                        alt={itemData.name}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <Text style={{ fontSize: '18px' }}>
                                        {item.amount}x {itemData.name}
                                    </Text>
                                </Group>
                            )
                        })}
                    </Stack>
                )}

                {result.items.length === 0 &&
                    result.workstationsCompleted === 0 &&
                    result.gatheringCyclesCompleted === 0 &&
                    result.helperCyclesCompleted === 0 &&
                    result.experienceEarned === 0 && (
                        <Text size="sm" c="dimmed">
                            No progress was made while you were away.
                        </Text>
                    )}
            </Modal>
        </>
    )
}

export default OfflineProgressModal

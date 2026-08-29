import { Modal, Stack, Text, Group } from '@mantine/core'
import { formatTime } from '@utils/offline-progress'
import Button from '@components/common/Button'
import Images from '@utils/images'

export interface EndScreenStats {
    onlinePlaytime: number
    offlinePlaytime: number
    totalPlaytime: number
}

interface Props {
    opened: boolean
    onClose: () => void
    stats: EndScreenStats | null
}

function EndScreenModal({ opened, onClose, stats }: Props) {
    if (!stats) return null

    return (
        <>
            {opened && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        zIndex: 100000001,
                        pointerEvents: 'none',
                    }}
                />
            )}
            <Modal
                opened={opened}
                onClose={onClose}
                size="md"
                zIndex={1000000002}
                closeOnClickOutside={false}
                closeOnEscape={false}
                withCloseButton={false}
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
                <Stack gap="lg">
                    <div>
                        <h2
                            style={{
                                fontSize: '28px',
                                marginTop: '-8px',
                                marginBottom: '8px',
                                color: '#ffd700',
                                textAlign: 'center',
                            }}
                        >
                            Koltera 2 has been COMPLETED!
                        </h2>
                        <center>
                            <img src={Images.get('creatures/farming/mushy.png')} style={{ width: '96px' }} />
                        </center>
                        <Text
                            style={{ fontSize: '17px', lineHeight: '1.5', color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}
                        >
                            Congratulations on finishing the main mission and putting in the hard work. Thank you for playing!{' '}
                            <br />- Braymen
                        </Text>
                    </div>
                    <div style={{ paddingTop: '0px' }}>
                        <Text
                            style={{
                                fontSize: '18px',
                                color: 'rgba(255,255,255,0.45)',
                                marginBottom: '0px',
                                textAlign: 'center',
                            }}
                        >
                            Final Times
                        </Text>
                        <Stack gap="6px">
                            {/* <Group justify="space-between">
                                <Text style={{ fontSize: '16px' }}>Creatures Summoned</Text>
                                <Text style={{ fontSize: '16px', fontWeight: 600, color: '#ffd700' }}>120 / 120</Text>
                            </Group> */}
                            <Group justify="space-between">
                                <Text style={{ fontSize: '16px' }}>Online Playtime</Text>
                                <Text style={{ fontSize: '16px', fontWeight: 500 }}>{formatTime(stats.onlinePlaytime)}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text style={{ fontSize: '16px' }}>Simulated Playtime</Text>
                                <Text style={{ fontSize: '16px', fontWeight: 500 }}>{formatTime(stats.offlinePlaytime)}</Text>
                            </Group>
                            <Group
                                justify="space-between"
                                style={{
                                    borderTop: '1px solid rgba(255,255,255,0.1)',
                                    paddingTop: '6px',
                                    marginTop: '2px',
                                }}
                            >
                                <Text style={{ fontSize: '16px' }}>Total Playtime</Text>
                                <Text style={{ fontSize: '16px' }}>{formatTime(stats.totalPlaytime)}</Text>
                            </Group>
                        </Stack>
                    </div>

                    <Group justify="flex-end" style={{ marginTop: '4px' }}>
                        <Button onClick={onClose}>Continue</Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    )
}

export default EndScreenModal

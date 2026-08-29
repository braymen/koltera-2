import { Modal, Stack, Text, Group, Switch } from '@mantine/core'
import { StateProps } from '@engine/types'
import { updateSettings } from '@modules/settings/functions'
import Sounds from '@utils/sounds'
import Music from '@utils/music'
import Button from '@components/common/Button'

interface Props {
    opened: boolean
    onClose: () => void
    state: StateProps['state']
    dispatch: StateProps['dispatch']
}

function FirstTimeLoadModal({ opened, onClose, state, dispatch }: Props) {
    const settings = state.settings

    const handleMusicToggle = (enabled: boolean) => {
        dispatch({
            action: updateSettings,
            payload: { settings: { enableMusic: enabled } },
        })
        if (enabled) {
            Music.play()
        } else {
            Music.pause()
        }
    }

    const handleSoundEffectsToggle = (enabled: boolean) => {
        dispatch({
            action: updateSettings,
            payload: { settings: { enableSoundEffects: enabled } },
        })
        if (enabled) {
            Sounds.play('click.wav')
        }
    }

    const handleOfflineProgressToggle = (enabled: boolean) => {
        dispatch({
            action: updateSettings,
            payload: { settings: { offlineProgress: enabled } },
        })
    }

    const handleConfirm = () => {
        dispatch({
            action: (currentState: any) => {
                currentState.firstTimeLoad = false
                return currentState
            },
            payload: {},
        })
        if (settings.enableMusic && !Music.getIsPlaying() && !Music.getIsManuallyPaused()) {
            Music.play()
        }
        onClose()
    }

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
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
                size="sm"
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
                        width: '400px',
                    },
                    overlay: {
                        backgroundColor: 'transparent',
                        backdropFilter: 'none',
                    },
                }}
            >
                <Stack gap="lg">
                    <h3 style={{ fontSize: '24px', marginTop: '-8px', lineHeight: '1.5' }}>Welcome to Koltera!</h3>
                    <Text style={{ fontSize: '18px', marginTop: '-24px', lineHeight: '1' }} fw={400}>
                        Before you begin, please configure your preferences. You can change these settings later in the settings
                        menu.
                    </Text>

                    <Stack gap="0">
                        <Group justify="space-between" style={{ padding: '4px 0' }}>
                            <Text style={{ fontSize: '16px' }} fw={500}>Music</Text>
                            <Switch checked={settings.enableMusic} onChange={(e) => handleMusicToggle(e.currentTarget.checked)} size="lg" />
                        </Group>

                        <Group justify="space-between" style={{ padding: '4px 0' }}>
                            <Text style={{ fontSize: '16px' }} fw={500}>Sound Effects</Text>
                            <Switch checked={settings.enableSoundEffects} onChange={(e) => handleSoundEffectsToggle(e.currentTarget.checked)} size="lg" />
                        </Group>

                        <Group justify="space-between" style={{ padding: '4px 0' }}>
                            <Text style={{ fontSize: '16px' }} fw={500}>Offline Progress</Text>
                            <Switch checked={settings.offlineProgress} onChange={(e) => handleOfflineProgressToggle(e.currentTarget.checked)} size="lg" />
                        </Group>
                    </Stack>

                    <Group justify="flex-end" style={{ marginTop: '16px' }}>
                        <Button onClick={handleConfirm}>Confirm</Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    )
}

export default FirstTimeLoadModal

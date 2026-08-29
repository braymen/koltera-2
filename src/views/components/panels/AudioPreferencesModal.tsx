import { Modal, Stack, Text, Group, Switch, Button } from '@mantine/core'
import { StateProps } from '@engine/types'
import { updateSettings } from '@modules/settings/functions'
import Sounds from '@utils/sounds'
import Music from '@utils/music'

interface Props {
    opened: boolean
    onClose: () => void
    state: StateProps['state']
    dispatch: StateProps['dispatch']
}

const switchStyles = (enabled: boolean) => ({
    track: {
        backgroundColor: enabled ? 'rgba(0, 200, 255, 0.3)' : 'rgba(100, 100, 100, 0.3)',
        borderColor: enabled ? 'rgba(0, 200, 255, 0.5)' : 'rgba(100, 100, 100, 0.5)',
    },
    thumb: {
        backgroundColor: enabled ? 'rgba(0, 200, 255, 1)' : 'rgba(150, 150, 150, 1)',
    },
})

function AudioPreferencesModal({ opened, onClose, state, dispatch }: Props) {
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

    const handleContinue = () => {
        Sounds.play('click.wav')
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
                        zIndex: 100000000,
                        pointerEvents: 'none',
                    }}
                />
            )}
            <Modal
                opened={opened}
                onClose={onClose}
                title="Audio Preferences"
                size="sm"
                zIndex={100000000}
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
                        width: '00px', // TODO: likely a typo — should this be a real width or removed?
                    },
                    overlay: {
                        backgroundColor: 'transparent',
                        backdropFilter: 'none',
                    },
                }}
            >
                <Stack gap="lg">
                    <Text style={{ fontSize: '18px', marginTop: '-16px', lineHeight: '1' }} fw={400}>
                        Welcome to Koltera! Would you like to enable music and sound effects? <br />
                        <br />
                        You can change these settings later in the settings menu.
                    </Text>

                    <Group justify="space-between" style={{ padding: '12px 0' }}>
                        <Group gap="md">
                            <Text style={{ fontSize: '16px' }} fw={500}>Music</Text>
                            <Switch
                                checked={settings.enableMusic}
                                onChange={(e) => handleMusicToggle(e.currentTarget.checked)}
                                size="lg"
                                styles={switchStyles(settings.enableMusic)}
                            />
                        </Group>
                        <Group gap="md">
                            <Text style={{ fontSize: '16px' }} fw={500}>Sound Effects</Text>
                            <Switch
                                checked={settings.enableSoundEffects}
                                onChange={(e) => handleSoundEffectsToggle(e.currentTarget.checked)}
                                size="lg"
                                styles={switchStyles(settings.enableSoundEffects)}
                            />
                        </Group>
                    </Group>

                    <Group justify="flex-end" style={{ marginTop: '16px' }}>
                        <Button
                            onClick={handleContinue}
                            style={{
                                backgroundColor: 'rgba(0, 200, 255, 0.2)',
                                border: '1px solid rgba(0, 200, 255, 0.5)',
                                color: '#fff',
                                padding: '8px 24px',
                                fontSize: '16px',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(0, 200, 255, 0.3)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(0, 200, 255, 0.2)'
                            }}
                        >
                            Continue
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    )
}

export default AudioPreferencesModal

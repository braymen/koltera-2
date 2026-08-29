import { useState, useMemo, useEffect } from 'react'
import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import Button from '@components/common/Button'
import { Group, Stack, Text, Slider, Switch, Select } from '@mantine/core'
import { updateSettings, resetSettings } from '@modules/settings/functions'
import { DEFAULT_SETTINGS } from '@engine/settings'
import Sounds from '@utils/sounds'
import Music from '@utils/music'
import { FLAT_NAVIGATION_MAP } from '@utils/navigation'

type TabType = 'audio' | 'interface' | 'gameplay'

const TABS: { id: TabType; label: string }[] = [
    { id: 'audio', label: 'Audio Settings' },
    { id: 'interface', label: 'Interface Settings' },
    { id: 'gameplay', label: 'Gameplay Settings' },
]

function VolumeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div>
            <Group justify="space-between" mb="0">
                <Text size="lg">{label}</Text>
                <Text size="lg" fw={500}>
                    {value}%
                </Text>
            </Group>
            <Slider value={value} onChange={onChange} min={0} max={100} step={1} />
        </div>
    )
}

function Settings({ state, dispatch }: StateProps) {
    const [activeTab, setActiveTab] = useState<TabType>('audio')
    const [resetConfirm, setResetConfirm] = useState(false)
    const settings = state.settings || DEFAULT_SETTINGS

    const navigationTabsToDisable = useMemo(
        () =>
            FLAT_NAVIGATION_MAP.filter((tab) => tab.id !== 'Settings')
                .map((tab) => tab.id)
                .sort((a, b) => a.localeCompare(b)),
        []
    )

    const handleUpdate = (updates: Partial<typeof settings>) => {
        dispatch({
            action: updateSettings,
            payload: { settings: updates },
        })
    }

    const handleReset = () => {
        if (!resetConfirm) {
            setResetConfirm(true)
            setTimeout(() => setResetConfirm(false), 3000)
            return
        }
        dispatch({
            action: resetSettings,
            payload: {},
        })
        setResetConfirm(false)
    }

    // Keep settings in sync when fullscreen changes via F11 or OS gesture
    useEffect(() => {
        if (window.api?.onFullscreenChange) {
            window.api.onFullscreenChange((fullscreen: boolean) => {
                handleUpdate({ fullscreen })
            })
        }
        return () => {
            if (window.api?.removeFullscreenChangeListener) {
                window.api.removeFullscreenChangeListener()
            }
        }
    }, [])

    const toggleNavigationTab = (tabId: string) => {
        const disabledTabs = settings.disabledNavigationTabs || []
        const newDisabledTabs = disabledTabs.includes(tabId)
            ? disabledTabs.filter((id) => id !== tabId)
            : [...disabledTabs, tabId]
        handleUpdate({ disabledNavigationTabs: newDisabledTabs })
    }

    const tabStyle = (id: TabType) => ({
        backgroundColor: activeTab === id ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,.4)',
        border: activeTab === id ? '1px solid rgba(255,255,255,.4)' : '1px solid rgba(255,255,255,.25)',
        padding: '8px 16px',
        cursor: 'pointer',
    })

    return (
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '1200px' }}>
            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '4px', margin: '4px' }}>
                {TABS.map(({ id, label }) => (
                    <div
                        key={id}
                        onClick={() => {
                            Sounds.play('click.wav')
                            setActiveTab(id)
                        }}
                        style={tabStyle(id)}
                    >
                        <h3 style={{ fontSize: '20px', fontWeight: '400', margin: 0 }}>{label}</h3>
                    </div>
                ))}
                <div
                    onClick={() => {
                        Sounds.play('click.wav')
                        handleReset()
                    }}
                    style={{
                        backgroundColor: resetConfirm ? 'rgba(163, 70, 70, 0.6)' : 'rgba(0,0,0,.4)',
                        border: resetConfirm ? '1px solid rgba(191, 92, 92, 0.8)' : '1px solid rgba(255,255,255,.25)',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        marginLeft: 'auto',
                    }}
                >
                    <h3 style={{ fontSize: '20px', fontWeight: '400', margin: 0 }}>
                        {resetConfirm ? 'Click Again to Reset All' : 'Restore to Defaults'}
                    </h3>
                </div>
            </div>

            {/* Audio Settings Tab */}
            {activeTab === 'audio' && (
                <Panel style={{ minHeight: '590px' }}>
                    <Stack gap="md">
                        <h2 style={{ marginTop: 0 }}>Audio Settings</h2>
                        <VolumeSlider
                            label="Master Volume"
                            value={settings.masterVolume}
                            onChange={(value) => handleUpdate({ masterVolume: value })}
                        />
                        <VolumeSlider
                            label="Music Volume"
                            value={settings.musicVolume}
                            onChange={(value) => handleUpdate({ musicVolume: value })}
                        />
                        <VolumeSlider
                            label="SFX Volume"
                            value={settings.soundEffectsVolume}
                            onChange={(value) => handleUpdate({ soundEffectsVolume: value })}
                        />
                        <Group>
                            <Switch
                                label="Mute SFX"
                                size="lg"
                                checked={!settings.enableSoundEffects}
                                onChange={(event) => handleUpdate({ enableSoundEffects: !event.currentTarget.checked })}
                            />
                            <Switch
                                label="Mute Notification Pop Sounds"
                                size="lg"
                                checked={!settings.enableNotificationSounds}
                                disabled={!settings.enableSoundEffects}
                                onChange={(event) => handleUpdate({ enableNotificationSounds: !event.currentTarget.checked })}
                            />
                        </Group>
                        <Switch
                            label="Mute Music"
                            size="lg"
                            checked={!settings.enableMusic}
                            onChange={(event) => handleUpdate({ enableMusic: !event.currentTarget.checked })}
                        />
                        <Switch
                            label="Mute Sound When Unfocused"
                            size="lg"
                            checked={settings.muteWhenUnfocused ?? false}
                            onChange={(event) => handleUpdate({ muteWhenUnfocused: event.currentTarget.checked })}
                        />
                        <div>
                            <Button
                                onClick={Music.skip}
                                style={{ backgroundColor: '#474747', borderColor: '#666666', maxWidth: '200px' }}
                            >
                                Skip Song
                            </Button>
                        </div>
                    </Stack>
                </Panel>
            )}

            {/* Interface Settings Tab */}
            {activeTab === 'interface' && (
                <Panel style={{ minHeight: '590px' }}>
                    <Stack gap="md">
                        <h2 style={{ marginTop: 0 }}>Interface Settings</h2>
                        <Switch
                            label="Fullscreen"
                            size="lg"
                            checked={settings.fullscreen ?? false}
                            onChange={(event) => {
                                const value = event.currentTarget.checked
                                handleUpdate({ fullscreen: value })
                                if (window.api?.setFullscreen) {
                                    window.api.setFullscreen(value)
                                }
                            }}
                        />
                        <Switch
                            label="Disable CRT Effect"
                            size="lg"
                            checked={!settings.crtEffect}
                            onChange={(event) => handleUpdate({ crtEffect: !event.currentTarget.checked })}
                        />
                        <Switch
                            label="Disable Item Gain Notifications"
                            size="lg"
                            checked={!settings.enableItemGainNotifications}
                            onChange={(event) => handleUpdate({ enableItemGainNotifications: !event.currentTarget.checked })}
                        />
                        <Switch
                            label="Disable 'Can Summon' Navigation Notification"
                            size="lg"
                            checked={!(settings.showCanSummonBadge ?? true)}
                            onChange={(event) => handleUpdate({ showCanSummonBadge: !event.currentTarget.checked })}
                        />
                        <Switch
                            label="Disable Awaken Creature Animation"
                            size="lg"
                            checked={settings.disableAwakenCreatureAnimation ?? false}
                            onChange={(event) => handleUpdate({ disableAwakenCreatureAnimation: event.currentTarget.checked })}
                        />
                        <Switch
                            label="EXPERIMENTAL: Alien Mode"
                            size="lg"
                            checked={settings.oldSchoolMode}
                            onChange={(event) => handleUpdate({ oldSchoolMode: event.currentTarget.checked })}
                        />
                        <Switch
                            label="EXPERIMENTAL: Auto-Scale Interface (automatically adjust scale based on window width)"
                            size="lg"
                            checked={settings.autoScaleEnabled ?? true}
                            onChange={(event) => handleUpdate({ autoScaleEnabled: event.currentTarget.checked })}
                        />
                        <div style={{ marginBottom: '16px' }}>
                            <Group justify="space-between" mb="0">
                                <Text size="lg">EXPERIMENTAL: Interface Scale</Text>
                                <Text size="lg" fw={500}>
                                    {Math.round((settings.zoomFactor || 1.0) * 100)}%
                                </Text>
                            </Group>
                            <Slider
                                value={settings.zoomFactor || 1.0}
                                onChange={(value) => {
                                    handleUpdate({ zoomFactor: value })
                                    if (window.api?.setZoomFactor) {
                                        window.api.setZoomFactor(value)
                                    }
                                }}
                                min={1}
                                max={2.0}
                                step={0.2}
                                disabled={settings.autoScaleEnabled ?? true}
                                marks={[
                                    { value: 1.0, label: '100%' },
                                    { value: 1.2, label: '120%' },
                                    { value: 1.4, label: '140%' },
                                    { value: 1.6, label: '160%' },
                                    { value: 1.8, label: '180%' },
                                    { value: 2.0, label: '200%' },
                                ]}
                            />
                        </div>
                        <div>
                            <Text size="lg" mb="0" fw={500}>
                                EXPERIMENTAL: Font
                            </Text>
                            <Select
                                size="lg"
                                value={settings.selectedFont || 'GameFont'}
                                onChange={(value) => {
                                    if (value) handleUpdate({ selectedFont: value })
                                }}
                                data={[
                                    { value: 'GameFont', label: 'Game Font (Default)' },
                                    { value: 'VT323', label: 'VT323' },
                                    { value: 'RedAlertINET', label: 'C&C Red Alert [INET]' },
                                    { value: 'AtkinsonHyperlegible', label: 'Atkinson Hyperlegible' },
                                    { value: 'AncientEgyptianHieroglyphs', label: 'Ancient Egyptian Hieroglyphs' },
                                    { value: 'Bitty', label: 'Bitty' },
                                    { value: 'Times New Roman', label: 'Times New Roman' },
                                    { value: 'Comic Sans MS', label: 'Comic Sans MS' },
                                ]}
                            />
                        </div>
                    </Stack>
                </Panel>
            )}

            {/* Gameplay Settings Tab */}
            {activeTab === 'gameplay' && (
                <Panel style={{ minHeight: '590px' }}>
                    <Stack gap="md">
                        <h2 style={{ marginTop: 0 }}>Gameplay Settings</h2>
                        <Group>
                            <Switch
                                label="Disable Offline Progress"
                                size="lg"
                                checked={!settings.offlineProgress}
                                onChange={(event) => handleUpdate({ offlineProgress: !event.currentTarget.checked })}
                            />
<Switch
                                label="Creature Progress Bars towards Level Cap"
                                size="lg"
                                checked={settings.creatureProgressTowardsCap ?? false}
                                onChange={(event) => handleUpdate({ creatureProgressTowardsCap: event.currentTarget.checked })}
                            />
                            <Switch
                                label="Disable Confirm Awaken Tree Upgrade"
                                size="lg"
                                checked={settings.disableConfirmAwakenTreeUpgrade ?? false}
                                onChange={(event) => handleUpdate({ disableConfirmAwakenTreeUpgrade: event.currentTarget.checked })}
                            />
                        </Group>
                        <div>
                            <Text size="lg" mb="xs" fw={500}>
                                Disable Navigation Tabs
                            </Text>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gridTemplateRows: `repeat(${Math.ceil(navigationTabsToDisable.length / 3)}, auto)`,
                                    gridAutoFlow: 'column',
                                    gap: '8px',
                                }}
                            >
                                {navigationTabsToDisable.map((tabId) => (
                                    <Switch
                                        key={tabId}
                                        label={tabId}
                                        size="lg"
                                        checked={(settings.disabledNavigationTabs || []).includes(tabId)}
                                        onChange={() => toggleNavigationTab(tabId)}
                                    />
                                ))}
                            </div>
                        </div>
                    </Stack>
                </Panel>
            )}
        </div>
    )
}

export default Settings

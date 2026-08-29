import { ChangeEvent, useRef } from 'react'
import cloneDeep from 'lodash.clonedeep'
import Button from '@components/common/Button'
import Panel from '@components/common/Panel'
import { State, StateProps } from '@engine/types'
import { DEFAULT_SAVE, patch, version } from '@engine/saves'

const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

const createExportFilename = () => {
    const now = new Date()
    const pad = (value: number) => value.toString().padStart(2, '0')
    const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
    const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    return `koltera-save-${date}-${time}.json`
}

function SaveManagement({ state, dispatch }: StateProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleExportClick = async () => {
        try {
            const encrypted = await window.api.encrypt(JSON.stringify(state))
            const blob = new Blob([encrypted], { type: 'application/octet-stream' })
            triggerDownload(blob, createExportFilename())
        } catch (err) {
            console.error(err)
        }
    }

    const applyImportedState = (nextState: State) => {
        dispatch({
            action: () => nextState,
            payload: {},
        })
        try {
            window.api.save(nextState)
        } catch (err) {
            console.error(err)

            return
        }
    }

    const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) {
            return
        }

        try {
            if (!window.confirm('Importing a save will overwrite your current progress. Continue?')) {
                return
            }

            const text = await file.text()
            let jsonString: string
            // Check if the file is encrypted or plain JSON (backward compatibility)
            if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                jsonString = text
            } else {
                jsonString = await window.api.decrypt(text)
            }
            const parsed = JSON.parse(jsonString)
            const versioned = version(parsed as State)
            const patchedState = patch(versioned as unknown as object, cloneDeep(DEFAULT_SAVE) as unknown as object) as State
            patchedState.lastSaveTime = Date.now() / 1000

            applyImportedState(patchedState)
        } catch (err) {
            console.error(err)
        }
    }

    const handleOpenBackups = async () => {
        if (!window.api?.openBackups) {
            return
        }

        try {
            const result = await window.api.openBackups()
            if (typeof result === 'string' && result.length > 0) {
                throw new Error(result)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleResetClick = () => {
        if (!window.confirm('Are you sure you want to reset your save? This will erase your current progress.')) {
            return
        }

        const resetState = cloneDeep(DEFAULT_SAVE)
        resetState.lastSaveTime = Date.now() / 1000

        applyImportedState(resetState as State)

        setTimeout(() => {
            window.location.reload()
        }, 500)
    }

    return (
        <div style={{ maxWidth: '960px' }}>
            <Panel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <h2 style={{ margin: '0 0 8px 0' }}>Save Management</h2>
                        <p style={{ margin: 0 }}>
                            Export your current save, import another one, or reset it. The backups folder may also be helpful if
                            you need to rollback.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        <Button onClick={handleExportClick}>Export Save</Button>
                        <Button onClick={() => fileInputRef.current?.click()}>Import Save</Button>
                        <Button onClick={handleResetClick} style={{ backgroundColor: 'rgba(192, 57, 43, 0.65)', color: '#fff' }}>
                            Reset Save
                        </Button>
                        <Button onClick={handleOpenBackups}>Open Backups Folder</Button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/json,.json,application/octet-stream"
                        style={{ display: 'none' }}
                        onChange={handleImportChange}
                    />
                </div>
            </Panel>
        </div>
    )
}

export default SaveManagement

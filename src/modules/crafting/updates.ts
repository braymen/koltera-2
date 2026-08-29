import * as Functions from './functions'
import { Update } from '@engine/types'
import { Skills } from '@modules/skilling/types'
import { NAVIGATION_MAP } from '@utils/navigation'

const workstationTabs = NAVIGATION_MAP.find((section) => section.section === 'Workstations')?.tabs ?? []

export const onUpdate = (state: any, { deltaTime }: Update) => {
    const tabs = workstationTabs
    if (!tabs.length) return state

    for (const tab of tabs) {
        const workstationKey = tab.id.toLowerCase().replace(' ', '') as keyof typeof state
        if (!state[workstationKey] || typeof state[workstationKey] !== 'object' || !('isActive' in state[workstationKey])) {
            continue
        }
        state = Functions.updateCrafting(state, {
            deltaTime,
            workstation: tab.id as Skills,
        })
    }

    return state
}

export const onFixedUpdate = (state: any, { deltaTime }: Update) => {
    return state
}

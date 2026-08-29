import GatheringLayout from '@components/layouts/GatheringLayout'
import { StateProps } from '@engine/types'
import { Skills } from '@modules/skilling/types'

export function makeGatheringPage(skill: Skills) {
    return function GatheringPage({ state, dispatch }: StateProps) {
        return <GatheringLayout state={state} dispatch={dispatch} skill={skill} />
    }
}

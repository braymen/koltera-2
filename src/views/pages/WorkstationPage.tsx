import WorkstationLayout from '@components/layouts/WorkstationLayout'
import { StateProps } from '@engine/types'
import { Skills } from '@modules/skilling/types'
import CraftingActions from '@modules/crafting/dispatch'

export function makeWorkstationPage(workstationType: Skills) {
    return function WorkstationPage({ state, dispatch }: StateProps) {
        return (
            <WorkstationLayout
                state={state}
                dispatch={dispatch}
                workstationType={workstationType}
                onCraft={(amount, recipeId, ingredientId) => {
                    CraftingActions.startCrafting(dispatch, {
                        amount: amount,
                        itemId: recipeId,
                        workstation: workstationType,
                        ingredientId: ingredientId,
                    })
                }}
            />
        )
    }
}

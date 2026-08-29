import RecipeInfoPanel from '@components/panels/RecipeInfoPanel'
import RecipeBrowserPanel from '@components/panels/RecipeBrowserPanel'
import QueuePanel from '@components/panels/QueuePanel'
import SkillLevelPanel from '@components/panels/SkillLevelPanel'
import { StateProps } from '@engine/types'
import { getAvailableRecipes, getCrafterDetails } from '@modules/crafting/helpers'
import { Skills } from '@modules/skilling/types'
import { useMemo, useState } from 'react'

interface Props extends StateProps {
    workstationType: Skills
    onCraft: (amount: number, recipeId: string, ingredientId?: string) => void
}

function Workstation({ state, dispatch, workstationType, onCraft }: Props) {
    const crafterDetails = getCrafterDetails(state, workstationType)
    const firstRecipeId = useMemo(() => {
        const recipes = getAvailableRecipes(workstationType)
            .sort((a, b) => a.recipe.levelRequirement - b.recipe.levelRequirement)
        return recipes.length > 0 ? recipes[0].id : null
    }, [workstationType])
    const [selectedRecipe, setSelectedRecipe] = useState<string | null>(firstRecipeId)

    return (
        <>
            <SkillLevelPanel state={state} dispatch={dispatch} skill={workstationType} />
            <div style={{ display: 'flex', marginTop: '4px' }}>
                <div style={{ flex: '1', minWidth: '400px' }}>
                    <RecipeBrowserPanel
                        state={state}
                        dispatch={dispatch}
                        selectedRecipe={selectedRecipe}
                        setSelectedRecipe={setSelectedRecipe}
                        crafterSkillName={workstationType}
                        crafterLevel={crafterDetails.level}
                    />
                </div>
                <div style={{ flex: '1', minWidth: '280px' }}>
                    <RecipeInfoPanel
                        state={state}
                        dispatch={dispatch}
                        selectedRecipe={selectedRecipe}
                        workstation={workstationType}
                        craftingLevel={crafterDetails.level}
                        crafterState={crafterDetails.state}
                        onCraft={onCraft}
                    />
                </div>
                <div style={{ flex: '1', minWidth: '250px' }}>
                    <QueuePanel dispatch={dispatch} workstationType={workstationType} crafterState={crafterDetails.state} />
                </div>
            </div>
        </>
    )
}

export default Workstation

import { State } from '@engine/types'
import SkillingHelpers from '@modules/skilling/helpers'
import { CrafterState } from './types'
import ItemsContent from '@data/items'

export const getCrafterDetails = (state: State, crafterSkillName: string) => {
    const skillData = state.skills.find((skill) => skill.id === crafterSkillName)
    const crafterDetails = {
        state: state[crafterSkillName.toLowerCase().replace(' ', '') as keyof State] as CrafterState,
        level: SkillingHelpers.getLevel(skillData?.xp || 0),
    }
    return crafterDetails
}

export const getAvailableRecipes = (skill: string) => {
    // Find all the items that can be crafted with the given skill
    const availableItems = ItemsContent.get.filter((item) => item.recipes.some((recipe) => recipe.workstation === skill))

    // Format the available items into a list of recipes
    const availableRecipes = availableItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        image: item.image,
        recipe: item.recipes.filter((recipe) => recipe.workstation === skill)[0],
    }))
    return availableRecipes
}

export const getSelectedRecipe = (itemId: string, workstation: string, ingredientId?: string) => {
    const item = ItemsContent.getById(itemId)
    if (!item) return null

    const recipes = item.recipes.filter((recipe) => recipe.workstation === workstation)
    if (recipes.length === 0) return null

    // If ingredientId is provided, find the specific recipe
    if (ingredientId) {
        const specificRecipe = recipes.find((r) => r.ingredients.some((ing) => ing.id === ingredientId))
        if (specificRecipe) {
            return {
                id: item.id,
                name: item.name,
                description: item.description,
                image: item.image,
                recipe: specificRecipe,
            }
        }
    }

    // Otherwise return the first recipe (for backward compatibility)
    return {
        id: item.id,
        name: item.name,
        description: item.description,
        image: item.image,
        recipe: recipes[0],
    }
}

export const getAllRecipesForItem = (itemId: string, workstation: string) => {
    const item = ItemsContent.getById(itemId)
    if (!item) return []

    return item.recipes.filter((recipe) => recipe.workstation === workstation)
}

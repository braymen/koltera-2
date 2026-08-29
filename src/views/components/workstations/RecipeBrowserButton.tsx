import { StateProps } from '@engine/types'
import { Item, ItemRecipe } from '@modules/inventory/types'
import { getAllRecipesForItem } from '@modules/crafting/helpers'
import Images from '@utils/images'
import Sounds from '@utils/sounds'

export interface Props extends StateProps {
    item: Item
    recipe: ItemRecipe
    workstation: string
    isSelected: boolean
    crafterLevel: number
    onClick: (recipeId: string) => void
}

function RecipeBrowserButton({ state, item, recipe, workstation, isSelected, crafterLevel, onClick }: Props) {
    const clicked = () => {
        Sounds.play('click.wav')
        onClick(item.id)
    }

    const canCraft = crafterLevel >= recipe.levelRequirement
    const allRecipes = getAllRecipesForItem(item.id, workstation)
    const hasIngredients = allRecipes.some((r) =>
        r.ingredients.every((ingredient) => {
            const inventoryItem = state.inventory.find((i) => i.id === ingredient.id)
            return inventoryItem && inventoryItem.amount >= ingredient.amount
        })
    )

    return (
        <div
            onClick={canCraft ? clicked : undefined}
            className={canCraft ? 'skill-focus-btn' : 'skill-focus-btn-disabled'}
            style={{
                padding: '4px 2px',
                display: 'flex',
                alignItems: 'center',
                opacity: canCraft ? 1 : 0.5,
                cursor: canCraft ? 'pointer' : 'not-allowed',
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                borderLeft: isSelected ? '3px solid rgba(255, 255, 255, 0.5)' : '3px solid transparent',
            }}
        >
            <img
                className="pixel"
                src={Images.get(item.image)}
                alt="Recipe Icon"
                style={{
                    width: '28px',
                    height: '28px',
                    marginRight: '8px',
                    marginLeft: '4px',
                    filter: canCraft ? 'none' : 'brightness(0)',
                }}
            />
            <div style={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
                <h3
                    style={{
                        fontSize: '18px',
                        fontWeight: '400',
                        margin: '0',
                        lineHeight: '1.2',
                        marginBottom: '-4px',
                    }}
                >
                    {canCraft ? item.name : '???'}
                </h3>
                {/* <p
                    style={{
                        fontSize: '18px',
                        margin: '0',
                        color: 'rgba(255,255,255,0.7)',
                        lineHeight: '1.2',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                    }}
                >
                    {canCraft ? item.description : 'Unlocks at Level ' + recipe.levelRequirement}
                </p> */}
            </div>
            <div
                style={{
                    paddingRight: '8px',
                    fontSize: '16px',
                    fontWeight: '400',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    minWidth: '120px',
                }}
            >
                <span
                    style={{
                        fontSize: '18px',
                        fontWeight: '400',
                        textAlign: 'right',
                        color: !hasIngredients ? '#ef5350' : '#66bb6a',
                    }}
                >
                    {!canCraft ? '' : !hasIngredients ? 'Missing Items' : 'Can Craft'}
                </span>
            </div>
        </div>
    )
}

export default RecipeBrowserButton

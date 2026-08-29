import Pagination from '@components/common/Pagination'
import Panel from '@components/common/Panel'
import RecipeBrowserButton from '@components/workstations/RecipeBrowserButton'
import { StateProps } from '@engine/types'
import { Input } from '@mantine/core'
import { useState } from 'react'
import ItemsContent from '@data/items'
import { getAvailableRecipes } from '@modules/crafting/helpers'

interface Props extends StateProps {
    selectedRecipe: string | null
    setSelectedRecipe: (recipeId: string) => void
    crafterSkillName: string
    crafterLevel: number
}

function RecipeBrowserPanel({ state, dispatch, selectedRecipe, setSelectedRecipe, crafterSkillName, crafterLevel }: Props) {
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const recipesPerPage = 12

    const availableRecipes = getAvailableRecipes(crafterSkillName)
        .filter(
            (item) =>
                searchTerm === '' ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.recipe.levelRequirement - b.recipe.levelRequirement)

    const totalPages = Math.ceil(availableRecipes.length / recipesPerPage)
    const displayedRecipes = availableRecipes.slice((currentPage - 1) * recipesPerPage, currentPage * recipesPerPage)

    return (
        <Panel style={{ minHeight: '578px', display: 'flex', flexDirection: 'column' }}>
            <h3>Recipe Browser</h3>
            <Input
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                }}
                radius={0}
                style={{ marginBottom: '12px', marginTop: '8px' }}
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {displayedRecipes.length > 0 ? (
                    displayedRecipes.map((item) => (
                        <RecipeBrowserButton
                            key={item.id}
                            state={state}
                            dispatch={dispatch}
                            item={ItemsContent.getById(item.id)}
                            recipe={item.recipe}
                            workstation={crafterSkillName}
                            isSelected={selectedRecipe === item.id}
                            crafterLevel={crafterLevel}
                            onClick={setSelectedRecipe}
                        />
                    ))
                ) : (
                    <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No recipes found...</div>
                )}
            </div>

            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
        </Panel>
    )
}

export default RecipeBrowserPanel

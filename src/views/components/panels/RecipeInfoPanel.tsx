import Button from '@components/common/Button'
import Panel from '@components/common/Panel'
import Tooltip from '@components/common/Tooltip'
import ItemsContent from '@data/items'
import SkillContent from '@data/skills'
import { StateProps } from '@engine/types'
import { Group, Input, Select, Slider, Stack, Text } from '@mantine/core'
import { getSelectedRecipe, getAllRecipesForItem } from '@modules/crafting/helpers'
import { CrafterState } from '@modules/crafting/types'
import Navigation from '@modules/navigation/dispatch'
import Skilling from '@modules/skilling/dispatch'
import SkillingHelpers from '@modules/skilling/helpers'
import Images from '@utils/images'
import { ChangeEvent, useEffect, useState } from 'react'
import * as UpgradeHelpers from '@modules/upgrades/helpers'
import BonusHelpers from '@modules/bonuses/helpers'
import Numbers from '@utils/numbers'

interface Props extends StateProps {
    selectedRecipe: string | null
    workstation: string
    craftingLevel: number
    crafterState: CrafterState
    onCraft: (amount: number, recipeId: string, ingredientId?: string) => void
}

const formatFriendlyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
}

const getPlayerIngredientInfo = (inventory: { id: string; amount: number }[], ingredientId: string, requiredAmount: number) => {
    const itemData = ItemsContent.getById(ingredientId)
    const inventoryItem = inventory.find((item) => item.id === ingredientId)
    return {
        itemData,
        inventoryAmount: inventoryItem?.amount || 0,
        hasEnough: inventoryItem && inventoryItem.amount >= requiredAmount,
    }
}

const getGatheringSource = (itemId: string): { skillId: string; activityId: string; levelRequirement: number } | null => {
    const item = ItemsContent.getById(itemId)
    if (!item || item.type !== 'Gathered') return null

    let best: { skillId: string; activityId: string; duration: number; levelRequirement: number } | null = null
    for (const skill of SkillContent.get) {
        if (skill.type !== 'skilling' || !skill.activities) continue
        for (const activity of skill.activities) {
            if (activity.output.some((o) => o.id === itemId)) {
                if (!best || activity.duration < best.duration) {
                    best = {
                        skillId: skill.id,
                        activityId: activity.id,
                        duration: activity.duration,
                        levelRequirement: activity.levelRequirement,
                    }
                }
            }
        }
    }
    return best ? { skillId: best.skillId, activityId: best.activityId, levelRequirement: best.levelRequirement } : null
}

const getRecipeUniqueId = (recipe: { ingredients: { id: string }[] }, index: number) =>
    recipe.ingredients.length > 1 ? recipe.ingredients[1].id : `${recipe.ingredients[0].id}-${index}`

function RecipeInfoPanel({ state, dispatch, selectedRecipe, workstation, craftingLevel, crafterState, onCraft }: Props) {
    const [amount, setAmount] = useState<number>(1)
    const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null)

    const allRecipes = selectedRecipe ? getAllRecipesForItem(selectedRecipe, workstation) : []
    const hasMultipleRecipes = allRecipes.length > 1

    // Get selected recipe data
    let selectedRecipeData = selectedRecipe
        ? getSelectedRecipe(selectedRecipe, workstation, selectedIngredientId || undefined)
        : null

    if (selectedRecipe && hasMultipleRecipes && selectedIngredientId) {
        const recipeIndex = allRecipes.findIndex((recipe, index) => getRecipeUniqueId(recipe, index) === selectedIngredientId)
        if (recipeIndex >= 0) {
            const recipe = allRecipes[recipeIndex]
            const item = ItemsContent.getById(selectedRecipe)
            if (item) {
                selectedRecipeData = { id: item.id, name: item.name, description: item.description, image: item.image, recipe }
            }
        }
    }

    // Initialize selected ingredient when recipe changes
    useEffect(() => {
        if (selectedRecipe && hasMultipleRecipes) {
            const availableRecipe = allRecipes.find((recipe) =>
                recipe.ingredients.every((ing) => {
                    const inventoryItem = state.inventory.find((item) => item.id === ing.id)
                    return inventoryItem && inventoryItem.amount >= ing.amount
                })
            )
            if (availableRecipe) {
                const recipeIndex = allRecipes.indexOf(availableRecipe)
                setSelectedIngredientId(getRecipeUniqueId(availableRecipe, recipeIndex))
            } else if (allRecipes.length > 0) {
                setSelectedIngredientId(getRecipeUniqueId(allRecipes[0], 0))
            }
        } else {
            setSelectedIngredientId(null)
        }
    }, [selectedRecipe, workstation]) // eslint-disable-line react-hooks/exhaustive-deps

    const canCraft = selectedRecipeData && craftingLevel >= selectedRecipeData.recipe.levelRequirement

    // Calculate max craftable amount
    let maxAmount = 0
    if (selectedRecipeData) {
        if (selectedRecipeData.recipe.ingredients.length === 0) {
            maxAmount = Number.MAX_SAFE_INTEGER
        } else {
            maxAmount = Math.min(
                ...selectedRecipeData.recipe.ingredients.map((ingredient) => {
                    const inventoryItem = state.inventory.find((item) => item.id === ingredient.id)
                    return Math.floor((inventoryItem?.amount || 0) / ingredient.amount)
                })
            )
        }
    }

    // Check if player has required ingredients
    const hasIngredients = selectedRecipeData
        ? selectedRecipeData.recipe.ingredients.every((ingredient) => {
              const inventoryItem = state.inventory.find((item) => item.id === ingredient.id)
              return inventoryItem && inventoryItem.amount >= ingredient.amount * amount
          })
        : false

    // Reset amount when recipe changes or when it exceeds max
    useEffect(() => {
        if (amount > maxAmount && maxAmount > 0) {
            setAmount(maxAmount)
        } else if (maxAmount === 0) {
            setAmount(1)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRecipe, maxAmount])

    const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10)
        if (Number.isNaN(value)) {
            setAmount(1)
            return
        }
        setAmount(Math.min(Math.max(value, 1), maxAmount))
    }

    const handleStartCrafting = () => {
        if (!selectedRecipe || !canCraft || !hasIngredients) return

        let ingredientId: string | undefined
        if (hasMultipleRecipes && selectedIngredientId) {
            const recipeIndex = allRecipes.findIndex((recipe, index) => getRecipeUniqueId(recipe, index) === selectedIngredientId)
            if (recipeIndex >= 0) {
                const recipe = allRecipes[recipeIndex]
                ingredientId = recipe.ingredients.length > 1 ? recipe.ingredients[1].id : recipe.ingredients[0].id
            }
        }
        onCraft(amount, selectedRecipe, ingredientId)
    }

    // Pre-compute upgrade bonuses
    const recoveryChance = UpgradeHelpers.getWorkstationRecoveryChance(state.purchasedUpgrades, workstation as any)
    const xpBreakdown = BonusHelpers.getWorkstationXpBonus(state, workstation)
    const durationBreakdown = BonusHelpers.getWorkstationDurationReduction(state, workstation)

    const totalOutputAmount = selectedRecipeData ? selectedRecipeData.recipe.outputAmount * amount : 0
    const speedMultiplier = durationBreakdown.multiplier
    const singleCraftTime = selectedRecipeData ? selectedRecipeData.recipe.craftTime * speedMultiplier : 0
    const totalCraftTime = singleCraftTime * amount
    const baseExperience = selectedRecipeData ? selectedRecipeData.recipe.experience * amount : 0
    const totalExperience = Math.round(baseExperience * xpBreakdown.multiplier * 100) / 100
    const xpPerSecond = totalCraftTime > 0 ? totalExperience / totalCraftTime : 0

    // Left section icon for the recipe variant select
    let leftSectionIcon: JSX.Element | null = null
    if (selectedIngredientId) {
        const recipeIndex = allRecipes.findIndex((recipe, index) => getRecipeUniqueId(recipe, index) === selectedIngredientId)
        if (recipeIndex >= 0) {
            const recipe = allRecipes[recipeIndex]
            const displayIngredientId = recipe.ingredients.length > 1 ? recipe.ingredients[1].id : recipe.ingredients[0].id
            const itemData = ItemsContent.getById(displayIngredientId)
            leftSectionIcon = (
                <img
                    className="pixel"
                    src={Images.get(itemData?.image || 'items/placeholder.png')}
                    alt={itemData?.name || ''}
                    style={{ width: '20px', height: '20px' }}
                />
            )
        }
    }

    return (
        <Panel style={{ minHeight: '578px', display: 'flex', flexDirection: 'column' }}>
            <h3>Recipe Information</h3>
            {selectedRecipeData ? (
                <>
                    <Text
                        size="xs"
                        style={{
                            position: 'absolute',
                            top: '6px',
                            right: '8px',
                            fontSize: '16px',
                            color: 'rgba(255,255,255,0.6)',
                        }}
                    >
                        Owned: {Numbers.whole(state.inventory.find((item) => item.id === selectedRecipeData!.id)?.amount || 0)}
                    </Text>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Recipe Info */}
                        <div style={{ textAlign: 'center', marginBottom: '8px', position: 'relative' }}>
                            <img
                                className="pixel"
                                src={Images.get(selectedRecipeData.image)}
                                alt={selectedRecipeData.name}
                                width={48}
                                height={48}
                                style={{ margin: '8px auto 0px' }}
                            />
                            <Group justify="center" gap="8px" style={{ marginTop: '-4px' }}>
                                <Text size="md" fw={400} style={{ fontSize: '18px' }}>
                                    {selectedRecipeData.name}
                                </Text>
                                <Text size="xs" style={{ fontSize: '16px', color: 'orange' }}>
                                    Lv. {selectedRecipeData.recipe.levelRequirement}
                                </Text>
                            </Group>
                            <Text size="xs" c="dimmed" style={{ fontSize: '16px', marginTop: '-4px', lineHeight: '1' }}>
                                {selectedRecipeData.description}
                            </Text>
                        </div>

                        {/* Material Selection Dropdown (if multiple recipes) */}
                        {hasMultipleRecipes && (
                            <Select
                                value={selectedIngredientId}
                                onChange={(value) => {
                                    if (!value || value === selectedIngredientId) return
                                    setSelectedIngredientId(value)
                                }}
                                data={allRecipes.map((recipe, index) => {
                                    const uniqueId = getRecipeUniqueId(recipe, index)
                                    const displayIngredient =
                                        recipe.ingredients.length > 1 ? recipe.ingredients[1] : recipe.ingredients[0]
                                    const itemData = ItemsContent.getById(displayIngredient.id)
                                    const inventoryItem = state.inventory.find((item) => item.id === displayIngredient.id)
                                    const allIngredientsAvailable = recipe.ingredients.every((ing) => {
                                        const invItem = state.inventory.find((item) => item.id === ing.id)
                                        return invItem && invItem.amount >= ing.amount
                                    })
                                    return {
                                        value: uniqueId,
                                        label: `${itemData?.name || displayIngredient.id} (Lv. ${recipe.levelRequirement}) - ${Numbers.whole(inventoryItem?.amount || 0)} available`,
                                        disabled: !allIngredientsAvailable && (inventoryItem?.amount || 0) === 0,
                                        image: itemData?.image,
                                        name: itemData?.name,
                                        level: recipe.levelRequirement,
                                        amount: inventoryItem?.amount || 0,
                                        recipeIndex: index,
                                    }
                                })}
                                leftSection={leftSectionIcon}
                                renderOption={({ option }) => {
                                    const recipeIndex = allRecipes.findIndex(
                                        (recipe, index) => getRecipeUniqueId(recipe, index) === option.value
                                    )
                                    const recipeData = recipeIndex >= 0 ? allRecipes[recipeIndex] : null
                                    const displayIngredientId =
                                        recipeData && recipeData.ingredients.length > 1
                                            ? recipeData.ingredients[1].id
                                            : recipeData?.ingredients[0].id || option.value
                                    const itemData = ItemsContent.getById(displayIngredientId)
                                    const inventoryItem = state.inventory.find((item) => item.id === displayIngredientId)
                                    return (
                                        <Group gap="8px" style={{ padding: '0px 0' }}>
                                            <img
                                                className="pixel"
                                                src={Images.get(itemData?.image || 'items/placeholder.png')}
                                                alt={itemData?.name || ''}
                                                style={{ width: '20px', height: '20px', flexShrink: 0 }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <Text size="sm" style={{ fontSize: '14px' }}>
                                                    {itemData?.name || displayIngredientId}
                                                </Text>
                                                <Text size="xs" style={{ fontSize: '14px' }}>
                                                    Lv. {recipeData?.levelRequirement || 0} -{' '}
                                                    {Numbers.whole(inventoryItem?.amount || 0)} available
                                                </Text>
                                            </div>
                                        </Group>
                                    )
                                }}
                                comboboxProps={{ withinPortal: false }}
                                size="sm"
                                styles={{
                                    input: {
                                        backgroundColor: 'rgba(0,0,0,0.35)',
                                        color: 'rgba(255,255,255,0.9)',
                                    },
                                    dropdown: {
                                        backgroundColor: 'rgba(0,0,0,1)',
                                        borderColor: 'rgba(255,255,255,0.25)',
                                    },
                                    option: {
                                        padding: '8px 12px',
                                    },
                                }}
                            />
                        )}

                        {/* Ingredients */}
                        <div style={{ marginBottom: '16px' }}>
                            <Text size="sm" fw={500} style={{ marginBottom: '-4px', fontSize: '18px' }}>
                                Materials
                            </Text>
                            <Stack gap="4px">
                                {selectedRecipeData.recipe.ingredients.map((ingredient) => {
                                    const info = getPlayerIngredientInfo(
                                        state.inventory,
                                        ingredient.id,
                                        ingredient.amount * amount
                                    )
                                    const gatherSource = getGatheringSource(ingredient.id)
                                    const playerSkillLevel = gatherSource
                                        ? SkillingHelpers.getLevel(
                                              state.skills.find((s) => s.id === gatherSource.skillId)?.xp || 0
                                          )
                                        : 0
                                    const hasLevel = gatherSource ? playerSkillLevel >= gatherSource.levelRequirement : false
                                    const isClickable = gatherSource && hasLevel
                                    const row = (
                                        <Group
                                            key={ingredient.id}
                                            justify="space-between"
                                            style={
                                                isClickable
                                                    ? {
                                                          cursor: 'pointer',
                                                          borderRadius: '4px',
                                                          padding: '0 4px',
                                                          margin: '0 -4px',
                                                      }
                                                    : undefined
                                            }
                                            onClick={
                                                isClickable
                                                    ? () => {
                                                          //Navigation.tab(dispatch, gatherSource.skillId)
                                                          Skilling.setSkill(
                                                              dispatch,
                                                              gatherSource.skillId,
                                                              gatherSource.activityId
                                                          )
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <Group gap="6px">
                                                <img
                                                    src={Images.get(info.itemData?.image || '')}
                                                    alt={info.itemData?.name || ''}
                                                    width={16}
                                                    height={16}
                                                />
                                                <Text
                                                    size="xs"
                                                    style={{
                                                        fontSize: '18px',
                                                        textDecoration: isClickable ? 'underline' : undefined,
                                                        textDecorationStyle: 'dotted' as const,
                                                        textUnderlineOffset: '3px',
                                                    }}
                                                >
                                                    {info.itemData?.name}
                                                </Text>
                                            </Group>
                                            <Text size="xs" c={info.hasEnough ? 'green' : 'red'} style={{ fontSize: '18px' }}>
                                                {Numbers.whole(info.inventoryAmount)}/{Numbers.whole(ingredient.amount * amount)}
                                            </Text>
                                        </Group>
                                    )
                                    if (isClickable) {
                                        return (
                                            <Tooltip
                                                key={ingredient.id}
                                                width="auto"
                                                content={
                                                    <Text size="xs" style={{ fontSize: '18px', whiteSpace: 'nowrap' }}>
                                                        Gathered while{' '}
                                                        <span style={{ textDecoration: 'underline' }}>
                                                            {gatherSource.skillId}
                                                        </span>
                                                        . Click to start gathering!
                                                    </Text>
                                                }
                                            >
                                                {row}
                                            </Tooltip>
                                        )
                                    }
                                    return row
                                })}
                            </Stack>
                        </div>

                        {/* Output */}
                        <div style={{ marginBottom: '0px', marginTop: 0 }}>
                            <Text size="sm" fw={500} style={{ marginBottom: '-4px', fontSize: '18px' }}>
                                Output
                            </Text>
                            <Group gap="6px" justify="space-between">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <img
                                        src={Images.get(ItemsContent.getById(selectedRecipeData.id)?.image || '')}
                                        alt={ItemsContent.getById(selectedRecipeData.id)?.name || ''}
                                        width={20}
                                        height={20}
                                    />
                                    <Text size="sm" style={{ fontSize: '18px' }}>
                                        {ItemsContent.getById(selectedRecipeData.id)?.name}
                                    </Text>
                                </span>
                                <Text c="green" style={{ fontSize: '18px' }}>
                                    {Numbers.whole(totalOutputAmount)}x
                                </Text>
                            </Group>
                        </div>
                    </div>

                    {/* Amount Input & Stats */}
                    <div>
                        <Group justify="space-between" align="center" style={{ marginBottom: '-4px' }}>
                            <Text size="sm" fw={500} style={{ fontSize: '18px' }}>
                                Experience/Second:
                            </Text>
                            <Text size="sm" style={{ fontSize: '18px' }} c="yellow">
                                {xpPerSecond.toFixed(2)} XP/s
                            </Text>
                        </Group>
                        <Group justify="space-between" align="center" style={{ marginBottom: '-4px' }}>
                            <Text size="sm" fw={500} style={{ fontSize: '18px' }}>
                                Total Experience:
                            </Text>
                            <Tooltip
                                content={
                                    <div>
                                        <div
                                            style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '-4px', color: 'white' }}
                                        >
                                            XP Breakdown
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Base XP</span>
                                                <span style={{ color: 'white' }}>
                                                    {selectedRecipeData
                                                        ? (selectedRecipeData.recipe.experience * amount).toFixed(2)
                                                        : '0.00'}
                                                </span>
                                            </div>
                                            {xpBreakdown.upgrades > 0 && (
                                                <div
                                                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}
                                                >
                                                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Awaken Tree</span>
                                                    <span style={{ color: '#4ade80' }}>+{xpBreakdown.upgrades.toFixed(2)}%</span>
                                                </div>
                                            )}
                                            {xpBreakdown.playerLevel > 0 && (
                                                <div
                                                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}
                                                >
                                                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Player Level</span>
                                                    <span style={{ color: '#4ade80' }}>
                                                        +{xpBreakdown.playerLevel.toFixed(2)}%
                                                    </span>
                                                </div>
                                            )}
                                            {xpBreakdown.tool > 0 && (
                                                <div
                                                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}
                                                >
                                                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Tool</span>
                                                    <span style={{ color: '#4ade80' }}>+{xpBreakdown.tool.toFixed(2)}%</span>
                                                </div>
                                            )}
                                            {xpBreakdown.total > 0 && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        fontSize: '16px',
                                                        borderTop: '1px solid rgba(255,255,255,0.15)',
                                                        paddingTop: '4px',
                                                        marginTop: '2px',
                                                    }}
                                                >
                                                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Total Bonus</span>
                                                    <span style={{ color: '#4ade80' }}>+{xpBreakdown.total.toFixed(2)}%</span>
                                                </div>
                                            )}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: '16px',
                                                    borderTop: '1px solid rgba(255,255,255,0.15)',
                                                    paddingTop: '4px',
                                                    marginTop: '2px',
                                                }}
                                            >
                                                <span style={{ color: 'white' }}>Final XP</span>
                                                <span style={{ color: 'white' }}>{totalExperience.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                }
                                width="240px"
                                center
                                inline
                            >
                                <Text size="sm" style={{ fontSize: '18px', cursor: 'pointer' }} c="yellow">
                                    {totalExperience.toFixed(2)} XP
                                </Text>
                            </Tooltip>
                        </Group>
                        <Group justify="space-between" align="center" style={{ marginBottom: '8px' }}>
                            <Text size="sm" fw={500} style={{ fontSize: '18px' }}>
                                Crafting Time:
                            </Text>
                            <Tooltip
                                content={
                                    <div>
                                        <div
                                            style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '-4px', color: 'white' }}
                                        >
                                            Duration Breakdown
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Base Time</span>
                                                <span style={{ color: 'white' }}>
                                                    {selectedRecipeData
                                                        ? formatFriendlyTime(selectedRecipeData.recipe.craftTime * amount)
                                                        : '0s'}
                                                </span>
                                            </div>
                                            {durationBreakdown.upgrades > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Awaken Tree</span>
                                                    <span style={{ color: '#4ade80' }}>-{durationBreakdown.upgrades.toFixed(2)}%</span>
                                                </div>
                                            )}
                                            {durationBreakdown.tool > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Tool (Speed Mode)</span>
                                                    <span style={{ color: '#4ade80' }}>-{durationBreakdown.tool.toFixed(2)}%</span>
                                                </div>
                                            )}
                                            {durationBreakdown.total > 0 && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        fontSize: '16px',
                                                        borderTop: '1px solid rgba(255,255,255,0.15)',
                                                        paddingTop: '4px',
                                                        marginTop: '2px',
                                                    }}
                                                >
                                                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Total Reduction</span>
                                                    <span style={{ color: '#4ade80' }}>-{durationBreakdown.total.toFixed(2)}%</span>
                                                </div>
                                            )}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: '16px',
                                                    borderTop: '1px solid rgba(255,255,255,0.15)',
                                                    paddingTop: '4px',
                                                    marginTop: '2px',
                                                }}
                                            >
                                                <span style={{ color: 'white' }}>Final Time</span>
                                                <span style={{ color: 'white' }}>{formatFriendlyTime(totalCraftTime)}</span>
                                            </div>
                                        </div>
                                    </div>
                                }
                                width="240px"
                                center
                                inline
                            >
                                <Text size="sm" style={{ fontSize: '18px', cursor: 'pointer' }} c="cyan">
                                    {formatFriendlyTime(totalCraftTime)}
                                </Text>
                            </Tooltip>
                        </Group>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <Input
                                type="number"
                                min={1}
                                max={maxAmount}
                                value={amount}
                                onChange={handleAmountChange}
                                disabled={maxAmount === 0}
                                size="sm"
                                style={{ fontSize: '16px', flex: 1 }}
                                radius={0}
                            />
                            <Button
                                onClick={() => setAmount(Math.max(1, amount - 1))}
                                disabled={maxAmount === 0 || amount <= 1}
                                style={{ maxWidth: '40px', padding: '0 8px' }}
                            >
                                -1
                            </Button>
                            <Button
                                onClick={() => setAmount(Math.min(amount + 1, maxAmount))}
                                disabled={maxAmount === 0 || amount >= maxAmount}
                                style={{ maxWidth: '40px', padding: '0 8px' }}
                            >
                                +1
                            </Button>
                            <Button
                                onClick={() => setAmount(maxAmount)}
                                disabled={maxAmount === 0}
                                style={{ maxWidth: '60px', padding: '0 8px' }}
                            >
                                Max
                            </Button>
                        </div>
                        <Slider
                            value={amount}
                            onChange={(num) => setAmount(Math.min(Math.max(num, 1), maxAmount))}
                            min={1}
                            max={maxAmount}
                            step={1}
                            disabled={maxAmount === 0}
                            style={{ marginBottom: '4px' }}
                            label={null}
                        />
                    </div>

                    {/* Action Button */}
                    <Button
                        disabled={!canCraft || !hasIngredients}
                        onClick={handleStartCrafting}
                        style={{
                            fontWeight: '400',
                            fontSize: '16px',
                            marginTop: '8px',
                            width: '100%',
                            backgroundColor: hasIngredients ? '#26402a' : 'rgb(40,40,40)',
                        }}
                    >
                        {!canCraft
                            ? 'Level Too Low'
                            : !hasIngredients
                              ? 'Missing Materials'
                              : crafterState?.isActive
                                ? 'Add to Queue'
                                : 'Start Crafting'}
                    </Button>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', flex: 1, fontSize: '24px' }}>
                    <Text style={{ fontSize: '20px' }}>Select a recipe to craft</Text>
                </div>
            )}
        </Panel>
    )
}

export default RecipeInfoPanel

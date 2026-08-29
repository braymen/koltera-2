import Panel from '@components/common/Panel'
import Button from '@components/common/Button'
import { StateProps } from '@engine/types'
import StoryActions from '@modules/story/dispatch'
import CreaturesActions from '@modules/creatures/dispatch'
import Inventory from '@modules/inventory/dispatch'
import Skilling from '@modules/skilling/dispatch'
import SkillingHelpers from '@modules/skilling/helpers'
import TaskBoardActions from '@modules/taskboard/dispatch'
import Sounds from '@utils/sounds'
import { useState } from 'react'
import { Input, Select } from '@mantine/core'
import ItemsContent from '@data/items'
import CreaturesContent from '@data/creatures'
import TraitsContent from '@data/traits'
import { Types } from '@modules/creatures/types'
import { createCreature } from '@modules/creatures/helpers'
import { changeInventory } from '@modules/inventory/functions'
import { getTotalCompletedExpeditions } from '@modules/expeditions/helpers'
import ExpeditionsContent from '@data/expeditions'
import { State } from '@engine/types'

interface Props extends StateProps {
    showEnding?: (show: boolean) => void
}

function DeveloperTools({ state, dispatch, showEnding }: Props) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [password, setPassword] = useState<string>('')
    const [error, setError] = useState<string>('')
    const locksDisabled = !!state.story?.lockOverride
    const [selectedItemId, setSelectedItemId] = useState<string>('')
    const [itemAmount, setItemAmount] = useState<string>('1')
    const [selectedSkillId, setSelectedSkillId] = useState<string>('')
    const [skillLevel, setSkillLevel] = useState<string>('1')
    const [selectedCreatureSpecies, setSelectedCreatureSpecies] = useState<string>('')
    const [creatureLevel, setCreatureLevel] = useState<string>('1')
    const [expeditionCompletions, setExpeditionCompletions] = useState<string>('0')

    const allItems = ItemsContent.get
    const itemOptions = allItems.map((item) => ({
        value: item.id,
        label: item.name,
    }))

    const handleGiveItem = () => {
        if (!selectedItemId || !itemAmount) {
            return
        }

        const amount = parseInt(itemAmount, 10)
        if (isNaN(amount) || amount <= 0) {
            return
        }

        Sounds.play('click.wav')
        Inventory.change(dispatch, [{ id: selectedItemId, amount }])
        setItemAmount('1')
    }

    const handlePasswordSubmit = () => {
        if (password === 'firox') {
            Sounds.play('click.wav')
            setIsAuthenticated(true)
            setError('')
            setPassword('')
        } else {
            Sounds.play('click.wav')
            setError('Incorrect password')
            setPassword('')
        }
    }

    const handlePasswordKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handlePasswordSubmit()
        }
    }

    if (!isAuthenticated) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Panel>
                    <h2 style={{ marginTop: 0 }}>Developer Tools</h2>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            maxWidth: '400px',
                            margin: '0 auto',
                        }}
                    >
                        <p style={{ marginBottom: '12px', color: 'rgba(255,255,255,.8)' }}>
                            Enter password to access developer tools
                        </p>
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                setError('')
                            }}
                            onKeyPress={handlePasswordKeyPress}
                            style={{ width: '100%' }}
                            radius={0}
                            error={error}
                        />
                        <Button
                            onClick={handlePasswordSubmit}
                            disabled={!password}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#2b7a0b',
                                color: 'white',
                            }}
                        >
                            Submit
                        </Button>
                    </div>
                </Panel>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Panel>
                <h2 style={{ marginTop: 0 }}>Developer Tools</h2>
                <p style={{ marginBottom: '12px', color: 'rgba(255,255,255,.8)' }}>
                    Use these controls for debugging and verifying game flow. These are temporary overrides and may lead to
                    spoilers or inconsistent states.
                </p>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            onClick={() => StoryActions.setLockOverride(dispatch, !locksDisabled)}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: locksDisabled ? '#5c2c00' : '#2b7a0b',
                                color: 'white',
                            }}
                        >
                            {locksDisabled ? 'Re-enable Tab Locks' : 'Temporarily Unlock All Tabs'}
                        </Button>
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                TaskBoardActions.resetTasks(dispatch)
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#5c4a2b',
                                color: 'white',
                            }}
                        >
                            Reset Taskboard
                        </Button>
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                dispatch({
                                    action: (currentState: State) => {
                                        currentState.machines = { machines: {} }
                                        return currentState
                                    },
                                    payload: {},
                                })
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#5c4a2b',
                                color: 'white',
                            }}
                        >
                            Reset Machines
                        </Button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                dispatch({
                                    action: (currentState: State) => {
                                        const refundAmount = currentState.purchasedUpgrades.length
                                        currentState.purchasedUpgrades = []
                                        if (refundAmount > 0) {
                                            const awakenItem = currentState.inventory.find((item) => item.id === 'awaken-points')
                                            if (awakenItem) {
                                                awakenItem.amount += refundAmount
                                            } else {
                                                currentState.inventory.push({ id: 'awaken-points', amount: refundAmount })
                                            }
                                        }
                                        return currentState
                                    },
                                    payload: {},
                                })
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#7a2b2b',
                                color: 'white',
                            }}
                        >
                            {`Reset Awaken Tree (${state.purchasedUpgrades.length} upgrades)`}
                        </Button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                CreaturesActions.summonAllCreatures(dispatch)
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#5c7a2b',
                                color: 'white',
                            }}
                        >
                            Summon All Creatures (Free)
                        </Button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                CreaturesActions.giveRandomCreatureLevel100(dispatch)
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#7a5c2b',
                                color: 'white',
                            }}
                        >
                            Give Random Creature Level 100
                        </Button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                Inventory.change(dispatch, [{ id: 'gold', amount: 10000 }])
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#d4af37',
                                color: 'white',
                            }}
                        >
                            Give 10,000 Gold
                        </Button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                Inventory.change(dispatch, [{ id: 'pouch', amount: 10 }])
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#5c2b7a',
                                color: 'white',
                            }}
                        >
                            Give 10 Pouches
                        </Button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                if (showEnding) {
                                    showEnding(true)
                                }
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#7a2b5c',
                                color: 'white',
                            }}
                        >
                            Show End Game Credits
                        </Button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                StoryActions.resetStory(dispatch)
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#7a2b5c',
                                color: 'white',
                            }}
                        >
                            Reset Story
                        </Button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                dispatch({
                                    action: (currentState: State) => {
                                        const shuffle = <T,>(arr: T[]): T[] => {
                                            const shuffled = [...arr]
                                            for (let i = shuffled.length - 1; i > 0; i--) {
                                                const j = Math.floor(Math.random() * (i + 1))
                                                ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
                                            }
                                            return shuffled
                                        }
                                        const randInt = (min: number, max: number) =>
                                            Math.floor(Math.random() * (max - min + 1)) + min

                                        // Give ~half the items with random amounts
                                        const allItemsList = ItemsContent.get
                                        const halfItems = shuffle(allItemsList).slice(
                                            0,
                                            Math.ceil(allItemsList.length / 2)
                                        )
                                        currentState = changeInventory(currentState, {
                                            resources: halfItems.map((item) => ({
                                                id: item.id,
                                                amount: randInt(1, 500),
                                            })),
                                        })

                                        // Summon ~half the creatures with random levels 1-70
                                        const allCreatures = CreaturesContent.get
                                        const halfCreatures = shuffle(allCreatures).slice(
                                            0,
                                            Math.ceil(allCreatures.length / 2)
                                        )
                                        const summonedCreatures = halfCreatures.map((c) => {
                                            const level = randInt(1, 70)
                                            return createCreature(c.id, level)
                                        })
                                        currentState.creatures = [
                                            ...currentState.creatures,
                                            ...summonedCreatures,
                                        ]

                                        // Awaken 8 random creatures and give awaken points
                                        const creaturesToAwaken = shuffle(currentState.creatures).slice(0, 8)
                                        creaturesToAwaken.forEach((c) => {
                                            c.awakened = true
                                        })
                                        currentState = changeInventory(currentState, {
                                            resources: [{ id: 'awaken-points', amount: 8 }],
                                        })

                                        // Random skill levels 1-70
                                        const allSkillIds = [
                                            'Chopping',
                                            'Mining',
                                            'Digging',
                                            'Exploring',
                                            'Fishing',
                                            'Farming',
                                            'Runecrafter',
                                            'Summoning',
                                            'Breeding',
                                            'Healing',
                                            'Helpers',
                                            'Workbench',
                                            'Furnace',
                                            'Stove',
                                            'Crusher',
                                            'Alchemy Table',
                                            'Expeditions',
                                        ]
                                        allSkillIds.forEach((skillId) => {
                                            const level = randInt(1, 70)
                                            const xpNeeded = SkillingHelpers.getXpForLevel(level)
                                            const existing = currentState.skills.find(
                                                (s) => s.id === skillId
                                            )
                                            if (existing) {
                                                existing.xp = Math.max(existing.xp, xpNeeded)
                                            } else {
                                                currentState.skills.push({ id: skillId, xp: xpNeeded })
                                            }
                                        })

                                        // Add summoned creatures and given items to collections
                                        halfCreatures.forEach((c) => {
                                            if (!currentState.collections.creatures.includes(c.id)) {
                                                currentState.collections.creatures.push(c.id)
                                            }
                                        })

                                        // Unlock ~10 expeditions by spreading 300 total completions
                                        // across the first few expedition types
                                        currentState.expeditionCompletions = {
                                            ...currentState.expeditionCompletions,
                                            'expedition-type-1': { 1: 80, 2: 20 },
                                            'expedition-type-2': { 1: 60, 2: 15 },
                                            'expedition-type-3': { 1: 40, 2: 10 },
                                            'expedition-type-4': { 1: 30, 2: 5 },
                                            'expedition-type-5': { 1: 25 },
                                            'expedition-type-6': { 1: 15 },
                                        }

                                        return currentState
                                    },
                                    payload: {},
                                })
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#7a2b2b',
                                color: 'white',
                            }}
                        >
                            Trailer
                        </Button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                Inventory.change(dispatch, [
                                    { id: 'automation-core-i', amount: 10 },
                                    { id: 'automation-core-ii', amount: 10 },
                                    { id: 'automation-core-iii', amount: 10 },
                                ])
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#2b5c7a',
                                color: 'white',
                            }}
                        >
                            Give 10 of Each Automation Core
                        </Button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                Inventory.change(
                                    dispatch,
                                    allItems.map((item) => ({ id: item.id, amount: 10000 }))
                                )
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#2b4a7a',
                                color: 'white',
                            }}
                        >
                            Give 10,000 of Every Item
                        </Button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                const level99Xp = SkillingHelpers.getXpForLevel(99)
                                const allSkills = [
                                    'Chopping',
                                    'Mining',
                                    'Digging',
                                    'Exploring',
                                    'Fishing',
                                    'Farming',
                                    'Runecrafter',
                                    'Summoning',
                                    'Breeding',
                                    'Healing',
                                    'Helpers',
                                    'Workbench',
                                    'Furnace',
                                    'Stove',
                                    'Crusher',
                                    'Alchemy Table',
                                    'Expeditions',
                                ]
                                allSkills.forEach((skillId) => {
                                    const currentXp = state.skills.find((s) => s.id === skillId)?.xp || 0
                                    const xpNeeded = Math.max(0, level99Xp - currentXp)
                                    if (xpNeeded > 0) {
                                        Skilling.addExperience(dispatch, skillId, xpNeeded)
                                    }
                                })
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#7a2b5c',
                                color: 'white',
                            }}
                        >
                            Give Level 99 XP to All Skills
                        </Button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            padding: '16px',
                        }}
                    >
                        <h3 style={{ margin: 0, color: 'rgba(255,255,255,.9)' }}>Give Item</h3>
                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            <Select
                                placeholder="Select an item"
                                data={itemOptions}
                                value={selectedItemId}
                                onChange={(value) => setSelectedItemId(value || '')}
                                searchable
                                style={{ flex: 1, minWidth: '200px' }}
                                radius={0}
                            />
                            <Input
                                type="number"
                                placeholder="Amount"
                                value={itemAmount}
                                onChange={(e) => setItemAmount(e.target.value)}
                                min={1}
                                style={{ width: '120px' }}
                                radius={0}
                            />
                            <Button
                                onClick={handleGiveItem}
                                disabled={!selectedItemId || !itemAmount || parseInt(itemAmount, 10) <= 0}
                                style={{
                                    width: 'auto',
                                    padding: '8px 16px',
                                    backgroundColor: '#2b7a5c',
                                    color: 'white',
                                }}
                            >
                                Give Item
                            </Button>
                        </div>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            padding: '16px',
                        }}
                    >
                        <h3 style={{ margin: 0, color: 'rgba(255,255,255,.9)' }}>Set Skill Level</h3>
                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            <Select
                                placeholder="Select a skill"
                                data={[
                                    'Chopping', 'Mining', 'Digging', 'Exploring', 'Fishing', 'Farming',
                                    'Runecrafter', 'Summoning', 'Breeding', 'Healing', 'Helpers',
                                    'Workbench', 'Furnace', 'Stove', 'Crusher', 'Alchemy Table', 'Expeditions',
                                ].map((id) => ({ value: id, label: id }))}
                                value={selectedSkillId}
                                onChange={(value) => setSelectedSkillId(value || '')}
                                searchable
                                style={{ flex: 1, minWidth: '200px' }}
                                radius={0}
                            />
                            <Input
                                type="number"
                                placeholder="Level"
                                value={skillLevel}
                                onChange={(e) => setSkillLevel(e.target.value)}
                                min={1}
                                max={99}
                                style={{ width: '120px' }}
                                radius={0}
                            />
                            {selectedSkillId && (
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.6)' }}>
                                    Current: Lv.{SkillingHelpers.getLevel(state.skills.find((s) => s.id === selectedSkillId)?.xp || 0)}
                                </span>
                            )}
                            <Button
                                onClick={() => {
                                    const level = parseInt(skillLevel, 10)
                                    if (!selectedSkillId || isNaN(level) || level < 1 || level > 99) return
                                    Sounds.play('click.wav')
                                    dispatch({
                                        action: (currentState: State) => {
                                            const xp = SkillingHelpers.getXpForLevel(level)
                                            const existing = currentState.skills.find((s) => s.id === selectedSkillId)
                                            if (existing) {
                                                existing.xp = xp
                                            } else {
                                                currentState.skills.push({ id: selectedSkillId, xp })
                                            }
                                            return currentState
                                        },
                                        payload: {},
                                    })
                                }}
                                disabled={!selectedSkillId || !skillLevel || parseInt(skillLevel, 10) < 1 || parseInt(skillLevel, 10) > 99}
                                style={{
                                    width: 'auto',
                                    padding: '8px 16px',
                                    backgroundColor: '#2b5c7a',
                                    color: 'white',
                                }}
                            >
                                Set Level
                            </Button>
                        </div>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            padding: '16px',
                        }}
                    >
                        <h3 style={{ margin: 0, color: 'rgba(255,255,255,.9)' }}>Summon Creature</h3>
                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            <Select
                                placeholder="Select a creature"
                                data={CreaturesContent.get.map((c) => ({ value: c.id, label: `${c.name} (T${c.tier})` }))}
                                value={selectedCreatureSpecies}
                                onChange={(value) => setSelectedCreatureSpecies(value || '')}
                                searchable
                                style={{ flex: 1, minWidth: '200px' }}
                                radius={0}
                            />
                            <Input
                                type="number"
                                placeholder="Level"
                                value={creatureLevel}
                                onChange={(e) => setCreatureLevel(e.target.value)}
                                min={1}
                                max={120}
                                style={{ width: '120px' }}
                                radius={0}
                            />
                            <Button
                                onClick={() => {
                                    const level = parseInt(creatureLevel, 10)
                                    if (!selectedCreatureSpecies || isNaN(level) || level < 1 || level > 120) return
                                    Sounds.play('click.wav')
                                    dispatch({
                                        action: (currentState: State) => {
                                            const creature = createCreature(selectedCreatureSpecies, level)
                                            currentState.creatures.push(creature)
                                            if (!currentState.collections.creatures.includes(selectedCreatureSpecies)) {
                                                currentState.collections.creatures.push(selectedCreatureSpecies)
                                            }
                                            return currentState
                                        },
                                        payload: {},
                                    })
                                }}
                                disabled={!selectedCreatureSpecies || !creatureLevel || parseInt(creatureLevel, 10) < 1 || parseInt(creatureLevel, 10) > 120}
                                style={{
                                    width: 'auto',
                                    padding: '8px 16px',
                                    backgroundColor: '#5c7a2b',
                                    color: 'white',
                                }}
                            >
                                Summon Creature
                            </Button>
                        </div>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            padding: '16px',
                        }}
                    >
                        <h3 style={{ margin: 0, color: 'rgba(255,255,255,.9)' }}>Set Expedition Completions</h3>
                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            <Input
                                type="number"
                                placeholder="Total completions"
                                value={expeditionCompletions}
                                onChange={(e) => setExpeditionCompletions(e.target.value)}
                                min={0}
                                style={{ width: '180px' }}
                                radius={0}
                            />
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.6)' }}>
                                Current: {getTotalCompletedExpeditions(state.expeditionCompletions)}
                            </span>
                            <Button
                                onClick={() => {
                                    const total = parseInt(expeditionCompletions, 10)
                                    if (isNaN(total) || total < 0) return
                                    Sounds.play('click.wav')
                                    dispatch({
                                        action: (currentState: State) => {
                                            currentState.expeditionCompletions = total > 0
                                                ? { 'expedition-type-1': { 1: total } }
                                                : {}
                                            return currentState
                                        },
                                        payload: {},
                                    })
                                }}
                                disabled={!expeditionCompletions || parseInt(expeditionCompletions, 10) < 0}
                                style={{
                                    width: 'auto',
                                    padding: '8px 16px',
                                    backgroundColor: '#7a5c2b',
                                    color: 'white',
                                }}
                            >
                                Set Completions
                            </Button>
                        </div>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)' }}>
                            Unlocks: 5 (2nd), 10 (3rd), 20, 30, 50, 70, 100, 200, 300, 400, 500, 700, 900, 1100, 1300, 1500, 2000, 2500, 3000
                        </span>
                        <Button
                            onClick={() => {
                                Sounds.play('click.wav')
                                dispatch({
                                    action: (currentState: State) => {
                                        const completions: Record<string, Record<number, number>> = {}
                                        for (const expType of ExpeditionsContent.get) {
                                            completions[expType.id] = {
                                                1: 20,
                                                2: 20,
                                                3: 20,
                                                4: 20,
                                            }
                                        }
                                        currentState.expeditionCompletions = {
                                            ...currentState.expeditionCompletions,
                                            ...completions,
                                        }
                                        return currentState
                                    },
                                    payload: {},
                                })
                            }}
                            style={{
                                width: 'auto',
                                padding: '8px 16px',
                                backgroundColor: '#5c2b7a',
                                color: 'white',
                            }}
                        >
                            Unlock All Tiers
                        </Button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            padding: '16px',
                        }}
                    >
                        <h3 style={{ margin: 0, color: 'rgba(255,255,255,.9)' }}>Creature Demographics by Tier</h3>
                        {(() => {
                            // Group creatures by tier
                            const creaturesByTier: { [tier: number]: typeof CreaturesContent.get } = {}
                            CreaturesContent.get.forEach((creature) => {
                                if (!creaturesByTier[creature.tier]) {
                                    creaturesByTier[creature.tier] = []
                                }
                                creaturesByTier[creature.tier].push(creature)
                            })

                            // Global trait counts across all creatures
                            const globalTraitCounts: { [traitId: string]: number } = {}
                            CreaturesContent.get.forEach((creature) => {
                                globalTraitCounts[creature.trait] = (globalTraitCounts[creature.trait] || 0) + 1
                            })
                            const knownTraitIds = TraitsContent.get.map((t) => t.id)
                            const unusedTraits = knownTraitIds.filter((id) => !globalTraitCounts[id])
                            const unknownTraits = Object.keys(globalTraitCounts).filter((id) => !knownTraitIds.includes(id))
                            const sortedGlobalTraits = Object.entries(globalTraitCounts).sort((a, b) => b[1] - a[1])

                            // Calculate stats for each tier
                            const tierStats = Object.keys(creaturesByTier)
                                .map(Number)
                                .sort((a, b) => a - b)
                                .map((tier) => {
                                    const creatures = creaturesByTier[tier]
                                    const typeCounts: { [type in Types]?: number } = {}
                                    const traitCounts: { [traitId: string]: number } = {}
                                    const statTotals = {
                                        power: 0,
                                        toughness: 0,
                                        agility: 0,
                                        intelligence: 0,
                                        gathering: 0,
                                        luck: 0,
                                    }
                                    const jobTotals = {
                                        chopping: 0,
                                        mining: 0,
                                        digging: 0,
                                        exploring: 0,
                                        fishing: 0,
                                        farming: 0,
                                    }

                                    creatures.forEach((creature) => {
                                        // Count types
                                        creature.types.forEach((type) => {
                                            typeCounts[type] = (typeCounts[type] || 0) + 1
                                        })

                                        // Count traits
                                        traitCounts[creature.trait] = (traitCounts[creature.trait] || 0) + 1

                                        // Sum stats
                                        statTotals.power += creature.stats.power
                                        statTotals.toughness += creature.stats.toughness
                                        statTotals.agility += creature.stats.agility
                                        statTotals.intelligence += creature.stats.intelligence
                                        statTotals.gathering += creature.stats.gathering
                                        statTotals.luck += creature.stats.luck

                                        // Sum job stats
                                        jobTotals.chopping += creature.jobs.chopping
                                        jobTotals.mining += creature.jobs.mining
                                        jobTotals.digging += creature.jobs.digging
                                        jobTotals.exploring += creature.jobs.exploring
                                        jobTotals.fishing += creature.jobs.fishing
                                        jobTotals.farming += creature.jobs.farming
                                    })

                                    const count = creatures.length
                                    return {
                                        tier,
                                        count,
                                        typeCounts,
                                        traitCounts,
                                        avgStats: {
                                            power: (statTotals.power / count).toFixed(2),
                                            toughness: (statTotals.toughness / count).toFixed(2),
                                            agility: (statTotals.agility / count).toFixed(2),
                                            intelligence: (statTotals.intelligence / count).toFixed(2),
                                            gathering: (statTotals.gathering / count).toFixed(2),
                                            luck: (statTotals.luck / count).toFixed(2),
                                        },
                                        avgJobs: {
                                            chopping: (jobTotals.chopping / count).toFixed(2),
                                            mining: (jobTotals.mining / count).toFixed(2),
                                            digging: (jobTotals.digging / count).toFixed(2),
                                            exploring: (jobTotals.exploring / count).toFixed(2),
                                            fishing: (jobTotals.fishing / count).toFixed(2),
                                            farming: (jobTotals.farming / count).toFixed(2),
                                        },
                                    }
                                })

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* Global trait distribution */}
                                    <div
                                        style={{
                                            border: '1px solid rgba(100,200,255,0.3)',
                                            padding: '12px',
                                            backgroundColor: 'rgba(100,200,255,0.05)',
                                        }}
                                    >
                                        <h4 style={{ margin: '0 0 8px 0', color: 'rgba(100,200,255,.9)' }}>
                                            Trait Distribution — All Tiers ({CreaturesContent.get.length} creatures,{' '}
                                            {knownTraitIds.length} known traits)
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                            {sortedGlobalTraits.map(([traitId, count]) => {
                                                const traitName = TraitsContent.getById(traitId)?.name ?? traitId
                                                const isUnknown = !knownTraitIds.includes(traitId)
                                                const pct = ((count / CreaturesContent.get.length) * 100).toFixed(0)
                                                return (
                                                    <div
                                                        key={traitId}
                                                        style={{
                                                            fontSize: '13px',
                                                            padding: '2px 8px',
                                                            border: `1px solid ${isUnknown ? 'rgba(255,150,50,.5)' : 'rgba(255,255,255,.2)'}`,
                                                            color: isUnknown ? 'rgba(255,150,50,.9)' : 'rgba(255,255,255,.8)',
                                                            backgroundColor: isUnknown ? 'rgba(255,150,50,.1)' : 'transparent',
                                                        }}
                                                    >
                                                        {traitName}: {count} ({pct}%){isUnknown ? ' ⚠ unknown' : ''}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {unusedTraits.length > 0 && (
                                            <div style={{ fontSize: '13px', color: 'rgba(255,200,50,.8)', marginTop: '4px' }}>
                                                Unused traits:{' '}
                                                {unusedTraits.map((id) => TraitsContent.getById(id)?.name ?? id).join(', ')}
                                            </div>
                                        )}
                                        {unknownTraits.length > 0 && (
                                            <div style={{ fontSize: '13px', color: 'rgba(255,100,50,.8)', marginTop: '4px' }}>
                                                Unknown trait IDs (not in traits.ts): {unknownTraits.join(', ')}
                                            </div>
                                        )}
                                    </div>

                                    {tierStats.map((stats) => (
                                        <div
                                            key={stats.tier}
                                            style={{
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                padding: '12px',
                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                            }}
                                        >
                                            <h4 style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,.9)' }}>
                                                Tier {stats.tier} ({stats.count} creatures)
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div>
                                                    <strong style={{ color: 'rgba(255,255,255,.8)' }}>Type Breakdown:</strong>
                                                    <div style={{ marginLeft: '12px', marginTop: '4px' }}>
                                                        {(['Water', 'Fire', 'Earth', 'Wind'] as Types[]).map((type) => (
                                                            <div
                                                                key={type}
                                                                style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)' }}
                                                            >
                                                                {type}: {stats.typeCounts[type] || 0}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <strong style={{ color: 'rgba(255,255,255,.8)' }}>Trait Breakdown:</strong>
                                                    <div
                                                        style={{
                                                            marginLeft: '12px',
                                                            marginTop: '4px',
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: '6px',
                                                        }}
                                                    >
                                                        {Object.entries(stats.traitCounts)
                                                            .sort((a, b) => b[1] - a[1])
                                                            .map(([traitId, count]) => {
                                                                const traitName = TraitsContent.getById(traitId)?.name ?? traitId
                                                                const isUnknown = !knownTraitIds.includes(traitId)
                                                                return (
                                                                    <span
                                                                        key={traitId}
                                                                        style={{
                                                                            fontSize: '13px',
                                                                            color: isUnknown
                                                                                ? 'rgba(255,150,50,.9)'
                                                                                : 'rgba(255,255,255,.7)',
                                                                        }}
                                                                    >
                                                                        {traitName}: {count}
                                                                        {isUnknown ? ' ⚠' : ''}
                                                                    </span>
                                                                )
                                                            })}
                                                    </div>
                                                </div>
                                                <div>
                                                    <strong style={{ color: 'rgba(255,255,255,.8)' }}>Average Stats:</strong>
                                                    <div
                                                        style={{
                                                            marginLeft: '12px',
                                                            marginTop: '4px',
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: '12px',
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)' }}>
                                                            Power: {stats.avgStats.power}
                                                        </span>
                                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)' }}>
                                                            Toughness: {stats.avgStats.toughness}
                                                        </span>
                                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)' }}>
                                                            Agility: {stats.avgStats.agility}
                                                        </span>
                                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)' }}>
                                                            Intelligence: {stats.avgStats.intelligence}
                                                        </span>
                                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)' }}>
                                                            Gathering: {stats.avgStats.gathering}
                                                        </span>
                                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)' }}>
                                                            Luck: {stats.avgStats.luck}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <strong style={{ color: 'rgba(255,255,255,.8)' }}>Average Job Stats:</strong>
                                                    <div
                                                        style={{
                                                            marginLeft: '12px',
                                                            marginTop: '4px',
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: '12px',
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)' }}>
                                                            Chopping: {stats.avgJobs.chopping}
                                                        </span>
                                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)' }}>
                                                            Mining: {stats.avgJobs.mining}
                                                        </span>
                                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)' }}>
                                                            Digging: {stats.avgJobs.digging}
                                                        </span>
                                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)' }}>
                                                            Exploring: {stats.avgJobs.exploring}
                                                        </span>
                                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)' }}>
                                                            Fishing: {stats.avgJobs.fishing}
                                                        </span>
                                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)' }}>
                                                            Farming: {stats.avgJobs.farming}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        })()}
                    </div>
                </div>
            </Panel>
        </div>
    )
}

export default DeveloperTools

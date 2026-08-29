import InventoryItemDetails from '@components/inventory/ItemDetails'
import InventorySelection from '@components/inventory/Inventory'
import { StateProps } from '@engine/types'
import { useState } from 'react'
import ChestLootModal from '@components/inventory/ChestLootModal'
import { ItemInstance } from '@modules/inventory/types'
import Panel from '@components/common/Panel'
import Button from '@components/common/Button'
import ItemsContent from '@data/items'
import InventoryModule from '@modules/inventory/dispatch'
import { calculateChestLoot } from '@modules/inventory/functions'
import Sounds from '@utils/sounds'

function Inventory({ state, dispatch }: StateProps) {
    const [selected, setSelected] = useState('')
    const [chestLoot, setChestLoot] = useState<ItemInstance[]>([])
    const [chestModalOpened, setChestModalOpened] = useState(false)
    const [chestModalName, setChestModalName] = useState('')

    const containers = state.inventory.filter((item) => {
        const meta = ItemsContent.getById(item.id)
        return meta?.type === 'Container' && meta.lootTable && item.amount > 0
    })
    const hasContainers = containers.length > 0

    const openAllContainers = () => {
        if (!hasContainers) return
        Sounds.play('click.wav')

        const allLoot: ItemInstance[] = []
        for (const container of containers) {
            const loot = calculateChestLoot(container.id, container.amount)
            allLoot.push(...loot)
            InventoryModule.openChest(dispatch, container.id, container.amount, loot)
        }

        // Combine duplicate items
        const combined = new Map<string, number>()
        for (const item of allLoot) {
            combined.set(item.id, (combined.get(item.id) || 0) + item.amount)
        }
        setChestLoot(Array.from(combined, ([id, amount]) => ({ id, amount })))
        const totalCount = containers.reduce((sum, c) => sum + c.amount, 0)
        setChestModalName(`${totalCount} Container${totalCount !== 1 ? 's' : ''}`)
        setChestModalOpened(true)
    }

    return (
        <>
            <div style={{ display: 'flex' }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Panel>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '0px',
                            }}
                        >
                            <h3>Inventory</h3>
                            <Button
                                onClick={openAllContainers}
                                disabled={!hasContainers}
                                style={{
                                    padding: '4px 12px',
                                    fontSize: '14px',
                                    height: '20px',
                                    width: 'fit-content',
                                    flexShrink: 0,
                                }}
                            >
                                Open Every Container
                            </Button>
                        </div>
                        <InventorySelection
                            state={state}
                            dispatch={dispatch}
                            selected={selected}
                            onSelect={(id: string) => {
                                setSelected(id)
                            }}
                        />
                    </Panel>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', width: '60%' }}>
                    <Panel>
                        <InventoryItemDetails
                            state={state}
                            dispatch={dispatch}
                            selected={selected}
                            amount={state.inventory.find((item) => item.id === selected)?.amount}
                            canSell={true}
                            canBuy={false}
                            hideBuyValue={true}
                        />
                    </Panel>
                </div>
            </div>
            <ChestLootModal
                opened={chestModalOpened}
                onClose={() => setChestModalOpened(false)}
                loot={chestLoot}
                chestName={chestModalName}
            />
        </>
    )
}

export default Inventory

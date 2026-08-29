import InventoryItemDetails from '@components/inventory/ItemDetails'
import { StateProps } from '@engine/types'
import { useState } from 'react'
import Panel from '@components/common/Panel'
import MerchantInventory from '@components/inventory/MerchantInventory'

function Merchant({ state, dispatch }: StateProps) {
    const [selected, setSelected] = useState('')

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Panel style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <MerchantInventory
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
                    <Panel style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <InventoryItemDetails
                            state={state}
                            dispatch={dispatch}
                            selected={selected}
                            amount={state.inventory.find((item) => item.id === selected)?.amount}
                            canSell={false}
                            canBuy={true}
                            showFavoriteButton={false}
                            hideSellValue={true}
                        />
                    </Panel>
                </div>
            </div>
        </>
    )
}

export default Merchant

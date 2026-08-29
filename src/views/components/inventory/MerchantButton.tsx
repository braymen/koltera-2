import ItemsContent from '@data/items'
import { StateProps } from '@engine/types'
import Images from '@utils/images'
import Sounds from '@utils/sounds'
import Numbers from '@utils/numbers'

interface Props extends StateProps {
    id: string
    image: string
    label: string
    amount: number
    onClick: (id: string) => void
    isSelected?: boolean
    weeklyLimit?: number
    weeklyPurchased?: number
}

function MerchantButton({
    state,
    dispatch,
    id,
    image,
    label,
    amount,
    onClick,
    isSelected = false,
    weeklyLimit,
    weeklyPurchased,
}: Props) {
    const goldAmount = state.inventory.find((item) => item.id === 'gold')?.amount ?? 0
    const clicked = () => {
        Sounds.play('click.wav')
        onClick(id)
    }

    return (
        <>
            <div
                onClick={clicked}
                className="skill-focus-btn"
                style={{
                    padding: '8px 2px',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    borderLeft: isSelected ? '3px solid rgba(255, 255, 255, 0.5)' : '3px solid transparent',
                }}
            >
                <img
                    className="pixel"
                    src={Images.get(image)}
                    alt="Skill Icon"
                    style={{ width: '26px', height: '26px', marginRight: '8px', marginLeft: '4px' }}
                />
                <h3 style={{ flexGrow: 1, fontSize: '18px', fontWeight: '400' }}>{label}</h3>
                <span style={{ float: 'right', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '8px' }}>
                    {weeklyLimit !== undefined && weeklyPurchased !== undefined && (
                        <span
                            style={{
                                fontSize: '16px',
                                fontWeight: '400',
                                color: weeklyPurchased >= weeklyLimit ? 'rgb(255, 251, 0)' : 'rgb(255, 251, 0)',
                                marginRight: '8px',
                            }}
                        >
                            Weekly Limit: {weeklyPurchased}/{weeklyLimit}
                        </span>
                    )}
                    <img
                        className="pixel"
                        src={Images.get(ItemsContent.getById('gold').image)}
                        alt="Gold"
                        style={{ width: '18px', height: '18px' }}
                    />
                    <span
                        style={{
                            fontSize: '18px',
                            fontWeight: '400',
                            color: goldAmount >= amount ? 'lime' : 'red',
                        }}
                    >
                        {Numbers.whole(amount)}
                    </span>
                </span>
            </div>
        </>
    )
}

export default MerchantButton

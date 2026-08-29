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
    isFavorite?: boolean
    isSelected?: boolean
}

function InventorySelectionButton({ id, image, label, amount, onClick, isFavorite = false, isSelected = false }: Props) {
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
                    padding: '6px 2px',
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
                    style={{ width: '28px', height: '28px', marginRight: '8px', marginLeft: '4px' }}
                />
                {isFavorite && (
                    <span
                        style={{
                            color: '#FFD700',
                            fontSize: '16px',
                            marginRight: '6px',
                        }}
                        title="Favorited"
                    >
                        ★
                    </span>
                )}
                <h3 style={{ flexGrow: 1, fontSize: '18px', fontWeight: '400' }}>{label}</h3>
                <div
                    style={{
                        paddingRight: '8px',
                        fontSize: '18px',
                        fontWeight: '400',
                        display: 'flex',
                        justifyContent: 'space-evenly',
                    }}
                >
                    <span style={{ fontSize: '18px', fontWeight: '400', textAlign: 'right' }}>{Numbers.whole(amount)}</span>
                </div>
            </div>
        </>
    )
}

export default InventorySelectionButton

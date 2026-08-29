import { Button as Btn } from '@mantine/core'
import Sounds from '@utils/sounds'

interface Props {
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
    disabled?: boolean
    children: string
    style?: React.CSSProperties
}

function Button({ onClick, disabled, children, style }: Props) {
    const clicked = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (children === 'Buy') {
            Sounds.play('buy.wav')
        } else if (children.includes('Open Chest') || children.includes('Open All')) {
            Sounds.play('open.wav')
        } else {
            Sounds.play('click.wav')
        }
        onClick(e)
    }

    return (
        <Btn
            disabled={disabled}
            onClick={clicked}
            style={{
                width: '100%',
                fontSize: '18px',
                fontWeight: '400',
                borderRadius: 0,
                backgroundColor: disabled ? 'rgb(40,40,40)' : '#354c69',
                ...style,
            }}
        >
            {children}
        </Btn>
    )
}

export default Button

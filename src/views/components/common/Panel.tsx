interface Props {
    children?: React.ReactNode
    style?: React.CSSProperties
}

function Panel({ children, style }: Props) {
    return (
        <div
            style={{
                backgroundColor: 'rgba(0,0,0,.4)',
                backgroundImage: `
                    linear-gradient(45deg, rgba(30, 30, 30, 0.2) 25%, transparent 25%),
                    linear-gradient(-45deg, rgba(30, 30, 30, 0.2) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, rgba(30, 30, 30, 0.2) 75%),
                    linear-gradient(-45deg, transparent 75%, rgba(30, 30, 30, 0.2) 75%)
                `,
                backgroundSize: '40px 40px',
                backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px',
                border: '1px solid rgba(255,255,255,.25)',
                padding: '8px',
                margin: '4px',
                position: 'relative',
                ...style,
            }}
        >
            {children}
        </div>
    )
}

export default Panel

import { Modal } from '@mantine/core'
import { useEffect, useState } from 'react'
import Button from './Button'
import Sounds from '@utils/sounds'

interface Props {
    opened: boolean
    onClose: () => void
    onConfirm: () => void
    text: string
}

function ConfirmModal({ opened, onClose, onConfirm, text }: Props) {
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight })
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const handleConfirm = () => {
        Sounds.play('click.wav')
        onConfirm()
        onClose()
    }

    const handleCancel = () => {
        Sounds.play('click.wav')
        onClose()
    }

    return (
        <>
            {opened && (
                <div
                    key={`backdrop-${windowSize.width}-${windowSize.height}`}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        zIndex: 100000000,
                        pointerEvents: 'none',
                    }}
                />
            )}
            <Modal
                opened={opened}
                onClose={handleCancel}
                title="Confirmation Popup"
                size="md"
                zIndex={100000000}
                styles={{
                    header: {
                        backgroundColor: 'rgba(20,20,20,0)',
                        color: '#fff',
                        marginBottom: '-12px',
                    },
                    body: {
                        backgroundColor: 'rgba(20,20,20,1)',
                        color: '#fff',
                    },
                    content: {
                        backgroundColor: 'rgba(20,20,20,1)',
                        zIndex: 10000000001,
                    },
                    overlay: {
                        backgroundColor: 'transparent',
                        backdropFilter: 'none',
                    },
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}
                >
                    <p style={{ fontSize: '18px', color: '#dddddd', margin: 0 }}>{text}</p>
                    <div
                        style={{
                            display: 'flex',
                            gap: '12px',
                        }}
                    >
                        <Button
                            onClick={handleCancel}
                            style={{
                                backgroundColor: '#6b2d2d',
                                flex: 1,
                            }}
                        >
                            No
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            style={{
                                backgroundColor: '#26402a',
                                flex: 1,
                            }}
                        >
                            Yes
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default ConfirmModal

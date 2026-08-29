import { useState } from 'react'
import { StateProps } from '@engine/types'
import Panel from '@components/common/Panel'
import Images from '@utils/images'
import Sounds from '@utils/sounds'
// import CoinFlip from '@components/minigames/CoinFlip'
import DirtSlots from '@components/minigames/DirtSlots'
// import HigherOrLower from '@components/minigames/HigherOrLower'
// import Keno from '@components/minigames/Keno'
// import Plinko from '@components/minigames/Plinko'

type GameId = 'coin-flip' | 'slots' | 'higher-lower' | 'keno' | 'plinko'

const GAMES: { id: GameId; name: string; description: string }[] = [
    // { id: 'coin-flip', name: 'Coin Flip', description: 'Pick heads or tails' },
    { id: 'slots', name: 'Dirt Slots', description: 'Match 3 symbols' },
    // { id: 'higher-lower', name: 'Higher or Lower', description: 'Push your luck' },
    // { id: 'keno', name: 'Keno', description: 'Pick numbers, get lucky' },
    // { id: 'plinko', name: 'Plinko', description: 'Drop balls, hit multipliers' },
]

function GamblersTavern({ state, dispatch }: StateProps) {
    const [selectedGame, setSelectedGame] = useState<GameId>('coin-flip')

    const dirtAmount = state.inventory.find((i) => i.id === 'dirt')?.amount ?? 0
    const dirtCredits = state.inventory.find((i) => i.id === 'Dirt Credits')?.amount ?? 0

    const renderGame = () => {
        switch (selectedGame) {
            // case 'coin-flip':
            //     return <CoinFlip state={state} dispatch={dispatch} />
            case 'slots':
                return <DirtSlots state={state} dispatch={dispatch} />
            // case 'higher-lower':
            //     return <HigherOrLower state={state} dispatch={dispatch} />
            // case 'keno':
            //     return <Keno state={state} dispatch={dispatch} />
            // case 'plinko':
            //     return <Plinko state={state} dispatch={dispatch} />
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '970px', margin: 'auto' }}>
            {/* Balance bar */}
            <Panel>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '4px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                        <img
                            className="pixel"
                            src={Images.get('items/dirt.png')}
                            alt="Dirt"
                            style={{ width: '20px', height: '20px' }}
                        />
                        <span>Dirt:</span>
                        <span style={{ color: 'rgb(255, 187, 0)' }}>{dirtAmount.toLocaleString()}</span>
                    </div>
                    <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                        <img
                            className="pixel"
                            src={Images.get('items/dirt-credits.png')}
                            alt="Dirt Credits"
                            style={{ width: '20px', height: '20px' }}
                        />
                        <span>Dirt Credits:</span>
                        <span style={{ color: 'rgb(255, 187, 0)' }}>{dirtCredits.toLocaleString()}</span>
                    </div>
                </div>
            </Panel>

            {/* Main layout: sidebar + game area */}
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                {/* Game selector sidebar */}
                <div style={{ width: '200px', flexShrink: 0 }}>
                    <Panel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '560px' }}>
                            {GAMES.map((game) => (
                                <div
                                    key={game.id}
                                    onClick={() => {
                                        Sounds.play('click.wav')
                                        setSelectedGame(game.id)
                                    }}
                                    className="skill-focus-btn"
                                    style={{
                                        padding: '10px 8px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedGame === game.id ? 'rgba(255, 187, 0, 0.12)' : 'transparent',
                                        borderLeft:
                                            selectedGame === game.id ? '3px solid rgb(255, 187, 0)' : '3px solid transparent',
                                    }}
                                >
                                    <div style={{ fontSize: '18px' }}>{game.name}</div>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>

                {/* Game area */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Panel>{renderGame()}</Panel>
                </div>
            </div>
        </div>
    )
}

export default GamblersTavern

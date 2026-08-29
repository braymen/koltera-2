import Panel from '@components/common/Panel'
import { StateProps } from '@engine/types'
import { Progress } from '@mantine/core'
import SkillingHelpers from '@modules/skilling/helpers'
import { Skills } from '@modules/skilling/types'
import { useEffect, useRef, useState } from 'react'


interface Props extends StateProps {
    skill: Skills
}

interface FloatingXP {
    id: string
    amount: number
    x: number
    y: number
}

let globalFloatingXPIdCounter = 0

function SkillLevelPanel({ state, skill }: Props) {
    const xp = state.skills.find((s) => s.id === skill)?.xp || 0
    const level = SkillingHelpers.getLevel(xp)
    const isMaxLevel = level >= 99
    const xpProgress = SkillingHelpers.getXpProgress(xp)
    const [floatingXPs, setFloatingXPs] = useState<FloatingXP[]>([])
    const prevXpRef = useRef(xp)
    const progressBarRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const prevXp = prevXpRef.current
        const xpGain = xp - prevXp

        if (xpGain > 0 && progressBarRef.current) {
            const rect = progressBarRef.current.getBoundingClientRect()
            const x = rect.left + rect.width / 2
            const y = rect.top + rect.height / 2

            const newFloatingXP: FloatingXP = {
                id: `xp-${skill}-${globalFloatingXPIdCounter++}-${Date.now()}`,
                amount: xpGain,
                x,
                y,
            }

            setFloatingXPs((prev) => [...prev, newFloatingXP])

            const timeoutId = setTimeout(() => {
                setFloatingXPs((prev) => prev.filter((fxp) => fxp.id !== newFloatingXP.id))
            }, 2000)

            prevXpRef.current = xp

            return () => {
                clearTimeout(timeoutId)
            }
        } else {
            prevXpRef.current = xp
        }
    }, [xp])


    return (
        <>
            <Panel style={{ position: 'relative' }}>
                <h3>{skill}</h3>
                <div style={{ lineHeight: '16px' }}>
                    <span>Level {level}</span>
                    <span style={{ float: 'right' }}>
                        {isMaxLevel
                            ? `Total ${Math.floor(xp).toLocaleString()}xp`
                            : `${Math.floor(xpProgress.current).toLocaleString()}xp / ${Math.floor(xpProgress.total).toLocaleString()}xp (Total ${Math.floor(xp).toLocaleString()}xp)`}
                    </span>
                </div>
                <div ref={progressBarRef} style={{ position: 'relative' }}>
                    <Progress
                        styles={{
                            section: { backgroundColor: 'rgba(255,255,255, 1)' },
                            root: { backgroundColor: 'rgba(255,255,255, .25)' },
                        }}
                        color={'rgba(255, 255, 255, 1)'}
                        value={(xpProgress.current / xpProgress.total) * 100}
                        style={{
                            height: '4px',
                            width: '100%',
                            marginBottom: '4px',
                        }}
                    />
                </div>
            </Panel>
            {/* Floating XP Text */}
            {floatingXPs.map((fxp) => (
                <div
                    key={fxp.id}
                    style={{
                        position: 'fixed',
                        left: `${fxp.x}px`,
                        top: `${fxp.y}px`,
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        zIndex: 10000,
                        transform: 'translate(-50%, -50%)',
                        animation: 'floatUp 2s ease-out forwards',
                    }}
                >
                    +{fxp.amount.toFixed(2)} XP
                </div>
            ))}
        </>
    )
}

export default SkillLevelPanel

import React, { useState, useRef, useEffect } from 'react'

interface TooltipProps {
    children: React.ReactNode
    content: React.ReactNode
    disabled?: boolean
    center?: boolean
    width?: string
    offsetY?: number
    inline?: boolean
}

function Tooltip({ children, content, disabled = false, center = false, width = '450px', offsetY = 0, inline = false }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const [isPositioned, setIsPositioned] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isVisible || !containerRef.current || !tooltipRef.current || disabled) return

        const updatePosition = () => {
            if (!containerRef.current || !tooltipRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            const tooltipRect = tooltipRef.current.getBoundingClientRect()
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            let top = rect.bottom + 8 + offsetY
            let left = center ? rect.left + rect.width / 2 - tooltipRect.width / 2 : rect.left

            if (left + tooltipRect.width > viewportWidth) {
                left = viewportWidth - tooltipRect.width - 8
            }
            if (top + tooltipRect.height > viewportHeight) {
                top = rect.top - tooltipRect.height - 8
            }
            if (left < 8) {
                left = 8
            }
            if (top < 8) {
                top = 8
            }

            setPosition({ top, left })
            setIsPositioned(true)
        }

        updatePosition()
        window.addEventListener('scroll', updatePosition, true)
        window.addEventListener('resize', updatePosition)

        return () => {
            window.removeEventListener('scroll', updatePosition, true)
            window.removeEventListener('resize', updatePosition)
        }
    }, [isVisible, disabled])

    if (disabled) {
        return <>{children}</>
    }

    return (
        <>
            <div
                ref={containerRef}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => { setIsVisible(false); setIsPositioned(false) }}
                style={{ display: inline ? 'inline-flex' : 'block', width: inline ? 'auto' : '100%' }}
            >
                {children}
            </div>
            {isVisible && (
                <div
                    ref={tooltipRef}
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left,
                        zIndex: 10000,
                        pointerEvents: 'none',
                        visibility: isPositioned ? 'visible' : 'hidden',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            padding: '12px',
                            borderRadius: '0px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                            width: width,
                            boxSizing: 'border-box',
                        }}
                    >
                        {content}
                    </div>
                </div>
            )}
        </>
    )
}

export default Tooltip

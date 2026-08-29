import { useEffect, useRef } from 'react'
import Button from '@components/common/Button'

interface Props {
    currentPage: number
    setCurrentPage: (page: number) => void
    totalPages: number
}

function Pagination({ currentPage, setCurrentPage, totalPages }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const parent = containerRef.current?.parentElement
        if (!parent) return

        const handleWheel = (e: WheelEvent) => {
            // If an inner scrollable element hasn't hit its boundary yet, let it scroll normally
            let el = e.target as HTMLElement | null
            while (el && el !== parent) {
                const style = window.getComputedStyle(el)
                const overflowY = style.overflowY
                const isScrollable =
                    el.scrollHeight > el.clientHeight && (overflowY === 'auto' || overflowY === 'scroll')
                const canStillScroll = e.deltaY > 0
                    ? el.scrollTop < el.scrollHeight - el.clientHeight
                    : el.scrollTop > 0
                if (isScrollable && canStillScroll) return
                el = el.parentElement
            }

            if (e.deltaY > 0) {
                setCurrentPage(Math.min(currentPage + 1, totalPages))
            } else if (e.deltaY < 0) {
                setCurrentPage(Math.max(currentPage - 1, 1))
            }
        }

        parent.addEventListener('wheel', handleWheel)
        return () => parent.removeEventListener('wheel', handleWheel)
    }, [currentPage, totalPages, setCurrentPage])

    if (totalPages === 0) {
        currentPage = 1
        totalPages = 1
    }

    return (
        <div ref={containerRef} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <Button
                disabled={currentPage <= 1}
                onClick={() => {
                    setCurrentPage(Math.max(currentPage - 1, 1))
                }}
                style={{ width: '80px', fontSize: '18px', fontWeight: '400', padding: 0 }}
            >
                &lt;
            </Button>
            <span>
                {currentPage}/{totalPages}
            </span>
            <Button
                disabled={currentPage === totalPages}
                onClick={() => {
                    setCurrentPage(Math.min(currentPage + 1, totalPages))
                }}
                style={{ width: '80px', fontSize: '18px', fontWeight: '400', padding: 0 }}
            >
                &gt;
            </Button>
        </div>
    )
}

export default Pagination

import { useEffect } from 'react'

const Steam = () => {
    useEffect(() => {
        const canvas = document.createElement('canvas')
        canvas.id = 'fake-refresh-steam'
        canvas.width = 1
        canvas.height = 1
        canvas.style.position = 'fixed'
        canvas.style.top = '0px'
        canvas.style.bottom = '0px'
        canvas.style.width = '100vw'
        canvas.style.height = '100vh'
        canvas.style.pointerEvents = 'none'
        canvas.style.zIndex = '30000'
        document.body.appendChild(canvas)

        const ctx = canvas.getContext('2d')!
        let animationFrameId: number | null = null

        const gameLoop = () => {
            ctx.clearRect(0, 0, 1, 1)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.01)'
            ctx.fillRect(0, 0, 1, 1)
            animationFrameId = requestAnimationFrame(gameLoop)
        }

        animationFrameId = requestAnimationFrame(gameLoop)

        return () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId)
            }
            document.body.removeChild(canvas)
        }
    }, [])

    return <></>
}

export default Steam

import { useState, useEffect, useRef } from 'react'
import ItemsContent from '@data/items'
import Images from '@utils/images'
import Sounds from './sounds'

interface FloatingNotification {
    id: string
    itemId: string
    amount: number
    x: number
    startY: number
    delay: number
}

const MAX_QUEUED_NOTIFICATIONS = 30

let notificationIdCounter = 0
let notificationQueue: FloatingNotification[] = []
let pendingBatch: Map<string, number> = new Map()
let currentSettings = {
    enableNotifications: true,
    enableNotificationSounds: true,
}

export const updateFloatingNotificationSettings = (settings: { enableNotifications: boolean; enableNotificationSounds?: boolean }) => {
    currentSettings = { ...currentSettings, ...settings }
}

export const addFloatingNotification = (itemId: string, amount: number) => {
    if (!currentSettings.enableNotifications) return

    // Batch same-item notifications between drain intervals
    pendingBatch.set(itemId, (pendingBatch.get(itemId) || 0) + amount)
}

const flushBatch = () => {
    if (pendingBatch.size === 0) return

    pendingBatch.forEach((amount, itemId) => {
        if (notificationQueue.length >= MAX_QUEUED_NOTIFICATIONS) return

        const x = window.innerWidth * (0.2 + Math.random() * 0.55) + 200
        const startY = 0 + Math.random() * 40
        const delay = Math.random() * 500

        notificationQueue.push({
            id: `notification-${notificationIdCounter++}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            itemId,
            amount,
            x,
            startY,
            delay,
        })
    })
    pendingBatch.clear()
}

export const FloatingNotificationsRenderer = () => {
    const [notifications, setNotifications] = useState<FloatingNotification[]>([])
    const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())
    const soundTimeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set())
    useEffect(() => {
        const interval = setInterval(() => {
            flushBatch()
            if (notificationQueue.length > 0) {
                const pending = notificationQueue
                notificationQueue = []
                pending.forEach((notification) => {
                    if (currentSettings.enableNotificationSounds) {
                        const t = setTimeout(() => {
                            Sounds.play('pop.wav')
                            soundTimeoutRefs.current.delete(t)
                        }, notification.delay)
                        soundTimeoutRefs.current.add(t)
                    }
                })
                setNotifications((prev) => [...prev, ...pending])
            }
        }, 50)

        return () => {
            clearInterval(interval)
            soundTimeoutRefs.current.forEach((t) => clearTimeout(t))
            soundTimeoutRefs.current.clear()
        }
    }, [])
    useEffect(() => {
        notifications.forEach((notification) => {
            if (timeoutRefs.current.has(notification.id)) {
                return
            }
            const timeoutId = setTimeout(() => {
                setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
                timeoutRefs.current.delete(notification.id)
            }, notification.delay + 2500)

            timeoutRefs.current.set(notification.id, timeoutId)
        })
        const currentIds = new Set(notifications.map((n) => n.id))
        timeoutRefs.current.forEach((timeout, id) => {
            if (!currentIds.has(id)) {
                clearTimeout(timeout)
                timeoutRefs.current.delete(id)
            }
        })
    }, [notifications])
    useEffect(() => {
        const timeoutMap = timeoutRefs.current

        return () => {
            timeoutMap.forEach((timeout) => clearTimeout(timeout))
            timeoutMap.clear()
        }
    }, [])

    return (
        <>
            {notifications.map((notification) => {
                const item = ItemsContent.getById(notification.itemId)
                if (!item) return null

                return (
                    <div
                        key={notification.id}
                        style={{
                            position: 'fixed',
                            left: `${notification.x}px`,
                            bottom: `${notification.startY}px`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#4ade80',
                            fontSize: '20px',
                            fontWeight: '400',
                            pointerEvents: 'none',
                            zIndex: 1000000,
                            transform: 'translateX(-50%)',
                            opacity: 0,
                            animation: `floatUpResource 2.5s ease-out ${notification.delay}ms forwards`,
                            padding: '4px 12px',
                            borderRadius: '0px',
                        }}
                    >
                        <img
                            className="pixel"
                            src={Images.get(item.image)}
                            alt={item.name}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <span>
                            +{notification.amount} {item.name}
                        </span>
                    </div>
                )
            })}
        </>
    )
}

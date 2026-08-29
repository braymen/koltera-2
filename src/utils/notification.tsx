import { addFloatingNotification, updateFloatingNotificationSettings } from './floating-notifications'

// Store current settings for notifications (always enabled with default duration)
let currentNotificationSettings = {
    enableNotifications: true,
    notificationDuration: 1000,
}

export const updateNotificationSettings = (settings: { enableNotifications: boolean; notificationDuration: number }) => {
    currentNotificationSettings = settings
    updateFloatingNotificationSettings({ enableNotifications: settings.enableNotifications })
}

export const ResourceNotification = (itemId: string, amount: number) => {
    if (!currentNotificationSettings.enableNotifications) return

    // Use floating notification system instead of Mantine notifications
    addFloatingNotification(itemId, amount)
}
export default ResourceNotification

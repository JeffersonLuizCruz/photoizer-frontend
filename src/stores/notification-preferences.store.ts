import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotificationPreferencesState {
  browserNotificationsEnabled: boolean
  notifyOnlyWhenHidden: boolean
  setBrowserNotificationsEnabled: (enabled: boolean) => void
  setNotifyOnlyWhenHidden: (enabled: boolean) => void
}

export const useNotificationPreferences = create<NotificationPreferencesState>()(
  persist(
    (set) => ({
      browserNotificationsEnabled: false,
      notifyOnlyWhenHidden: true,
      setBrowserNotificationsEnabled: (enabled) => set({ browserNotificationsEnabled: enabled }),
      setNotifyOnlyWhenHidden: (enabled) => set({ notifyOnlyWhenHidden: enabled }),
    }),
    { name: 'photoizer-notification-preferences' },
  ),
)

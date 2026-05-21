import { useState, useCallback } from 'react'
import { getToken } from '../lib/firebase'
import { messaging } from '../lib/firebase'
import { supabase } from '../lib/supabase'

const VAPID_KEY =
  'BOjQF-IeWa3EoEJJqnETQRnXv0y084VIJrquDl01iMw3cl5fieg6FEGQHnJcrrHi-06ORTIDsaOdmgLem-JFUUs'

const isNotificationSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator

export function usePushNotifications() {
  const isSupported = isNotificationSupported()

  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'denied'
  )
  const [token, setToken] = useState<string | null>(null)

  const requestPermission = useCallback(async (): Promise<string | null> => {
    if (!isSupported || !messaging) return null

    const result = await Notification.requestPermission()
    setPermission(result)
    if (result !== 'granted') return null

    try {
      const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY })
      if (!fcmToken) return null
      setToken(fcmToken)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase.from('fcm_tokens').upsert(
          {
            user_id: user.id,
            token: fcmToken,
            platform: 'web',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'token' }
        )
      }

      return fcmToken
    } catch (err) {
      console.error('FCM token error:', err)
      return null
    }
  }, [isSupported])

  return { isSupported, permission, token, requestPermission }
}

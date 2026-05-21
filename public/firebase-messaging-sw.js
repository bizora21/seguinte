importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyDHCrbFpuvrsm-mwSmf9R_U9lGtIsikZQk',
  authDomain: 'lojarapida-e7f56.firebaseapp.com',
  projectId: 'lojarapida-e7f56',
  storageBucket: 'lojarapida-e7f56.firebasestorage.app',
  messagingSenderId: '99227969555',
  appId: '1:99227969555:web:adf5b9c5f6ec4cb93377e6',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {}
  const data = payload.data || {}

  const isNewOrder = data.type === 'new_order'

  const title = notification.title || (isNewOrder ? '🔴 Nova Encomenda!' : 'LojaRápida')
  const body  = notification.body  || ''
  const icon  = notification.icon  || '/logo.png'
  const image = notification.image || data.image || undefined
  const url   = data.url || '/'

  const options = {
    body,
    icon,
    badge: '/logo.png',
    image,
    vibrate: isNewOrder ? [500, 200, 500, 200, 500] : [200, 100, 200],
    tag: isNewOrder ? 'new-order' : undefined,
    requireInteraction: isNewOrder,   // mantém visível até o vendedor interagir
    data: { url, type: data.type },
    ...(isNewOrder ? {
      actions: [
        { action: 'view_order', title: 'Ver encomenda →' },
        { action: 'dismiss',    title: 'Ignorar' },
      ],
    } : {}),
  }

  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const data   = event.notification.data || {}

  // "Ignorar" — apenas fecha, sem abrir nada
  if (action === 'dismiss') return

  // Qualquer outro clique (incluindo 'view_order' e clique no corpo)
  const target = data.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se já há uma tab aberta no mesmo origin, foca e navega
      for (const client of windowClients) {
        try {
          const clientUrl = new URL(client.url)
          if (clientUrl.origin === self.location.origin) {
            client.focus()
            client.navigate(target)
            return
          }
        } catch {}
      }
      // Senão, abre nova tab
      return clients.openWindow(target)
    })
  )
})

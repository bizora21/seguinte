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
  const { title, body, icon } = payload.notification || {}
  self.registration.showNotification(title || 'LojaRápida', {
    body: body || '',
    icon: icon || '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: payload.data || {},
  })
})

// Ao clicar na notificação, abre o URL indicado
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})

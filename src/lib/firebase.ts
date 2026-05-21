import { initializeApp, getApps } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'
export { getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'AIzaSyDHCrbFpuvrsm-mwSmf9R_U9lGtIsikZQk',
  authDomain: 'lojarapida-e7f56.firebaseapp.com',
  projectId: 'lojarapida-e7f56',
  storageBucket: 'lojarapida-e7f56.firebasestorage.app',
  messagingSenderId: '99227969555',
  appId: '1:99227969555:web:adf5b9c5f6ec4cb93377e6',
}

export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// messaging só existe em contexto de browser com SW support
export const messaging =
  typeof window !== 'undefined' ? getMessaging(app) : null

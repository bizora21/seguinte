import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const AuthDebug = () => {
  const { user, loading } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-yellow-50 border-yellow-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Debug - Auth Status</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-1">
        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        <div><strong>User:</strong> {user ? 'Logged in' : 'Not logged in'}</div>
        {user && (
          <>
            <div><strong>ID:</strong> {user.id}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Role:</strong> {user.profile?.role || 'No profile'}</div>
            <div><strong>Store:</strong> {user.profile?.store_name || 'N/A'}</div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default AuthDebug
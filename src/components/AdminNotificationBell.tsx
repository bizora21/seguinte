import React, { useState, useEffect } from 'react'
import { Bell, Check, Clock, X, Receipt, AlertTriangle } from 'lucide-react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Badge } from './ui/badge'
import { getUnreadNotificationsCount, getRecentNotifications, markNotificationAsRead, AdminNotification } from '../utils/admin'
import { supabase } from '../lib/supabase'
import { showSuccess, showError } from '../utils/toast'
import LoadingSpinner from './LoadingSpinner'

interface AdminNotificationBellProps {
  isAdmin: boolean
}

const AdminNotificationBell: React.FC<AdminNotificationBellProps> = ({ isAdmin }) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    if (!isAdmin) return
    setLoading(true)
    const count = await getUnreadNotificationsCount()
    setUnreadCount(count)
    const recent = await getRecentNotifications()
    setNotifications(recent)
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) {
      fetchNotifications()
      
      // Setup Realtime Subscription for Admin Notifications
      const channel = supabase
        .channel('admin_notifications_realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_notifications',
          },
          (payload) => {
            console.log('Realtime: New admin notification received:', payload)
            // Update count and fetch new list
            setUnreadCount(prev => prev + 1)
            fetchNotifications()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'admin_notifications',
          },
          (payload) => {
            // Handle marking as read from another session
            if (payload.new.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
            fetchNotifications()
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime: Admin notifications subscription active')
          }
        })

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [isAdmin])

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markNotificationAsRead(notificationId)
    if (success) {
      setUnreadCount(prev => Math.max(0, prev - 1))
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n))
      showSuccess('Notificação marcada como lida.')
    } else {
      showError('Falha ao marcar como lida.')
    }
  }
  
  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(new Date(dateString))
  }
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'delivery_confirmed':
        return <Check className="w-4 h-4 text-green-600" />
      case 'payment_approved':
        return <Receipt className="w-4 h-4 text-blue-600" />
      case 'payment_rejected':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  if (!isAdmin) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notificações
          <Badge variant="secondary">{unreadCount} não lidas</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center">
            <LoadingSpinner size="sm" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Nenhuma notificação recente.
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem 
              key={n.id} 
              className={`flex flex-col items-start space-y-1 p-3 cursor-pointer h-auto ${n.is_read ? 'bg-gray-50 text-gray-600' : 'bg-white font-medium'}`}
              onClick={() => !n.is_read && handleMarkAsRead(n.id)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-1">
                  {getIcon(n.type)}
                  <span className="text-sm font-semibold">
                    {n.type === 'delivery_confirmed' ? 'Entrega Confirmada' : 
                     n.type === 'payment_approved' ? 'Pagamento Aprovado' :
                     n.type === 'payment_rejected' ? 'Pagamento Rejeitado' : 'Novo Evento'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{formatTime(n.created_at)}</span>
              </div>
              <p className={`text-xs w-full break-words ${n.is_read ? 'text-gray-500' : 'text-gray-800'}`}>{n.message}</p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default AdminNotificationBell
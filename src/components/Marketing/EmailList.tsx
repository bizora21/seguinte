import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { Mail, RefreshCw, User, Store, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showError } from '../../utils/toast'
import LoadingSpinner from '../LoadingSpinner'
import { Profile } from '../../types/auth'

interface EmailListProps {
  role: 'cliente' | 'vendedor'
}

const EmailList: React.FC<EmailListProps> = ({ role }) => {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, store_name, created_at')
        .eq('role', role)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (error: any) {
      showError(`Erro ao carregar e-mails de ${role}: ` + error.message)
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString))
  }

  const getRoleBadge = (role: string) => {
    if (role === 'vendedor') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><Store className="w-3 h-3 mr-1" /> Vendedor</Badge>
    }
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><User className="w-3 h-3 mr-1" /> Cliente</Badge>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-xl">
          <Mail className="w-6 h-6 mr-2 text-blue-600" />
          Lista de E-mails ({role === 'cliente' ? 'Clientes' : 'Vendedores'}) ({profiles.length})
        </CardTitle>
        <Button onClick={fetchProfiles} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhum perfil de {role} encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Nome/Loja</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.email}</TableCell>
                    <TableCell>{profile.store_name || profile.email.split('@')[0]}</TableCell>
                    <TableCell>{getRoleBadge(profile.role)}</TableCell>
                    <TableCell>{formatDate(profile.created_at || '')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default EmailList
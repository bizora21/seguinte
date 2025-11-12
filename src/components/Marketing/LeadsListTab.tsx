import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { Users, RefreshCw, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showError } from '../../utils/toast'
import LoadingSpinner from '../LoadingSpinner'

interface Lead {
  id: string
  email: string
  source: string | null
  status: string | null
  created_at: string
}

const LeadsListTab = () => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error: any) {
      showError('Erro ao carregar leads: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-xl">
          <Users className="w-6 h-6 mr-2 text-blue-600" />
          Base de Leads ({leads.length})
        </CardTitle>
        <Button onClick={fetchLeads} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum lead capturado</h2>
            <p className="text-gray-600">Ative o pop-up de captura para começar a construir sua lista.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Inscrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.source || 'Desconhecida'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lead.status === 'subscribed' ? 'default' : 'secondary'} className={lead.status === 'subscribed' ? 'bg-green-100 text-green-800' : ''}>
                        {lead.status || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(lead.created_at)}</TableCell>
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

export default LeadsListTab
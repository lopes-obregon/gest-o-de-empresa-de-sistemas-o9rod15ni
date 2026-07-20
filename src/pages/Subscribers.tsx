import { useEffect, useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import {
  getSubscribers,
  updateSubscriber,
  deleteSubscriber,
  pullExternalSubscribers,
  SystemSubscriber,
} from '@/services/system-subscribers'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2, Search, AlertTriangle, Users2, RefreshCw } from 'lucide-react'
import { SubscriberFormDialog } from '@/components/SubscriberFormDialog'
import { useToast } from '@/hooks/use-toast'

export default function Subscribers() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [subscribers, setSubscribers] = useState<SystemSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [syncing, setSyncing] = useState(false)

  const loadData = async () => {
    const s = await getSubscribers()
    setSubscribers(s)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('system_subscribers', loadData)

  const filtered = useMemo(() => {
    return subscribers.filter((s) => {
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || s.payment_status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [subscribers, search, statusFilter])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await pullExternalSubscribers()
      toast({
        title: 'Sincronização concluída',
        description: `${result.created} novos assinantes, ${result.updated} atualizados.`,
      })
      loadData()
    } catch (err: any) {
      const status = err?.status || err?.response?.status || 0
      let description = 'Não foi possível sincronizar com o sistema externo.'
      if (status === 401) {
        description = 'Token de autenticação inválido ou não configurado no sistema externo.'
      } else if (status === 404) {
        description = 'Endpoint do sistema externo não encontrado.'
      } else if (status === 502) {
        description = 'Falha ao conectar com o sistema externo. Tente novamente.'
      }
      toast({
        title: 'Falha na sincronização',
        description,
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const togglePaymentStatus = async (s: SystemSubscriber) => {
    const newStatus = s.payment_status === 'em_dia' ? 'pendente' : 'em_dia'
    try {
      await updateSubscriber(s.id, { payment_status: newStatus })
      toast({ title: `Status alterado para ${newStatus === 'em_dia' ? 'Em Dia' : 'Pendente'}` })
      loadData()
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSubscriber(id)
      toast({ title: 'Assinante excluído' })
      loadData()
    } catch {
      toast({ title: 'Erro ao excluir assinante', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assinantes do Sistema</h2>
          <p className="text-slate-500">
            Clientes do sistema integrado e seus status de pagamento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Assinantes'}
          </Button>
          <SubscriberFormDialog onSaved={loadData} />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <p>
          Assinantes com status <strong>Pendente</strong> estão restritos de utilizar o sistema
          integrado. O acesso é liberado apenas quando o pagamento está <strong>Em Dia</strong>.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="em_dia">Em Dia</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-indigo-600" />
            Assinantes ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Nenhum assinante encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>ID Externo</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow
                      key={s.id}
                      className={s.payment_status === 'pendente' ? 'bg-red-50/50' : ''}
                    >
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-slate-600">{s.email}</TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {s.external_id || '—'}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => togglePaymentStatus(s)}
                          className="inline-flex items-center"
                        >
                          <Badge
                            variant={s.payment_status === 'pendente' ? 'destructive' : 'default'}
                            className={
                              s.payment_status === 'pendente'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer transition-colors'
                                : 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer transition-colors'
                            }
                          >
                            {s.payment_status === 'pendente' ? 'Pendente' : 'Em Dia'}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            s.access_status === 'active'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-200 text-slate-500'
                          }
                        >
                          {s.access_status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <SubscriberFormDialog subscriber={s} onSaved={loadData} />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle>Confirmar Exclusão</DialogTitle>
                              </DialogHeader>
                              <p className="text-sm text-slate-600 py-2">
                                Deseja realmente excluir o assinante <strong>{s.name}</strong>?
                              </p>
                              <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline">Cancelar</Button>
                                <Button variant="destructive" onClick={() => handleDelete(s.id)}>
                                  Excluir
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

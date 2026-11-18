import { useEffect, useState, useMemo, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
  getSubscribers,
  updateSubscriber,
  deleteSubscriber,
  pullExternalSubscribers,
  checkSubscriberExpiry,
  SystemSubscriber,
} from '@/services/system-subscribers'
import { getSystems, SubscriberSystem } from '@/services/subscriber-systems'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Trash2,
  Search,
  AlertTriangle,
  Users2,
  RefreshCw,
  BellRing,
  CheckCircle2,
  Pencil,
  Clock,
  XCircle,
} from 'lucide-react'
import { SubscriberFormDialog } from '@/components/SubscriberFormDialog'
import { SystemTabDialog } from '@/components/SystemTabDialog'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/format'

type StatusFilter = 'all' | 'em_dia' | 'pendente' | 'vencido'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'em_dia', label: 'Em Dia' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'vencido', label: 'Vencido' },
]

// Mesma lógica de dias restantes usada nos badges da tabela.
const getDaysRemaining = (expiryDateStr?: string): number | null => {
  if (!expiryDateStr) return null
  try {
    const expiry = new Date(expiryDateStr)
    if (isNaN(expiry.getTime())) return null
    const now = new Date()
    const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    const expiryUtc = new Date(Date.UTC(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()))
    const diffMs = expiryUtc.getTime() - todayUtc.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

export default function Subscribers() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [subscribers, setSubscribers] = useState<SystemSubscriber[]>([])
  const [systems, setSystems] = useState<SubscriberSystem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [activeSystemId, setActiveSystemId] = useState<string>('')
  const [syncing, setSyncing] = useState(false)
  const [checkingExpiry, setCheckingExpiry] = useState(false)
  const [markingPayment, setMarkingPayment] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [s, sys] = await Promise.all([getSubscribers(), getSystems()])
    setSubscribers(s)
    setSystems(sys)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('system_subscribers', loadData)

  // Quando os sistemas carregam (ou mudam), garante que a aba ativa é válida.
  useEffect(() => {
    if (systems.length === 0) return
    if (!systems.some((s) => s.id === activeSystemId)) {
      setActiveSystemId(systems[0].id)
    }
  }, [systems, activeSystemId])

  const activeSystem = systems.find((s) => s.id === activeSystemId) || systems[0]

  // Assinantes do sistema ativo. Assinantes sem sistema (ex: criados por
  // sincronização externa antes da feature) caem na primeira aba (padrão).
  const systemSubscribers = useMemo(() => {
    if (!activeSystem) return []
    return subscribers.filter((s) => (s.system || systems[0]?.id || '') === activeSystem.id)
  }, [subscribers, systems, activeSystem])

  const counts = useMemo(() => {
    const c = { total: systemSubscribers.length, em_dia: 0, pendente: 0, vencido: 0 }
    for (const s of systemSubscribers) {
      const days = getDaysRemaining(s.expiry_date)
      if (s.payment_status === 'em_dia' && days !== null && days <= 0) c.vencido++
      else if (s.payment_status === 'em_dia') c.em_dia++
      else c.pendente++
    }
    return c
  }, [systemSubscribers])

  const filtered = useMemo(() => {
    return systemSubscribers.filter((s) => {
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
      const days = getDaysRemaining(s.expiry_date)
      const isExpired = s.payment_status === 'em_dia' && days !== null && days <= 0
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'vencido' && isExpired) ||
        (statusFilter !== 'vencido' && s.payment_status === statusFilter)
      return matchesSearch && matchesStatus
    })
  }, [systemSubscribers, search, statusFilter])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await pullExternalSubscribers()
      toast({
        title: 'Sincronização concluída',
        description: `${result.created} novos assinantes, ${result.updated} atualizados.`,
      })
      loadData()
    } catch (err: unknown) {
      const errorObj = err as
        | {
            status?: number
            response?: { status?: number; data?: { error?: string; message?: string } }
            data?: { message?: string; error?: string }
            message?: string
          }
        | undefined
      const status = errorObj?.status || errorObj?.response?.status || 0
      const serverMessage =
        errorObj?.response?.data?.message ||
        errorObj?.response?.data?.error ||
        errorObj?.data?.message ||
        errorObj?.data?.error ||
        errorObj?.message
      let description = 'Não foi possível sincronizar com o sistema externo.'
      if (
        serverMessage &&
        !serverMessage.startsWith('ClientResponseError 502') &&
        !serverMessage.startsWith('Failed to load resource')
      ) {
        description = serverMessage
      } else if (status === 401) {
        description = 'Token de autenticação inválido ou não configurado no sistema externo.'
      } else if (status === 404) {
        description = 'Endpoint do sistema externo não encontrado.'
      } else if (status === 502) {
        description =
          'O sistema externo está indisponível (erro 502). Verifique se o servidor da API externa está no ar.'
      }
      toast({ title: 'Falha na sincronização', description, variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }

  const handleCheckExpiry = async () => {
    setCheckingExpiry(true)
    try {
      const result = await checkSubscriberExpiry()
      const statusUpdateMsg =
        result.status_updated_pendente && result.status_updated_pendente > 0
          ? `, ${result.status_updated_pendente} alterados para pendente`
          : ''
      toast({
        title: 'Verificação concluída',
        description: `${result.notified} notificações enviadas${statusUpdateMsg}, ${result.skipped} ignorados, ${result.errors} erros.`,
      })
      loadData()
    } catch (err: unknown) {
      const errorObj = err as
        | { response?: { data?: { message?: string } }; message?: string }
        | undefined
      const serverMessage = errorObj?.response?.data?.message || errorObj?.message
      toast({
        title: 'Falha ao verificar vencimentos',
        description: serverMessage || 'Erro ao executar verificação.',
        variant: 'destructive',
      })
    } finally {
      setCheckingExpiry(false)
    }
  }

  const buildErrorToast = (err: unknown, fallback: string) => {
    const errorObj = err as
      | {
          status?: number
          response?: { status?: number; data?: { message?: string; error?: string } }
          data?: { message?: string; error?: string }
          message?: string
        }
      | undefined
    const status = errorObj?.status || errorObj?.response?.status || 0
    const serverMessage =
      errorObj?.response?.data?.message ||
      errorObj?.response?.data?.error ||
      errorObj?.data?.message ||
      errorObj?.data?.error ||
      errorObj?.message
    let description = fallback
    if (serverMessage && !serverMessage.startsWith('ClientResponseError 502')) {
      description = serverMessage
    } else if (status === 502) {
      description = 'O sistema externo está indisponível (erro 502).'
    }
    return { title: 'Erro ao atualizar assinante', description, variant: 'destructive' as const }
  }

  // Marca como pago e RENOVA o prazo: nova expiração = hoje + plan_days.
  const markAsPaid = async (s: SystemSubscriber) => {
    setMarkingPayment(s.id)
    try {
      const planDays = s.plan_days && s.plan_days > 0 ? s.plan_days : 30
      const today = new Date()
      const newExpiry = new Date(
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) +
          planDays * 24 * 60 * 60 * 1000,
      )
      const expiryIso = newExpiry.toISOString().replace('T', ' ').substring(0, 19) + 'Z'
      await updateSubscriber(s.id, {
        payment_status: 'em_dia',
        expiry_date: expiryIso,
        sync_error: '',
      })
      toast({
        title: 'Pagamento registrado!',
        description: `Novo vencimento: ${formatDate(expiryIso)} (${planDays} dias).`,
      })
      loadData()
    } catch (err) {
      toast(buildErrorToast(err, 'Não foi possível registrar o pagamento.'))
    } finally {
      setMarkingPayment(null)
    }
  }

  // Toggle do badge: para 'em_dia' → 'pendente' apenas marca como pendente;
  // para 'pendente' → 'em_dia' registra o pagamento e renova o prazo.
  const togglePaymentStatus = async (s: SystemSubscriber) => {
    if (s.payment_status === 'pendente') {
      await markAsPaid(s)
      return
    }
    try {
      await updateSubscriber(s.id, { payment_status: 'pendente' })
      toast({ title: 'Status alterado para Pendente' })
      loadData()
    } catch (err) {
      toast(buildErrorToast(err, 'Erro ao atualizar status.'))
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

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assinantes do Sistema</h2>
          <p className="text-slate-500">
            Organizados por sistema vendido — crie uma aba para cada novo sistema.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCheckExpiry}
            disabled={checkingExpiry}
            className="border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <BellRing className={`mr-2 h-4 w-4 ${checkingExpiry ? 'animate-spin' : ''}`} />
            {checkingExpiry ? 'Verificando...' : 'Verificar Vencimentos'}
          </Button>
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Assinantes'}
          </Button>
          <SubscriberFormDialog
            onSaved={loadData}
            systems={systems}
            defaultSystemId={activeSystem?.id}
          />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <p>
          Assinantes com status <strong>Pendente</strong> estão restritos de utilizar o sistema
          integrado. O acesso é liberado apenas quando o pagamento está <strong>Em Dia</strong>.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      ) : systems.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-slate-500">
            Nenhum sistema cadastrado. Clique em <strong>Nova Aba</strong> para criar o primeiro.
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeSystemId} onValueChange={setActiveSystemId}>
          <div className="flex items-center gap-2">
            <TabsList className="flex-wrap h-auto">
              {systems.map((sys) => (
                <TabsTrigger key={sys.id} value={sys.id} className="gap-1.5">
                  {sys.name}
                  {!sys.active && <span className="text-xs text-slate-400">(inativo)</span>}
                </TabsTrigger>
              ))}
            </TabsList>
            <SystemTabDialog
              onSaved={loadData}
              onDeleted={() => {
                setActiveSystemId('')
                loadData()
              }}
            />
          </div>

          {systems.map((sys) => {
            const sysSubs = subscribers.filter((s) => (s.system || systems[0]?.id || '') === sys.id)
            const sysCounts = { total: sysSubs.length, em_dia: 0, pendente: 0, vencido: 0 }
            for (const s of sysSubs) {
              const days = getDaysRemaining(s.expiry_date)
              if (s.payment_status === 'em_dia' && days !== null && days <= 0) sysCounts.vencido++
              else if (s.payment_status === 'em_dia') sysCounts.em_dia++
              else sysCounts.pendente++
            }
            const isActive = sys.id === activeSystem?.id

            return (
              <TabsContent key={sys.id} value={sys.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{sys.name}</h3>
                    {sys.description && <p className="text-sm text-slate-500">{sys.description}</p>}
                  </div>
                  <SystemTabDialog system={sys} onSaved={loadData} onDeleted={loadData} />
                </div>

                {isActive && (
                  <>
                    {/* Contadores resumo do sistema */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6 pb-4 flex items-center gap-3">
                          <Users2 className="h-5 w-5 text-indigo-600" />
                          <div>
                            <p className="text-2xl font-bold">{sysCounts.total}</p>
                            <p className="text-xs text-slate-500">Total</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 pb-4 flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <div>
                            <p className="text-2xl font-bold text-emerald-700">
                              {sysCounts.em_dia}
                            </p>
                            <p className="text-xs text-slate-500">Em Dia</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 pb-4 flex items-center gap-3">
                          <Clock className="h-5 w-5 text-amber-600" />
                          <div>
                            <p className="text-2xl font-bold text-amber-700">
                              {sysCounts.pendente}
                            </p>
                            <p className="text-xs text-slate-500">Pendente</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 pb-4 flex items-center gap-3">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="text-2xl font-bold text-red-700">{sysCounts.vencido}</p>
                            <p className="text-xs text-slate-500">Vencido</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Sub-filtros + busca */}
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
                      <div className="flex flex-wrap gap-2">
                        {STATUS_FILTERS.map((f) => (
                          <button
                            key={f.value}
                            type="button"
                            onClick={() => setStatusFilter(f.value)}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                              statusFilter === f.value
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users2 className="w-5 h-5 text-indigo-600" />
                          Assinantes ({filtered.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {filtered.length === 0 ? (
                          <p className="text-center text-slate-500 py-8">
                            Nenhum assinante neste sistema com os filtros atuais.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nome</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>ID Externo</TableHead>
                                  <TableHead>Vencimento</TableHead>
                                  <TableHead>Dias Restantes</TableHead>
                                  <TableHead>Pagamento</TableHead>
                                  <TableHead>Acesso</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filtered.map((s) => {
                                  const daysRemaining = getDaysRemaining(s.expiry_date)
                                  const isExpired = daysRemaining !== null && daysRemaining <= 0
                                  const isRowHighlighted =
                                    s.payment_status === 'pendente' || isExpired
                                  return (
                                    <TableRow
                                      key={s.id}
                                      className={isRowHighlighted ? 'bg-red-50/50' : ''}
                                    >
                                      <TableCell className="font-medium">{s.name}</TableCell>
                                      <TableCell className="text-slate-600">{s.email}</TableCell>
                                      <TableCell className="text-slate-500 text-sm">
                                        {s.external_id || '—'}
                                      </TableCell>
                                      <TableCell className="text-slate-600 text-sm">
                                        {s.expiry_date ? formatDate(s.expiry_date) : '—'}
                                      </TableCell>
                                      <TableCell>
                                        {daysRemaining === null ? (
                                          <Badge
                                            variant="outline"
                                            className="bg-slate-50 text-slate-500 border-slate-200"
                                          >
                                            —
                                          </Badge>
                                        ) : daysRemaining > 7 ? (
                                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-medium">
                                            {daysRemaining} dias
                                          </Badge>
                                        ) : daysRemaining > 0 ? (
                                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none font-medium">
                                            {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-medium">
                                            Vencido ({Math.abs(daysRemaining)}d)
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {s.payment_status === 'pendente' ? (
                                          <Button
                                            size="sm"
                                            onClick={() => markAsPaid(s)}
                                            disabled={markingPayment === s.id}
                                            className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
                                          >
                                            <CheckCircle2
                                              className={`mr-1 h-3.5 w-3.5 ${markingPayment === s.id ? 'animate-pulse' : ''}`}
                                            />
                                            {markingPayment === s.id
                                              ? 'Registrando...'
                                              : 'Marcar como Pago'}
                                          </Button>
                                        ) : (
                                          <button
                                            onClick={() => togglePaymentStatus(s)}
                                            className="inline-flex items-center"
                                            title="Clique para marcar como Pendente"
                                          >
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer transition-colors">
                                              Em Dia
                                            </Badge>
                                          </button>
                                        )}
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
                                          <SubscriberFormDialog
                                            subscriber={s}
                                            onSaved={loadData}
                                            systems={systems}
                                          />
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
                                                Deseja realmente excluir o assinante{' '}
                                                <strong>{s.name}</strong>?
                                              </p>
                                              <div className="flex justify-end gap-2 pt-2">
                                                <Button variant="outline">Cancelar</Button>
                                                <Button
                                                  variant="destructive"
                                                  onClick={() => handleDelete(s.id)}
                                                >
                                                  Excluir
                                                </Button>
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </div>
  )
}

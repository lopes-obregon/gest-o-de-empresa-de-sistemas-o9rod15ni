import { useEffect, useState } from 'react'
import {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  Budget,
  BudgetWithItems,
  BudgetStatus,
  CreateBudgetItemInput,
} from '@/services/budgets'
import { getServices, createService, ServiceItem } from '@/services/services'
import { getClients, Client } from '@/services/clients'
import { useRealtime } from '@/hooks/use-realtime'
import { generateBudgetPdf } from '@/lib/budget-pdf'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/format'
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Printer,
  Calendar,
  Layers,
  Search,
  Building2,
  User,
  PlusCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const STATUS_MAP: Record<BudgetStatus, { label: string; class: string }> = {
  rascunho: { label: 'Rascunho', class: 'bg-slate-100 text-slate-800' },
  enviado: { label: 'Enviado', class: 'bg-blue-100 text-blue-800' },
  aprovado: { label: 'Aprovado', class: 'bg-emerald-100 text-emerald-800' },
  recusado: { label: 'Recusado', class: 'bg-rose-100 text-rose-800' },
}

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')

  // Diálogo Principal (Criar / Editar Orçamento)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithItems | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Diálogo para Cadastrar Serviço "Na Hora"
  const [quickServiceDialogOpen, setQuickServiceDialogOpen] = useState(false)
  const [quickServiceForm, setQuickServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    unit: 'un',
  })
  const [isCreatingQuickService, setIsCreatingQuickService] = useState(false)

  // Diálogo de confirmação de exclusão
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null)

  // Visualização e Impressão direta de detalhes
  const [viewBudgetModal, setViewBudgetModal] = useState<BudgetWithItems | null>(null)

  const { toast } = useToast()

  // Form State
  const [clientName, setClientName] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string>('custom')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus>('rascunho')
  const [budgetDate, setBudgetDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [validUntil, setValidUntil] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<CreateBudgetItemInput[]>([])

  const loadData = async () => {
    try {
      const [b, s, c] = await Promise.all([getBudgets(), getServices(), getClients()])
      setBudgets(b)
      setServices(s)
      setClients(c)
    } catch {
      toast({ title: 'Erro ao carregar orçamentos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('budgets', loadData)
  useRealtime('services', loadData)

  const handleOpenCreate = () => {
    setEditingBudget(null)
    setClientName('')
    setSelectedClientId('custom')
    setClientEmail('')
    setClientPhone('')
    setBudgetStatus('rascunho')
    setBudgetDate(new Date().toISOString().split('T')[0])
    setValidUntil('')
    setNotes('')
    setItems([
      {
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
      },
    ])
    setFormDialogOpen(true)
  }

  const handleOpenEdit = async (b: Budget) => {
    try {
      const full = await getBudget(b.id)
      setEditingBudget(full)
      setClientName(full.client_name)
      setSelectedClientId(full.client || 'custom')
      setClientEmail(full.client_email || '')
      setClientPhone(full.client_phone || '')
      setBudgetStatus(full.status)
      setBudgetDate(full.date ? full.date.split(' ')[0].split('T')[0] : '')
      setValidUntil(full.valid_until ? full.valid_until.split(' ')[0].split('T')[0] : '')
      setNotes(full.notes || '')
      setItems(
        full.items.map((it) => ({
          service: it.service,
          name: it.name,
          description: it.description || '',
          quantity: it.quantity,
          unit_price: it.unit_price,
          total: it.total,
        })),
      )
      setFormDialogOpen(true)
    } catch {
      toast({ title: 'Erro ao carregar detalhes do orçamento', variant: 'destructive' })
    }
  }

  const handleClientSelectChange = (clientId: string) => {
    setSelectedClientId(clientId)
    if (clientId === 'custom') {
      return
    }
    const found = clients.find((c) => c.id === clientId)
    if (found) {
      setClientName(found.name)
      if (found.email) setClientEmail(found.email)
      if (found.phone) setClientPhone(found.phone)
    }
  }

  // Itens Manipulation
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast({ title: 'O orçamento precisa ter ao menos 1 item' })
      return
    }
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
  }

  const handleItemChange = (
    index: number,
    field: keyof CreateBudgetItemInput,
    value: string | number,
  ) => {
    const updated = [...items]
    const item = { ...updated[index] }

    if (field === 'quantity') {
      const q = Math.max(0, Number(value) || 0)
      item.quantity = q
      item.total = q * item.unit_price
    } else if (field === 'unit_price') {
      const p = Math.max(0, Number(value) || 0)
      item.unit_price = p
      item.total = item.quantity * p
    } else if (field === 'name') {
      item.name = String(value)
    } else if (field === 'description') {
      item.description = String(value)
    }

    updated[index] = item
    setItems(updated)
  }

  const handleSelectServiceForItem = (index: number, serviceId: string) => {
    if (serviceId === 'novo') {
      // Abre diálogo para cadastrar na hora
      setQuickServiceForm({
        name: '',
        description: '',
        price: '',
        category: '',
        unit: 'un',
      })
      setQuickServiceDialogOpen(true)
      return
    }

    const s = services.find((srv) => srv.id === serviceId)
    if (s) {
      const updated = [...items]
      const item = { ...updated[index] }
      item.service = s.id
      item.name = s.name
      item.description = s.description || ''
      item.unit_price = s.price
      item.total = item.quantity * s.price
      updated[index] = item
      setItems(updated)
    }
  }

  const handleCreateQuickService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickServiceForm.name.trim()) return
    setIsCreatingQuickService(true)
    try {
      const created = await createService({
        name: quickServiceForm.name.trim(),
        description: quickServiceForm.description.trim(),
        price: Number(quickServiceForm.price) || 0,
        category: quickServiceForm.category.trim(),
        unit: quickServiceForm.unit.trim() || 'un',
        active: true,
      })

      // Atualiza lista de serviços
      const refreshedServices = await getServices()
      setServices(refreshedServices)

      // Adiciona como item ou preenche o último item vazio
      setItems((prev) => {
        const copy = [...prev]
        const last = copy[copy.length - 1]
        if (last && !last.name.trim()) {
          copy[copy.length - 1] = {
            service: created.id,
            name: created.name,
            description: created.description || '',
            quantity: 1,
            unit_price: created.price,
            total: created.price,
          }
          return copy
        } else {
          return [
            ...copy,
            {
              service: created.id,
              name: created.name,
              description: created.description || '',
              quantity: 1,
              unit_price: created.price,
              total: created.price,
            },
          ]
        }
      })

      toast({ title: `Serviço "${created.name}" cadastrado e adicionado ao orçamento!` })
      setQuickServiceDialogOpen(false)
    } catch {
      toast({ title: 'Erro ao cadastrar serviço rápido', variant: 'destructive' })
    } finally {
      setIsCreatingQuickService(false)
    }
  }

  const calculateTotal = () => {
    return items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim()) {
      toast({ title: 'Nome do cliente é obrigatório', variant: 'destructive' })
      return
    }

    const validItems = items.filter((it) => it.name.trim().length > 0)
    if (validItems.length === 0) {
      toast({ title: 'Adicione pelo menos um item com nome e valor', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          client_name: clientName.trim(),
          client: selectedClientId !== 'custom' ? selectedClientId : undefined,
          client_email: clientEmail.trim(),
          client_phone: clientPhone.trim(),
          status: budgetStatus,
          date: budgetDate,
          valid_until: validUntil || undefined,
          notes: notes.trim(),
          items: validItems,
        })
        toast({ title: 'Orçamento atualizado com sucesso' })
      } else {
        await createBudget({
          client_name: clientName.trim(),
          client: selectedClientId !== 'custom' ? selectedClientId : undefined,
          client_email: clientEmail.trim(),
          client_phone: clientPhone.trim(),
          status: budgetStatus,
          date: budgetDate,
          valid_until: validUntil || undefined,
          notes: notes.trim(),
          items: validItems,
        })
        toast({ title: 'Orçamento criado com sucesso' })
      }

      setFormDialogOpen(false)
      loadData()
    } catch {
      toast({
        title: editingBudget ? 'Erro ao atualizar orçamento' : 'Erro ao criar orçamento',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!budgetToDelete) return
    try {
      await deleteBudget(budgetToDelete.id)
      toast({ title: 'Orçamento removido com sucesso' })
      setBudgetToDelete(null)
      loadData()
    } catch {
      toast({ title: 'Erro ao remover orçamento', variant: 'destructive' })
    }
  }

  const handlePrintPdf = async (budget: Budget) => {
    try {
      const full = await getBudget(budget.id)
      generateBudgetPdf(full)
    } catch {
      toast({ title: 'Erro ao gerar PDF do orçamento', variant: 'destructive' })
    }
  }

  const handleViewDetails = async (budget: Budget) => {
    try {
      const full = await getBudget(budget.id)
      setViewBudgetModal(full)
    } catch {
      toast({ title: 'Erro ao abrir visualização', variant: 'destructive' })
    }
  }

  const filteredBudgets = budgets.filter((b) => {
    const matchesSearch =
      b.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.client_email && b.client_email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'todos' || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Orçamentos</h2>
          <p className="text-slate-500">
            Crie propostas comerciais, adicione serviços, some valores e salve em PDF.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por cliente ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          <Button
            variant={statusFilter === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('todos')}
            className={statusFilter === 'todos' ? 'bg-indigo-600' : ''}
          >
            Todos
          </Button>
          {(['rascunho', 'enviado', 'aprovado', 'recusado'] as BudgetStatus[]).map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className={statusFilter === st ? 'bg-indigo-600' : ''}
            >
              {STATUS_MAP[st].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de Orçamentos */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed rounded-xl border-slate-300">
          <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700">Nenhum orçamento encontrado</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Monte orçamentos detalhados com cálculo automático e gere o PDF para seu cliente.
          </p>
          <Button onClick={handleOpenCreate} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Orçamento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBudgets.map((budget) => {
            const st = STATUS_MAP[budget.status]
            return (
              <Card
                key={budget.id}
                className="border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div>
                      <span className="text-xs text-slate-400 font-mono">
                        #{budget.id.substring(0, 8).toUpperCase()}
                      </span>
                      <h3
                        className="font-bold text-lg text-slate-900 line-clamp-1 cursor-pointer hover:text-indigo-600"
                        onClick={() => handleViewDetails(budget)}
                        title={budget.client_name}
                      >
                        {budget.client_name}
                      </h3>
                    </div>
                    <Badge variant="secondary" className={`${st.class} whitespace-nowrap`}>
                      {st.label}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>Data: {formatDate(budget.date)}</span>
                    </div>
                    {budget.client_email && (
                      <p className="text-xs text-slate-500 truncate">{budget.client_email}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-xs text-slate-500 block">Total do Orçamento</span>
                      <span className="text-xl font-bold text-emerald-600">
                        {formatCurrency(budget.total)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintPdf(budget)}
                        className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                        title="Salvar ou Imprimir em PDF"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(budget)}
                        className="text-slate-600 hover:text-indigo-600 h-8 w-8"
                        title="Editar orçamento"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setBudgetToDelete(budget)}
                        className="text-slate-600 hover:text-rose-600 h-8 w-8"
                        title="Remover orçamento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Diálogo Criar / Editar Orçamento */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento Comercial'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* Seção Cliente e Datas */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" />
                Dados do Cliente & Validade
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vincular a Cliente Cadastrado (Opcional)</Label>
                  <Select value={selectedClientId} onValueChange={handleClientSelectChange}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione um cliente ou digite livremente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">-- Digitar cliente avulso --</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.tax_id ? `(${c.tax_id})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_name">Nome do Cliente / Empresa *</Label>
                  <Input
                    id="client_name"
                    required
                    placeholder="Ex: ACME Tech, João Silva..."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_email">E-mail do Cliente</Label>
                  <Input
                    id="client_email"
                    type="email"
                    placeholder="cliente@empresa.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_phone">Telefone / WhatsApp</Label>
                  <Input
                    id="client_phone"
                    placeholder="(11) 99999-9999"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status do Orçamento</Label>
                  <Select
                    value={budgetStatus}
                    onValueChange={(v: BudgetStatus) => setBudgetStatus(v)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="enviado">Enviado</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="recusado">Recusado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data de Emissão *</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={budgetDate}
                    onChange={(e) => setBudgetDate(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Validade da Proposta</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Seção Itens do Orçamento */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    Itens e Serviços do Orçamento
                  </h4>
                  <p className="text-xs text-slate-500">
                    Selecione um serviço cadastrado ou edite os valores e descrições conforme
                    necessário.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setQuickServiceForm({
                        name: '',
                        description: '',
                        price: '',
                        category: '',
                        unit: 'un',
                      })
                      setQuickServiceDialogOpen(true)
                    }}
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  >
                    <PlusCircle className="h-4 w-4 mr-1 text-indigo-600" />
                    Cadastrar Serviço na Hora
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddItem}
                    className="bg-slate-800 hover:bg-slate-900 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Item
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Item #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(idx)}
                          className="h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Selecionar de serviços existentes */}
                      <div className="md:col-span-5 space-y-1">
                        <Label className="text-xs">Puxar do Catálogo</Label>
                        <Select
                          value={item.service || ''}
                          onValueChange={(val) => handleSelectServiceForItem(idx, val)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione um serviço..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="novo" className="font-semibold text-indigo-600">
                              + Cadastrar novo serviço agora...
                            </SelectItem>
                            {services.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} - {formatCurrency(s.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Nome do item editável */}
                      <div className="md:col-span-7 space-y-1">
                        <Label className="text-xs">Nome / Descrição Curta *</Label>
                        <Input
                          required
                          className="h-9"
                          placeholder="Nome do serviço"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Descrição detalhada do item */}
                    <div className="space-y-1">
                      <Label className="text-xs">Escopo / Detalhamento do Item</Label>
                      <Input
                        className="h-9"
                        placeholder="Detalhes ou entregáveis inclusos neste item..."
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      />
                    </div>

                    {/* Quantidade, Preço Unitário e Subtotal */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="text-xs">Quantidade</Label>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          className="h-9"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Preço Unitário (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="h-9"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-xs text-slate-500 block">Subtotal Item</span>
                        <span className="font-bold text-slate-900 text-base">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Destaque */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
                <div>
                  <span className="text-sm font-semibold text-indigo-950">
                    Total do Orçamento Somado Automaticamente
                  </span>
                  <p className="text-xs text-indigo-700">
                    Soma de {items.length} item(ns) com valores unitários e quantidades.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-700">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações / Condições Comerciais</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Ex: Condições de pagamento (50% entrada + 50% entrega), prazo estimado, garantias..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Salvando...'
                  : editingBudget
                    ? 'Salvar Alterações'
                    : 'Criar Orçamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo Rápido: Cadastrar Serviço Na Hora */}
      <Dialog open={quickServiceDialogOpen} onOpenChange={setQuickServiceDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Serviço na Hora</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateQuickService} className="space-y-3 pt-2">
            <p className="text-xs text-slate-500">
              O serviço será salvo no catálogo permanente e já inserido neste orçamento.
            </p>

            <div className="space-y-1">
              <Label htmlFor="quick-name">Nome do Serviço *</Label>
              <Input
                id="quick-name"
                required
                placeholder="Ex: Configuração de Servidor, Bot WhatsApp..."
                value={quickServiceForm.name}
                onChange={(e) => setQuickServiceForm({ ...quickServiceForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="quick-price">Preço Base (R$) *</Label>
                <Input
                  id="quick-price"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={quickServiceForm.price}
                  onChange={(e) =>
                    setQuickServiceForm({ ...quickServiceForm, price: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="quick-unit">Unidade</Label>
                <Input
                  id="quick-unit"
                  placeholder="projeto, hora, un"
                  value={quickServiceForm.unit}
                  onChange={(e) =>
                    setQuickServiceForm({ ...quickServiceForm, unit: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="quick-category">Categoria</Label>
              <Input
                id="quick-category"
                placeholder="Ex: IA, Web, Infraestrutura"
                value={quickServiceForm.category}
                onChange={(e) =>
                  setQuickServiceForm({ ...quickServiceForm, category: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="quick-desc">Descrição</Label>
              <Textarea
                id="quick-desc"
                rows={2}
                placeholder="Resumo do escopo..."
                value={quickServiceForm.description}
                onChange={(e) =>
                  setQuickServiceForm({ ...quickServiceForm, description: e.target.value })
                }
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickServiceDialogOpen(false)}
                disabled={isCreatingQuickService}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isCreatingQuickService}
              >
                {isCreatingQuickService ? 'Cadastrando...' : 'Cadastrar e Inserir'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar Detalhes & Imprimir */}
      {viewBudgetModal && (
        <Dialog
          open={Boolean(viewBudgetModal)}
          onOpenChange={(open) => !open && setViewBudgetModal(null)}
        >
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-center pr-6">
                <DialogTitle>
                  Orçamento #{viewBudgetModal.id.substring(0, 8).toUpperCase()}
                </DialogTitle>
                <Badge className={STATUS_MAP[viewBudgetModal.status].class}>
                  {STATUS_MAP[viewBudgetModal.status].label}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-800 text-base">
                  {viewBudgetModal.client_name}
                </h4>
                <div className="text-xs text-slate-500 space-y-1 mt-1">
                  {viewBudgetModal.client_email && <p>E-mail: {viewBudgetModal.client_email}</p>}
                  {viewBudgetModal.client_phone && <p>Telefone: {viewBudgetModal.client_phone}</p>}
                  <p>Data de emissão: {formatDate(viewBudgetModal.date)}</p>
                  {viewBudgetModal.valid_until && (
                    <p>Validade até: {formatDate(viewBudgetModal.valid_until)}</p>
                  )}
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-sm text-slate-800 mb-2">Itens da Proposta</h5>
                <div className="border rounded-lg overflow-hidden divide-y divide-slate-200 text-sm">
                  {viewBudgetModal.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center">
                      <div>
                        <span className="font-medium text-slate-900">{it.name}</span>
                        {it.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{it.description}</p>
                        )}
                        <span className="text-xs text-slate-400">
                          {it.quantity}x {formatCurrency(it.unit_price)}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(it.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="font-bold text-emerald-950">VALOR TOTAL</span>
                <span className="text-xl font-bold text-emerald-700">
                  {formatCurrency(viewBudgetModal.total)}
                </span>
              </div>

              {viewBudgetModal.notes && (
                <div className="p-3 bg-slate-50 rounded border text-xs text-slate-600 space-y-1">
                  <span className="font-semibold block text-slate-700">Observações:</span>
                  <p className="whitespace-pre-wrap">{viewBudgetModal.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setViewBudgetModal(null)}>
                Fechar
              </Button>
              <Button
                onClick={() => generateBudgetPdf(viewBudgetModal)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Printer className="h-4 w-4 mr-2" />
                Salvar em PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Alerta de Confirmação de Exclusão */}
      <AlertDialog
        open={Boolean(budgetToDelete)}
        onOpenChange={(open) => !open && setBudgetToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o orçamento do cliente "{budgetToDelete?.client_name}" e todos os
              seus itens vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

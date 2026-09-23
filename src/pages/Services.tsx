import { useEffect, useState } from 'react'
import {
  getServices,
  createService,
  updateService,
  deleteService,
  ServiceItem,
} from '@/services/services'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { Plus, Pencil, Trash2, Layers, Search } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

export default function Services() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceItem | null>(null)
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<{
    name: string
    description: string
    price: string
    category: string
    unit: string
    active: boolean
  }>({
    name: '',
    description: '',
    price: '',
    category: '',
    unit: 'un',
    active: true,
  })

  const loadData = async () => {
    try {
      const data = await getServices()
      setServices(data)
    } catch {
      toast({ title: 'Erro ao carregar serviços', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('services', loadData)

  const handleOpenCreate = () => {
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      unit: 'un',
      active: true,
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (service: ServiceItem) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      price: String(service.price ?? ''),
      category: service.category || '',
      unit: service.unit || 'un',
      active: service.active ?? true,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price) || 0,
        category: formData.category.trim(),
        unit: formData.unit.trim() || 'un',
        active: formData.active,
      }

      if (editingService) {
        await updateService(editingService.id, payload)
        toast({ title: 'Serviço atualizado com sucesso' })
      } else {
        await createService(payload)
        toast({ title: 'Serviço cadastrado com sucesso' })
      }

      setDialogOpen(false)
      loadData()
    } catch {
      toast({
        title: editingService ? 'Erro ao atualizar serviço' : 'Erro ao criar serviço',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!serviceToDelete) return
    try {
      await deleteService(serviceToDelete.id)
      toast({ title: 'Serviço removido com sucesso' })
      setServiceToDelete(null)
      loadData()
    } catch {
      toast({ title: 'Erro ao remover serviço', variant: 'destructive' })
    }
  }

  const categories = Array.from(
    new Set(services.map((s) => s.category).filter(Boolean) as string[]),
  )

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCat = selectedCategory === 'todos' || (s.category || 'Geral') === selectedCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Catálogo de Serviços</h2>
          <p className="text-slate-500">
            Cadastre os serviços e soluções que podem ser inclusos nos orçamentos.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar serviços por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Button
              variant={selectedCategory === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('todos')}
              className={selectedCategory === 'todos' ? 'bg-indigo-600' : ''}
            >
              Todos
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'bg-indigo-600' : ''}
              >
                {cat}
              </Button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed rounded-xl border-slate-300">
          <Layers className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700">Nenhum serviço encontrado</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Cadastre os serviços oferecidos pela sua empresa para facilitar a montagem de
            orçamentos.
          </p>
          <Button onClick={handleOpenCreate} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Primeiro Serviço
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className="border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-lg text-slate-900 leading-snug">
                        {service.name}
                      </span>
                      {service.category && (
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                          {service.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      (service.active ?? true)
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 text-xs'
                        : 'border-slate-300 bg-slate-100 text-slate-600 text-xs'
                    }
                  >
                    {(service.active ?? true) ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <p className="text-sm text-slate-600 line-clamp-3 mb-4 min-h-[40px]">
                  {service.description || 'Sem descrição informada.'}
                </p>

                <div className="flex items-baseline justify-between pt-3 border-t border-slate-100 mt-auto">
                  <div>
                    <span className="text-xs text-slate-500 block">Preço Base</span>
                    <span className="text-xl font-bold text-indigo-600">
                      {formatCurrency(service.price)}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">/{service.unit || 'un'}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(service)}
                      className="text-slate-600 hover:text-indigo-600 h-8 w-8"
                      title="Editar serviço"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setServiceToDelete(service)}
                      className="text-slate-600 hover:text-rose-600 h-8 w-8"
                      title="Remover serviço"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Criar / Editar Serviço */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="service-name">Nome do Serviço *</Label>
              <Input
                id="service-name"
                required
                placeholder="Ex: Desenvolvimento de Agente IA, Consultoria..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-price">Preço Base (R$) *</Label>
                <Input
                  id="service-price"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-unit">Unidade de Cobrança</Label>
                <Input
                  id="service-unit"
                  placeholder="Ex: projeto, hora, mês, un"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-category">Categoria</Label>
              <Input
                id="service-category"
                placeholder="Ex: IA, Web, Automação, Consultoria"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">Descrição Detalhada</Label>
              <Textarea
                id="service-description"
                rows={3}
                placeholder="Descreva o escopo, entregáveis e especificações do serviço..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <Label htmlFor="service-active" className="cursor-pointer">
                  Serviço Ativo
                </Label>
                <p className="text-xs text-slate-500">
                  Serviços inativos não aparecem como sugestão em novos orçamentos.
                </p>
              </div>
              <Switch
                id="service-active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
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
                  : editingService
                    ? 'Atualizar Serviço'
                    : 'Cadastrar Serviço'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alerta de Confirmação de Exclusão */}
      <AlertDialog
        open={Boolean(serviceToDelete)}
        onOpenChange={(open) => !open && setServiceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o serviço "{serviceToDelete?.name}" do catálogo. Orçamentos já
              criados não serão afetados.
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

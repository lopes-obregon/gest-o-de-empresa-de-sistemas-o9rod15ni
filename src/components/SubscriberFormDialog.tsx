import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil } from 'lucide-react'
import { createSubscriber, updateSubscriber, SystemSubscriber } from '@/services/system-subscribers'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

interface SubscriberFormDialogProps {
  subscriber?: SystemSubscriber | null
  trigger?: React.ReactNode
  onSaved: () => void
}

export function SubscriberFormDialog({ subscriber, trigger, onSaved }: SubscriberFormDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return ''
    return dateStr.substring(0, 10)
  }

  const [formData, setFormData] = useState({
    name: subscriber?.name || '',
    email: subscriber?.email || '',
    payment_status: subscriber?.payment_status || 'em_dia',
    access_status: subscriber?.access_status || 'active',
    external_id: subscriber?.external_id || '',
    expiry_date: formatDateForInput(subscriber?.expiry_date),
    external_create_date: formatDateForInput(subscriber?.external_create_date),
  })

  const resetForm = useCallback(() => {
    setFormData({
      name: subscriber?.name || '',
      email: subscriber?.email || '',
      payment_status: subscriber?.payment_status || 'em_dia',
      access_status: subscriber?.access_status || 'active',
      external_id: subscriber?.external_id || '',
      expiry_date: formatDateForInput(subscriber?.expiry_date),
      external_create_date: formatDateForInput(subscriber?.external_create_date),
    })
    setFieldErrors({})
  }, [subscriber])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFieldErrors({})

    try {
      const payload: Partial<SystemSubscriber> = {
        name: formData.name,
        email: formData.email,
        payment_status: formData.payment_status as 'em_dia' | 'pendente',
        access_status: formData.access_status as 'active' | 'inactive',
        external_id: formData.external_id,
        expiry_date: formData.expiry_date ? `${formData.expiry_date} 00:00:00.000Z` : '',
      }

      if (subscriber) {
        await updateSubscriber(subscriber.id, payload)
        toast({ title: 'Assinante atualizado' })
      } else {
        await createSubscriber(payload)
        toast({ title: 'Assinante cadastrado' })
      }

      setIsOpen(false)
      resetForm()
      onSaved()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao salvar assinante', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) resetForm()
  }

  const defaultTrigger = subscriber ? (
    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
      <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
    </Button>
  ) : (
    <Button className="bg-indigo-600 hover:bg-indigo-700">
      <Plus className="mr-2 h-4 w-4" /> Novo Assinante
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{subscriber ? 'Editar Assinante' : 'Cadastrar Assinante'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status de Pagamento</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(v: 'em_dia' | 'pendente') =>
                  setFormData({ ...formData, payment_status: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_dia">Em Dia</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status de Acesso</Label>
              <Select
                value={formData.access_status}
                onValueChange={(v: 'active' | 'inactive') =>
                  setFormData({ ...formData, access_status: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>ID Externo (opcional)</Label>
            <Input
              value={formData.external_id}
              onChange={(e) => setFormData({ ...formData, external_id: e.target.value })}
              placeholder="Mapeamento para sistema externo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
              {fieldErrors.expiry_date && (
                <p className="text-sm text-red-500">{fieldErrors.expiry_date}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Data de Cadastro Externo</Label>
              <Input
                type="date"
                value={formData.external_create_date}
                disabled
                className="bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

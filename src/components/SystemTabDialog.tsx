import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Pencil } from 'lucide-react'
import {
  createSystem,
  updateSystem,
  deleteSystem,
  SubscriberSystem,
} from '@/services/subscriber-systems'
import { useToast } from '@/hooks/use-toast'

interface SystemTabDialogProps {
  system?: SubscriberSystem | null
  trigger?: React.ReactNode
  onSaved: () => void
  onDeleted?: () => void
}

export function SystemTabDialog({ system, trigger, onSaved, onDeleted }: SystemTabDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState(system?.name || '')
  const [description, setDescription] = useState(system?.description || '')
  const [active, setActive] = useState(system ? system.active !== false : true)

  useEffect(() => {
    if (isOpen) {
      setName(system?.name || '')
      setDescription(system?.description || '')
      setActive(system ? system.active !== false : true)
    }
  }, [isOpen, system])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Informe o nome do sistema', variant: 'destructive' })
      return
    }
    setIsSubmitting(true)
    try {
      if (system) {
        await updateSystem(system.id, {
          name: name.trim(),
          description: description.trim(),
          active,
        })
        toast({ title: 'Sistema atualizado', description: name.trim() })
      } else {
        await createSystem({
          name: name.trim(),
          description: description.trim(),
          active: true,
        })
        toast({ title: 'Sistema criado', description: `Aba "${name.trim()}" disponível.` })
      }
      setIsOpen(false)
      onSaved()
    } catch {
      toast({
        title: system ? 'Erro ao atualizar sistema' : 'Erro ao criar sistema',
        description: 'Verifique se já não existe um sistema com esse nome.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!system) return
    try {
      await deleteSystem(system.id)
      toast({ title: 'Sistema excluído' })
      setIsOpen(false)
      onSaved()
      onDeleted?.()
    } catch (err) {
      toast({
        title: 'Não foi possível excluir',
        description: err instanceof Error ? err.message : 'Erro ao excluir o sistema.',
        variant: 'destructive',
      })
    }
  }

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
  }, [])

  const defaultTrigger = system ? (
    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600">
      <Pencil className="h-3 w-3" />
    </Button>
  ) : (
    <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
      <Plus className="mr-1 h-4 w-4" /> Nova Aba
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{system ? 'Editar Sistema' : 'Nova Aba de Sistema'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nome do sistema</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sistema Financeiro"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Para que serve este sistema"
            />
          </div>
          {system && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="system-active"
                checked={active}
                onCheckedChange={(v) => setActive(v === true)}
              />
              <Label htmlFor="system-active" className="font-normal cursor-pointer">
                Sistema ativo (exibir a aba)
              </Label>
            </div>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : system ? 'Salvar Alterações' : 'Criar Sistema'}
            </Button>
            {system && (
              <Button
                type="button"
                variant="outline"
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                Excluir sistema
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

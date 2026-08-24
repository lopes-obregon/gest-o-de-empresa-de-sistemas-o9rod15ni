import { useState, useRef, useCallback } from 'react'
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
import { Plus, Upload, FileText, FileImage, X, Pencil } from 'lucide-react'
import { createClient, updateClient, Client } from '@/services/clients'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'

interface ClientFormDialogProps {
  client?: Client | null
  trigger?: React.ReactNode
  onSaved: () => void
}

interface PendingFile {
  file: File
  preview: string
}

function isImageFile(filename: string) {
  return /\.(jpg|jpeg|png)$/i.test(filename)
}

export function ClientFormDialog({ client, trigger, onSaved }: ClientFormDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    tax_id: client?.tax_id || '',
  })

  const resetForm = useCallback(() => {
    setFormData({
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      tax_id: client?.tax_id || '',
    })
    setPendingFiles([])
    setFieldErrors({})
  }, [client])

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
      ]
      const newFiles: PendingFile[] = []
      for (const file of Array.from(files)) {
        if (!validTypes.includes(file.type)) {
          toast({ title: `Tipo não suportado: ${file.name}`, variant: 'destructive' })
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: `Arquivo muito grande (máx 5MB): ${file.name}`, variant: 'destructive' })
          continue
        }
        newFiles.push({ file, preview: file.name })
      }
      setPendingFiles((prev) => [...prev, ...newFiles])
    },
    [toast],
  )

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFieldErrors({})

    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('email', formData.email)
      data.append('phone', formData.phone)
      data.append('tax_id', formData.tax_id)

      pendingFiles.forEach((pf) => {
        data.append('documents', pf.file)
      })

      if (client) {
        await updateClient(client.id, data)
        toast({ title: 'Cliente atualizado' })
      } else {
        await createClient(data)
        toast({ title: 'Cliente cadastrado' })
      }

      setIsOpen(false)
      resetForm()
      onSaved()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao salvar cliente', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) resetForm()
  }

  const defaultTrigger = client ? (
    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
      <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
    </Button>
  ) : (
    <Button className="bg-indigo-600 hover:bg-indigo-700">
      <Plus className="mr-2 h-4 w-4" /> Novo Cliente
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Cadastrar Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Nome da Empresa</Label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Documentos / Contratos</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors duration-150',
                isDragging
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50',
              )}
            >
              <Upload className="h-6 w-6 text-slate-400" />
              <p className="text-sm text-slate-500 text-center">
                Arraste arquivos aqui ou{' '}
                <span className="text-indigo-600 font-medium">clique para selecionar</span>
              </p>
              <p className="text-xs text-slate-400">PDF, DOCX, JPG, PNG · máx 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </div>

            {pendingFiles.length > 0 && (
              <div className="space-y-1.5">
                {pendingFiles.map((pf, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isImageFile(pf.preview) ? (
                        <FileImage className="h-4 w-4 text-indigo-500 shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                      )}
                      <span className="text-sm text-slate-700 truncate">{pf.preview}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removePendingFile(i)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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

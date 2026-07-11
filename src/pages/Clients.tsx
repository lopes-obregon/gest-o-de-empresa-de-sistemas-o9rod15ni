import { useEffect, useState } from 'react'
import { getClients, createClient, Client } from '@/services/clients'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Mail, Phone, Building } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tax_id: '',
  })

  const loadData = async () => {
    const c = await getClients()
    setClients(c)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('clients', loadData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createClient(formData)
      toast({ title: 'Cliente cadastrado' })
      setIsOpen(false)
      setFormData({ name: '', email: '', phone: '', tax_id: '' })
    } catch (err) {
      toast({ title: 'Erro ao cadastrar', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="text-slate-500">Cadastros de empresas.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
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
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? [...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-xl animate-pulse"></div>
            ))
          : clients.map((client) => (
              <Card key={client.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{client.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  {client.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-slate-400" /> {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-slate-400" /> {client.phone}
                    </div>
                  )}
                  {client.tax_id && (
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-2 text-slate-400" /> {client.tax_id}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  )
}

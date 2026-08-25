import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProjects, createProject, Project } from '@/services/projects'
import { getClients, Client } from '@/services/clients'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/format'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'

const STATUS_MAP = {
  lead: { label: 'Lead', class: 'bg-slate-100 text-slate-800' },
  em_desenvolvimento: { label: 'Em Dev', class: 'bg-indigo-100 text-indigo-800' },
  pausado: { label: 'Pausado', class: 'bg-rose-100 text-rose-800' },
  finalizado: { label: 'Finalizado', class: 'bg-emerald-100 text-emerald-800' },
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<{
    name: string
    client: string
    start_date: string
    end_date: string
    status: 'lead' | 'em_desenvolvimento' | 'pausado' | 'finalizado'
    budget: string
    description: string
  }>({
    name: '',
    client: '',
    start_date: '',
    end_date: '',
    status: 'lead',
    budget: '',
    description: '',
  })

  const loadData = async () => {
    const [p, c] = await Promise.all([getProjects(), getClients()])
    setProjects(p)
    setClients(c)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('projects', loadData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createProject({
        ...formData,
        budget: Number(formData.budget),
      })
      toast({ title: 'Projeto criado com sucesso' })
      setIsOpen(false)
      setFormData({
        name: '',
        client: '',
        start_date: '',
        end_date: '',
        status: 'lead',
        budget: '',
        description: '',
      })
    } catch (err) {
      toast({ title: 'Erro ao criar projeto', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projetos</h2>
          <p className="text-slate-500">Gerencie todos os projetos da agência.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Projeto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Projeto</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select
                  required
                  value={formData.client}
                  onValueChange={(v) => setFormData({ ...formData, client: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data Início</Label>
                  <Input
                    type="date"
                    id="start_date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data Fim</Label>
                  <Input
                    type="date"
                    id="end_date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    required
                    value={formData.status}
                    onValueChange={(v: 'lead' | 'em_desenvolvimento' | 'pausado' | 'finalizado') =>
                      setFormData({ ...formData, status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="em_desenvolvimento">Em Dev</SelectItem>
                      <SelectItem value="pausado">Pausado</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Orçamento (R$)</Label>
                  <Input
                    type="number"
                    id="budget"
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Projeto'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const status = STATUS_MAP[project.status as keyof typeof STATUS_MAP]
            return (
              <Link key={project.id} to={`/projetos/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3
                        className="font-bold text-lg line-clamp-1 flex-1 mr-2"
                        title={project.name}
                      >
                        {project.name}
                      </h3>
                      <Badge variant="secondary" className={`${status.class} whitespace-nowrap`}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-slate-500 text-sm mb-6">{project.expand?.client?.name}</p>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Prazo</span>
                        <span className="font-medium">{formatDate(project.end_date)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Orçamento</span>
                        <span className="font-medium text-emerald-600">
                          {formatCurrency(project.budget)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

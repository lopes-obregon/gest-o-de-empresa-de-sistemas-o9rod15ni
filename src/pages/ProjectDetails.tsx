import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProject, updateProject, Project } from '@/services/projects'
import { getTransactions, Transaction } from '@/services/transactions'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatDate } from '@/lib/format'
import { ArrowLeft, Calendar, DollarSign, Edit } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const STATUS_MAP = {
  lead: { label: 'Lead', class: 'bg-slate-100 text-slate-800' },
  em_desenvolvimento: { label: 'Em Dev', class: 'bg-indigo-100 text-indigo-800' },
  pausado: { label: 'Pausado', class: 'bg-rose-100 text-rose-800' },
  finalizado: { label: 'Finalizado', class: 'bg-emerald-100 text-emerald-800' },
}

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadData = async () => {
    if (!id) return
    try {
      const [p, t] = await Promise.all([getProject(id), getTransactions()])
      setProject(p)
      setTransactions(t.filter((tx) => tx.project === id))
    } catch (e) {
      toast({ title: 'Projeto não encontrado', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useRealtime('projects', loadData)
  useRealtime('transactions', loadData)

  const handleStatusChange = async (status: string) => {
    if (!project) return
    try {
      await updateProject(project.id, { status: status as Project['status'] })
      toast({ title: 'Status atualizado' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  if (loading)
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 w-1/4 rounded"></div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    )

  if (!project) return <div>Projeto não encontrado.</div>

  const expenses = transactions
    .filter((t) => t.type === 'saida')
    .reduce((acc, t) => acc + t.amount, 0)
  const budgetUsed = project.budget > 0 ? (expenses / project.budget) * 100 : 0
  const income = transactions
    .filter((t) => t.type === 'entrada')
    .reduce((acc, t) => acc + t.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/projetos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
          <p className="text-slate-500">{project.expand?.client?.name}</p>
        </div>
        <div>
          <Select value={project.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="em_desenvolvimento">Em Desenvolvimento</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Descrição</p>
              <p className="text-slate-900">
                {project.description || 'Nenhuma descrição fornecida.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Início</p>
                  <p className="font-semibold">{formatDate(project.start_date)}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Entrega Final</p>
                  <p className="font-semibold">{formatDate(project.end_date)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financeiro do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Orçamento</span>
                <span className="font-bold">{formatCurrency(project.budget)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Despesas</span>
                <span className="font-bold text-rose-600">{formatCurrency(expenses)}</span>
              </div>
              <Progress value={Math.min(budgetUsed, 100)} className="h-2" />
              <p className="text-xs text-right mt-1 text-slate-500">
                {budgetUsed.toFixed(1)}% utilizado
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">Faturado (Entradas)</span>
                <span className="font-bold text-emerald-600">{formatCurrency(income)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

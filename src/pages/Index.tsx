import { useEffect, useState } from 'react'
import { getProjects, Project } from '@/services/projects'
import { getTransactions, Transaction } from '@/services/transactions'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { BadgeDollarSign, Briefcase, TrendingDown, TrendingUp } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, CartesianGrid, XAxis, PieChart, Pie, Cell } from 'recharts'
import { Badge } from '@/components/ui/badge'

const PROJECT_STATUS_COLORS: Record<string, string> = {
  lead: 'hsl(var(--muted-foreground))',
  em_desenvolvimento: 'hsl(var(--primary))',
  pausado: 'hsl(var(--destructive))',
  finalizado: 'hsl(var(--success))',
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  lead: 'Lead',
  em_desenvolvimento: 'Em Dev',
  pausado: 'Pausado',
  finalizado: 'Finalizado',
}

export default function Index() {
  const [projects, setProjects] = useState<Project[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const [p, t] = await Promise.all([getProjects(), getTransactions()])
    setProjects(p)
    setTransactions(t)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('projects', loadData)
  useRealtime('transactions', loadData)

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  const activeProjects = projects.filter((p) => p.status === 'em_desenvolvimento').length

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const monthlyIncome = monthlyTransactions
    .filter((t) => t.type === 'entrada')
    .reduce((acc, t) => acc + t.amount, 0)
  const monthlyExpense = monthlyTransactions
    .filter((t) => t.type === 'saida')
    .reduce((acc, t) => acc + t.amount, 0)
  const balance =
    transactions.filter((t) => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0) -
    transactions.filter((t) => t.type === 'saida').reduce((acc, t) => acc + t.amount, 0)

  // Chart Data preparation
  const chartData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const m = d.getMonth()
    const y = d.getFullYear()
    const mTrans = transactions.filter((t) => {
      const td = new Date(t.date)
      return td.getMonth() === m && td.getFullYear() === y
    })
    const inc = mTrans.filter((t) => t.type === 'entrada').reduce((a, t) => a + t.amount, 0)
    const exp = mTrans.filter((t) => t.type === 'saida').reduce((a, t) => a + t.amount, 0)
    chartData.push({
      month: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(d),
      entradas: inc,
      saidas: exp,
    })
  }

  const statusCount = projects.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const pieData = Object.keys(PROJECT_STATUS_LABELS)
    .map((key) => ({
      name: PROJECT_STATUS_LABELS[key],
      value: statusCount[key] || 0,
      fill: PROJECT_STATUS_COLORS[key],
    }))
    .filter((d) => d.value > 0)

  const upcomingDeadlines = projects
    .filter((p) => p.status === 'em_desenvolvimento')
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-slate-500">Visão geral do seu negócio.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Projetos Ativos</CardTitle>
            <Briefcase className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{activeProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Receita Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(monthlyIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Despesas Mensais</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(monthlyExpense)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Saldo Geral</CardTitle>
            <BadgeDollarSign className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(balance)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Fluxo de Caixa (6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer
              config={{
                entradas: { label: 'Entradas', color: 'hsl(var(--success))' },
                saidas: { label: 'Saídas', color: 'hsl(var(--destructive))' },
              }}
              className="h-[300px] w-full"
            >
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area
                  type="monotone"
                  dataKey="entradas"
                  stroke="hsl(var(--success))"
                  fillOpacity={1}
                  fill="url(#colorEntradas)"
                />
                <Area
                  type="monotone"
                  dataKey="saidas"
                  stroke="hsl(var(--destructive))"
                  fillOpacity={1}
                  fill="url(#colorSaidas)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Status dos Projetos</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {pieData.length > 0 ? (
              <ChartContainer config={{}} className="h-[250px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-slate-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">Nenhuma entrega próxima.</p>
          ) : (
            <div className="space-y-4">
              {upcomingDeadlines.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium leading-none">{p.name}</p>
                    <p className="text-sm text-slate-500">{p.expand?.client?.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className="bg-indigo-50 text-indigo-700 border-indigo-200"
                    >
                      {formatDate(p.end_date)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { Project } from '@/services/projects'

export function DeadlineAlert({ projects }: { projects: Project[] }) {
  const now = new Date()
  const sevenDays = new Date()
  sevenDays.setDate(now.getDate() + 7)

  const upcoming = projects
    .filter((p) => p.status === 'em_desenvolvimento')
    .filter((p) => {
      const d = new Date(p.end_date)
      return d >= now && d <= sevenDays
    })
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())

  if (upcoming.length === 0) return null

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          Entregas Proximas ({upcoming.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {upcoming.map((p) => (
            <Link
              key={p.id}
              to={`/projetos/${p.id}`}
              className="flex justify-between items-center p-2 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <div>
                <p className="font-medium text-amber-900">{p.name}</p>
                <p className="text-sm text-amber-700">{p.expand?.client?.name}</p>
              </div>
              <span className="text-sm font-bold text-amber-800">{formatDate(p.end_date)}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

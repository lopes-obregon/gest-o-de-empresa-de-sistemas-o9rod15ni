import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { getProjects, Project } from '@/services/projects'
import { useRealtime } from '@/hooks/use-realtime'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link } from 'react-router-dom'
import { formatDate } from '@/lib/format'

export function DeadlineBadge() {
  const [projects, setProjects] = useState<Project[]>([])

  const loadData = async () => {
    try {
      setProjects(await getProjects())
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('projects', loadData)

  const now = new Date()
  const sevenDays = new Date()
  sevenDays.setDate(now.getDate() + 7)

  const upcoming = projects
    .filter((p) => p.status === 'em_desenvolvimento')
    .filter((p) => {
      const d = new Date(p.end_date)
      return d >= now && d <= sevenDays
    })

  if (upcoming.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-xs font-bold text-white bg-rose-500 rounded-full">
            {upcoming.length}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {upcoming.map((p) => (
          <DropdownMenuItem key={p.id} asChild>
            <Link to={`/projetos/${p.id}`} className="flex justify-between items-center">
              <span className="truncate">{p.name}</span>
              <span className="text-xs text-slate-500 ml-2">{formatDate(p.end_date)}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

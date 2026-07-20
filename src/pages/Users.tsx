import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getUsers, deleteUser, User } from '@/services/users'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Shield, Trash2 } from 'lucide-react'
import { UserFormDialog } from '@/components/UserFormDialog'
import { useToast } from '@/hooks/use-toast'

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const u = await getUsers()
    setUsers(u)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('users', loadData)

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/configuracoes" replace />
  }

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      toast({ title: 'Você não pode excluir seu próprio usuário', variant: 'destructive' })
      return
    }
    try {
      await deleteUser(id)
      toast({ title: 'Usuário excluído' })
      loadData()
    } catch {
      toast({ title: 'Erro ao excluir usuário', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Usuários do Sistema</h2>
          <p className="text-slate-500">Gerencie usuários e seus níveis de privilégio.</p>
        </div>
        <UserFormDialog onSaved={loadData} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Usuários Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || '—'}</TableCell>
                      <TableCell className="text-slate-600">{u.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={u.role === 'admin' ? 'default' : 'secondary'}
                          className={
                            u.role === 'admin'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }
                        >
                          {u.role === 'admin' ? 'Administrador' : 'Membro'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <UserFormDialog user={u} onSaved={loadData} />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle>Confirmar Exclusão</DialogTitle>
                              </DialogHeader>
                              <p className="text-sm text-slate-600 py-2">
                                Deseja realmente excluir o usuário <strong>{u.name}</strong>?
                              </p>
                              <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => {}}>
                                  Cancelar
                                </Button>
                                <Button variant="destructive" onClick={() => handleDelete(u.id)}>
                                  Excluir
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

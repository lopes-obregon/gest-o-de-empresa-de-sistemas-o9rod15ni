import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function Settings() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-slate-500">Gerencie as preferências da sua conta.</p>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/configuracoes/usuarios" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Gerenciamento de Usuários
                </CardTitle>
                <CardDescription>
                  Crie, edite e exclua usuários do sistema, controlando seus níveis de privilégio
                  (Admin ou Membro).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-indigo-600 font-medium">Acessar →</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-slate-400" />
                Integrações
              </CardTitle>
              <CardDescription>Em breve: integrações com plataformas externas.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Esta seção está em desenvolvimento.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Em Breve</CardTitle>
            <CardDescription>Esta seção está em desenvolvimento.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              Aqui você poderá gerenciar integrações com plataformas externas e configurações da
              empresa.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users2, Building2, Mail, Phone } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { CompanySettingsDialog } from '@/components/CompanySettingsDialog'
import { CompanySettings, getCompanySettings } from '@/services/company-settings'

export default function Settings() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)

  useEffect(() => {
    getCompanySettings().then(setCompanySettings).catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-slate-500">Gerencie as preferências da sua conta e da empresa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card: Informações da Empresa (Foco do pedido do usuário) */}
        <Card
          onClick={() => setCompanyDialogOpen(true)}
          className="hover:shadow-md transition-all cursor-pointer h-full border-slate-200 hover:border-indigo-300 flex flex-col justify-between group"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Informações da Empresa
            </CardTitle>
            <CardDescription>
              Defina o email para envio de contratos, orçamentos, razão social, CNPJ e termos de
              pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {companySettings ? (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1.5 text-slate-600">
                <div className="font-semibold text-slate-800 line-clamp-1">
                  {companySettings.name}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 truncate">
                  <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{companySettings.email || 'Não informado'}</span>
                </div>
                {companySettings.phone && (
                  <div className="flex items-center gap-1.5 text-slate-500 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{companySettings.phone}</span>
                  </div>
                )}
              </div>
            ) : null}
            <p className="text-sm text-indigo-600 font-medium">Configurar Dados →</p>
          </CardContent>
        </Card>

        {/* Card: Gerenciamento de Usuários (Admin) */}
        {isAdmin && (
          <Link to="/configuracoes/usuarios" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-slate-200 hover:border-indigo-300 flex flex-col justify-between">
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
        )}

        {/* Card: Integrações */}
        <Card className="h-full border-slate-200 opacity-90 flex flex-col justify-between">
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

      <CompanySettingsDialog
        open={companyDialogOpen}
        onOpenChange={setCompanyDialogOpen}
        onSaved={(updated) => setCompanySettings(updated)}
      />
    </div>
  )
}

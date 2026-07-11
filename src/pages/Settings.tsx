import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-slate-500">Gerencie as preferências da sua conta.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em Breve</CardTitle>
          <CardDescription>Esta seção está em desenvolvimento.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Aqui você poderá gerenciar membros da equipe, integrações com plataformas externas e
            configurações da empresa.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

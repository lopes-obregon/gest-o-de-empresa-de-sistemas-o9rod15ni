import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, forgotPassword } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isforgotPassword, setIsForgotPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Entrou no handleSubmit")
    setIsLoading(true)
    if (isforgotPassword) {
      // Aqui você pode adicionar a lógica para redefinir a senha
      setIsLoading(false)
      const { error } = await forgotPassword(email, password)
      if (error) 
      {
        toast({
          title: 'Erro ao redefinir senha',
          description: 'Ocorreu um erro ao tentar redefinir a senha.',
          variant: 'destructive',
        })
        return;
      }
      else
      {
        toast({
          title: 'Senha redefinida',
          description: 'Sua senha foi redefinida com sucesso.',
          variant: 'default',
        })
        setIsForgotPassword(false)
        return;
      }
    
    }
    const { error } = await signIn(email, password)
    setIsLoading(false)
    if (error) {
      toast({
        title: 'Erro no login',
        description: 'Verifique suas credenciais e tente novamente.',
        variant: 'destructive',
      })
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Bem-vindo ao SkipERP</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar o sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
           
            <div className="space-y-2">
              <div className = "flex items-center justify-between">
                <Label htmlFor="password">
                  {isforgotPassword ? 'Nova Senha' : 'Senha'}
                </Label>
                
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {!isforgotPassword ? (
              <Button 
              onClick={() => setIsForgotPassword(true)} variant="link" className="text-sm text-indigo-600 hover:text-indigo-700"
              type="button"
              >
                Esqueci minha senha
              </Button>
              ) : (
              <Button 
              onClick={() => setIsForgotPassword(false)} variant="link" className="text-sm text-indigo-600 hover:text-indigo-700"
              type="button">
                Voltar ao login
              </Button>
              )}
            </div>
            
            
          
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isLoading}
            >
              {isforgotPassword ? 'Redefinir Senha' :
              isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

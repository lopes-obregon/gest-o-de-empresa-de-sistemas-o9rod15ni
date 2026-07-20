import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import Layout from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Index from './pages/Index'
import Projects from './pages/Projects'
import ProjectDetails from './pages/ProjectDetails'
import Clients from './pages/Clients'
import Finance from './pages/Finance'
import Settings from './pages/Settings'
import UsersPage from './pages/Users'
import Subscribers from './pages/Subscribers'
import NotFound from './pages/NotFound'

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/projetos" element={<Projects />} />
              <Route path="/projetos/:id" element={<ProjectDetails />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/financeiro" element={<Finance />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/configuracoes/usuarios" element={<UsersPage />} />
              <Route path="/assinantes" element={<Subscribers />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App

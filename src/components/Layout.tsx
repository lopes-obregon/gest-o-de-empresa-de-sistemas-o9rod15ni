  LayoutDashboard,
  Briefcase,
  Users,
  UserCheck,
  ShieldCheck,
  BadgeDollarSign,
  Settings,
  LogOut,
  Search,
} from 'lucide-react'
  Menu,
  Search,
} from 'lucide-react'
=======
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserCheck,
  BadgeDollarSign,
  Settings,
  LogOut,
  Search,
  Menu,
} from 'lucide-react'
=======
  LayoutDashboard,
  Briefcase,
  Users,
  UserCheck,
  ShieldCheck,
  BadgeDollarSign,
  Settings,
  LogOut,
  Search,
} from 'lucide-react'
  Menu,
  Search,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useIsMobile } from '@/hooks/use-mobile'

export default function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projetos', path: '/projetos', icon: Briefcase },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Assinantes', path: '/assinantes', icon: UserCheck },
    { name: 'Financeiro', path: '/financeiro', icon: BadgeDollarSign },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ]

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  const NavLinks = () => (
    <div className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path))
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <item.icon
              className={cn('w-5 h-5 mr-3', isActive ? 'text-indigo-600' : 'text-slate-400')}
            />
            {item.name}
          </Link>
        )
      })}
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">V</span>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            VL Soluções em IA LTDA
          </span>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center flex-1">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden mr-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="p-6 flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">V</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">VL Soluções em IA LTDA</span>
                  </div>
                  <nav className="px-4">
                    <NavLinks />
                  </nav>
                </SheetContent>
              </Sheet>

              <div className="hidden sm:flex max-w-md w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar..."
                  className="w-full pl-9 bg-slate-50 border-none focus-visible:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={`https://img.usecurling.com/ppl/thumbnail?seed=${user?.id}`}
                      />
                      <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.name && <p className="font-medium">{user.name}</p>}
                      {user?.email && (
                        <p className="w-[200px] truncate text-sm text-slate-500">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

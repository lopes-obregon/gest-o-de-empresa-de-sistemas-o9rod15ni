import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-indigo-600 font-bold text-3xl">404</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Página não encontrada</h1>
        <p className="text-lg text-slate-500 max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2"
          >
            Voltar para o Início
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound

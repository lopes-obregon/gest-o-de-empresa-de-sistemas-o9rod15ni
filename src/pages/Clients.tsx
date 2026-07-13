import { useEffect, useState } from 'react'
import { getClients, Client } from '@/services/clients'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, Building, FileText } from 'lucide-react'
import { ClientFormDialog } from '@/components/ClientFormDialog'
import { ClientDocumentList } from '@/components/ClientDocumentList'
import { Badge } from '@/components/ui/badge'

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadData = async () => {
    const c = await getClients()
    setClients(c)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('clients', loadData)

  const docCount = (client: Client) => client.documents?.length || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="text-slate-500">Cadastros de empresas.</p>
        </div>
        <ClientFormDialog onSaved={loadData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? [...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-xl animate-pulse"></div>
            ))
          : clients.map((client) => (
              <Card key={client.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{client.name}</span>
                    </CardTitle>
                    <ClientFormDialog client={client} onSaved={loadData} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <div className="space-y-2 text-sm text-slate-600">
                    {client.email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-slate-400 shrink-0" /> {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-slate-400 shrink-0" /> {client.phone}
                      </div>
                    )}
                    {client.tax_id && (
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-2 text-slate-400 shrink-0" />{' '}
                        {client.tax_id}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
                      className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Documentos
                      {docCount(client) > 0 && (
                        <Badge variant="secondary" className="ml-1 bg-indigo-100 text-indigo-700">
                          {docCount(client)}
                        </Badge>
                      )}
                    </button>

                    {expandedId === client.id && (
                      <div className="mt-2 animate-fade-in">
                        <ClientDocumentList client={client} onUpdated={loadData} compact />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  )
}

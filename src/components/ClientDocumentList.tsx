import { FileText, Download, Trash2, FileImage } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getClientDocuments, downloadDocument, removeDocument, Client } from '@/services/clients'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

interface ClientDocumentListProps {
  client: Client
  onUpdated: () => void
  compact?: boolean
}

function isImageFile(filename: string) {
  return /\.(jpg|jpeg|png)$/i.test(filename)
}

export function ClientDocumentList({ client, onUpdated, compact }: ClientDocumentListProps) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState<string | null>(null)
  const docs = getClientDocuments(client.id, client.documents)

  if (docs.length === 0) {
    return <p className="text-sm text-slate-400 italic">Nenhum documento vinculado.</p>
  }

  const handleDelete = async (key: string) => {
    setDeleting(key)
    try {
      await removeDocument(client.id, key, client.documents || [])
      toast({ title: 'Documento removido' })
      onUpdated()
    } catch {
      toast({ title: 'Erro ao remover documento', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {docs.map((doc) => (
        <div
          key={doc.key}
          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors duration-150"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isImageFile(doc.name) ? (
              <FileImage className="h-4 w-4 text-indigo-500 shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
            )}
            <span className="text-sm text-slate-700 truncate">{doc.name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => downloadDocument(client.id, doc.key)}
              title="Baixar / Visualizar"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
              disabled={deleting === doc.key}
              onClick={() => handleDelete(doc.key)}
              title="Remover"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

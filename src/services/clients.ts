import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface Client extends RecordModel {
  name: string
  tax_id: string
  email: string
  phone: string
  documents?: string[]
}

export interface ClientDocument {
  name: string
  url: string
  key: string
}

export const getClients = () => pb.collection<Client>('clients').getFullList({ sort: '-created' })

export const getClient = (id: string) => pb.collection<Client>('clients').getOne(id)

export const createClient = (data: Partial<Client> | FormData) =>
  pb.collection<Client>('clients').create(data)

export const updateClient = (id: string, data: Partial<Client> | FormData) =>
  pb.collection<Client>('clients').update(id, data)

export const deleteClient = (id: string) => pb.collection<Client>('clients').delete(id)

export function getClientDocuments(
  clientId: string,
  documents: string[] | undefined,
): ClientDocument[] {
  if (!documents || documents.length === 0) return []
  return documents.map((key) => ({
    name: key,
    url: pb.files.getURL(
      { id: clientId, collectionId: 'clients', collectionName: 'clients' } as RecordModel,
      key,
    ),
    key,
  }))
}

export function downloadDocument(clientId: string, filename: string) {
  const url = pb.files.getURL(
    { id: clientId, collectionId: 'clients', collectionName: 'clients' } as RecordModel,
    filename,
  )
  window.open(url, '_blank')
}

export async function removeDocument(
  clientId: string,
  documentKey: string,
  currentDocuments: string[],
) {
  const formData = new FormData()
  const remaining = currentDocuments.filter((d) => d !== documentKey)
  formData.append('documents-', documentKey)
  return pb.collection<Client>('clients').update(clientId, formData)
}

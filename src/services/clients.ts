import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface Client extends RecordModel {
  name: string
  tax_id: string
  email: string
  phone: string
}

export const getClients = () => pb.collection<Client>('clients').getFullList({ sort: '-created' })
export const getClient = (id: string) => pb.collection<Client>('clients').getOne(id)
export const createClient = (data: Partial<Client>) => pb.collection<Client>('clients').create(data)
export const updateClient = (id: string, data: Partial<Client>) =>
  pb.collection<Client>('clients').update(id, data)
export const deleteClient = (id: string) => pb.collection<Client>('clients').delete(id)

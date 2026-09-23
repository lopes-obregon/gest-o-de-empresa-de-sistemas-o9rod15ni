import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface ServiceItem extends RecordModel {
  name: string
  description: string
  price: number
  category?: string
  unit?: string
  active?: boolean
}

export const getServices = (onlyActive = false) => {
  const filter = onlyActive ? 'active = true' : ''
  return pb.collection<ServiceItem>('services').getFullList({
    sort: 'name',
    filter,
  })
}

export const getService = (id: string) => pb.collection<ServiceItem>('services').getOne(id)

export const createService = (data: Partial<ServiceItem>) =>
  pb.collection<ServiceItem>('services').create(data)

export const updateService = (id: string, data: Partial<ServiceItem>) =>
  pb.collection<ServiceItem>('services').update(id, data)

export const deleteService = (id: string) => pb.collection<ServiceItem>('services').delete(id)

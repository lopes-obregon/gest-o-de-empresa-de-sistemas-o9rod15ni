import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface SystemSubscriber extends RecordModel {
  name: string
  email: string
  payment_status: 'em_dia' | 'pendente'
  access_status: 'active' | 'inactive'
  external_id?: string
  expiry_date?: string
  external_create_date?: string
  last_notification_status?: string
  last_notification_date?: string
  system?: string
}

export const getSubscribers = () =>
  pb.collection<SystemSubscriber>('system_subscribers').getFullList({ sort: '-created' })

export const getSubscriber = (id: string) =>
  pb.collection<SystemSubscriber>('system_subscribers').getOne(id)

export const createSubscriber = (data: Partial<SystemSubscriber>) =>
  pb.collection<SystemSubscriber>('system_subscribers').create(data)

export const updateSubscriber = (id: string, data: Partial<SystemSubscriber>) =>
  pb.collection<SystemSubscriber>('system_subscribers').update(id, data)

export const deleteSubscriber = (id: string) =>
  pb.collection<SystemSubscriber>('system_subscribers').delete(id)

export interface SyncResult {
  success: boolean
  created: number
  updated: number
  errors: number
  total: number
  message?: string
}

export interface CheckExpiryResult {
  success: boolean
  total_checked: number
  notified: number
  skipped: number
  errors: number
  message?: string
  details?: Array<{
    email: string
    status?: string
    days_remaining?: number
    action: string
    success?: boolean
    error?: string
  }>
}

export const pullExternalSubscribers = (): Promise<SyncResult> =>
  pb.send('/backend/v1/pull-external-subscribers', { method: 'POST' })

export const checkSubscriberExpiry = (): Promise<CheckExpiryResult> =>
  pb.send('/backend/v1/check-expiry', { method: 'POST' })

import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'
import { Project } from './projects'

export interface Transaction extends RecordModel {
  description: string
  amount: number
  type: 'entrada' | 'saida'
  category: string
  date: string
  project?: string
  expand?: {
    project: Project
  }
}

export const getTransactions = () =>
  pb.collection<Transaction>('transactions').getFullList({ sort: '-date', expand: 'project' })
export const getTransaction = (id: string) =>
  pb.collection<Transaction>('transactions').getOne(id, { expand: 'project' })
export const createTransaction = (data: Partial<Transaction>) =>
  pb.collection<Transaction>('transactions').create(data)
export const updateTransaction = (id: string, data: Partial<Transaction>) =>
  pb.collection<Transaction>('transactions').update(id, data)
export const deleteTransaction = (id: string) =>
  pb.collection<Transaction>('transactions').delete(id)

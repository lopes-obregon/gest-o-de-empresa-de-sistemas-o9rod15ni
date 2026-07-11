import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface FixedExpense extends RecordModel {
  description: string
  amount: number
  due_day: number
  category: string
}

export const getFixedExpenses = () =>
  pb.collection<FixedExpense>('fixed_expenses').getFullList({ sort: 'due_day' })

export const createFixedExpense = (data: Partial<FixedExpense>) =>
  pb.collection<FixedExpense>('fixed_expenses').create(data)

export const updateFixedExpense = (id: string, data: Partial<FixedExpense>) =>
  pb.collection<FixedExpense>('fixed_expenses').update(id, data)

export const deleteFixedExpense = (id: string) =>
  pb.collection<FixedExpense>('fixed_expenses').delete(id)

import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'
import { Client } from './clients'
import { ServiceItem } from './services'

export type BudgetStatus = 'rascunho' | 'enviado' | 'aprovado' | 'recusado'

export interface Budget extends RecordModel {
  client_name: string
  client?: string
  client_email?: string
  client_phone?: string
  status: BudgetStatus
  date: string
  valid_until?: string
  total: number
  notes?: string
  expand?: {
    client?: Client
  }
}

export interface BudgetItem extends RecordModel {
  budget: string
  service?: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  total: number
  expand?: {
    service?: ServiceItem
  }
}

export interface BudgetWithItems extends Budget {
  items: BudgetItem[]
}

export const getBudgets = () =>
  pb.collection<Budget>('budgets').getFullList({
    sort: '-date,-created',
    expand: 'client',
  })

export const getBudget = async (id: string): Promise<BudgetWithItems> => {
  const budget = await pb.collection<Budget>('budgets').getOne(id, {
    expand: 'client',
  })
  const items = await pb.collection<BudgetItem>('budget_items').getFullList({
    filter: `budget = "${id}"`,
    sort: 'created',
    expand: 'service',
  })
  return {
    ...budget,
    items,
  }
}

export interface CreateBudgetItemInput {
  service?: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  total: number
}

export interface CreateBudgetInput {
  client_name: string
  client?: string
  client_email?: string
  client_phone?: string
  status: BudgetStatus
  date: string
  valid_until?: string
  notes?: string
  items: CreateBudgetItemInput[]
}

export const createBudget = async (input: CreateBudgetInput): Promise<Budget> => {
  const total = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

  const budgetRecord = await pb.collection<Budget>('budgets').create({
    client_name: input.client_name,
    client: input.client || undefined,
    client_email: input.client_email,
    client_phone: input.client_phone,
    status: input.status,
    date: input.date,
    valid_until: input.valid_until || undefined,
    notes: input.notes,
    total,
  })

  for (const item of input.items) {
    await pb.collection<BudgetItem>('budget_items').create({
      budget: budgetRecord.id,
      service: item.service || undefined,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
    })
  }

  return budgetRecord
}

export interface UpdateBudgetInput {
  client_name?: string
  client?: string
  client_email?: string
  client_phone?: string
  status?: BudgetStatus
  date?: string
  valid_until?: string
  notes?: string
  items?: CreateBudgetItemInput[]
}

export const updateBudget = async (budgetId: string, input: UpdateBudgetInput): Promise<Budget> => {
  let total: number | undefined

  if (input.items) {
    total = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    // Remove existing items and recreate
    const existing = await pb.collection<BudgetItem>('budget_items').getFullList({
      filter: `budget = "${budgetId}"`,
    })
    for (const item of existing) {
      await pb.collection<BudgetItem>('budget_items').delete(item.id)
    }
    for (const item of input.items) {
      await pb.collection<BudgetItem>('budget_items').create({
        budget: budgetId,
        service: item.service || undefined,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      })
    }
  }

  const payload: Partial<Budget> = {
    ...(input.client_name !== undefined && { client_name: input.client_name }),
    ...(input.client !== undefined && { client: input.client || undefined }),
    ...(input.client_email !== undefined && { client_email: input.client_email }),
    ...(input.client_phone !== undefined && { client_phone: input.client_phone }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.date !== undefined && { date: input.date }),
    ...(input.valid_until !== undefined && { valid_until: input.valid_until || undefined }),
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(total !== undefined && { total }),
  }

  return pb.collection<Budget>('budgets').update(budgetId, payload)
}

export const deleteBudget = async (id: string) => {
  return pb.collection<Budget>('budgets').delete(id)
}

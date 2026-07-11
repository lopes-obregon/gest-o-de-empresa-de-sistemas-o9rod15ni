import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface Employee extends RecordModel {
  name: string
  position: string
  salary: number
  status: 'active' | 'inactive'
}

export const getEmployees = () => pb.collection<Employee>('employees').getFullList({ sort: 'name' })

export const createEmployee = (data: Partial<Employee>) =>
  pb.collection<Employee>('employees').create(data)

export const updateEmployee = (id: string, data: Partial<Employee>) =>
  pb.collection<Employee>('employees').update(id, data)

export const deleteEmployee = (id: string) => pb.collection<Employee>('employees').delete(id)

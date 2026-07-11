import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface User extends RecordModel {
  name: string
  email: string
  role: 'admin' | 'member'
}

export const getUsers = () => pb.collection<User>('users').getFullList({ sort: 'created' })

export const updateUserRole = (id: string, role: string) =>
  pb.collection<User>('users').update(id, { role })

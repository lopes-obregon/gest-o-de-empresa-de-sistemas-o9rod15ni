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

export const createUser = (data: { name: string; email: string; password: string; role: string }) =>
  pb.collection<User>('users').create({
    name: data.name,
    email: data.email,
    password: data.password,
    passwordConfirm: data.password,
    role: data.role,
  })

export const deleteUser = (id: string) => pb.collection<User>('users').delete(id)

export const updateUser = (id: string, data: { name?: string; role?: string }) =>
  pb.collection<User>('users').update(id, data)

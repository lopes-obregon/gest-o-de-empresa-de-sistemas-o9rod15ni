import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'
import { Client } from './clients'

export interface Project extends RecordModel {
  name: string
  client: string
  start_date: string
  end_date: string
  status: 'lead' | 'em_desenvolvimento' | 'pausado' | 'finalizado'
  budget: number
  description: string
  expand?: {
    client: Client
  }
}

export const getProjects = () =>
  pb.collection<Project>('projects').getFullList({ sort: '-created', expand: 'client' })
export const getProject = (id: string) =>
  pb.collection<Project>('projects').getOne(id, { expand: 'client' })
export const createProject = (data: Partial<Project>) =>
  pb.collection<Project>('projects').create(data)
export const updateProject = (id: string, data: Partial<Project>) =>
  pb.collection<Project>('projects').update(id, data)
export const deleteProject = (id: string) => pb.collection<Project>('projects').delete(id)

import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface SubscriberSystem extends RecordModel {
  name: string
  description?: string
  active?: boolean
}

export const getSystems = () =>
  pb.collection<SubscriberSystem>('subscriber_systems').getFullList({ sort: 'created' })

export const getSystem = (id: string) =>
  pb.collection<SubscriberSystem>('subscriber_systems').getOne(id)

export const createSystem = (data: Partial<SubscriberSystem>) =>
  pb.collection<SubscriberSystem>('subscriber_systems').create(data)

export const updateSystem = (id: string, data: Partial<SubscriberSystem>) =>
  pb.collection<SubscriberSystem>('subscriber_systems').update(id, data)

/**
 * Tenta excluir um sistema. Se ainda houver assinantes vinculados, a API
 * externa (Ponte) não conhece o conceito de sistema, por isso o campo NUNCA
 * é enviado nos payloads de assinante para fora (hooks fazem o mapeamento).
 * A exclusão de sistema com assinantes é bloqueada na UI (contagem) e aqui
 * retornamos erro amigável.
 */
export const deleteSystem = async (id: string) => {
  const linked = await pb
    .collection('system_subscribers')
    .getList(1, 1, { filter: `system="${id}"` })
  if (linked.totalItems > 0) {
    throw new Error(
      `Este sistema ainda possui ${linked.totalItems} assinante(s) vinculado(s). Mova-os para outro sistema antes de excluir.`,
    )
  }
  return pb.collection<SubscriberSystem>('subscriber_systems').delete(id)
}

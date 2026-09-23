import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface CompanySettings extends RecordModel {
  name: string
  email: string
  cnpj: string
  phone: string
  address: string
  logo_url: string
  website: string
  payment_conditions: string
}

export type UpdateCompanySettingsInput = {
  name: string
  email?: string
  cnpj?: string
  phone?: string
  address?: string
  logo_url?: string
  website?: string
  payment_conditions?: string
}

export const DEFAULT_COMPANY_SETTINGS: Omit<CompanySettings, keyof RecordModel> = {
  name: 'VL Soluções em IA LTDA',
  email: 'contato@vlsolucoes.com.br',
  cnpj: '00.000.000/0001-00',
  phone: '(11) 99999-9999',
  address: 'São Paulo - SP',
  logo_url: '',
  website: 'https://vlsolucoes.com.br',
  payment_conditions: '50% na assinatura + 50% na entrega',
}

/**
 * Obtém as configurações da empresa (singleton).
 * Se não existir nenhum registro, tenta criar um com os valores padrão.
 */
export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const records = await pb.collection<CompanySettings>('company_settings').getList(1, 1, {
      sort: '-created',
    })
    if (records.items && records.items.length > 0) {
      return records.items[0]
    }

    // Se a collection estiver vazia, cria o primeiro registro
    const created = await pb
      .collection<CompanySettings>('company_settings')
      .create(DEFAULT_COMPANY_SETTINGS)
    return created
  } catch (error) {
    console.error('Erro ao buscar configurações da empresa:', error)
    // Retorna fallback simulado para evitar que a aplicação quebre
    return {
      id: '',
      collectionId: 'company_settings',
      collectionName: 'company_settings',
      created: '',
      updated: '',
      ...DEFAULT_COMPANY_SETTINGS,
    } as unknown as CompanySettings
  }
}

/**
 * Atualiza as configurações da empresa.
 */
export async function updateCompanySettings(
  id: string,
  data: UpdateCompanySettingsInput,
): Promise<CompanySettings> {
  if (id) {
    return pb.collection<CompanySettings>('company_settings').update(id, data)
  }
  return pb.collection<CompanySettings>('company_settings').create(data)
}

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react'
import {
  CompanySettings,
  getCompanySettings,
  updateCompanySettings,
} from '@/services/company-settings'
import { useToast } from '@/hooks/use-toast'

interface CompanySettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (settings: CompanySettings) => void
}

export function CompanySettingsDialog({ open, onOpenChange, onSaved }: CompanySettingsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recordId, setRecordId] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cnpj: '',
    phone: '',
    address: '',
    website: '',
    logo_url: '',
    payment_conditions: '',
  })

  useEffect(() => {
    if (open) {
      loadSettings()
    }
  }, [open])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await getCompanySettings()
      setRecordId(data.id || '')
      setFormData({
        name: data.name || '',
        email: data.email || '',
        cnpj: data.cnpj || '',
        phone: data.phone || '',
        address: data.address || '',
        website: data.website || '',
        logo_url: data.logo_url || '',
        payment_conditions: data.payment_conditions || '',
      })
    } catch {
      toast({
        title: 'Erro ao carregar dados da empresa',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({
        title: 'Nome da empresa é obrigatório',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const updated = await updateCompanySettings(recordId, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        cnpj: formData.cnpj.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        website: formData.website.trim(),
        logo_url: formData.logo_url.trim(),
        payment_conditions: formData.payment_conditions.trim(),
      })

      setRecordId(updated.id)
      toast({
        title: 'Informações da empresa salvas com sucesso!',
        description: 'Os dados atualizados já serão aplicados aos orçamentos e contratos.',
      })
      if (onSaved) onSaved(updated)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao salvar informações da empresa',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Informações da Empresa
          </DialogTitle>
          <DialogDescription>
            Configure o email, razão social, CNPJ e outros dados institucionais que aparecem nos
            contratos, propostas e orçamentos emitidos.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-slate-500">Carregando dados da empresa...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="company_name">Nome da Empresa / Razão Social *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="company_name"
                    required
                    placeholder="VL Soluções em IA LTDA"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-9 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company_email">
                  Email de Contato (aparece nos contratos e orçamentos) *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="company_email"
                    type="email"
                    placeholder="contato@vlsolucoes.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-9 bg-white"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Principal endereço para envio de propostas e contato comercial.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company_cnpj">CNPJ</Label>
                <div className="relative">
                  <FileSpreadsheet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="company_cnpj"
                    placeholder="00.000.000/0001-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    className="pl-9 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company_phone">Telefone / WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="company_phone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-9 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company_website">Site / Domínio (opcional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="company_website"
                    placeholder="https://vlsolucoes.com.br"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="pl-9 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="company_address">Endereço (opcional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="company_address"
                    placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="pl-9 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="company_logo">URL do Logotipo da Empresa (opcional)</Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="company_logo"
                    placeholder="https://exemplo.com/logo.png"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="pl-9 bg-white"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Insira o link público da logo para exibição no cabeçalho do PDF dos orçamentos.
                </p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="company_payment_conditions">Condições Padrão de Pagamento</Label>
                <Textarea
                  id="company_payment_conditions"
                  rows={3}
                  placeholder="Ex: 50% na assinatura do contrato + 50% na entrega e aprovação final. Vencimento em até 5 dias após emissão da NF."
                  value={formData.payment_conditions}
                  onChange={(e) => setFormData({ ...formData, payment_conditions: e.target.value })}
                  className="bg-white"
                />
                <p className="text-xs text-slate-500">
                  Texto exibido nas observações do orçamento e nos contratos comerciais caso não
                  seja informado um termo personalizado.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

import { BudgetWithItems } from '@/services/budgets'
import { formatCurrency, formatDate } from '@/lib/format'
import { CompanySettings, getCompanySettings } from '@/services/company-settings'

export async function generateBudgetPdf(
  budget: BudgetWithItems,
  providedCompany?: CompanySettings | null,
) {
  let company = providedCompany
  if (!company) {
    try {
      company = await getCompanySettings()
    } catch {
      company = null
    }
  }

  const companyName = company?.name?.trim() || 'VL SOLUÇÕES EM IA LTDA'
  const companyEmail = company?.email?.trim() || 'contato@vlsolucoes.com.br'
  const companyCnpj = company?.cnpj?.trim() || '00.000.000/0001-00'
  const companyPhone = company?.phone?.trim() || ''
  const companyAddress = company?.address?.trim() || ''
  const companyWebsite = company?.website?.trim() || ''
  const companyLogo = company?.logo_url?.trim() || ''
  const defaultPaymentConditions = company?.payment_conditions?.trim() || ''

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Por favor, permita pop-ups para gerar e imprimir o PDF do orçamento.')
    return
  }

  const itemsRowsHtml = budget.items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
        <td style="padding: 12px 10px; color: #64748b; text-align: center;">${idx + 1}</td>
        <td style="padding: 12px 10px; color: #1e293b; font-weight: 500;">
          ${escapeHtml(item.name)}
          ${
            item.description
              ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: normal;">${escapeHtml(
                  item.description,
                )}</div>`
              : ''
          }
        </td>
        <td style="padding: 12px 10px; text-align: center; color: #334155;">${item.quantity}</td>
        <td style="padding: 12px 10px; text-align: right; color: #334155;">${formatCurrency(
          item.unit_price,
        )}</td>
        <td style="padding: 12px 10px; text-align: right; font-weight: 600; color: #0f172a;">${formatCurrency(
          item.total,
        )}</td>
      </tr>
    `,
    )
    .join('')

  const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
    rascunho: { label: 'Rascunho', color: '#475569', bg: '#f1f5f9' },
    enviado: { label: 'Enviado', color: '#1d4ed8', bg: '#dbeafe' },
    aprovado: { label: 'Aprovado', color: '#15803d', bg: '#dcfce7' },
    recusado: { label: 'Recusado', color: '#b91c1c', bg: '#fee2e2' },
  }

  const st = statusLabels[budget.status] || {
    label: budget.status,
    color: '#334155',
    bg: '#f1f5f9',
  }

  // Prepara linha de dados de contato institucional
  const companyContacts = [
    companyEmail ? `E-mail: ${escapeHtml(companyEmail)}` : '',
    companyCnpj ? `CNPJ: ${escapeHtml(companyCnpj)}` : '',
    companyPhone ? `Tel: ${escapeHtml(companyPhone)}` : '',
    companyWebsite ? `${escapeHtml(companyWebsite)}` : '',
  ]
    .filter(Boolean)
    .join(' &bull; ')

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Orçamento #${budget.id.substring(0, 8).toUpperCase()} - ${escapeHtml(
    budget.client_name,
  )}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 20mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 20px;
      margin-bottom: 24px;
      gap: 20px;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-logo {
      max-height: 56px;
      max-width: 140px;
      object-fit: contain;
      border-radius: 4px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 3px;
    }
    .budget-meta {
      text-align: right;
      white-space: nowrap;
    }
    .budget-meta h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
    }
    .budget-meta p {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: #64748b;
    }
    .badge-status {
      display: inline-block;
      margin-top: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: ${st.bg};
      color: ${st.color};
    }
    .info-grid {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 28px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }
    .info-block {
      flex: 1;
    }
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 6px;
    }
    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }
    .info-detail {
      font-size: 12px;
      color: #475569;
      margin-top: 3px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px;
      border-bottom: 2px solid #cbd5e1;
    }
    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
      margin-bottom: 24px;
    }
    .totals-box {
      width: 280px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fafafa;
      padding: 16px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #475569;
    }
    .totals-row.final {
      border-top: 2px solid #e2e8f0;
      margin-top: 6px;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    .notes-box {
      border-left: 4px solid #4f46e5;
      background: #f8fafc;
      padding: 14px 16px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .notes-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #4f46e5;
      margin-bottom: 4px;
    }
    .notes-content {
      font-size: 13px;
      color: #334155;
      white-space: pre-wrap;
      line-height: 1.5;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
    .action-bar {
      position: sticky;
      top: 0;
      background: #1e1b4b;
      color: white;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
    .btn-print {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    .btn-print:hover {
      background: #4338ca;
    }
    @media print {
      .action-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <div>
      <strong>Visualização de Orçamento</strong> &bull; Pronto para salvar ou imprimir em PDF
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ Salvar como PDF / Imprimir
    </button>
  </div>

  <div class="container">
    <div class="header">
      <div class="brand-section">
        ${
          companyLogo
            ? `<img src="${escapeHtml(
                companyLogo,
              )}" alt="Logo" class="brand-logo" onerror="this.style.display='none'" />`
            : ''
        }
        <div>
          <div class="brand-title">${escapeHtml(companyName)}</div>
          ${companyAddress ? `<div class="brand-subtitle">${escapeHtml(companyAddress)}</div>` : ''}
          ${companyContacts ? `<div class="brand-subtitle">${companyContacts}</div>` : ''}
        </div>
      </div>
      <div class="budget-meta">
        <h1>PROPOSTA COMERCIAL</h1>
        <p>Orçamento <strong>#${budget.id.substring(0, 8).toUpperCase()}</strong></p>
        <div class="badge-status">${st.label}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <div class="info-label">Dados do Cliente</div>
        <div class="info-value">${escapeHtml(budget.client_name)}</div>
        ${
          budget.client_email
            ? `<div class="info-detail">E-mail: ${escapeHtml(budget.client_email)}</div>`
            : ''
        }
        ${
          budget.client_phone
            ? `<div class="info-detail">Telefone: ${escapeHtml(budget.client_phone)}</div>`
            : ''
        }
      </div>
      <div class="info-block">
        <div class="info-label">Datas & Prazos</div>
        <div class="info-detail"><strong>Data de Emissão:</strong> ${formatDate(budget.date)}</div>
        ${
          budget.valid_until
            ? `<div class="info-detail"><strong>Validade da Proposta:</strong> ${formatDate(
                budget.valid_until,
              )}</div>`
            : '<div class="info-detail"><strong>Validade:</strong> 15 dias corridos</div>'
        }
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th style="text-align: left;">Descrição do Serviço / Solução</th>
          <th style="width: 70px; text-align: center;">Qtd</th>
          <th style="width: 120px; text-align: right;">Unitário</th>
          <th style="width: 130px; text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${
          itemsRowsHtml ||
          `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #94a3b8;">Nenhum item informado.</td></tr>`
        }
      </tbody>
    </table>

    <div class="totals-area">
      <div class="totals-box">
        <div class="totals-row">
          <span>Itens inclusos:</span>
          <strong>${budget.items.length}</strong>
        </div>
        <div class="totals-row final">
          <span>VALOR TOTAL:</span>
          <span style="color: #4f46e5;">${formatCurrency(budget.total)}</span>
        </div>
      </div>
    </div>

    ${
      budget.notes
        ? `
      <div class="notes-box">
        <div class="notes-title">Observações do Orçamento</div>
        <div class="notes-content">${escapeHtml(budget.notes)}</div>
      </div>
    `
        : ''
    }

    ${
      defaultPaymentConditions
        ? `
      <div class="notes-box" style="border-left-color: #059669; background: #f0fdf4;">
        <div class="notes-title" style="color: #059669;">Condições Gerais de Pagamento</div>
        <div class="notes-content" style="color: #1e293b;">${escapeHtml(defaultPaymentConditions)}</div>
      </div>
    `
        : ''
    }

    <div class="footer">
      <p>Este documento é uma estimativa orçamentária válida para os serviços acima listados.</p>
      <p>Gerado pelo sistema de gestão ${escapeHtml(companyName)} &bull; ${new Date().toLocaleDateString(
        'pt-BR',
      )} às ${new Date().toLocaleTimeString('pt-BR')}</p>
    </div>
  </div>
</body>
</html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

function escapeHtml(str: string): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

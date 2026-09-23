migrate(
  (app) => {
    try {
      const servicesCol = app.findCollectionByNameOrId('services')
      const existing = app.findRecordsByFilter('services', '', '-created', 1, 0)
      if (existing.length === 0) {
        const seedServices = [
          {
            name: 'Desenvolvimento de Agente de IA Personalizado',
            description:
              'Criação e integração de agente conversacional inteligente com ferramentas e base de conhecimento.',
            price: 4500,
            category: 'Inteligência Artificial',
            unit: 'projeto',
            active: true,
          },
          {
            name: 'Desenvolvimento de Web App / SaaS (MVP)',
            description:
              'Desenvolvimento completo de frontend React e backend em nuvem com autenticação e banco de dados.',
            price: 7800,
            category: 'Desenvolvimento Web',
            unit: 'projeto',
            active: true,
          },
          {
            name: 'Automação de Processos & Integração de APIs',
            description:
              'Integração entre sistemas (CRM, ERP, Gateways de Pagamento e Webhooks) para fluxos automatizados.',
            price: 2200,
            category: 'Automação',
            unit: 'fluxo',
            active: true,
          },
          {
            name: 'Consultoria e Arquitetura de Software',
            description:
              'Hora técnica especializada em diagnóstico, modelagem de banco e boas práticas de arquitetura.',
            price: 250,
            category: 'Consultoria',
            unit: 'hora',
            active: true,
          },
          {
            name: 'Suporte e Manutenção Mensal',
            description:
              'Monitoramento, correção preventiva e garantia de SLA para aplicações em produção.',
            price: 1200,
            category: 'Suporte',
            unit: 'mês',
            active: true,
          },
        ]

        for (const item of seedServices) {
          const rec = new Record(servicesCol)
          rec.set('name', item.name)
          rec.set('description', item.description)
          rec.set('price', item.price)
          rec.set('category', item.category)
          rec.set('unit', item.unit)
          rec.set('active', item.active)
          app.save(rec)
        }
      }
    } catch (err) {
      console.log('Error seeding services:', err)
    }
  },
  (app) => {
    // down migration
  },
)

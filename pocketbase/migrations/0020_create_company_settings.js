migrate(
  (app) => {
    const collection = new Collection({
      name: 'company_settings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: false },
        { name: 'cnpj', type: 'text', required: false },
        { name: 'phone', type: 'text', required: false },
        { name: 'address', type: 'text', required: false },
        { name: 'logo_url', type: 'text', required: false },
        { name: 'website', type: 'text', required: false },
        { name: 'payment_conditions', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(collection)

    // Seed registro singleton inicial
    try {
      const records = app.findRecordsByFilter('company_settings', '', '', 1, 0)
      if (!records || records.length === 0) {
        const col = app.findCollectionByNameOrId('company_settings')
        const record = new Record(col)
        record.set('name', 'VL Soluções em IA LTDA')
        record.set('email', 'contato@vlsolucoes.com.br')
        record.set('cnpj', '00.000.000/0001-00')
        record.set('phone', '(11) 99999-9999')
        record.set('address', 'São Paulo - SP')
        record.set('website', 'https://vlsolucoes.com.br')
        record.set('payment_conditions', '50% na assinatura + 50% na entrega')
        record.set('logo_url', '')
        app.save(record)
      }
    } catch (e) {
      console.log('Erro ao criar seed de company_settings:', e)
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('company_settings')
      app.delete(collection)
    } catch (_) {}
  },
)

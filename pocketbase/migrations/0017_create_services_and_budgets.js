migrate(
  (app) => {
    const services = new Collection({
      name: 'services',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'price', type: 'number', required: true, min: 0 },
        { name: 'category', type: 'text' },
        { name: 'unit', type: 'text' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_services_name ON services (name)',
        'CREATE INDEX idx_services_active ON services (active)',
      ],
    })
    app.save(services)

    const clientsCollection = app.findCollectionByNameOrId('clients')

    const budgets = new Collection({
      name: 'budgets',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'client_name', type: 'text', required: true },
        {
          name: 'client',
          type: 'relation',
          collectionId: clientsCollection.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'client_email', type: 'email' },
        { name: 'client_phone', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['rascunho', 'enviado', 'aprovado', 'recusado'],
          maxSelect: 1,
        },
        { name: 'date', type: 'date', required: true },
        { name: 'valid_until', type: 'date' },
        { name: 'total', type: 'number', min: 0 },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_budgets_status ON budgets (status)',
        'CREATE INDEX idx_budgets_date ON budgets (date)',
      ],
    })
    app.save(budgets)

    const budgetsCollection = app.findCollectionByNameOrId('budgets')
    const servicesCollection = app.findCollectionByNameOrId('services')

    const budgetItems = new Collection({
      name: 'budget_items',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'budget',
          type: 'relation',
          required: true,
          collectionId: budgetsCollection.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'service',
          type: 'relation',
          collectionId: servicesCollection.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'quantity', type: 'number', required: true, min: 0 },
        { name: 'unit_price', type: 'number', required: true, min: 0 },
        { name: 'total', type: 'number', required: true, min: 0 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_budget_items_budget ON budget_items (budget)'],
    })
    app.save(budgetItems)
  },
  (app) => {
    try {
      const budgetItems = app.findCollectionByNameOrId('budget_items')
      app.delete(budgetItems)
    } catch (_) {}

    try {
      const budgets = app.findCollectionByNameOrId('budgets')
      app.delete(budgets)
    } catch (_) {}

    try {
      const services = app.findCollectionByNameOrId('services')
      app.delete(services)
    } catch (_) {}
  },
)

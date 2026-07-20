migrate(
  (app) => {
    const collection = new Collection({
      name: 'system_subscribers',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        {
          name: 'payment_status',
          type: 'select',
          required: true,
          values: ['em_dia', 'pendente'],
          maxSelect: 1,
        },
        {
          name: 'access_status',
          type: 'select',
          required: true,
          values: ['active', 'inactive'],
          maxSelect: 1,
        },
        { name: 'external_id', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_system_subscribers_email ON system_subscribers (email)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('system_subscribers')
    app.delete(collection)
  },
)

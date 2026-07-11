migrate(
  (app) => {
    const collection = new Collection({
      name: 'fixed_expenses',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'description', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true, min: 0 },
        { name: 'due_day', type: 'number', required: true, min: 1, max: 31, onlyInt: true },
        { name: 'category', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('fixed_expenses')
    app.delete(collection)
  },
)

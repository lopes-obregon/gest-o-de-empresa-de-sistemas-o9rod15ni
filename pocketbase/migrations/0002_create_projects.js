migrate(
  (app) => {
    const collection = new Collection({
      name: 'projects',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'client',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('clients').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'start_date', type: 'date', required: true },
        { name: 'end_date', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['lead', 'em_desenvolvimento', 'pausado', 'finalizado'],
          maxSelect: 1,
        },
        { name: 'budget', type: 'number' },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_projects_status ON projects (status)',
        'CREATE INDEX idx_projects_end_date ON projects (end_date)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('projects')
    app.delete(collection)
  },
)

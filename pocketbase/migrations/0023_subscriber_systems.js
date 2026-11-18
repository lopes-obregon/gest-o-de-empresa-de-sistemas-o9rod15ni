// Cria a collection subscriber_systems (um "sistema" vendido pelo usuário,
// ex: "Gestor Caminhoneiro") e adiciona o campo system (relation) em
// system_subscribers, com backfill: todos os assinantes existentes vão para
// o sistema padrão "Gestor Caminhoneiro".
migrate(
  (app) => {
    // 1. Collection subscriber_systems
    let systemsCol
    try {
      systemsCol = app.findCollectionByNameOrId('subscriber_systems')
    } catch (_) {
      systemsCol = null
    }

    if (!systemsCol) {
      systemsCol = new Collection({
        name: 'subscriber_systems',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'name', type: 'text', required: true, min: 1, max: 100 },
          { name: 'description', type: 'text' },
          { name: 'active', type: 'bool' },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_subscriber_systems_name ON subscriber_systems (name COLLATE NOCASE)',
        ],
      })
      app.save(systemsCol)
    }

    // 2. Seed do sistema padrão (idempotente)
    let defaultSystemId
    try {
      const existing = app.findFirstRecordByFilter(
        'subscriber_systems',
        "name = 'Gestor Caminhoneiro'",
      )
      defaultSystemId = existing.id
    } catch (_) {
      const col = app.findCollectionByNameOrId('subscriber_systems')
      const record = new Record(col)
      record.set('name', 'Gestor Caminhoneiro')
      record.set('description', 'Sistema padrão: gestão para caminhoneiros (assinantes atuais).')
      record.set('active', true)
      app.save(record)
      defaultSystemId = record.id
    }

    // 3. Campo system (relation) em system_subscribers
    const systemsColId = app.findCollectionByNameOrId('subscriber_systems').id
    const subCol = app.findCollectionByNameOrId('system_subscribers')
    if (!subCol.fields.getByName('system')) {
      subCol.fields.add(
        new RelationField({
          name: 'system',
          collectionId: systemsColId,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      app.save(subCol)
    }

    // 4. Backfill: todo assinante sem sistema vai para o sistema padrão.
    app
      .db()
      .newQuery("UPDATE system_subscribers SET system = {:sid} WHERE system IS NULL OR system = ''")
      .bind({ sid: defaultSystemId })
      .execute()
  },
  (app) => {
    // Revert: remove o campo system e apaga a collection subscriber_systems.
    try {
      const subCol = app.findCollectionByNameOrId('system_subscribers')
      const sysField = subCol.fields.getByName('system')
      if (sysField) {
        subCol.fields.removeByName('system')
        app.save(subCol)
      }
    } catch (_) {}
    try {
      const col = app.findCollectionByNameOrId('subscriber_systems')
      app.delete(col)
    } catch (_) {}
  },
)

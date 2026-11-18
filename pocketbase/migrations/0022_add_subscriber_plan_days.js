// Adiciona campo plan_days (duração do plano em dias, padrão 30) e sync_error
// (última falha de sincronização com a API externa) na collection system_subscribers.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('system_subscribers')

    if (!col.fields.getByName('plan_days')) {
      col.fields.add(
        new NumberField({
          name: 'plan_days',
          onlyInt: true,
          min: 1,
          max: 3650,
        }),
      )
    }

    if (!col.fields.getByName('sync_error')) {
      col.fields.add(new TextField({ name: 'sync_error' }))
    }

    app.save(col)

    // Backfill: assinantes existentes sem valor assumem 30 dias de plano.
    app
      .db()
      .newQuery(
        'UPDATE system_subscribers SET plan_days = 30 WHERE plan_days IS NULL OR plan_days = 0',
      )
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('system_subscribers')
    const planField = col.fields.getByName('plan_days')
    if (planField) {
      col.fields.removeByName('plan_days')
    }
    const errField = col.fields.getByName('sync_error')
    if (errField) {
      col.fields.removeByName('sync_error')
    }
    app.save(col)
  },
)

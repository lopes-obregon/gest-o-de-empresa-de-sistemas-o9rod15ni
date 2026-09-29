migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('budgets')

    if (!col.fields.getByName('payment_conditions')) {
      col.fields.add(new TextField({ name: 'payment_conditions' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('budgets')
    col.fields.removeByName('payment_conditions')
    app.save(col)
  },
)

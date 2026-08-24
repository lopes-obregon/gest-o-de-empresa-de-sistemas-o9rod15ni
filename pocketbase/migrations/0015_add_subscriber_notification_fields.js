migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('system_subscribers')

    if (!col.fields.getByName('last_notification_status')) {
      col.fields.add(new TextField({ name: 'last_notification_status' }))
    }

    if (!col.fields.getByName('last_notification_date')) {
      col.fields.add(new DateField({ name: 'last_notification_date' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('system_subscribers')
    col.fields.removeByName('last_notification_status')
    col.fields.removeByName('last_notification_date')
    app.save(col)
  },
)

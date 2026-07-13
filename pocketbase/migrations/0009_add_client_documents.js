migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')

    if (!col.fields.getByName('documents')) {
      col.fields.add(
        new FileField({
          name: 'documents',
          maxSelect: 20,
          maxSize: 5242880,
          mimeTypes: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
          ],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    const field = col.fields.getByName('documents')
    if (field) {
      col.fields.remove(field.id)
    }
    app.save(col)
  },
)

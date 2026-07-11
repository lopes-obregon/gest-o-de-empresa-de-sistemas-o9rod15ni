migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!col.fields.getByName('role')) {
      col.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'member'],
          maxSelect: 1,
        }),
      )
    }

    col.listRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'admin')"
    col.viewRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'admin')"
    col.createRule = "@request.auth.role = 'admin'"
    col.updateRule = "@request.auth.role = 'admin' || id = @request.auth.id"
    col.deleteRule = "@request.auth.role = 'admin'"

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.listRule = 'id = @request.auth.id'
    col.viewRule = 'id = @request.auth.id'
    col.createRule = ''
    col.updateRule = 'id = @request.auth.id'
    col.deleteRule = 'id = @request.auth.id'
    app.save(col)
  },
)

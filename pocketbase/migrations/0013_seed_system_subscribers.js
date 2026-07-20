migrate((app) => {
  var subscribers = [
    {
      name: 'Comercio Norte LTDA',
      email: 'contato@comercionorte.com.br',
      payment_status: 'em_dia',
      access_status: 'active',
      external_id: 'EXT-001',
    },
    {
      name: 'Tech Solutions Brasil',
      email: 'financeiro@techsolutionsbr.com',
      payment_status: 'pendente',
      access_status: 'inactive',
      external_id: 'EXT-002',
    },
    {
      name: 'AgroSul Distribuidora',
      email: 'sistemas@agrosul.com.br',
      payment_status: 'em_dia',
      access_status: 'active',
      external_id: 'EXT-003',
    },
    {
      name: 'Clinica Vida Plena',
      email: 'ti@vidaplena.com.br',
      payment_status: 'pendente',
      access_status: 'active',
      external_id: 'EXT-004',
    },
  ]

  var col = app.findCollectionByNameOrId('system_subscribers')
  for (var i = 0; i < subscribers.length; i++) {
    var sub = subscribers[i]
    try {
      app.findFirstRecordByData('system_subscribers', 'email', sub.email)
    } catch (_) {
      var record = new Record(col)
      record.set('name', sub.name)
      record.set('email', sub.email)
      record.set('payment_status', sub.payment_status)
      record.set('access_status', sub.access_status)
      record.set('external_id', sub.external_id)
      app.save(record)
    }
  }
})

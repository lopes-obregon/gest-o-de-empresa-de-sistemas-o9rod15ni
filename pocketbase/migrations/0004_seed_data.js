migrate((app) => {
  const users = app.findCollectionByNameOrId('_pb_users_auth_')
  try {
    app.findAuthRecordByEmail('_pb_users_auth_', 'felipe.vilamaior@gmail.com')
  } catch (_) {
    const record = new Record(users)
    record.setEmail('felipe.vilamaior@gmail.com')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Felipe Vilamaior')
    app.save(record)
  }

  let clientId = ''
  try {
    const existingClient = app.findFirstRecordByData(
      'clients',
      'email',
      'contato@empresaexemplo.com.br',
    )
    clientId = existingClient.id
  } catch (_) {
    const clients = app.findCollectionByNameOrId('clients')
    const clientRecord = new Record(clients)
    clientRecord.set('name', 'Empresa Exemplo LTDA')
    clientRecord.set('email', 'contato@empresaexemplo.com.br')
    clientRecord.set('phone', '(11) 99999-9999')
    clientRecord.set('tax_id', '12.345.678/0001-90')
    app.save(clientRecord)
    clientId = clientRecord.id
  }

  let projectId = ''
  try {
    const existingProject = app.findFirstRecordByData('projects', 'name', 'E-commerce Platform')
    projectId = existingProject.id
  } catch (_) {
    const projects = app.findCollectionByNameOrId('projects')
    const projectRecord = new Record(projects)
    projectRecord.set('name', 'E-commerce Platform')
    projectRecord.set('client', clientId)
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 60)
    projectRecord.set('start_date', start.toISOString())
    projectRecord.set('end_date', end.toISOString())
    projectRecord.set('status', 'em_desenvolvimento')
    projectRecord.set('budget', 50000)
    projectRecord.set(
      'description',
      'Plataforma completa de vendas online com integração de pagamentos e estoque.',
    )
    app.save(projectRecord)
    projectId = projectRecord.id
  }

  try {
    app.findFirstRecordByData('transactions', 'description', 'Entrada 1ª Parcela E-commerce')
  } catch (_) {
    const transactions = app.findCollectionByNameOrId('transactions')
    const t1 = new Record(transactions)
    t1.set('description', 'Entrada 1ª Parcela E-commerce')
    t1.set('amount', 25000)
    t1.set('type', 'entrada')
    t1.set('category', 'Pagamento Cliente')
    t1.set('date', new Date().toISOString())
    t1.set('project', projectId)
    app.save(t1)

    const t2 = new Record(transactions)
    t2.set('description', 'Pagamento Servidor AWS')
    t2.set('amount', 500)
    t2.set('type', 'saida')
    t2.set('category', 'Servidores')
    t2.set('date', new Date().toISOString())
    app.save(t2)
  }
})

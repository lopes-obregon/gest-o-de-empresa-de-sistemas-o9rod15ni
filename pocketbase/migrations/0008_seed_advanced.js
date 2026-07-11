migrate((app) => {
  try {
    const user = app.findAuthRecordByEmail('_pb_users_auth_', 'felipe.vilamaior@gmail.com')
    user.set('role', 'admin')
    app.save(user)
  } catch (_) {}

  var fixedExpenses = [
    { description: 'Aluguel do Escritorio', amount: 3500, due_day: 5, category: 'Infraestrutura' },
    { description: 'Internet Empresarial', amount: 250, due_day: 10, category: 'Infraestrutura' },
    { description: 'Licencas de Software', amount: 1200, due_day: 15, category: 'Ferramentas' },
    { description: 'Contabilidade', amount: 800, due_day: 20, category: 'Servicos' },
  ]

  var feCol = app.findCollectionByNameOrId('fixed_expenses')
  for (var i = 0; i < fixedExpenses.length; i++) {
    var fe = fixedExpenses[i]
    try {
      app.findFirstRecordByData('fixed_expenses', 'description', fe.description)
    } catch (_) {
      var record = new Record(feCol)
      record.set('description', fe.description)
      record.set('amount', fe.amount)
      record.set('due_day', fe.due_day)
      record.set('category', fe.category)
      app.save(record)
    }
  }

  var employees = [
    { name: 'Joao Silva', position: 'Desenvolvedor Full Stack', salary: 8000, status: 'active' },
    { name: 'Maria Santos', position: 'Designer UX/UI', salary: 6500, status: 'active' },
    { name: 'Pedro Oliveira', position: 'Gerente de Projetos', salary: 9000, status: 'active' },
    { name: 'Ana Costa', position: 'Desenvolvedora Backend', salary: 7500, status: 'inactive' },
  ]

  var empCol = app.findCollectionByNameOrId('employees')
  for (var j = 0; j < employees.length; j++) {
    var emp = employees[j]
    try {
      app.findFirstRecordByData('employees', 'name', emp.name)
    } catch (_) {
      var empRecord = new Record(empCol)
      empRecord.set('name', emp.name)
      empRecord.set('position', emp.position)
      empRecord.set('salary', emp.salary)
      empRecord.set('status', emp.status)
      app.save(empRecord)
    }
  }
})

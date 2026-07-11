routerAdd(
  'POST',
  '/backend/v1/finance/generate-monthly',
  (e) => {
    const userRole = e.auth ? e.auth.getString('role') : ''
    if (userRole !== 'admin') {
      return e.forbiddenError('Acesso restrito a administradores')
    }

    const transactionsCol = $app.findCollectionByNameOrId('transactions')
    const today = new Date().toISOString().split('T')[0]
    var count = 0

    var employees = $app.findRecordsByFilter('employees', "status = 'active'", 'name', 0, 0)
    for (var i = 0; i < employees.length; i++) {
      var emp = employees[i]
      var record = new Record(transactionsCol)
      record.set('description', 'Salario: ' + emp.getString('name'))
      record.set('amount', emp.getFloat('salary'))
      record.set('type', 'saida')
      record.set('category', 'Salarios')
      record.set('date', today)
      $app.save(record)
      count++
    }

    var expenses = $app.findRecordsByFilter('fixed_expenses', "id != ''", 'due_day', 0, 0)
    for (var j = 0; j < expenses.length; j++) {
      var exp = expenses[j]
      var record2 = new Record(transactionsCol)
      record2.set('description', exp.getString('description'))
      record2.set('amount', exp.getFloat('amount'))
      record2.set('type', 'saida')
      record2.set('category', exp.getString('category'))
      record2.set('date', today)
      $app.save(record2)
      count++
    }

    return e.json(200, {
      success: true,
      count: count,
      message: count + ' transacoes geradas com sucesso',
    })
  },
  $apis.requireAuth(),
)

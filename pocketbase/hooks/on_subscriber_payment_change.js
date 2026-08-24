onRecordAfterUpdateSuccess((e) => {
  const oldStatus = e.record.original().getString('payment_status')
  const newStatus = e.record.getString('payment_status')

  const email = e.record.getString('email')
  const externalId = e.record.getString('external_id')
  const name = e.record.getString('name')

  var mappedStatus = 'pending'
  if (newStatus === 'em_dia') {
    mappedStatus = 'paid'
  } else if (newStatus === 'pendente') {
    mappedStatus = 'pending'
  }

  var requestBody = JSON.stringify({
    email: email,
    external_id: externalId,
    name: name,
    payment_status: mappedStatus,
  })

  const authToken = $secrets.get('EXTERNAL_SYSTEM_AUTH_TOKEN') || ''
  const cfClientId = $secrets.get('CF_ACCESS_CLIENT_ID') || ''
  const cfClientSecret = $secrets.get('CF_ACCESS_CLIENT_SECRET') || ''
  const url = $secrets.get('API_BRIDE') || $secrets.get('API_DEV_BRIDE') || ''
  console.log('Entrou no mudar Pagamento! ', url)
  if (url && url.trim() !== '') {
    url = url + '/users'
  }
  console.log('Entrou no mudar Pagamento!  depois do tratamento', url)
  try {
    var res = $http.send({
      url: 'https://api.vlsolucoesia.com.br/backend/v1/users',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken ? 'Bearer ' + authToken : '',
        'CF-Access-Client-Id': cfClientId,
        'CF-Access-Client-Secret': cfClientSecret,
      },
      body: requestBody,
      timeout: 30,
    })

    if (res.statusCode < 200 || res.statusCode >= 300) {
      $app
        .logger()
        .error(
          'Subscriber payment status sync failed: non-2xx response',
          'subscriber_id',
          e.record.id,
          'email',
          email,
          'external_id',
          externalId,
          'old_status',
          oldStatus,
          'new_status',
          newStatus,
          'mapped_status',
          mappedStatus,
          'statusCode',
          res.statusCode,
          'responseBody',
          typeof res.body === 'string' ? res.body : '',
        )
    } else {
      $app
        .logger()
        .info(
          'Subscriber payment status synced to external system',
          'subscriber_id',
          e.record.id,
          'email',
          email,
          'external_id',
          externalId,
          'old_status',
          oldStatus,
          'new_status',
          newStatus,
          'mapped_status',
          mappedStatus,
          'statusCode',
          res.statusCode,
        )
    }
  } catch (err) {
    $app
      .logger()
      .error(
        'Subscriber payment status sync failed: transport error',
        'subscriber_id',
        e.record.id,
        'email',
        email,
        'external_id',
        externalId,
        'old_status',
        oldStatus,
        'new_status',
        newStatus,
        'mapped_status',
        mappedStatus,
        'error',
        err.message || String(err),
      )
  }

  return e.next()
}, 'system_subscribers')

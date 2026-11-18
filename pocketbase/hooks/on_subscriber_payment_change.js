// Sincroniza alterações de assinante com o sistema externo (Ponte).
// Dispara quando payment_status OU expiry_date mudam (marcar como pago renova
// o vencimento). Falhas da API externa são gravadas em sync_error para o
// frontend exibir ao usuário; a gravação do erro em si não re-dispara o PUT.
onRecordAfterUpdateSuccess((e) => {
  const original = e.record.original()
  const oldStatus = original.getString('payment_status')
  const newStatus = e.record.getString('payment_status')
  const oldExpiry = original.getString('expiry_date')
  const newExpiry = e.record.getString('expiry_date')

  // Só sincroniza quando status de pagamento ou vencimento mudaram.
  // Updates que apenas gravam sync_error não disparam novo PUT (evita loop).
  const statusChanged = oldStatus !== newStatus
  const expiryChanged = oldExpiry !== newExpiry
  if (!statusChanged && !expiryChanged) {
    return e.next()
  }

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
    expiry_date: newExpiry ? newExpiry.substring(0, 10) : '',
  })

  const authToken = $secrets.get('EXTERNAL_SYSTEM_AUTH_TOKEN') || ''
  const cfClientId = $secrets.get('CF_ACCESS_CLIENT_ID') || ''
  const cfClientSecret = $secrets.get('CF_ACCESS_CLIENT_SECRET') || ''
  let targetUrl = $secrets.get('API_BRIDE') || $secrets.get('API_DEV_BRIDE') || ''

  if (targetUrl.endsWith('/')) {
    targetUrl = targetUrl + 'users'
  } else if (!targetUrl.endsWith('/')) {
    targetUrl = targetUrl + '/users'
  }
  console.log('Url completa:', targetUrl)

  // Persiste a mensagem de erro para o frontend exibir; como nem status nem
  // expiry mudam neste update, o próprio hook não é re-disparado por ele.
  const persistSyncError = (errMessage) => {
    try {
      e.record.set('sync_error', errMessage)
      $app.save(e.record)
    } catch (saveErr) {
      $app
        .logger()
        .error(
          'Subscriber payment sync: failed to persist sync_error',
          'subscriber_id',
          e.record.id,
          'error',
          String(saveErr),
        )
    }
  }

  const clearSyncError = () => {
    if ((e.record.getString('sync_error') || '') !== '') {
      e.record.set('sync_error', '')
      $app.save(e.record)
    }
  }

  try {
    var res = $http.send({
      url: targetUrl,
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
      const errMessage =
        'O sistema externo retornou erro ' + res.statusCode + ' ao registrar o pagamento/renovação.'
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
          'old_expiry',
          oldExpiry,
          'new_expiry',
          newExpiry,
          'mapped_status',
          mappedStatus,
          'statusCode',
          res.statusCode,
          'responseBody',
          typeof res.body === 'string' ? res.body : '',
        )
      persistSyncError(errMessage)
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
          'old_expiry',
          oldExpiry,
          'new_expiry',
          newExpiry,
          'mapped_status',
          mappedStatus,
          'statusCode',
          res.statusCode,
        )
      clearSyncError()
    }
  } catch (err) {
    const errMessage =
      'Falha de conexão com o sistema externo ao registrar o pagamento/renovação: ' +
      (err.message || String(err))
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
        'old_expiry',
        oldExpiry,
        'new_expiry',
        newExpiry,
        'mapped_status',
        mappedStatus,
        'error',
        err.message || String(err),
      )
    persistSyncError(errMessage)
  }

  return e.next()
}, 'system_subscribers')

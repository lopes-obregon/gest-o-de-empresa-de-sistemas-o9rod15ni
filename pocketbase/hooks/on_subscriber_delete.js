onRecordAfterDeleteSuccess((e) => {
  const subscriberId = e.record.id
  const externalId = e.record.getString('external_id')
  const email = e.record.getString('email')

  if (!externalId) {
    $app
      .logger()
      .warn(
        'Subscriber delete sync skipped: no external_id',
        'subscriber_id',
        subscriberId,
        'email',
        email,
      )
    return e.next()
  }

  const authToken = $secrets.get('EXTERNAL_SYSTEM_AUTH_TOKEN') || ''
  const cfClientId = $secrets.get('CF_ACCESS_CLIENT_ID') || ''
  const cfClientSecret = $secrets.get('CF_ACCESS_CLIENT_SECRET') || ''

  const url = 'https://api.vlsolucoesia.com.br/backend/v1/users/' + encodeURIComponent(externalId)

  try {
    var res = $http.send({
      url: url,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken ? 'Bearer ' + authToken : '',
        'CF-Access-Client-Id': cfClientId,
        'CF-Access-Client-Secret': cfClientSecret,
      },
      timeout: 30,
    })

    if (res.statusCode < 200 || res.statusCode >= 300) {
      $app
        .logger()
        .error(
          'Subscriber delete sync failed: non-2xx response',
          'subscriber_id',
          subscriberId,
          'email',
          email,
          'external_id',
          externalId,
          'statusCode',
          res.statusCode,
          'responseBody',
          typeof res.body === 'string' ? res.body : '',
        )
    } else {
      $app
        .logger()
        .info(
          'Subscriber delete synced to external system',
          'subscriber_id',
          subscriberId,
          'email',
          email,
          'external_id',
          externalId,
          'statusCode',
          res.statusCode,
        )
    }
  } catch (err) {
    $app
      .logger()
      .error(
        'Subscriber delete sync failed: transport error',
        'subscriber_id',
        subscriberId,
        'email',
        email,
        'external_id',
        externalId,
        'error',
        err.message || String(err),
      )
  }

  return e.next()
}, 'system_subscribers')

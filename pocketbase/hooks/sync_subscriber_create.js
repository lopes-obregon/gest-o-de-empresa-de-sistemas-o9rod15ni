onRecordAfterCreateSuccess((e) => {
  const apiUrl = $secrets.get('EXTERNAL_SYSTEM_API_URL') || ''
  const authToken = $secrets.get('EXTERNAL_SYSTEM_AUTH_TOKEN') || ''

  if (!apiUrl) {
    $app
      .logger()
      .warn(
        'Subscriber sync skipped: EXTERNAL_SYSTEM_API_URL not configured',
        'subscriber_id',
        e.record.id,
      )
    return e.next()
  }

  const payload = {
    id: e.record.id,
    name: e.record.getString('name'),
    email: e.record.getString('email'),
    payment_status: e.record.getString('payment_status'),
    access_status: e.record.getString('access_status'),
  }

  const headers = { 'Content-Type': 'application/json' }
  if (authToken) {
    headers['Authorization'] = 'Bearer ' + authToken
  }

  try {
    const res = $http.send({
      url: apiUrl,
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
      timeout: 15,
    })

    if (res.statusCode < 200 || res.statusCode >= 300) {
      $app
        .logger()
        .error(
          'Subscriber sync failed: external API returned non-2xx status',
          'subscriber_id',
          e.record.id,
          'statusCode',
          res.statusCode,
        )
    }
  } catch (err) {
    $app
      .logger()
      .error(
        'Subscriber sync failed: transport error',
        'subscriber_id',
        e.record.id,
        'error',
        err.message || String(err),
      )
  }

  return e.next()
}, 'system_subscribers')

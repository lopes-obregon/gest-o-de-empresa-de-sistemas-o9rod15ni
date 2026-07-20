onRecordAfterUpdateSuccess((e) => {
  const apiUrl = $secrets.get('EXTERNAL_SYSTEM_API_URL') || ''
  const authToken = $secrets.get('EXTERNAL_SYSTEM_AUTH_TOKEN') || ''

  if (!apiUrl) {
    $app
      .logger()
      .warn(
        'Subscriber sync (update) skipped: EXTERNAL_SYSTEM_API_URL not configured',
        'subscriber_id',
        e.record.id,
      )
    return e.next()
  }

  var internalStatus = e.record.getString('payment_status')
  var externalStatus = 'pending'
  if (internalStatus === 'em_dia') externalStatus = 'paid'
  else if (internalStatus === 'pendente') externalStatus = 'pending'

  const payload = {
    external_id: e.record.getString('external_id') || e.record.id,
    email: e.record.getString('email'),
    name: e.record.getString('name'),
    payment_status: externalStatus,
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
          'Subscriber sync (update) failed: external API returned non-2xx status',
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
        'Subscriber sync (update) failed: transport error',
        'subscriber_id',
        e.record.id,
        'error',
        err.message || String(err),
      )
  }

  return e.next()
}, 'system_subscribers')

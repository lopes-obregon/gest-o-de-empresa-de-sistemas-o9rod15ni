routerAdd('POST', '/backend/v1/sync-users', (e) => {
  function formatIsoString(d) {
    var year = d.getUTCFullYear()
    var month = String(d.getUTCMonth() + 1).padStart(2, '0')
    var day = String(d.getUTCDate()).padStart(2, '0')
    var hours = String(d.getUTCHours()).padStart(2, '0')
    var minutes = String(d.getUTCMinutes()).padStart(2, '0')
    var seconds = String(d.getUTCSeconds()).padStart(2, '0')
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds
  }

  function parseDateInput(inputStr) {
    if (!inputStr) return null
    var str = String(inputStr).trim()
    if (!str) return null

    // Pattern: dd/mm/yyyy [hh:mm[:ss]] or dd/mm/yyyy, [hh:mm[:ss]]
    var brMatch = str.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
    )
    if (brMatch) {
      var day = parseInt(brMatch[1], 10)
      var month = parseInt(brMatch[2], 10) - 1
      var year = parseInt(brMatch[3], 10)
      var hours = brMatch[4] ? parseInt(brMatch[4], 10) : 0
      var minutes = brMatch[5] ? parseInt(brMatch[5], 10) : 0
      var seconds = brMatch[6] ? parseInt(brMatch[6], 10) : 0
      var d = new Date(Date.UTC(year, month, day, hours, minutes, seconds))
      if (!isNaN(d.getTime())) {
        return d
      }
    }

    // Try standard JS Date parsing (handles ISO format: YYYY-MM-DD, YYYY-MM-DDTHH:mm:ssZ, etc.)
    var parsed = new Date(str)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }

    return null
  }

  function parseToIso(inputStr) {
    var d = parseDateInput(inputStr)
    if (!d) return null
    return formatIsoString(d)
  }

  function add30Days(dataStr) {
    var d = parseDateInput(dataStr)
    if (!d) return null
    var future = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000)
    return formatIsoString(future)
  }

  const authToken = $secrets.get('EXTERNAL_SYSTEM_AUTH_TOKEN') || ''
  const body = e.requestInfo().body || {}

  if (!authToken) {
    return e.json(500, { error: 'Server not configured for synchronization' })
  }

  var providedToken = ''
  var authHeader = e.request.header.get('Authorization') || ''
  if (authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.slice(7)
  }

  if (providedToken !== authToken) {
    return e.json(401, { error: 'Unauthorized' })
  }

  var externalId = (body.external_id || '').trim()
  var email = (body.email || '').trim()
  var name = (body.name || '').trim()
 // var paymentStatus = (body.payment_status || '').trim()
  var paymentStatus = 'paid' // Default to 'paid' for now, adjust as needed based on your external system's data

  var rawCreateDate = (body.create_date || body.CreateDate || '').trim()

  if (!email && !externalId) {
    return e.badRequestError('Either email or external_id is required')
  }

  var internalStatus = 'pendente'
  if (paymentStatus === 'paid') {
    internalStatus = 'em_dia'
  } else if (paymentStatus === 'pending' || paymentStatus === 'overdue') {
    internalStatus = 'pendente'
  }

  var formattedCreateDate = parseToIso(rawCreateDate)
  var expiryDate = add30Days(rawCreateDate)

  var existingRecord = null

  if (email) {
    try {
      existingRecord = $app.findFirstRecordByData('system_subscribers', 'email', email)
    } catch (_) {}
  }

  if (!existingRecord && externalId) {
    try {
      existingRecord = $app.findFirstRecordByData('system_subscribers', 'external_id', externalId)
    } catch (_) {}
  }

  var collection = $app.findCollectionByNameOrId('system_subscribers')

  if (existingRecord) {
    existingRecord.set('name', name || existingRecord.getString('name'))
    existingRecord.set('payment_status', internalStatus)
    if (externalId) {
      existingRecord.set('external_id', externalId)
    }
    if (email) {
      existingRecord.set('email', email)
    }
    if (formattedCreateDate) {
      existingRecord.set('external_create_date', formattedCreateDate)
    } else if (rawCreateDate) {
      existingRecord.set('external_create_date', rawCreateDate)
    }
    if (expiryDate) {
      existingRecord.set('expiry_date', expiryDate)
    }
    $app.save(existingRecord)
    $app
      .logger()
      .info(
        'Inbound sync: subscriber updated',
        'subscriber_id',
        existingRecord.id,
        'email',
        email,
        'external_id',
        externalId,
        'external_create_date',
        existingRecord.getString('external_create_date'),
        'expiry_date',
        existingRecord.getString('expiry_date'),
      )

    return e.json(200, {
      success: true,
      action: 'updated',
      id: existingRecord.id,
      message: 'Subscriber updated successfully',
    })
  }

  var newRecord = new Record(collection)
  newRecord.set('name', name || 'Imported User')
  newRecord.set('email', email || externalId + '@imported.local')
  newRecord.set('payment_status', internalStatus)
  newRecord.set('access_status', 'active')
  if (formattedCreateDate) {
    newRecord.set('external_create_date', formattedCreateDate)
  } else if (rawCreateDate) {
    newRecord.set('external_create_date', rawCreateDate)
  }
  if (expiryDate) {
    newRecord.set('expiry_date', expiryDate)
  }
  if (externalId) {
    newRecord.set('external_id', externalId)
  }
  $app.save(newRecord)

  $app
    .logger()
    .info(
      'Inbound sync: subscriber created',
      'subscriber_id',
      newRecord.id,
      'email',
      email,
      'external_id',
      externalId,
      'external_create_date',
      newRecord.getString('external_create_date'),
      'expiry_date',
      newRecord.getString('expiry_date'),
    )

  return e.json(201, {
    success: true,
    action: 'created',
    id: newRecord.id,
    message: 'Subscriber created successfully',
  })
})

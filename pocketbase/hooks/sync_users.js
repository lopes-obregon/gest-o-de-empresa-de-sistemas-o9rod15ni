const {adicionar30Dias, CalclarDiasRestantes} = require(`${__hooks}/utils/dateUtils.js`)
routerAdd('POST', '/backend/v1/sync-users', (e) => {
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
  var paymentStatus = (body.payment_status || '').trim()
  var createDate = (body.create_date || body.CreateDate || '').trim()
  if (!email && !externalId) {
    return e.badRequestError('Either email or external_id is required')
  }

  var internalStatus = 'pendente'
  if (paymentStatus === 'paid') {
    internalStatus = 'em_dia'
  } else if (paymentStatus === 'pending' || paymentStatus === 'overdue') {
    internalStatus = 'pendente'
  }

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
    //colocar aqui
    if (createDate) 
      {
        existingRecord.set('external_create_date', createDate)
        const expiryDate = adicionar30Dias(createDate)
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
        createDate,
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
  newRecord.set('external_create_date', createDate)
  if (createDate) {
    const expiryDate = adicionar30Dias(createDate)
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
      createDate,
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


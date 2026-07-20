routerAdd(
  'POST',
  '/backend/v1/pull-external-subscribers',
  (e) => {
    if (!e.auth) {
      return e.forbiddenError('Admin access required')
    }
    if (!e.hasSuperuserAuth() && e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Admin access required')
    }

    var authToken = $secrets.get('EXTERNAL_SYSTEM_AUTH_TOKEN') || ''
    if (!authToken) {
      return e.json(401, {
        error: 'Token de autenticação não configurado. Configure EXTERNAL_SYSTEM_AUTH_TOKEN.',
      })
    }

    var externalUrl = $secrets.get('EXTERNAL_SYSTEM_API_URL') || ''
    if (!externalUrl) {
      return e.json(500, {
        error: 'URL do sistema externo não configurada. Configure EXTERNAL_SYSTEM_API_URL.',
      })
    }

    if (externalUrl.endsWith('/')) {
      externalUrl = externalUrl.slice(0, -1)
    }

    var res
    try {
      res = $http.send({
        url: externalUrl,
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + authToken,
          'Content-Type': 'application/json',
        },
        timeout: 30,
      })
    } catch (err) {
      $app
        .logger()
        .error(
          'Pull external subscribers failed: transport error',
          'error',
          err.message || String(err),
        )
      return e.json(502, { error: 'Falha ao conectar ao sistema externo' })
    }

    if (res.statusCode === 401) {
      $app
        .logger()
        .error('Pull external subscribers failed: 401 Unauthorized', 'statusCode', res.statusCode)
      return e.json(401, {
        error: 'Token de autenticação inválido ou expirado no sistema externo.',
      })
    }

    if (res.statusCode === 404) {
      $app
        .logger()
        .error('Pull external subscribers failed: 404 Not Found', 'statusCode', res.statusCode)
      return e.json(404, {
        error: 'Endpoint do sistema externo não encontrado.',
      })
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      $app
        .logger()
        .error(
          'Pull external subscribers failed: external API returned non-2xx',
          'statusCode',
          res.statusCode,
        )
      return e.json(502, {
        error: 'Sistema externo retornou um erro.',
        statusCode: res.statusCode,
      })
    }

    var externalSubscribers = []
    var body = res.json || {}
    if (Array.isArray(body)) {
      externalSubscribers = body
    } else if (Array.isArray(body.subscribers)) {
      externalSubscribers = body.subscribers
    } else if (Array.isArray(body.data)) {
      externalSubscribers = body.data
    } else if (Array.isArray(body.items)) {
      externalSubscribers = body.items
    } else if (Array.isArray(body.result)) {
      externalSubscribers = body.result
    } else if (body.success && Array.isArray(body.users)) {
      externalSubscribers = body.users
    }

    var collection = $app.findCollectionByNameOrId('system_subscribers')
    var created = 0
    var updated = 0
    var errors = 0

    for (var i = 0; i < externalSubscribers.length; i++) {
      var sub = externalSubscribers[i]
      var name = ((sub.name || '') + '').trim()
      var email = ((sub.email || '') + '').trim()
      var externalId = ((sub.external_id || '') + '').trim()
      var externalPaymentStatus = ((sub.payment_status || '') + '').trim()

      var internalPaymentStatus = 'pendente'
      if (externalPaymentStatus === 'paid') {
        internalPaymentStatus = 'em_dia'
      }

      var internalAccessStatus = internalPaymentStatus === 'em_dia' ? 'active' : 'inactive'

      var existingRecord = null

      if (email) {
        try {
          existingRecord = $app.findFirstRecordByData('system_subscribers', 'email', email)
        } catch (_) {}
      }

      if (!existingRecord && externalId) {
        try {
          existingRecord = $app.findFirstRecordByData(
            'system_subscribers',
            'external_id',
            externalId,
          )
        } catch (_) {}
      }

      try {
        if (existingRecord) {
          if (name) {
            existingRecord.set('name', name)
          }
          existingRecord.set('payment_status', internalPaymentStatus)
          existingRecord.set('access_status', internalAccessStatus)
          if (externalId) {
            existingRecord.set('external_id', externalId)
          }
          if (email) {
            existingRecord.set('email', email)
          }
          $app.save(existingRecord)
          updated++
        } else {
          if (!email && !externalId) {
            errors++
            continue
          }
          var newRecord = new Record(collection)
          newRecord.set('name', name || 'Imported User')
          newRecord.set('email', email || (externalId ? externalId + '@imported.local' : ''))
          newRecord.set('payment_status', internalPaymentStatus)
          newRecord.set('access_status', internalAccessStatus)
          if (externalId) {
            newRecord.set('external_id', externalId)
          }
          $app.save(newRecord)
          created++
        }
      } catch (err) {
        errors++
        $app
          .logger()
          .error(
            'Pull external subscribers: error processing record',
            'error',
            err.message || String(err),
            'email',
            email,
            'external_id',
            externalId,
          )
      }
    }

    $app
      .logger()
      .info(
        'Pull external subscribers completed',
        'created',
        created,
        'updated',
        updated,
        'errors',
        errors,
        'total',
        externalSubscribers.length,
      )

    return e.json(200, {
      success: true,
      created: created,
      updated: updated,
      errors: errors,
      total: externalSubscribers.length,
    })
  },
  $apis.requireAuth(),
)

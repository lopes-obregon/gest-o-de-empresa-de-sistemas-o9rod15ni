routerAdd(
  'POST',
  '/backend/v1/pull-external-subscribers',
  (e) => {
    let baseUrl = $secrets.get('EXTERNAL_SYSTEM_API_URL') || ''
    if (!baseUrl || baseUrl.indexOf('internal.goskip.dev') !== -1) {
      baseUrl = 'https://api.vlsolucoesia.com.br'
    }
    const url = baseUrl.replace(/\/+$/, '') + '/backend/v1/users'
    let cfClientId = $secrets.get('CF_Access_Client_Id')
    let cfClientSecret = $secrets.get('CF-Access-Client-Secret')
    const headers = {
      'Content-Type': 'application/json',
    }

    const authToken = $secrets.get('EXTERNAL_SYSTEM_AUTH_TOKEN') || ''
    headers['Authorization'] = authToken ? 'Bearer ' + authToken : ''
    headers['CF-Access-Client-Id'] = cfClientId
    headers['CF-Access-Client-Secret'] = cfClientSecret

    let res
    try {
      res = $http.send({
        url: url,
        method: 'GET',
        headers: headers,
        timeout: 30,
      })
    } catch (err) {
      $app.logger().error('pull_external_subscribers: transport error', 'error', String(err))
      return e.json(502, {
        success: false,
        created: 0,
        updated: 0,
        errors: 0,
        total: 0,
        message: 'Falha ao conectar com o sistema externo.',
      })
    }

    if (res.statusCode !== 200) {
      $app
        .logger()
        .error(
          'pull_external_subscribers: non-200 response',
          'status',
          res.statusCode,
          'body',
          String(res.body).substring(0, 500),
        )
      return e.json(res.statusCode, {
        success: false,
        created: 0,
        updated: 0,
        errors: 0,
        total: 0,
        message: 'O sistema externo retornou erro ' + res.statusCode + '.',
      })
    }

    let body
    try {
      body = res.json
    } catch (err) {
      $app.logger().error('pull_external_subscribers: failed to parse JSON', 'error', String(err))
      return e.json(500, {
        success: false,
        created: 0,
        updated: 0,
        errors: 0,
        total: 0,
        message: 'Resposta inválida do sistema externo.',
      })
    }

    const users = body.users || []
    if (!Array.isArray(users)) {
      return e.json(500, {
        success: false,
        created: 0,
        updated: 0,
        errors: 0,
        total: 0,
        message: "Formato inválido: campo 'users' não é uma lista.",
      })
    }

    let created = 0
    let updated = 0
    let errors = 0

    for (const u of users) {
      const email = (u.email || '').trim().toLowerCase()
      if (!email) {
        errors++
        continue
      }

      const name = (u.name || '').trim() || email
      const externalId = u.external_id || ''
      const rawStatus = (u.payment_status || '').trim().toLowerCase()
      const paymentStatus = rawStatus === 'paid' ? 'em_dia' : 'pendente'

      let existing = null
      try {
        existing = $app.findFirstRecordByData('system_subscribers', 'email', email)
      } catch (_) {}

      if (existing) {
        const currentStatus = existing.getString('payment_status')
        const currentName = existing.getString('name')
        const currentExternalId = existing.getString('external_id')
        const needsUpdate =
          currentStatus !== paymentStatus ||
          currentName !== name ||
          currentExternalId !== externalId

        if (needsUpdate) {
          try {
            existing.set('name', name)
            existing.set('payment_status', paymentStatus)
            if (externalId) {
              existing.set('external_id', externalId)
            }
            $app.save(existing)
            updated++
          } catch (err) {
            $app
              .logger()
              .error(
                'pull_external_subscribers: update failed',
                'email',
                email,
                'error',
                String(err),
              )
            errors++
          }
        }
      } else {
        try {
          const col = $app.findCollectionByNameOrId('system_subscribers')
          const record = new Record(col)
          record.set('name', name)
          record.set('email', email)
          record.set('payment_status', paymentStatus)
          record.set('access_status', 'active')
          if (externalId) {
            record.set('external_id', externalId)
          }
          $app.save(record)
          created++
        } catch (err) {
          $app
            .logger()
            .error('pull_external_subscribers: create failed', 'email', email, 'error', String(err))
          errors++
        }
      }
    }

    return e.json(200, {
      success: true,
      created: created,
      updated: updated,
      errors: errors,
      total: users.length,
      message: 'Sincronização concluída.',
    })
  },
  $apis.requireAuth(),
)

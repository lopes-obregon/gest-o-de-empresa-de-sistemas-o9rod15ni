routerAdd(
  'POST',
  '/backend/v1/pull-external-subscribers',
  (e) => {
    function formatIsoDate(d) {
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

      // dd/mm/yyyy [hh:mm[:ss]]
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

      var parsed = new Date(str)
      if (!isNaN(parsed.getTime())) {
        return parsed
      }

      return null
    }

    function calculateDates(rawCreateDate, rawExpiryDate) {
      var parsedCreate = parseDateInput(rawCreateDate)
      var parsedExpiry = parseDateInput(rawExpiryDate)

      var createDateStr = null
      var expiryDateStr = null

      if (parsedCreate) {
        createDateStr = formatIsoDate(parsedCreate)
      }

      if (parsedExpiry) {
        expiryDateStr = formatIsoDate(parsedExpiry)
      } else if (parsedCreate) {
        var future = new Date(parsedCreate.getTime() + 30 * 24 * 60 * 60 * 1000)
        expiryDateStr = formatIsoDate(future)
      }

      return {
        createDateStr: createDateStr,
        expiryDateStr: expiryDateStr,
      }
    }

    let baseUrl = $secrets.get('API_BRIDE') || $secrets.get('API_DEV_BRIDE') || ''
    if (!baseUrl || baseUrl.endsWith('/')) {
      baseUrl = baseUrl + 'users'
    } else if (!baseUrl.endsWith('/')) {
      baseUrl = baseUrl + '/users'
    }

    let cfClientId = $secrets.get('CF_ACCESS_CLIENT_ID') || ''
    let cfClientSecret = $secrets.get('CF_ACCESS_CLIENT_SECRET') || ''
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
        url: baseUrl,
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
      const externalId = u.external_id || u.id || ''
      const rawStatus = (u.payment_status || '').trim().toLowerCase()
      let paymentStatus = rawStatus === 'paid' ? 'em_dia' : 'pendente'

      // Tratar CreateDate e create_date (case insensitive)
      let rawCreateDate =
        u.CreateDate || u.create_date || u.createdate || u.created_at || u.createdAt || null
      if (!rawCreateDate) {
        for (const k of Object.keys(u)) {
          const lowerK = k.toLowerCase()
          if (lowerK === 'createdate' || lowerK === 'create_date') {
            rawCreateDate = u[k]
            break
          }
        }
      }

      // Tratar ExpiryDate e expiry_date (case insensitive)
      let rawExpiryDate =
        u.ExpiryDate || u.expiry_date || u.expirydate || u.expires_at || u.expiresAt || null
      if (!rawExpiryDate) {
        for (const k of Object.keys(u)) {
          const lowerK = k.toLowerCase()
          if (lowerK === 'expirydate' || lowerK === 'expiry_date') {
            rawExpiryDate = u[k]
            break
          }
        }
      }

      const dateResult = calculateDates(rawCreateDate, rawExpiryDate)
      const parsedCreateDateStr = dateResult.createDateStr
      let parsedExpiryDateStr = dateResult.expiryDateStr

      let existing = null
      try {
        existing = $app.findFirstRecordByData('system_subscribers', 'email', email)
      } catch (_) {}

      if (existing) {
        const currentStatus = existing.getString('payment_status')
        const currentName = existing.getString('name')
        const currentExternalId = existing.getString('external_id')
        const currentCreateDate = existing.getString('external_create_date')
        const currentExpiryDate = existing.getString('expiry_date')

        // Se o registro existente não tem expiry_date e a API não enviou CreateDate, tenta derivar do created existente
        if (!parsedExpiryDateStr && !currentExpiryDate) {
          const existingCreatedStr = existing.getString('created')
          if (existingCreatedStr) {
            const parsedExistingCreated = parseDateInput(existingCreatedStr)
            if (parsedExistingCreated) {
              const future = new Date(parsedExistingCreated.getTime() + 30 * 24 * 60 * 60 * 1000)
              parsedExpiryDateStr = formatIsoDate(future)
            }
          }
        }

        let needsUpdate =
          currentStatus !== paymentStatus ||
          currentName !== name ||
          currentExternalId !== externalId

        if (
          parsedCreateDateStr &&
          (!currentCreateDate || currentCreateDate !== parsedCreateDateStr)
        ) {
          needsUpdate = true
        }
        if (
          parsedExpiryDateStr &&
          (!currentExpiryDate || currentExpiryDate !== parsedExpiryDateStr)
        ) {
          needsUpdate = true
        }

        if (needsUpdate) {
          try {
            existing.set('name', name)
            existing.set('payment_status', paymentStatus)
            if (externalId) {
              existing.set('external_id', externalId)
            }
            if (parsedCreateDateStr) {
              existing.set('external_create_date', parsedCreateDateStr)
            }
            if (parsedExpiryDateStr) {
              existing.set('expiry_date', parsedExpiryDateStr)
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
          if (parsedCreateDateStr) {
            record.set('external_create_date', parsedCreateDateStr)
          }
          if (!parsedExpiryDateStr) {
            // Se não veio CreateDate da API externa, usa agora + 30 dias como fallback
            const now = new Date()
            const fallbackExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            parsedExpiryDateStr = formatIsoDate(fallbackExpiry)
          }
          record.set('expiry_date', parsedExpiryDateStr)
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

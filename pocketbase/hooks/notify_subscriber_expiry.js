cronAdd('notify_subscriber_expiry', '0 8 * * *', () => {
  $app.logger().info('notify_subscriber_expiry: starting cron run')

  let baseUrl = $secrets.get('EXTERNAL_SYSTEM_API_URL') || ''
  if (!baseUrl || baseUrl.indexOf('internal.goskip.dev') !== -1) {
    baseUrl = 'https://api.vlsolucoesia.com.br'
  }
  const notifyUrl = baseUrl.replace(/\/+$/, '') + '/mensagem'
  const cfClientId = $secrets.get('CF_ACCESS_CLIENT_ID') || ''
  const cfClientSecret = $secrets.get('CF_ACCESS_CLIENT_SECRET') || ''
  const authToken = $secrets.get('EXTERNAL_SYSTEM_AUTH_TOKEN') || ''

  let records = []
  try {
    records = $app.findRecordsByFilter(
      'system_subscribers',
      "access_status = 'active' && expiry_date != ''",
      '-created',
      0,
      0,
    )
  } catch (err) {
    $app
      .logger()
      .error('notify_subscriber_expiry: failed to fetch subscribers', 'error', String(err))
    return
  }

  const now = new Date()
  const todayUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  const nowIsoStr = now.toISOString().replace('T', ' ').substring(0, 19)

  let notifiedCount = 0
  let skippedCount = 0
  let errorCount = 0
  let statusUpdatedCount = 0

  for (const record of records) {
    const rawExpiry = record.getString('expiry_date')
    if (!rawExpiry) continue

    let expiryDate
    try {
      expiryDate = new Date(rawExpiry)
      if (isNaN(expiryDate.getTime())) continue
    } catch (_) {
      continue
    }

    const expiryUtcMidnight = new Date(
      Date.UTC(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth(), expiryDate.getUTCDate()),
    )
    const diffMs = expiryUtcMidnight.getTime() - todayUtcMidnight.getTime()
    const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    let recordModified = false

    // Regra de vencimento automático: quando hoje >= expiry_date (daysRemaining <= 0), payment_status muda para pendente
    if (daysRemaining <= 0) {
      const currentPaymentStatus = record.getString('payment_status')
      if (currentPaymentStatus !== 'pendente') {
        record.set('payment_status', 'pendente')
        recordModified = true
        statusUpdatedCount++
        $app
          .logger()
          .info(
            'notify_subscriber_expiry: payment_status updated to pendente due to expiry',
            'email',
            record.getString('email'),
            'expiry_date',
            rawExpiry,
          )
      }
    }

    let notificationStatus = null
    if (daysRemaining === 7) {
      notificationStatus = 'prestes_a_vencer'
    } else if (daysRemaining <= 0) {
      notificationStatus = 'vencido'
    }

    if (!notificationStatus) {
      if (recordModified) {
        try {
          $app.save(record)
        } catch (saveErr) {
          $app
            .logger()
            .error(
              'notify_subscriber_expiry: failed to save record status update',
              'email',
              record.getString('email'),
              'error',
              String(saveErr),
            )
        }
      }
      skippedCount++
      continue
    }

    const lastStatus = record.getString('last_notification_status')
    if (lastStatus === notificationStatus) {
      if (recordModified) {
        try {
          $app.save(record)
        } catch (saveErr) {
          $app
            .logger()
            .error(
              'notify_subscriber_expiry: failed to save record status update',
              'email',
              record.getString('email'),
              'error',
              String(saveErr),
            )
        }
      }
      skippedCount++
      continue
    }

    const email = record.getString('email')
    const name = record.getString('name')
    const externalId = record.getString('external_id')
    const formattedExpiry = rawExpiry.substring(0, 10)

    const payload = {
      external_id: externalId,
      status: notificationStatus,
      expiry_date: formattedExpiry,
      email: email,
      name: name,
      days_remaining: daysRemaining,
    }

    try {
      const res = $http.send({
        url: notifyUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken ? 'Bearer ' + authToken : '',
          'CF-Access-Client-Id': cfClientId,
          'CF-Access-Client-Secret': cfClientSecret,
        },
        body: JSON.stringify(payload),
        timeout: 20,
      })

      if (res.statusCode >= 200 && res.statusCode < 300) {
        $app
          .logger()
          .info(
            'notify_subscriber_expiry: notification sent successfully',
            'email',
            email,
            'status',
            notificationStatus,
            'days_remaining',
            daysRemaining,
            'statusCode',
            res.statusCode,
          )

        record.set('last_notification_status', notificationStatus)
        record.set('last_notification_date', nowIsoStr)
        $app.save(record)
        notifiedCount++
      } else {
        if (recordModified) {
          $app.save(record)
        }
        $app
          .logger()
          .error(
            'notify_subscriber_expiry: notification returned error status',
            'email',
            email,
            'status',
            notificationStatus,
            'statusCode',
            res.statusCode,
            'responseBody',
            typeof res.body === 'string' ? res.body.substring(0, 300) : '',
          )
        errorCount++
      }
    } catch (err) {
      if (recordModified) {
        try {
          $app.save(record)
        } catch (_) {}
      }
      $app
        .logger()
        .error(
          'notify_subscriber_expiry: transport error sending notification',
          'email',
          email,
          'status',
          notificationStatus,
          'error',
          String(err),
        )
      errorCount++
    }
  }

  $app
    .logger()
    .info(
      'notify_subscriber_expiry: cron finished',
      'total',
      records.length,
      'notified',
      notifiedCount,
      'status_updated_pendente',
      statusUpdatedCount,
      'skipped',
      skippedCount,
      'errors',
      errorCount,
    )
})

routerAdd(
  'POST',
  '/backend/v1/check-expiry',
  (e) => {
    let baseUrl =
      $secrets.get('EXTERNAL_SYSTEM_API_URL') ||
      $secrets.get('API_DEV_BRIDE') ||
      $secrets.get('API_BRIDE') ||
      ''
    if (!baseUrl || baseUrl.indexOf('internal.goskip.dev') !== -1) {
      baseUrl = 'https://api.vlsolucoesia.com.br'
    }
    const notifyUrl = baseUrl.replace(/\/+$/, '') + '/mensagem'
    const cfClientId = $secrets.get('CF_ACCESS_CLIENT_ID') || ''
    const cfClientSecret = $secrets.get('CF_ACCESS_CLIENT_SECRET') || ''
    const authToken = $secrets.get('EXTERNAL_SYSTEM_AUTH_TOKEN') || ''

    let records = []
    try {
      records = $app.findRecordsByFilter(
        'system_subscribers',
        "access_status = 'active' && expiry_date != ''",
        '-created',
        0,
        0,
      )
    } catch (err) {
      $app.logger().error('check_expiry: failed to fetch subscribers', 'error', String(err))
      return e.json(500, {
        success: false,
        message: 'Falha ao buscar assinantes: ' + String(err),
      })
    }

    const now = new Date()
    const todayUtcMidnight = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    )
    const nowIsoStr = now.toISOString().replace('T', ' ').substring(0, 19)

    let notifiedCount = 0
    let skippedCount = 0
    let errorCount = 0
    let statusUpdatedCount = 0
    const details = []

    for (const record of records) {
      const rawExpiry = record.getString('expiry_date')
      if (!rawExpiry) continue

      let expiryDate
      try {
        expiryDate = new Date(rawExpiry)
        if (isNaN(expiryDate.getTime())) continue
      } catch (_) {
        continue
      }

      const expiryUtcMidnight = new Date(
        Date.UTC(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth(), expiryDate.getUTCDate()),
      )
      const diffMs = expiryUtcMidnight.getTime() - todayUtcMidnight.getTime()
      const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      const email = record.getString('email')
      const name = record.getString('name')
      const externalId = record.getString('external_id')
      const formattedExpiry = rawExpiry.substring(0, 10)
      const lastStatus = record.getString('last_notification_status')

      let recordModified = false

      // Regra de vencimento automático: quando hoje >= expiry_date (daysRemaining <= 0), payment_status muda para pendente
      if (daysRemaining <= 0) {
        const currentPaymentStatus = record.getString('payment_status')
        if (currentPaymentStatus !== 'pendente') {
          record.set('payment_status', 'pendente')
          recordModified = true
          statusUpdatedCount++
          $app
            .logger()
            .info(
              'check_expiry: payment_status updated to pendente due to expiry',
              'email',
              email,
              'expiry_date',
              rawExpiry,
            )
        }
      }

      let notificationStatus = null
      if (daysRemaining === 7) {
        notificationStatus = 'prestes_a_vencer'
      } else if (daysRemaining <= 0) {
        notificationStatus = 'vencido'
      }

      if (!notificationStatus) {
        if (recordModified) {
          try {
            $app.save(record)
          } catch (saveErr) {
            $app
              .logger()
              .error(
                'check_expiry: failed to save record status update',
                'email',
                email,
                'error',
                String(saveErr),
              )
          }
        }
        skippedCount++
        details.push({
          email: email,
          days_remaining: daysRemaining,
          action: 'skipped_not_target_day',
          status_updated: recordModified,
        })
        continue
      }

      if (lastStatus === notificationStatus) {
        if (recordModified) {
          try {
            $app.save(record)
          } catch (saveErr) {
            $app
              .logger()
              .error(
                'check_expiry: failed to save record status update',
                'email',
                email,
                'error',
                String(saveErr),
              )
          }
        }
        skippedCount++
        details.push({
          email: email,
          status: notificationStatus,
          days_remaining: daysRemaining,
          action: 'already_notified',
          status_updated: recordModified,
        })
        continue
      }

      const payload = {
        external_id: externalId,
        status: notificationStatus,
        expiry_date: formattedExpiry,
        email: email,
        name: name,
        days_remaining: daysRemaining,
      }

      try {
        const res = $http.send({
          url: notifyUrl,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authToken ? 'Bearer ' + authToken : '',
            'CF-Access-Client-Id': cfClientId,
            'CF-Access-Client-Secret': cfClientSecret,
          },
          body: JSON.stringify(payload),
          timeout: 20,
        })

        if (res.statusCode >= 200 && res.statusCode < 300) {
          $app
            .logger()
            .info(
              'check_expiry: notification sent successfully',
              'email',
              email,
              'status',
              notificationStatus,
              'days_remaining',
              daysRemaining,
              'statusCode',
              res.statusCode,
            )

          record.set('last_notification_status', notificationStatus)
          record.set('last_notification_date', nowIsoStr)
          $app.save(record)
          notifiedCount++
          details.push({
            email: email,
            status: notificationStatus,
            days_remaining: daysRemaining,
            action: 'notified',
            success: true,
            status_updated: recordModified,
          })
        } else {
          if (recordModified) {
            $app.save(record)
          }
          $app
            .logger()
            .error(
              'check_expiry: notification returned error status',
              'email',
              email,
              'status',
              notificationStatus,
              'statusCode',
              res.statusCode,
              'responseBody',
              typeof res.body === 'string' ? res.body.substring(0, 300) : '',
            )
          errorCount++
          details.push({
            email: email,
            status: notificationStatus,
            days_remaining: daysRemaining,
            action: 'failed',
            error: 'Status code ' + res.statusCode,
            status_updated: recordModified,
          })
        }
      } catch (err) {
        if (recordModified) {
          try {
            $app.save(record)
          } catch (_) {}
        }
        $app
          .logger()
          .error(
            'check_expiry: transport error sending notification',
            'email',
            email,
            'status',
            notificationStatus,
            'error',
            String(err),
          )
        errorCount++
        details.push({
          email: email,
          status: notificationStatus,
          days_remaining: daysRemaining,
          action: 'failed',
          error: String(err),
          status_updated: recordModified,
        })
      }
    }

    return e.json(200, {
      success: true,
      total_checked: records.length,
      notified: notifiedCount,
      status_updated_pendente: statusUpdatedCount,
      skipped: skippedCount,
      errors: errorCount,
      details: details,
      message: 'Verificação de vencimentos concluída com sucesso.',
    })
  },
  $apis.requireAuth(),
)

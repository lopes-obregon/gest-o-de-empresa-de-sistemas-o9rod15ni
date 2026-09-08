migrate(
  (app) => {
    function formatIsoDate(d) {
      const year = d.getUTCFullYear()
      const month = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      const hours = String(d.getUTCHours()).padStart(2, '0')
      const minutes = String(d.getUTCMinutes()).padStart(2, '0')
      const seconds = String(d.getUTCSeconds()).padStart(2, '0')
      return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds
    }

    function parseDate(inputStr) {
      if (!inputStr) return null
      const str = String(inputStr).trim()
      if (!str) return null

      // dd/mm/yyyy
      const brMatch = str.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
      )
      if (brMatch) {
        const day = parseInt(brMatch[1], 10)
        const month = parseInt(brMatch[2], 10) - 1
        const year = parseInt(brMatch[3], 10)
        const hours = brMatch[4] ? parseInt(brMatch[4], 10) : 0
        const minutes = brMatch[5] ? parseInt(brMatch[5], 10) : 0
        const seconds = brMatch[6] ? parseInt(brMatch[6], 10) : 0
        const d = new Date(Date.UTC(year, month, day, hours, minutes, seconds))
        if (!isNaN(d.getTime())) return d
      }

      const d = new Date(str)
      if (!isNaN(d.getTime())) return d
      return null
    }

    let records = []
    try {
      records = app.findRecordsByFilter(
        'system_subscribers',
        "expiry_date = '' || expiry_date = null",
        '-created',
        0,
        0,
      )
    } catch (_) {
      return
    }

    for (const record of records) {
      const currentExpiry = record.getString('expiry_date')
      if (currentExpiry) continue

      const externalCreate = record.getString('external_create_date')
      let baseDate = null

      if (externalCreate) {
        baseDate = parseDate(externalCreate)
      }

      if (!baseDate) {
        const createdStr = record.getString('created')
        if (createdStr) {
          baseDate = parseDate(createdStr)
        }
      }

      if (baseDate) {
        const expiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        record.set('expiry_date', formatIsoDate(expiry))
        app.save(record)
      }
    }
  },
  (app) => {
    // down migration: no-op since populating missing expiry_date is data enrichment
  },
)

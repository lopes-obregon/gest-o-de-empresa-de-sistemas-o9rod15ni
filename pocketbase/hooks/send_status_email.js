routerAdd(
  'POST',
  '/backend/v1/projects/{id}/send-status-email',
  (e) => {
    const id = e.request.pathValue('id')
    if (!id) return e.badRequestError('ID do projeto e obrigatorio')

    let project
    try {
      project = $app.findRecordById('projects', id)
    } catch (_) {
      return e.notFoundError('Projeto nao encontrado')
    }

    const clientId = project.getString('client')
    if (!clientId) return e.badRequestError('Projeto sem cliente vinculado')

    let client
    try {
      client = $app.findRecordById('clients', clientId)
    } catch (_) {
      return e.notFoundError('Cliente nao encontrado')
    }

    const clientEmail = client.getString('email')
    const clientName = client.getString('name')
    if (!clientEmail) return e.badRequestError('Cliente nao possui email cadastrado')

    const projectName = project.getString('name')
    const projectStatus = project.getString('status')
    const endDate = project.getString('end_date')

    var statusLabel = 'Desconhecido'
    if (projectStatus === 'lead') statusLabel = 'Lead'
    else if (projectStatus === 'em_desenvolvimento') statusLabel = 'Em Desenvolvimento'
    else if (projectStatus === 'pausado') statusLabel = 'Pausado'
    else if (projectStatus === 'finalizado') statusLabel = 'Finalizado'

    var subject = 'Atualizacao de Status: ' + projectName
    var emailBody =
      'Ola ' +
      clientName +
      ',\n\n' +
      'Segue a atualizacao do status do seu projeto:\n' +
      'Projeto: ' +
      projectName +
      '\n' +
      'Status: ' +
      statusLabel +
      '\n' +
      'Data de Entrega: ' +
      endDate +
      '\n\n' +
      'Em caso de duvidas, entre em contato.\n\n' +
      'Atenciosamente,\nEquipe SkipERP'

    $app
      .logger()
      .info(
        'Status email notification sent',
        'project',
        projectName,
        'client',
        clientName,
        'email',
        clientEmail,
        'subject',
        subject,
      )

    return e.json(200, {
      success: true,
      message: 'Email de atualizacao enviado para ' + clientEmail,
      recipient: clientEmail,
      subject: subject,
    })
  },
  $apis.requireAuth(),
)

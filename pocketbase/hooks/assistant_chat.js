routerAdd(
  'POST',
  '/backend/v1/assistant/chat',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('auth required')

      const body = e.requestInfo().body || {}
      const message = (body.message || '').trim()
      if (!message) return e.badRequestError('message is required')

      const conv = $ai.agent('vl-assistente').getOrCreateConversation({
        user_id: userId,
        id: body.conversation_id || null,
        title: body.title || null,
      })

      const iter = $ai.agent('vl-assistente').chat({
        user_id: userId,
        conversation_id: conv.id,
        message: message,
        stream: true,
      })

      e.response.header().set('Content-Type', 'text/event-stream')
      e.response.header().set('Cache-Control', 'no-cache')
      e.response.header().set('X-Conversation-Id', conv.id)

      $response.stream(e, iter)
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'AI temporariamente indisponível' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha ao processar solicitação do agente' : err.message,
        })
      }
      if (err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, {
          error: status >= 500 ? 'AI temporariamente indisponível' : err.message,
        })
      }
      return e.json(500, { error: 'Erro interno no processamento do assistente' })
    }
  },
  $apis.requireAuth(),
)

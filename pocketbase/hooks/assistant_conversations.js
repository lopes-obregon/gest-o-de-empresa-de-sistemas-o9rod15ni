routerAdd(
  'GET',
  '/backend/v1/assistant/conversations',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('auth required')

      const limit = parseInt(e.requestInfo().query?.limit || '20', 10) || 20
      const conversations = $ai.agent('vl-assistente').listConversations({
        user_id: userId,
        limit: limit,
      })
      return e.json(200, conversations)
    } catch (err) {
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, { error: status >= 500 ? 'Falha ao listar conversas' : err.message })
      }
      return e.json(500, { error: 'Erro ao buscar conversas' })
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'GET',
  '/backend/v1/assistant/conversations/{conversationId}/messages',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('auth required')

      const conversationId = e.request.pathValue('conversationId')
      if (!conversationId) return e.badRequestError('conversationId is required')

      const messages = $ai.agent('vl-assistente').listMessages({
        conversation_id: conversationId,
        user_id: userId,
        limit: 100,
      })

      return e.json(200, messages)
    } catch (err) {
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, { error: status >= 500 ? 'Conversa não encontrada' : err.message })
      }
      return e.json(500, { error: 'Erro ao buscar mensagens' })
    }
  },
  $apis.requireAuth(),
)

import pb from '@/lib/pocketbase/client'
import {
  streamAgentChat,
  displayableMessages,
  DisplayMessage,
  AgentMessage,
  StreamAgentChatHandlers,
} from '@/lib/skipAi'

export interface ConversationItem {
  id: string
  title?: string
  created: string
  updated?: string
}

export async function listAssistantConversations(): Promise<ConversationItem[]> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const res = await fetch(`${baseUrl}/backend/v1/assistant/conversations`, {
    headers: {
      Authorization: pb.authStore.token,
    },
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Erro ao carregar histórico de conversas')
  }
  const data = await res.json()
  return (data?.conversations || data || []) as ConversationItem[]
}

export async function loadConversationMessages(conversationId: string): Promise<DisplayMessage[]> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const res = await fetch(
    `${baseUrl}/backend/v1/assistant/conversations/${conversationId}/messages`,
    {
      headers: {
        Authorization: pb.authStore.token,
      },
    },
  )
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Erro ao carregar mensagens da conversa')
  }
  const data = (await res.json()) as { messages?: AgentMessage[] } | AgentMessage[]
  const rawList = Array.isArray(data) ? data : data.messages || []
  return displayableMessages(rawList)
}

export async function sendAssistantMessageStream(
  message: string,
  conversationId: string | null,
  handlers: StreamAgentChatHandlers,
) {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const res = await fetch(`${baseUrl}/backend/v1/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
    signal: handlers.signal,
  })

  const conversationHeader = res.headers.get('X-Conversation-Id')
  const result = await streamAgentChat(res, handlers)

  return {
    conversationId: conversationHeader || result.conversation_id,
    messageId: result.message_id,
    content: result.content,
    citations: result.citations,
    toolCalls: result.toolCalls,
  }
}

import { useEffect, useRef, useState } from 'react'
import {
  listAssistantConversations,
  loadConversationMessages,
  sendAssistantMessageStream,
  ConversationItem,
} from '@/services/assistant'
import { DisplayMessage } from '@/lib/skipAi'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import {
  Bot,
  User,
  Send,
  Plus,
  MessageSquare,
  Sparkles,
  Loader2,
  Wrench,
  HelpCircle,
  Database,
} from 'lucide-react'

export default function Assistant() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])

  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isStreaming, activeTools])

  const fetchConversations = async () => {
    try {
      const list = await listAssistantConversations()
      setConversations(list)
    } catch {
      // Falha silenciosa no initial load se o agente ainda não tiver conversas
    } finally {
      setLoadingConversations(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  const handleSelectConversation = async (convId: string) => {
    if (convId === activeConversationId) return
    setActiveConversationId(convId)
    setLoadingMessages(true)
    try {
      const msgs = await loadConversationMessages(convId)
      setMessages(msgs)
    } catch {
      toast({ title: 'Erro ao carregar mensagens da conversa', variant: 'destructive' })
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleNewConversation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setActiveConversationId(null)
    setMessages([])
    setActiveTools([])
    setIsStreaming(false)
  }

  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault()
    const text = (customPrompt || inputMessage).trim()
    if (!text || isStreaming) return

    setInputMessage('')
    const userMsgId = 'user-' + Date.now()
    const assistantTempId = 'asst-' + Date.now()

    const newMessages: DisplayMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: text,
        created: new Date().toISOString(),
      },
    ]

    setMessages(newMessages)
    setIsStreaming(true)
    setActiveTools([])

    const abortCtrl = new AbortController()
    abortControllerRef.current = abortCtrl

    let assistantText = ''

    try {
      const res = await sendAssistantMessageStream(text, activeConversationId, {
        signal: abortCtrl.signal,
        onChunk: (_delta, full) => {
          assistantText = full
          setMessages((prev) => {
            const copy = [...prev]
            const lastIdx = copy.findIndex((m) => m.id === assistantTempId)
            if (lastIdx !== -1) {
              copy[lastIdx] = {
                ...copy[lastIdx],
                content: full,
              }
              return copy
            } else {
              return [
                ...copy,
                {
                  id: assistantTempId,
                  role: 'assistant',
                  content: full,
                  created: new Date().toISOString(),
                },
              ]
            }
          })
        },
        onToolCallStart: (info) => {
          setActiveTools((prev) => [...prev, info.name])
        },
        onToolCallDone: (info) => {
          setActiveTools((prev) => prev.filter((name) => name !== info.id))
        },
        onCitations: (citations) => {
          setMessages((prev) => {
            const copy = [...prev]
            const lastIdx = copy.findIndex((m) => m.id === assistantTempId)
            if (lastIdx !== -1) {
              copy[lastIdx] = {
                ...copy[lastIdx],
                citations,
              }
            }
            return copy
          })
        },
        onError: (errMsg) => {
          toast({ title: 'Erro do Assistente', description: errMsg, variant: 'destructive' })
        },
      })

      if (res.conversationId && res.conversationId !== activeConversationId) {
        setActiveConversationId(res.conversationId)
        fetchConversations()
      }

      // Garante que o texto final está no estado
      setMessages((prev) => {
        const copy = [...prev]
        const lastIdx = copy.findIndex((m) => m.id === assistantTempId)
        if (lastIdx !== -1) {
          copy[lastIdx] = {
            ...copy[lastIdx],
            id: res.messageId || assistantTempId,
            content: res.content || assistantText,
            citations: res.citations,
          }
          return copy
        } else {
          return [
            ...copy,
            {
              id: res.messageId || assistantTempId,
              role: 'assistant',
              content: res.content || assistantText,
              citations: res.citations,
              created: new Date().toISOString(),
            },
          ]
        }
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Cancelado pelo usuário
      } else {
        const msg = err instanceof Error ? err.message : 'Falha na comunicação com o assistente'
        toast({ title: 'Erro', description: msg, variant: 'destructive' })
      }
    } finally {
      setIsStreaming(false)
      setActiveTools([])
      abortControllerRef.current = null
    }
  }

  const promptSuggestions = [
    'Quais são os serviços cadastrados no catálogo?',
    'Liste os orçamentos recentes e me dê o total de propostas abertas',
    'Cadastre um novo serviço chamado "Auditoria de Segurança" com preço de R$ 1.800',
    'Como está a situação dos clientes com pagamento pendente?',
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Assistente de IA</h2>
            <Badge className="bg-indigo-600 text-white font-normal flex items-center gap-1 text-xs">
              <Sparkles className="h-3 w-3" /> Agente Nativo
            </Badge>
          </div>
          <p className="text-slate-500 text-sm">
            Suporte inteligente com permissão completa para consultar e cadastrar dados no sistema.
          </p>
        </div>

        <Button
          onClick={handleNewConversation}
          variant="outline"
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Conversa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-230px)] min-h-[500px]">
        {/* Barra Lateral de Conversas */}
        <Card className="md:col-span-4 lg:col-span-3 border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Conversas Anteriores
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-500"
              onClick={fetchConversations}
              title="Recarregar conversas"
            >
              <Database className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingConversations ? (
              <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                Carregando histórico...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhuma conversa anterior. Inicie uma nova conversa ao lado.
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === activeConversationId
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2.5 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-900 font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <MessageSquare
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    <div className="flex-1 truncate">
                      <p className="truncate text-xs">
                        {conv.title || `Conversa ${conv.id.substring(0, 8)}`}
                      </p>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(conv.created).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </Card>

        {/* Área Principal de Chat */}
        <Card className="md:col-span-8 lg:col-span-9 border-slate-200 flex flex-col overflow-hidden bg-white">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                  Assistente VL Soluções
                </h4>
                <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Pronto para ler e criar qualquer cadastro
                </p>
              </div>
            </div>

            {activeTools.length > 0 && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-800 border-amber-300 text-xs flex items-center gap-1 animate-pulse"
              >
                <Wrench className="h-3 w-3" /> Executando ação no sistema...
              </Badge>
            )}
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingMessages ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                Carregando mensagens...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-slate-800 text-base mb-1">
                  Como posso te ajudar hoje?
                </h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Eu sou o agente de suporte inteligente integrado ao sistema. Posso responder
                  perguntas sobre suas finanças, clientes, projetos, assinantes, serviços e
                  orçamentos, além de realizar cadastros diretamente no banco de dados para você.
                </p>

                <div className="w-full space-y-2 text-left">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" /> Sugestões de comandos:
                  </span>
                  {promptSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(undefined, sug)}
                      className="w-full p-2.5 text-xs text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 border border-slate-200 hover:border-indigo-200 rounded-lg text-left transition-all"
                    >
                      &bull; {sug}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === 'user'
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className={`h-8 w-8 ${isUser ? 'bg-slate-700' : 'bg-indigo-600'}`}>
                      <AvatarFallback className="text-white text-xs font-semibold">
                        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-sm'
                          : 'bg-slate-100 text-slate-900 rounded-tl-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                      {/* Citações / Fontes se houver */}
                      {m.citations && m.citations.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                          <span className="font-semibold block mb-1 text-slate-600">
                            Referências consultadas:
                          </span>
                          <ul className="space-y-1">
                            {m.citations.map((c, ci) => (
                              <li key={ci} className="italic line-clamp-2">
                                [{c.n}] {c.excerpt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}

            {isStreaming && (
              <div className="flex items-center gap-2 text-slate-500 text-xs pl-11 py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                <span>O agente está pensando e acessando as ferramentas...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Barra de Envio de Mensagem */}
          <div className="p-3 border-t border-slate-200 bg-slate-50">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Input
                placeholder="Pergunte algo ou peça para cadastrar um serviço, cliente, orçamento..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isStreaming}
                className="bg-white flex-1"
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isStreaming}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    Enviar
                  </>
                )}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}

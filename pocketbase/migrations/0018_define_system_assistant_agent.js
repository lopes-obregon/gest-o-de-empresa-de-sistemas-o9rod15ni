migrate(
  (app) => {
    try {
      $ai.agents.define(app, {
        slug: 'vl-assistente',
        name: 'Assistente VL Soluções',
        description:
          'Assistente inteligente com suporte completo para gestão, leitura e cadastro de serviços, orçamentos, projetos, clientes, assinantes e finanças.',
        systemPrompt:
          'Você é o Assistente Virtual inteligente do sistema de gestão da VL Soluções em IA LTDA. Você tem permissão total para ler e realizar qualquer tipo de cadastro no sistema (serviços, orçamentos e itens, clientes, projetos, lançamentos financeiros de entrada/saída, despesas fixas, funcionários e assinantes do sistema). Sempre responda em português do Brasil de maneira prestativa, clara, profissional e precisa. Quando o usuário pedir para listar, consultar, criar, atualizar ou registrar dados, use as tools disponíveis das collections para ler ou salvar as informações no banco de dados e confirme o que foi feito com clareza.',
        tier: 'fast',
        tools: [
          {
            collection: 'services',
            perms: { list: true, read: true, create: true, update: true, delete: true },
          },
          {
            collection: 'budgets',
            perms: { list: true, read: true, create: true, update: true, delete: true },
          },
          {
            collection: 'budget_items',
            perms: { list: true, read: true, create: true, update: true, delete: true },
          },
          {
            collection: 'clients',
            perms: { list: true, read: true, create: true, update: true, delete: true },
          },
          {
            collection: 'projects',
            perms: { list: true, read: true, create: true, update: true, delete: true },
          },
          {
            collection: 'transactions',
            perms: { list: true, read: true, create: true, update: true, delete: true },
          },
          {
            collection: 'fixed_expenses',
            perms: { list: true, read: true, create: true, update: true, delete: true },
          },
          {
            collection: 'employees',
            perms: { list: true, read: true, create: true, update: true, delete: true },
          },
          {
            collection: 'system_subscribers',
            perms: { list: true, read: true, create: true, update: true, delete: true },
          },
        ],
        memory: [
          {
            type: 'text',
            payload: {
              text: 'VL Soluções em IA LTDA é uma agência e software house focada em inteligência artificial, automação e desenvolvimento de sistemas personalizados.',
            },
          },
          {
            type: 'text',
            payload: {
              text: 'O sistema possui módulos de Dashboard, Projetos, Clientes, Assinantes, Serviços, Orçamentos, Financeiro (transações e despesas fixas), Funcionários e Usuários.',
            },
          },
          {
            type: 'faq',
            payload: {
              qa: [
                {
                  question: 'Como gerar um orçamento em PDF?',
                  answer:
                    'Acesse o menu Orçamentos, clique no orçamento desejado e selecione o botão "Salvar PDF" para visualizar ou baixar o PDF formatado.',
                },
                {
                  question: 'Como cadastrar um serviço novo na hora do orçamento?',
                  answer:
                    'Ao criar ou editar um orçamento, dentro do diálogo de adicionar item você pode clicar em "Novo Serviço", preencher os dados e ele será cadastrado e inserido imediatamente.',
                },
              ],
            },
          },
        ],
      })
    } catch (e) {
      console.log('Error defining vl-assistente agent:', e)
      throw e
    }
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'vl-assistente')
    } catch (_) {}
  },
)

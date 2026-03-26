import type { ToolDefinition } from '@/services/ai-tools/tool-types';

export function getFinanceTools(): ToolDefinition[] {
  return [
    // =========================================================
    // QUERY TOOLS (10)
    // =========================================================
    {
      name: 'finance_list_entries',
      description:
        'Lista lançamentos financeiros (contas a pagar e receber) com filtros por tipo, status, categoria, vencimento e mais',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['PAYABLE', 'RECEIVABLE'],
            description: 'Tipo do lançamento (a pagar ou a receber)',
          },
          status: {
            type: 'string',
            enum: [
              'PENDING',
              'PAID',
              'RECEIVED',
              'OVERDUE',
              'CANCELLED',
              'PARTIAL',
            ],
            description: 'Status do lançamento',
          },
          categoryId: {
            type: 'string',
            description: 'Filtrar por categoria financeira (ID)',
          },
          costCenterId: {
            type: 'string',
            description: 'Filtrar por centro de custo (ID)',
          },
          bankAccountId: {
            type: 'string',
            description: 'Filtrar por conta bancária (ID)',
          },
          dueDateFrom: {
            type: 'string',
            description: 'Vencimento a partir de (ISO 8601, ex: 2026-01-01)',
          },
          dueDateTo: {
            type: 'string',
            description: 'Vencimento até (ISO 8601, ex: 2026-12-31)',
          },
          isOverdue: {
            type: 'boolean',
            description: 'Filtrar apenas lançamentos vencidos',
          },
          search: {
            type: 'string',
            description: 'Busca por descrição, fornecedor ou cliente',
          },
          limit: {
            type: 'number',
            description: 'Máximo de resultados (padrão 10, máximo 20)',
          },
          page: {
            type: 'number',
            description: 'Página de resultados (padrão 1)',
          },
        },
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'finance_get_entry',
      description:
        'Obtém os detalhes completos de um lançamento financeiro específico, incluindo pagamentos registrados',
      parameters: {
        type: 'object',
        properties: {
          entryId: {
            type: 'string',
            description: 'ID do lançamento financeiro',
          },
        },
        required: ['entryId'],
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'finance_list_cost_centers',
      description: 'Lista centros de custo cadastrados com paginação',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Máximo de resultados (padrão 10, máximo 20)',
          },
          page: {
            type: 'number',
            description: 'Página de resultados (padrão 1)',
          },
        },
      },
      module: 'finance',
      permission: 'finance.cost-centers.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'finance_list_bank_accounts',
      description: 'Lista contas bancárias cadastradas com saldo atual',
      parameters: {
        type: 'object',
        properties: {},
      },
      module: 'finance',
      permission: 'finance.bank-accounts.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'finance_get_bank_account',
      description:
        'Obtém os detalhes completos de uma conta bancária específica',
      parameters: {
        type: 'object',
        properties: {
          bankAccountId: {
            type: 'string',
            description: 'ID da conta bancária',
          },
        },
        required: ['bankAccountId'],
      },
      module: 'finance',
      permission: 'finance.bank-accounts.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'finance_list_categories',
      description: 'Lista categorias financeiras cadastradas (receita/despesa)',
      parameters: {
        type: 'object',
        properties: {},
      },
      module: 'finance',
      permission: 'finance.categories.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'finance_list_loans',
      description:
        'Lista empréstimos e financiamentos com filtros por tipo, status ou instituição',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description:
              'Tipo do empréstimo (ex: PERSONAL, VEHICLE, REAL_ESTATE)',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'PAID_OFF', 'DEFAULTED', 'RENEGOTIATED'],
            description: 'Status do empréstimo',
          },
          search: {
            type: 'string',
            description: 'Busca por nome ou número do contrato',
          },
          limit: {
            type: 'number',
            description: 'Máximo de resultados (padrão 10, máximo 20)',
          },
          page: {
            type: 'number',
            description: 'Página de resultados (padrão 1)',
          },
        },
      },
      module: 'finance',
      permission: 'finance.loans.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'finance_get_loan',
      description:
        'Obtém os detalhes completos de um empréstimo, incluindo parcelas e pagamentos',
      parameters: {
        type: 'object',
        properties: {
          loanId: { type: 'string', description: 'ID do empréstimo' },
        },
        required: ['loanId'],
      },
      module: 'finance',
      permission: 'finance.loans.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'finance_list_consortia',
      description:
        'Lista consórcios cadastrados com filtros por status e contemplação',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
            description: 'Status do consórcio',
          },
          isContemplated: {
            type: 'boolean',
            description: 'Filtrar por consórcios contemplados ou não',
          },
          search: {
            type: 'string',
            description: 'Busca por nome ou administradora',
          },
          limit: {
            type: 'number',
            description: 'Máximo de resultados (padrão 10, máximo 20)',
          },
          page: {
            type: 'number',
            description: 'Página de resultados (padrão 1)',
          },
        },
      },
      module: 'finance',
      permission: 'finance.consortia.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'finance_get_consortium',
      description:
        'Obtém os detalhes completos de um consórcio, incluindo pagamentos realizados',
      parameters: {
        type: 'object',
        properties: {
          consortiumId: { type: 'string', description: 'ID do consórcio' },
        },
        required: ['consortiumId'],
      },
      module: 'finance',
      permission: 'finance.consortia.access',
      requiresConfirmation: false,
      category: 'query',
    },

    // =========================================================
    // ACTION TOOLS (5)
    // =========================================================
    {
      name: 'finance_create_entry',
      description:
        'Cria um novo lançamento financeiro (conta a pagar ou a receber)',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['PAYABLE', 'RECEIVABLE'],
            description: 'Tipo: PAYABLE (a pagar) ou RECEIVABLE (a receber)',
          },
          description: {
            type: 'string',
            description: 'Descrição do lançamento',
          },
          categoryId: {
            type: 'string',
            description: 'ID da categoria financeira',
          },
          expectedAmount: {
            type: 'number',
            description: 'Valor esperado do lançamento',
          },
          dueDate: {
            type: 'string',
            description: 'Data de vencimento (ISO 8601)',
          },
          issueDate: {
            type: 'string',
            description: 'Data de emissão (ISO 8601, padrão: hoje)',
          },
          costCenterId: {
            type: 'string',
            description: 'ID do centro de custo (opcional)',
          },
          bankAccountId: {
            type: 'string',
            description: 'ID da conta bancária (opcional)',
          },
          supplierName: {
            type: 'string',
            description: 'Nome do fornecedor (para contas a pagar)',
          },
          customerName: {
            type: 'string',
            description: 'Nome do cliente (para contas a receber)',
          },
          notes: {
            type: 'string',
            description: 'Observações sobre o lançamento',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags para classificação do lançamento',
          },
        },
        required: [
          'type',
          'description',
          'categoryId',
          'expectedAmount',
          'dueDate',
        ],
      },
      module: 'finance',
      permission: 'finance.entries.register',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'finance_register_payment',
      description:
        'Registra um pagamento (total ou parcial) para um lançamento financeiro existente',
      parameters: {
        type: 'object',
        properties: {
          entryId: {
            type: 'string',
            description: 'ID do lançamento a pagar',
          },
          amount: {
            type: 'number',
            description: 'Valor do pagamento',
          },
          paidAt: {
            type: 'string',
            description: 'Data do pagamento (ISO 8601, padrão: hoje)',
          },
          bankAccountId: {
            type: 'string',
            description: 'ID da conta bancária utilizada (opcional)',
          },
          method: {
            type: 'string',
            enum: [
              'PIX',
              'BOLETO',
              'TRANSFER',
              'CASH',
              'CREDIT_CARD',
              'DEBIT_CARD',
              'CHECK',
            ],
            description: 'Método de pagamento',
          },
          notes: {
            type: 'string',
            description: 'Observações sobre o pagamento',
          },
        },
        required: ['entryId', 'amount'],
      },
      module: 'finance',
      permission: 'finance.entries.modify',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'finance_cancel_entry',
      description: 'Cancela um lançamento financeiro pendente ou vencido',
      parameters: {
        type: 'object',
        properties: {
          entryId: {
            type: 'string',
            description: 'ID do lançamento a cancelar',
          },
        },
        required: ['entryId'],
      },
      module: 'finance',
      permission: 'finance.entries.modify',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'finance_create_cost_center',
      description:
        'Cria um novo centro de custo para classificação de despesas',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Código do centro de custo (ex: CC-001)',
          },
          name: { type: 'string', description: 'Nome do centro de custo' },
          description: {
            type: 'string',
            description: 'Descrição do centro de custo',
          },
          parentId: {
            type: 'string',
            description: 'ID do centro de custo pai (para hierarquia)',
          },
          monthlyBudget: {
            type: 'number',
            description: 'Orçamento mensal do centro de custo',
          },
          annualBudget: {
            type: 'number',
            description: 'Orçamento anual do centro de custo',
          },
        },
        required: ['code', 'name'],
      },
      module: 'finance',
      permission: 'finance.cost-centers.register',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'finance_create_bank_account',
      description: 'Cadastra uma nova conta bancária',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Nome da conta (ex: Conta Corrente Itaú)',
          },
          bankCode: {
            type: 'string',
            description: 'Código do banco (ex: 341)',
          },
          bankName: { type: 'string', description: 'Nome do banco (ex: Itaú)' },
          agency: { type: 'string', description: 'Número da agência' },
          accountNumber: { type: 'string', description: 'Número da conta' },
          accountType: {
            type: 'string',
            enum: ['CHECKING', 'SAVINGS', 'INVESTMENT', 'CASH'],
            description: 'Tipo da conta',
          },
          pixKeyType: {
            type: 'string',
            enum: ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'],
            description: 'Tipo de chave PIX (opcional)',
          },
          pixKey: { type: 'string', description: 'Chave PIX (opcional)' },
          color: { type: 'string', description: 'Cor da conta em hexadecimal' },
          isDefault: { type: 'boolean', description: 'Se é a conta padrão' },
        },
        required: [
          'name',
          'bankCode',
          'agency',
          'accountNumber',
          'accountType',
        ],
      },
      module: 'finance',
      permission: 'finance.bank-accounts.register',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'finance_create_category',
      description:
        'Cria uma nova categoria financeira para classificação de lançamentos',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome da categoria' },
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE'],
            description: 'Tipo: INCOME (receita) ou EXPENSE (despesa)',
          },
          description: {
            type: 'string',
            description: 'Descrição da categoria',
          },
          color: {
            type: 'string',
            description: 'Cor em hexadecimal (ex: #10B981)',
          },
          parentId: {
            type: 'string',
            description: 'ID da categoria pai (para subcategorias)',
          },
        },
        required: ['name', 'type'],
      },
      module: 'finance',
      permission: 'finance.categories.register',
      requiresConfirmation: false,
      category: 'action',
    },

    // =========================================================
    // REPORT TOOLS (11)
    // =========================================================
    {
      name: 'finance_dashboard',
      description:
        'Gera um resumo financeiro geral com totais de contas a pagar/receber, vencidos, saldo e indicadores',
      parameters: {
        type: 'object',
        properties: {},
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'finance_cashflow',
      description:
        'Gera relatório de fluxo de caixa com entradas e saídas agrupadas por período',
      parameters: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Data inicial do período (ISO 8601)',
          },
          endDate: {
            type: 'string',
            description: 'Data final do período (ISO 8601)',
          },
          groupBy: {
            type: 'string',
            enum: ['day', 'week', 'month'],
            description: 'Agrupamento dos dados (padrão: month)',
          },
          bankAccountId: {
            type: 'string',
            description: 'Filtrar por conta bancária (ID)',
          },
        },
        required: ['startDate', 'endDate'],
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'finance_overdue_report',
      description:
        'Relatório de lançamentos vencidos com totais por tipo (a pagar e a receber) e alertas próximos do vencimento',
      parameters: {
        type: 'object',
        properties: {
          dueSoonDays: {
            type: 'number',
            description:
              'Dias para considerar "próximo do vencimento" (padrão: 3)',
          },
        },
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'report',
    },

    // ─── Advanced Analytical Tools ───────────────────────────

    {
      name: 'finance_get_summary',
      description:
        'Resumo financeiro por período: total a pagar, total a receber, vencidos, pagos no período e saldo em caixa. Use para perguntas como "Como está meu financeiro?"',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month', 'quarter', 'year'],
            description:
              'Período de análise (padrão: month). "today" = hoje, "week" = últimos 7 dias, "month" = mês atual, "quarter" = trimestre atual, "year" = ano atual',
          },
        },
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'finance_list_overdue_entries',
      description:
        'Lista lançamentos vencidos com nome do fornecedor/cliente, valor, data de vencimento e dias de atraso. Use para perguntas como "Quem me deve?" ou "O que está vencido?"',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['PAYABLE', 'RECEIVABLE'],
            description:
              'Tipo: PAYABLE (contas a pagar vencidas) ou RECEIVABLE (contas a receber vencidas). Se omitido, retorna ambos.',
          },
          limit: {
            type: 'number',
            description: 'Máximo de resultados (padrão 10, máximo 20)',
          },
        },
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'finance_get_cashflow_forecast',
      description:
        'Previsão de fluxo de caixa: saldo atual, receitas e despesas previstas nos próximos dias, saldo projetado e alerta se saldo ficar negativo. Use para perguntas como "Vou ter dinheiro pro salário?"',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Dias para projetar no futuro (padrão 30, máximo 180)',
          },
        },
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'finance_compare_expenses',
      description:
        'Compara despesas entre dois meses, mostrando total de cada período, diferença, variação percentual e top categorias. Use para perguntas como "Gastei mais ou menos que mês passado?"',
      parameters: {
        type: 'object',
        properties: {
          period1: {
            type: 'string',
            description: 'Primeiro período no formato YYYY-MM (ex: 2026-01)',
          },
          period2: {
            type: 'string',
            description: 'Segundo período no formato YYYY-MM (ex: 2026-02)',
          },
          categoryId: {
            type: 'string',
            description:
              'Filtrar por categoria específica (ID). Se omitido, compara todas as categorias.',
          },
        },
        required: ['period1', 'period2'],
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'finance_get_customer_payment_score',
      description:
        'Avalia o histórico de pagamento de um cliente: score, classificação, tempo médio de pagamento, taxa de pontualidade. Use para perguntas como "O cliente X paga em dia?"',
      parameters: {
        type: 'object',
        properties: {
          customerName: {
            type: 'string',
            description: 'Nome do cliente para avaliar (busca parcial)',
          },
        },
        required: ['customerName'],
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'finance_suggest_cost_reduction',
      description:
        'Analisa despesas recentes e sugere onde cortar gastos: top categorias, tendência mensal, categorias com aumento acima de 20%. Use para perguntas como "Onde posso cortar gastos?"',
      parameters: {
        type: 'object',
        properties: {
          months: {
            type: 'number',
            description:
              'Meses de retrospectiva para análise (padrão 3, máximo 12)',
          },
        },
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'finance_get_bank_account_balances',
      description:
        'Lista todas as contas bancárias ativas com nome, saldo atual e tipo. Use para perguntas como "Qual meu saldo?" ou "Quanto tenho no banco?"',
      parameters: {
        type: 'object',
        properties: {},
      },
      module: 'finance',
      permission: 'finance.bank-accounts.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'finance_detect_anomalies',
      description:
        'Detecta gastos anômalos e variações incomuns nos lançamentos financeiros. Identifica picos de despesa, aumento de preço de fornecedores e frequência atípica de lançamentos.',
      parameters: {
        type: 'object',
        properties: {
          months: {
            type: 'number',
            description:
              'Meses de retrospectiva para análise (padrão 6, máximo 24)',
          },
        },
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'finance_suggest_payment_timing',
      description:
        'Analisa lançamentos a pagar e sugere o melhor momento para cada pagamento: desconto por antecipação, segurança para atrasar ou risco de multa. Use para perguntas como "Quando devo pagar?", "Posso atrasar alguma conta?" ou "Tem algum desconto por antecipação?"',
      parameters: {
        type: 'object',
        properties: {
          daysAhead: {
            type: 'number',
            description:
              'Dias no futuro para analisar (padrão 30, máximo 90)',
          },
        },
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'finance_three_way_match',
      description:
        'Executa a verificação de correspondência tripla (three-way matching) para um lançamento a pagar: compara nota fiscal, pedido de compra e recebimento de mercadoria. Use para perguntas como "Confere a nota com o pedido?" ou "O recebimento bate com a NF?"',
      parameters: {
        type: 'object',
        properties: {
          entryId: {
            type: 'string',
            description: 'ID do lançamento a pagar para verificar',
          },
        },
        required: ['entryId'],
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'finance_get_upcoming_payments',
      description:
        'Lista lançamentos pendentes que vencem nos próximos dias, agrupados por dia e com total. Use para perguntas como "O que vence essa semana?" ou "O que tenho para pagar?"',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description:
              'Dias para buscar vencimentos futuros (padrão 7, máximo 90)',
          },
        },
      },
      module: 'finance',
      permission: 'finance.entries.access',
      requiresConfirmation: false,
      category: 'report',
    },
  ];
}

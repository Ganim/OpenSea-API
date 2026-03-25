import type { ModuleKnowledge } from '../module-knowledge.interface';

export const financeKnowledge: ModuleKnowledge = {
  module: 'finance',
  displayName: 'Financeiro',
  description:
    'Gerencia lancamentos financeiros (a pagar e a receber), contas bancarias, centros de custo, emprestimos, consorcios e fluxo de caixa.',
  version: '1.0.0',

  // ================================================================
  // ENTITIES
  // ================================================================
  entities: [
    {
      name: 'Entry',
      displayName: 'Lancamento',
      description:
        'Lancamento financeiro — pode ser a pagar (PAYABLE) ou a receber (RECEIVABLE). Entidade central do modulo financeiro.',
      fields: [
        {
          name: 'description',
          displayName: 'Descricao',
          type: 'string',
          required: true,
          description: 'Descricao do lancamento',
          example: 'Pagamento fornecedor Textil SA',
        },
        {
          name: 'type',
          displayName: 'Tipo',
          type: 'enum',
          required: true,
          description: 'Tipo do lancamento',
          enumValues: ['PAYABLE', 'RECEIVABLE'],
        },
        {
          name: 'amount',
          displayName: 'Valor',
          type: 'number',
          required: true,
          description: 'Valor em centavos (ex: 15000 = R$ 150,00)',
          example: '15000',
        },
        {
          name: 'dueDate',
          displayName: 'Data de Vencimento',
          type: 'date',
          required: true,
          description: 'Data de vencimento do lancamento',
        },
        {
          name: 'status',
          displayName: 'Status',
          type: 'enum',
          required: false,
          description: 'Status do lancamento',
          enumValues: [
            'PENDING',
            'PAID',
            'OVERDUE',
            'CANCELLED',
            'PARTIALLY_PAID',
          ],
          defaultValue: 'PENDING',
        },
        {
          name: 'categoryId',
          displayName: 'Categoria',
          type: 'relation',
          required: false,
          description: 'Categoria do lancamento',
        },
        {
          name: 'bankAccountId',
          displayName: 'Conta Bancaria',
          type: 'relation',
          required: false,
          description: 'Conta bancaria associada',
        },
        {
          name: 'costCenterId',
          displayName: 'Centro de Custo',
          type: 'relation',
          required: false,
          description: 'Centro de custo para alocacao',
        },
        {
          name: 'recurrence',
          displayName: 'Recorrencia',
          type: 'enum',
          required: false,
          description: 'Frequencia de recorrencia',
          enumValues: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
          defaultValue: 'NONE',
        },
        {
          name: 'tags',
          displayName: 'Tags',
          type: 'array',
          required: false,
          description: 'Tags para classificacao',
        },
      ],
      statusFlow: {
        statuses: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIALLY_PAID'],
        transitions: {
          PENDING: ['PAID', 'OVERDUE', 'CANCELLED', 'PARTIALLY_PAID'],
          OVERDUE: ['PAID', 'CANCELLED', 'PARTIALLY_PAID'],
          PARTIALLY_PAID: ['PAID', 'CANCELLED'],
        },
        initialStatus: 'PENDING',
        terminalStatuses: ['PAID', 'CANCELLED'],
      },
      relationships: [
        {
          entity: 'BankAccount',
          type: 'belongs_to',
          description: 'Lancamento pode estar vinculado a uma conta bancaria',
          required: false,
        },
        {
          entity: 'CostCenter',
          type: 'belongs_to',
          description: 'Lancamento pode ter um centro de custo',
          required: false,
        },
        {
          entity: 'EntryCategory',
          type: 'belongs_to',
          description: 'Lancamento pode ter uma categoria',
          required: false,
        },
      ],
      validations: [
        'Descricao e obrigatoria',
        'Tipo (PAYABLE/RECEIVABLE) e obrigatorio',
        'Valor deve ser positivo (em centavos)',
        'Data de vencimento e obrigatoria',
        'Lancamentos PAID e CANCELLED nao podem ser alterados',
      ],
    },
    {
      name: 'BankAccount',
      displayName: 'Conta Bancaria',
      description:
        'Conta bancaria da empresa para gerenciar saldos e vincular lancamentos.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome identificador da conta',
          example: 'Conta Principal Itau',
        },
        {
          name: 'bank',
          displayName: 'Banco',
          type: 'string',
          required: false,
          description: 'Nome do banco',
        },
        {
          name: 'balance',
          displayName: 'Saldo',
          type: 'number',
          required: false,
          description: 'Saldo atual em centavos',
          defaultValue: '0',
        },
        {
          name: 'type',
          displayName: 'Tipo',
          type: 'enum',
          required: false,
          description: 'Tipo da conta',
          enumValues: ['CHECKING', 'SAVINGS', 'INVESTMENT', 'CASH'],
          defaultValue: 'CHECKING',
        },
      ],
      relationships: [
        {
          entity: 'Entry',
          type: 'has_many',
          description: 'Conta tem muitos lancamentos',
          required: false,
        },
      ],
      validations: ['Nome e obrigatorio'],
    },
    {
      name: 'CostCenter',
      displayName: 'Centro de Custo',
      description:
        'Centro de custo para alocacao e analise de despesas por area.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome do centro de custo',
          example: 'Marketing',
        },
        {
          name: 'code',
          displayName: 'Codigo',
          type: 'string',
          required: false,
          description: 'Codigo do centro de custo',
        },
        {
          name: 'budget',
          displayName: 'Orcamento',
          type: 'number',
          required: false,
          description: 'Orcamento alocado em centavos',
        },
      ],
      relationships: [
        {
          entity: 'Entry',
          type: 'has_many',
          description: 'Centro de custo tem muitos lancamentos',
          required: false,
        },
      ],
      validations: ['Nome e obrigatorio'],
    },
    {
      name: 'EntryCategory',
      displayName: 'Categoria de Lancamento',
      description:
        'Categoria para classificar lancamentos financeiros (ex: Aluguel, Folha, Material).',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome da categoria',
          example: 'Folha de Pagamento',
        },
        {
          name: 'type',
          displayName: 'Tipo',
          type: 'enum',
          required: false,
          description: 'Aplicavel a PAYABLE, RECEIVABLE ou ambos',
          enumValues: ['PAYABLE', 'RECEIVABLE', 'BOTH'],
          defaultValue: 'BOTH',
        },
      ],
      relationships: [
        {
          entity: 'Entry',
          type: 'has_many',
          description: 'Categoria tem muitos lancamentos',
          required: false,
        },
      ],
      validations: ['Nome e obrigatorio'],
    },
    {
      name: 'Loan',
      displayName: 'Emprestimo',
      description:
        'Emprestimo bancario com parcelas, taxa de juros e acompanhamento de pagamentos.',
      fields: [
        {
          name: 'description',
          displayName: 'Descricao',
          type: 'string',
          required: true,
          description: 'Descricao do emprestimo',
        },
        {
          name: 'amount',
          displayName: 'Valor Total',
          type: 'number',
          required: true,
          description: 'Valor total do emprestimo em centavos',
        },
        {
          name: 'interestRate',
          displayName: 'Taxa de Juros',
          type: 'number',
          required: false,
          description: 'Taxa de juros mensal (%)',
        },
        {
          name: 'installments',
          displayName: 'Parcelas',
          type: 'number',
          required: true,
          description: 'Numero total de parcelas',
        },
      ],
      relationships: [
        {
          entity: 'BankAccount',
          type: 'belongs_to',
          description: 'Emprestimo vinculado a uma conta',
          required: false,
        },
      ],
      validations: [
        'Descricao e obrigatoria',
        'Valor deve ser positivo',
        'Numero de parcelas deve ser maior que zero',
      ],
    },
    {
      name: 'Consortium',
      displayName: 'Consorcio',
      description: 'Consorcio com acompanhamento de parcelas e contemplacao.',
      fields: [
        {
          name: 'description',
          displayName: 'Descricao',
          type: 'string',
          required: true,
          description: 'Descricao do consorcio',
        },
        {
          name: 'totalValue',
          displayName: 'Valor da Carta',
          type: 'number',
          required: true,
          description: 'Valor da carta de credito em centavos',
        },
        {
          name: 'installments',
          displayName: 'Parcelas',
          type: 'number',
          required: true,
          description: 'Numero total de parcelas',
        },
        {
          name: 'contemplated',
          displayName: 'Contemplado',
          type: 'boolean',
          required: false,
          description: 'Se foi contemplado',
          defaultValue: 'false',
        },
      ],
      relationships: [],
      validations: [
        'Descricao e obrigatoria',
        'Valor e numero de parcelas obrigatorios',
      ],
    },
  ],

  // ================================================================
  // WORKFLOWS
  // ================================================================
  workflows: [
    {
      name: 'register_payable',
      displayName: 'Registrar Conta a Pagar',
      description: 'Fluxo para registrar um lancamento a pagar.',
      triggers: [
        'Usuario informa uma despesa',
        'Compra de estoque gera conta a pagar',
        'Folha de pagamento',
      ],
      outcomes: ['Lancamento PAYABLE criado com status PENDING'],
      steps: [
        {
          order: 1,
          name: 'Coletar Dados',
          description: 'Identificar descricao, valor, vencimento e categoria.',
          requiredData: ['description', 'amount', 'dueDate'],
          autoActions: [],
          confirmActions: [],
          nextSteps: ['Criar Lancamento'],
          errorHandling: 'Perguntar dados faltantes',
        },
        {
          order: 2,
          name: 'Criar Lancamento',
          description: 'Criar o lancamento financeiro tipo PAYABLE.',
          requiredData: ['description', 'amount', 'dueDate', 'type=PAYABLE'],
          autoActions: [],
          confirmActions: ['finance_create_entry'],
          nextSteps: [],
          errorHandling: 'Informar erro e verificar dados',
        },
      ],
    },
    {
      name: 'register_receivable',
      displayName: 'Registrar Conta a Receber',
      description: 'Fluxo para registrar um lancamento a receber.',
      triggers: ['Venda realizada', 'Servico prestado', 'Faturamento'],
      outcomes: ['Lancamento RECEIVABLE criado com status PENDING'],
      steps: [
        {
          order: 1,
          name: 'Coletar Dados',
          description: 'Identificar descricao, valor, vencimento e cliente.',
          requiredData: ['description', 'amount', 'dueDate'],
          autoActions: [],
          confirmActions: [],
          nextSteps: ['Criar Lancamento'],
          errorHandling: 'Perguntar dados faltantes',
        },
        {
          order: 2,
          name: 'Criar Lancamento',
          description: 'Criar o lancamento financeiro tipo RECEIVABLE.',
          requiredData: ['description', 'amount', 'dueDate', 'type=RECEIVABLE'],
          autoActions: [],
          confirmActions: ['finance_create_entry'],
          nextSteps: [],
          errorHandling: 'Informar erro e verificar dados',
        },
      ],
    },
    {
      name: 'cashflow_analysis',
      displayName: 'Analise de Fluxo de Caixa',
      description:
        'Consultar receitas vs despesas para um periodo e projetar saldo.',
      triggers: [
        'Usuario pergunta sobre fluxo de caixa',
        'Analise financeira',
        'Previsao de caixa',
      ],
      outcomes: ['Visao consolidada de entradas e saidas apresentada'],
      steps: [
        {
          order: 1,
          name: 'Buscar Lancamentos',
          description: 'Listar lancamentos do periodo agrupados por tipo.',
          requiredData: ['periodo (startDate, endDate)'],
          autoActions: ['finance_list_entries'],
          confirmActions: [],
          nextSteps: ['Consolidar'],
          errorHandling: 'Se sem periodo, usar mes atual',
        },
        {
          order: 2,
          name: 'Consolidar',
          description:
            'Calcular totais de recebimentos e pagamentos, saldo projetado.',
          requiredData: [],
          autoActions: ['finance_cashflow_summary'],
          confirmActions: [],
          nextSteps: [],
          errorHandling: 'Informar se nao ha dados suficientes',
        },
      ],
    },
  ],

  // ================================================================
  // BUSINESS RULES
  // ================================================================
  rules: [
    {
      id: 'fin_001',
      description: 'Valores financeiros sao armazenados em centavos (inteiro)',
      severity: 'INFO',
      appliesTo: ['Entry', 'BankAccount', 'Loan', 'Consortium'],
      condition: 'Sempre',
      action:
        'Converter reais para centavos antes de enviar (R$ 150,00 = 15000). Exibir em reais para o usuario.',
    },
    {
      id: 'fin_002',
      description: 'Lancamentos PAID ou CANCELLED nao podem ser editados',
      severity: 'BLOCK',
      appliesTo: ['Entry', 'modify'],
      condition: 'Status e PAID ou CANCELLED',
      action: 'Informar que lancamento ja finalizado nao pode ser alterado',
    },
    {
      id: 'fin_003',
      description:
        'Lancamentos vencidos devem ser marcados como OVERDUE automaticamente',
      severity: 'WARN',
      appliesTo: ['Entry'],
      condition: 'dueDate < hoje e status = PENDING',
      action: 'Alertar o usuario sobre lancamentos vencidos',
    },
    {
      id: 'fin_004',
      description: 'Baixa parcial muda status para PARTIALLY_PAID',
      severity: 'INFO',
      appliesTo: ['Entry', 'pay'],
      condition: 'Pagamento menor que valor total',
      action: 'Registrar pagamento parcial e atualizar saldo restante',
    },
  ],

  // ================================================================
  // DECISION TREES
  // ================================================================
  decisionTrees: [
    {
      question: 'E uma despesa (a pagar) ou receita (a receber)?',
      context: 'Quando usuario quer registrar um lancamento financeiro',
      branches: [
        {
          condition: 'Menciona pagar, despesa, conta, fornecedor, compra',
          action: 'Criar lancamento PAYABLE',
        },
        {
          condition: 'Menciona receber, receita, venda, cliente, faturar',
          action: 'Criar lancamento RECEIVABLE',
        },
        {
          condition: 'Ambiguo ou generico',
          action: 'Perguntar se e a pagar ou a receber',
        },
      ],
    },
    {
      question: 'O usuario quer consultar ou registrar?',
      context: 'Quando usuario faz pedido generico sobre financeiro',
      branches: [
        {
          condition: 'Menciona quanto devo, contas pendentes, vencidas',
          action: 'Listar lancamentos pendentes/vencidos',
        },
        {
          condition: 'Menciona fluxo de caixa, receita vs despesa',
          action: 'Iniciar workflow cashflow_analysis',
        },
        {
          condition: 'Menciona registrar, lançar, nova conta',
          action: 'Determinar se PAYABLE ou RECEIVABLE',
        },
      ],
    },
  ],

  // ================================================================
  // DATA REQUIREMENTS
  // ================================================================
  dataRequirements: [
    {
      action: 'create_entry',
      required: [
        {
          field: 'description',
          description: 'Descricao do lancamento',
          howToObtain: 'ask_user',
        },
        {
          field: 'type',
          description: 'PAYABLE ou RECEIVABLE',
          howToObtain: 'ask_user',
        },
        {
          field: 'amount',
          description: 'Valor em centavos',
          howToObtain: 'ask_user',
        },
        {
          field: 'dueDate',
          description: 'Data de vencimento',
          howToObtain: 'ask_user',
        },
      ],
      optional: [
        {
          field: 'categoryId',
          description: 'Categoria',
          howToObtain: 'lookup_entity',
        },
        {
          field: 'bankAccountId',
          description: 'Conta bancaria',
          howToObtain: 'lookup_entity',
        },
        {
          field: 'costCenterId',
          description: 'Centro de custo',
          howToObtain: 'lookup_entity',
        },
        {
          field: 'tags',
          description: 'Tags',
          howToObtain: 'ask_user',
        },
      ],
      derivable: [
        {
          field: 'type',
          description: 'Tipo do lancamento',
          derivationStrategy:
            'Inferir do contexto: despesa/fornecedor = PAYABLE, receita/venda = RECEIVABLE',
        },
        {
          field: 'categoryId',
          description: 'Categoria adequada',
          derivationStrategy:
            'Buscar por nome mencionado nas categorias existentes',
        },
      ],
    },
  ],

  // ================================================================
  // DEPENDENCIES
  // ================================================================
  dependencies: [
    {
      module: 'stock',
      relationship: 'Ordens de compra de estoque geram lancamentos a pagar',
      sharedEntities: ['Supplier', 'PurchaseOrder'],
    },
    {
      module: 'sales',
      relationship: 'Vendas geram lancamentos a receber',
      sharedEntities: ['Order', 'Customer'],
    },
    {
      module: 'hr',
      relationship: 'Folha de pagamento gera lancamentos a pagar',
      sharedEntities: ['Employee'],
    },
  ],

  // ================================================================
  // COMMON QUERIES
  // ================================================================
  commonQueries: [
    {
      intent: 'pending_payments',
      examples: [
        'Quais contas tenho a pagar?',
        'Contas vencidas',
        'O que vence essa semana?',
      ],
      strategy: 'Listar lancamentos PAYABLE com status PENDING ou OVERDUE',
      toolsNeeded: ['finance_list_entries'],
    },
    {
      intent: 'pending_receivables',
      examples: [
        'O que tenho a receber?',
        'Clientes que devem',
        'Receitas pendentes',
      ],
      strategy: 'Listar lancamentos RECEIVABLE com status PENDING',
      toolsNeeded: ['finance_list_entries'],
    },
    {
      intent: 'cashflow',
      examples: [
        'Fluxo de caixa do mes',
        'Receita vs despesa',
        'Balanco financeiro',
      ],
      strategy: 'Buscar lancamentos do periodo e calcular totais',
      toolsNeeded: ['finance_list_entries', 'finance_cashflow_summary'],
    },
    {
      intent: 'bank_balance',
      examples: [
        'Saldo das contas',
        'Quanto tenho em caixa?',
        'Saldo bancario',
      ],
      strategy: 'Listar contas bancarias com saldos',
      toolsNeeded: ['finance_list_bank_accounts'],
    },
  ],
};

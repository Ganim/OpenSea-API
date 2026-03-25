import type { ModuleKnowledge } from '../module-knowledge.interface';

export const salesKnowledge: ModuleKnowledge = {
  module: 'sales',
  displayName: 'Vendas',
  description:
    'Gerencia clientes, pedidos, reservas de estoque, promocoes, comissoes e pipeline comercial.',
  version: '1.0.0',

  // ================================================================
  // ENTITIES
  // ================================================================
  entities: [
    {
      name: 'Customer',
      displayName: 'Cliente',
      description:
        'Cadastro de cliente (pessoa fisica ou juridica) com dados de contato, enderecos e historico de compras.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome completo ou razao social',
          example: 'Joao da Silva',
        },
        {
          name: 'type',
          displayName: 'Tipo',
          type: 'enum',
          required: false,
          description: 'Tipo de pessoa',
          enumValues: ['INDIVIDUAL', 'COMPANY'],
          defaultValue: 'INDIVIDUAL',
        },
        {
          name: 'document',
          displayName: 'Documento',
          type: 'string',
          required: false,
          description: 'CPF (pessoa fisica) ou CNPJ (pessoa juridica)',
        },
        {
          name: 'email',
          displayName: 'E-mail',
          type: 'string',
          required: false,
          description: 'E-mail de contato',
        },
        {
          name: 'phone',
          displayName: 'Telefone',
          type: 'string',
          required: false,
          description: 'Telefone de contato',
        },
        {
          name: 'status',
          displayName: 'Status',
          type: 'enum',
          required: false,
          description: 'Status do cliente',
          enumValues: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
          defaultValue: 'ACTIVE',
        },
      ],
      statusFlow: {
        statuses: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
        transitions: {
          ACTIVE: ['INACTIVE', 'BLOCKED'],
          INACTIVE: ['ACTIVE'],
          BLOCKED: ['ACTIVE'],
        },
        initialStatus: 'ACTIVE',
        terminalStatuses: [],
      },
      relationships: [
        {
          entity: 'Order',
          type: 'has_many',
          description: 'Cliente pode ter muitos pedidos',
          required: false,
        },
      ],
      validations: [
        'Nome e obrigatorio',
        'Documento (CPF/CNPJ) deve ser valido se informado',
        'Clientes BLOCKED nao podem fazer novos pedidos',
      ],
    },
    {
      name: 'Order',
      displayName: 'Pedido',
      description:
        'Pedido de venda com itens, valores, status de aprovacao e rastreamento de entrega.',
      fields: [
        {
          name: 'customerId',
          displayName: 'Cliente',
          type: 'relation',
          required: true,
          description: 'Cliente que fez o pedido',
        },
        {
          name: 'status',
          displayName: 'Status',
          type: 'enum',
          required: false,
          description: 'Status do pedido',
          enumValues: [
            'DRAFT',
            'PENDING',
            'CONFIRMED',
            'IN_PREPARATION',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED',
            'RETURNED',
          ],
          defaultValue: 'DRAFT',
        },
        {
          name: 'items',
          displayName: 'Itens',
          type: 'array',
          required: true,
          description: 'Lista de produtos/variantes e quantidades',
        },
        {
          name: 'totalAmount',
          displayName: 'Valor Total',
          type: 'number',
          required: false,
          description: 'Valor total do pedido em centavos',
        },
        {
          name: 'paymentMethod',
          displayName: 'Forma de Pagamento',
          type: 'enum',
          required: false,
          description: 'Forma de pagamento',
          enumValues: [
            'CASH',
            'CREDIT_CARD',
            'DEBIT_CARD',
            'PIX',
            'BANK_SLIP',
            'OTHER',
          ],
        },
        {
          name: 'discount',
          displayName: 'Desconto',
          type: 'number',
          required: false,
          description: 'Valor de desconto em centavos',
        },
        {
          name: 'notes',
          displayName: 'Observacoes',
          type: 'string',
          required: false,
          description: 'Observacoes do pedido',
        },
        {
          name: 'sellerId',
          displayName: 'Vendedor',
          type: 'relation',
          required: false,
          description: 'Vendedor responsavel pelo pedido',
        },
      ],
      statusFlow: {
        statuses: [
          'DRAFT',
          'PENDING',
          'CONFIRMED',
          'IN_PREPARATION',
          'SHIPPED',
          'DELIVERED',
          'CANCELLED',
          'RETURNED',
        ],
        transitions: {
          DRAFT: ['PENDING', 'CANCELLED'],
          PENDING: ['CONFIRMED', 'CANCELLED'],
          CONFIRMED: ['IN_PREPARATION', 'CANCELLED'],
          IN_PREPARATION: ['SHIPPED', 'CANCELLED'],
          SHIPPED: ['DELIVERED', 'RETURNED'],
          DELIVERED: ['RETURNED'],
        },
        initialStatus: 'DRAFT',
        terminalStatuses: ['CANCELLED', 'RETURNED'],
      },
      relationships: [
        {
          entity: 'Customer',
          type: 'belongs_to',
          description: 'Pedido pertence a um cliente',
          required: true,
        },
        {
          entity: 'Reservation',
          type: 'has_many',
          description: 'Pedido pode reservar itens de estoque',
          required: false,
        },
      ],
      validations: [
        'CustomerId e obrigatorio',
        'Deve ter pelo menos um item',
        'Cliente nao pode estar BLOCKED',
        'Itens devem estar disponiveis em estoque para confirmacao',
        'Valor total e calculado automaticamente',
      ],
    },
    {
      name: 'Reservation',
      displayName: 'Reserva',
      description:
        'Reserva de itens de estoque vinculada a um pedido. Garante disponibilidade ate confirmacao.',
      fields: [
        {
          name: 'orderId',
          displayName: 'Pedido',
          type: 'relation',
          required: true,
          description: 'Pedido que originou a reserva',
        },
        {
          name: 'variantId',
          displayName: 'Variante',
          type: 'relation',
          required: true,
          description: 'Variante reservada',
        },
        {
          name: 'quantity',
          displayName: 'Quantidade',
          type: 'number',
          required: true,
          description: 'Quantidade reservada',
        },
        {
          name: 'status',
          displayName: 'Status',
          type: 'enum',
          required: false,
          description: 'Status da reserva',
          enumValues: ['ACTIVE', 'CONSUMED', 'RELEASED'],
          defaultValue: 'ACTIVE',
        },
        {
          name: 'expiresAt',
          displayName: 'Expiracao',
          type: 'date',
          required: false,
          description: 'Data/hora de expiracao automatica',
        },
      ],
      statusFlow: {
        statuses: ['ACTIVE', 'CONSUMED', 'RELEASED'],
        transitions: {
          ACTIVE: ['CONSUMED', 'RELEASED'],
        },
        initialStatus: 'ACTIVE',
        terminalStatuses: ['CONSUMED', 'RELEASED'],
      },
      relationships: [
        {
          entity: 'Order',
          type: 'belongs_to',
          description: 'Reserva pertence a um pedido',
          required: true,
        },
      ],
      validations: [
        'OrderId e obrigatorio',
        'VariantId e obrigatorio',
        'Quantidade deve ser positiva',
        'Estoque deve ter itens AVAILABLE suficientes',
      ],
    },
    {
      name: 'Promotion',
      displayName: 'Promocao',
      description:
        'Promocao ou desconto aplicavel a produtos, categorias ou pedidos.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome da promocao',
          example: 'Black Friday 2026',
        },
        {
          name: 'type',
          displayName: 'Tipo',
          type: 'enum',
          required: true,
          description: 'Tipo de desconto',
          enumValues: ['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y'],
        },
        {
          name: 'value',
          displayName: 'Valor',
          type: 'number',
          required: true,
          description: 'Valor do desconto (% ou centavos)',
        },
        {
          name: 'startDate',
          displayName: 'Inicio',
          type: 'date',
          required: true,
          description: 'Data de inicio da promocao',
        },
        {
          name: 'endDate',
          displayName: 'Fim',
          type: 'date',
          required: true,
          description: 'Data de fim da promocao',
        },
        {
          name: 'active',
          displayName: 'Ativa',
          type: 'boolean',
          required: false,
          description: 'Se a promocao esta ativa',
          defaultValue: 'true',
        },
      ],
      relationships: [
        {
          entity: 'Product',
          type: 'many_to_many',
          description: 'Promocao pode ser aplicada a produtos especificos',
          required: false,
        },
      ],
      validations: [
        'Nome e obrigatorio',
        'Tipo e obrigatorio',
        'Datas de inicio e fim sao obrigatorias',
        'Desconto percentual deve ser entre 0 e 100',
      ],
    },
  ],

  // ================================================================
  // WORKFLOWS
  // ================================================================
  workflows: [
    {
      name: 'create_order',
      displayName: 'Criar Pedido',
      description:
        'Fluxo completo para criar um pedido de venda, desde identificacao do cliente ate confirmacao.',
      triggers: ['Usuario quer vender', 'Novo pedido', 'Fazer venda'],
      outcomes: [
        'Pedido criado e confirmado com reserva de estoque',
        'Pedido em rascunho (pendente)',
      ],
      steps: [
        {
          order: 1,
          name: 'Identificar Cliente',
          description: 'Buscar ou cadastrar o cliente.',
          requiredData: ['nome ou id do cliente'],
          autoActions: ['sales_list_customers'],
          confirmActions: ['sales_create_customer'],
          nextSteps: ['Selecionar Produtos'],
          errorHandling:
            'Se cliente nao encontrado, perguntar se quer cadastrar',
        },
        {
          order: 2,
          name: 'Selecionar Produtos',
          description: 'Identificar produtos e quantidades desejados.',
          requiredData: ['produtos/variantes', 'quantidades'],
          autoActions: ['stock_list_products', 'stock_list_variants'],
          confirmActions: [],
          nextSteps: ['Verificar Estoque'],
          errorHandling: 'Se produto nao encontrado, listar similares',
        },
        {
          order: 3,
          name: 'Verificar Estoque',
          description: 'Verificar se ha estoque disponivel para os itens.',
          requiredData: ['variantIds', 'quantities'],
          autoActions: ['stock_list_items'],
          confirmActions: [],
          nextSteps: ['Criar Pedido'],
          errorHandling: 'Se sem estoque, informar e sugerir alternativas',
        },
        {
          order: 4,
          name: 'Criar Pedido',
          description: 'Criar o pedido com itens e calcular valor total.',
          requiredData: ['customerId', 'items'],
          autoActions: [],
          confirmActions: ['sales_create_order'],
          nextSteps: ['Confirmar Pedido'],
          errorHandling: 'Informar erro e verificar dados',
        },
        {
          order: 5,
          name: 'Confirmar Pedido',
          description: 'Confirmar pedido e reservar itens de estoque.',
          requiredData: ['orderId'],
          autoActions: [],
          confirmActions: ['sales_confirm_order'],
          nextSteps: [],
          errorHandling: 'Se falhar reserva, informar itens indisponiveis',
        },
      ],
    },
    {
      name: 'order_fulfillment',
      displayName: 'Atendimento de Pedido',
      description:
        'Fluxo de separacao, envio e entrega de um pedido confirmado.',
      triggers: ['Pedido confirmado', 'Preparar pedido para envio'],
      outcomes: ['Pedido entregue', 'Pedido cancelado'],
      steps: [
        {
          order: 1,
          name: 'Separar Itens',
          description: 'Separar itens do estoque para o pedido.',
          requiredData: ['orderId'],
          autoActions: ['sales_get_order'],
          confirmActions: ['sales_start_preparation'],
          nextSteps: ['Enviar'],
          errorHandling:
            'Se item nao encontrado na posicao, verificar realocacao',
        },
        {
          order: 2,
          name: 'Enviar',
          description: 'Registrar envio do pedido.',
          requiredData: ['orderId'],
          autoActions: [],
          confirmActions: ['sales_ship_order'],
          nextSteps: ['Confirmar Entrega'],
          errorHandling: 'Informar erro no envio',
        },
        {
          order: 3,
          name: 'Confirmar Entrega',
          description: 'Registrar que o pedido foi entregue.',
          requiredData: ['orderId'],
          autoActions: [],
          confirmActions: ['sales_deliver_order'],
          nextSteps: [],
          errorHandling: 'Se nao entregue, verificar devolucao',
        },
      ],
    },
  ],

  // ================================================================
  // BUSINESS RULES
  // ================================================================
  rules: [
    {
      id: 'sales_001',
      description: 'Clientes BLOCKED nao podem fazer novos pedidos',
      severity: 'BLOCK',
      appliesTo: ['Order', 'create'],
      condition: 'Cliente tem status BLOCKED',
      action: 'Informar que o cliente esta bloqueado',
    },
    {
      id: 'sales_002',
      description: 'Pedidos so podem ser confirmados se ha estoque disponivel',
      severity: 'BLOCK',
      appliesTo: ['Order', 'confirm'],
      condition: 'Algum item do pedido nao tem estoque AVAILABLE suficiente',
      action: 'Informar itens indisponiveis e sugerir ajustes no pedido',
    },
    {
      id: 'sales_003',
      description: 'Valores financeiros em centavos',
      severity: 'INFO',
      appliesTo: ['Order', 'Promotion'],
      condition: 'Sempre',
      action: 'Converter reais para centavos. Exibir em reais para o usuario.',
    },
    {
      id: 'sales_004',
      description: 'Reservas expiradas devem ser liberadas automaticamente',
      severity: 'WARN',
      appliesTo: ['Reservation'],
      condition: 'expiresAt < agora e status = ACTIVE',
      action: 'Alertar que reservas expiraram e estoque foi liberado',
    },
    {
      id: 'sales_005',
      description: 'Pedidos DELIVERED podem ser devolvidos, gerando RETURNED',
      severity: 'INFO',
      appliesTo: ['Order', 'return'],
      condition: 'Pedido esta DELIVERED',
      action: 'Registrar devolucao e devolver itens ao estoque',
    },
  ],

  // ================================================================
  // DECISION TREES
  // ================================================================
  decisionTrees: [
    {
      question: 'O que o usuario quer fazer com vendas?',
      context: 'Quando usuario faz pedido generico sobre vendas',
      branches: [
        {
          condition: 'Menciona vender, pedido, fazer venda',
          action: 'Iniciar workflow create_order',
        },
        {
          condition: 'Menciona cliente, cadastrar cliente',
          action: 'Buscar ou cadastrar cliente',
        },
        {
          condition: 'Menciona consultar pedidos, historico de vendas',
          action: 'Listar pedidos com filtros',
        },
        {
          condition: 'Menciona promocao, desconto, campanha',
          action: 'Gerenciar promocoes',
        },
        {
          condition: 'Menciona devolver, devolucao, troca',
          action: 'Processar devolucao',
        },
        {
          condition: 'Menciona comissao, vendedor, ranking',
          action: 'Consultar comissoes e desempenho',
        },
      ],
    },
  ],

  // ================================================================
  // DATA REQUIREMENTS
  // ================================================================
  dataRequirements: [
    {
      action: 'create_order',
      required: [
        {
          field: 'customerId',
          description: 'Cliente do pedido',
          howToObtain: 'lookup_entity',
        },
        {
          field: 'items',
          description: 'Itens do pedido (variante + quantidade)',
          howToObtain: 'ask_user',
        },
      ],
      optional: [
        {
          field: 'paymentMethod',
          description: 'Forma de pagamento',
          howToObtain: 'ask_user',
        },
        {
          field: 'discount',
          description: 'Desconto',
          howToObtain: 'ask_user',
        },
        {
          field: 'sellerId',
          description: 'Vendedor responsavel',
          howToObtain: 'lookup_entity',
        },
        {
          field: 'notes',
          description: 'Observacoes',
          howToObtain: 'ask_user',
        },
      ],
      derivable: [
        {
          field: 'customerId',
          description: 'Cliente',
          derivationStrategy:
            'Buscar por nome mencionado. Se nao encontrar, perguntar se quer cadastrar.',
        },
        {
          field: 'totalAmount',
          description: 'Valor total',
          derivationStrategy:
            'Calculado automaticamente a partir dos itens e desconto',
        },
      ],
    },
    {
      action: 'create_customer',
      required: [
        {
          field: 'name',
          description: 'Nome ou razao social',
          howToObtain: 'ask_user',
        },
      ],
      optional: [
        {
          field: 'type',
          description: 'Tipo de pessoa (INDIVIDUAL/COMPANY)',
          howToObtain: 'ask_user',
        },
        {
          field: 'document',
          description: 'CPF ou CNPJ',
          howToObtain: 'ask_user',
        },
        {
          field: 'email',
          description: 'E-mail',
          howToObtain: 'ask_user',
        },
        {
          field: 'phone',
          description: 'Telefone',
          howToObtain: 'ask_user',
        },
      ],
      derivable: [
        {
          field: 'type',
          description: 'Tipo de pessoa',
          derivationStrategy:
            'Se tem CNPJ = COMPANY, se tem CPF = INDIVIDUAL. Padrao: INDIVIDUAL',
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
      relationship:
        'Pedidos confirmados reservam e depois consomem itens de estoque',
      sharedEntities: ['Product', 'Variant', 'Item'],
    },
    {
      module: 'finance',
      relationship: 'Vendas confirmadas geram lancamentos a receber',
      sharedEntities: ['Entry'],
    },
  ],

  // ================================================================
  // COMMON QUERIES
  // ================================================================
  commonQueries: [
    {
      intent: 'sales_summary',
      examples: [
        'Vendas do mes',
        'Quanto vendi hoje?',
        'Resumo de vendas',
        'Faturamento',
      ],
      strategy: 'Listar pedidos do periodo e somar valores',
      toolsNeeded: ['sales_list_orders'],
    },
    {
      intent: 'pending_orders',
      examples: [
        'Pedidos pendentes',
        'O que falta entregar?',
        'Pedidos em aberto',
      ],
      strategy:
        'Listar pedidos com status PENDING, CONFIRMED ou IN_PREPARATION',
      toolsNeeded: ['sales_list_orders'],
    },
    {
      intent: 'customer_history',
      examples: [
        'Historico do cliente X',
        'O que o cliente comprou?',
        'Pedidos do cliente',
      ],
      strategy: 'Buscar cliente e listar pedidos por customerId',
      toolsNeeded: ['sales_list_customers', 'sales_list_orders'],
    },
    {
      intent: 'top_products',
      examples: [
        'Produtos mais vendidos',
        'O que mais vende?',
        'Ranking de vendas',
      ],
      strategy: 'Analisar itens de pedidos e agregar por produto',
      toolsNeeded: ['sales_list_orders'],
    },
  ],
};

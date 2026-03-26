import type { ToolDefinition } from '@/services/ai-tools/tool-types';

export function getSalesTools(): ToolDefinition[] {
  return [
    // =========================================================
    // QUERY TOOLS (8)
    // =========================================================
    {
      name: 'sales_list_customers',
      description:
        'Lista clientes cadastrados com filtros opcionais por tipo ou status',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['INDIVIDUAL', 'BUSINESS'],
            description:
              'Filtrar por tipo de cliente (pessoa física ou jurídica)',
          },
          isActive: {
            type: 'boolean',
            description: 'Filtrar por clientes ativos ou inativos',
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
      module: 'sales',
      permission: 'sales.customers.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'sales_get_customer',
      description:
        'Obtém os detalhes completos de um cliente específico pelo ID',
      parameters: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: 'ID do cliente' },
        },
        required: ['customerId'],
      },
      module: 'sales',
      permission: 'sales.customers.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'sales_list_orders',
      description:
        'Lista pedidos de venda com filtros por tipo, canal, cliente ou estágio',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Busca por número do pedido ou nome do cliente',
          },
          type: {
            type: 'string',
            enum: ['QUOTE', 'ORDER'],
            description: 'Filtrar por tipo (orçamento ou pedido)',
          },
          channel: {
            type: 'string',
            enum: [
              'PDV',
              'WEB',
              'WHATSAPP',
              'MARKETPLACE',
              'BID',
              'MANUAL',
              'API',
            ],
            description: 'Filtrar por canal de venda',
          },
          customerId: {
            type: 'string',
            description: 'Filtrar por cliente (ID)',
          },
          stageId: {
            type: 'string',
            description: 'Filtrar por estágio do pipeline (ID)',
          },
          pipelineId: {
            type: 'string',
            description: 'Filtrar por pipeline (ID)',
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
      module: 'sales',
      permission: 'sales.orders.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'sales_get_order',
      description:
        'Obtém os detalhes completos de um pedido específico com seus itens',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'ID do pedido' },
        },
        required: ['orderId'],
      },
      module: 'sales',
      permission: 'sales.orders.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'sales_list_reservations',
      description:
        'Lista reservas de itens de estoque com filtros por item ou usuário',
      parameters: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string',
            description: 'Filtrar por item de estoque (ID)',
          },
          userId: {
            type: 'string',
            description: 'Filtrar por usuário que reservou (ID)',
          },
          activeOnly: {
            type: 'boolean',
            description: 'Exibir apenas reservas ativas (padrão: true)',
          },
        },
      },
      module: 'sales',
      permission: 'sales.orders.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'sales_list_promotions',
      description:
        'Lista promoções de variantes com filtros por variante ou status',
      parameters: {
        type: 'object',
        properties: {
          variantId: {
            type: 'string',
            description: 'Filtrar por variante (ID)',
          },
          activeOnly: {
            type: 'boolean',
            description: 'Exibir apenas promoções ativas (padrão: false)',
          },
        },
      },
      module: 'sales',
      permission: 'sales.promotions.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'sales_get_promotion',
      description: 'Obtém os detalhes de uma promoção específica pelo ID',
      parameters: {
        type: 'object',
        properties: {
          promotionId: { type: 'string', description: 'ID da promoção' },
        },
        required: ['promotionId'],
      },
      module: 'sales',
      permission: 'sales.promotions.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'sales_list_coupons',
      description: 'Lista cupons de desconto com filtros por status ou código',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Busca por código ou descrição do cupom',
          },
          isActive: {
            type: 'boolean',
            description: 'Filtrar por cupons ativos ou inativos',
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
      module: 'sales',
      permission: 'sales.promotions.access',
      requiresConfirmation: false,
      category: 'query',
    },

    // =========================================================
    // ACTION TOOLS (10)
    // =========================================================
    {
      name: 'sales_create_customer',
      description: 'Cadastra um novo cliente (pessoa física ou jurídica)',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Nome completo ou razão social',
          },
          type: {
            type: 'string',
            enum: ['INDIVIDUAL', 'BUSINESS'],
            description: 'Tipo: INDIVIDUAL (PF) ou BUSINESS (PJ)',
          },
          document: {
            type: 'string',
            description: 'CPF ou CNPJ (apenas dígitos)',
          },
          email: { type: 'string', description: 'E-mail do cliente' },
          phone: { type: 'string', description: 'Telefone do cliente' },
          address: { type: 'string', description: 'Endereço completo' },
          city: { type: 'string', description: 'Cidade' },
          state: {
            type: 'string',
            description: 'UF do estado (2 caracteres, ex: SP)',
          },
          zipCode: { type: 'string', description: 'CEP' },
          notes: { type: 'string', description: 'Observações sobre o cliente' },
        },
        required: ['name', 'type'],
      },
      module: 'sales',
      permission: 'sales.customers.register',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'sales_update_customer',
      description: 'Atualiza os dados de um cliente existente',
      parameters: {
        type: 'object',
        properties: {
          customerId: {
            type: 'string',
            description: 'ID do cliente a atualizar',
          },
          name: { type: 'string', description: 'Novo nome do cliente' },
          type: {
            type: 'string',
            enum: ['INDIVIDUAL', 'BUSINESS'],
            description: 'Novo tipo de cliente',
          },
          document: { type: 'string', description: 'Novo CPF ou CNPJ' },
          email: { type: 'string', description: 'Novo e-mail' },
          phone: { type: 'string', description: 'Novo telefone' },
          address: { type: 'string', description: 'Novo endereço' },
          city: { type: 'string', description: 'Nova cidade' },
          state: { type: 'string', description: 'Nova UF (2 caracteres)' },
          zipCode: { type: 'string', description: 'Novo CEP' },
          notes: { type: 'string', description: 'Novas observações' },
          isActive: {
            type: 'boolean',
            description: 'Ativar ou desativar o cliente',
          },
        },
        required: ['customerId'],
      },
      module: 'sales',
      permission: 'sales.customers.modify',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'sales_create_order',
      description: 'Cria um novo pedido ou orçamento de venda com itens',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['QUOTE', 'ORDER'],
            description: 'Tipo: QUOTE (orçamento) ou ORDER (pedido)',
          },
          customerId: {
            type: 'string',
            description: 'ID do cliente',
          },
          pipelineId: {
            type: 'string',
            description: 'ID do pipeline de vendas',
          },
          stageId: {
            type: 'string',
            description: 'ID do estágio inicial no pipeline',
          },
          channel: {
            type: 'string',
            enum: [
              'PDV',
              'WEB',
              'WHATSAPP',
              'MARKETPLACE',
              'BID',
              'MANUAL',
              'API',
            ],
            description: 'Canal de venda (padrão: MANUAL)',
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                variantId: {
                  type: 'string',
                  description: 'ID da variante do produto',
                },
                name: { type: 'string', description: 'Nome do item' },
                quantity: {
                  type: 'number',
                  description: 'Quantidade',
                },
                unitPrice: {
                  type: 'number',
                  description: 'Preço unitário',
                },
                discountPercent: {
                  type: 'number',
                  description: 'Percentual de desconto (0-100)',
                },
                discountValue: {
                  type: 'number',
                  description: 'Valor fixo de desconto',
                },
              },
              required: ['name', 'quantity', 'unitPrice'],
            },
            description: 'Itens do pedido',
          },
          notes: {
            type: 'string',
            description: 'Observações do pedido',
          },
          sourceWarehouseId: {
            type: 'string',
            description: 'ID do armazém de origem',
          },
          deliveryMethod: {
            type: 'string',
            enum: ['PICKUP', 'OWN_FLEET', 'CARRIER', 'PARTIAL'],
            description: 'Método de entrega',
          },
        },
        required: ['type', 'customerId', 'pipelineId', 'stageId', 'items'],
      },
      module: 'sales',
      permission: 'sales.orders.register',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'sales_confirm_order',
      description:
        'Confirma um pedido que está em rascunho ou aguardando aprovação, avançando para o estágio APPROVED',
      parameters: {
        type: 'object',
        properties: {
          orderId: {
            type: 'string',
            description: 'ID do pedido a confirmar',
          },
        },
        required: ['orderId'],
      },
      module: 'sales',
      permission: 'sales.orders.confirm',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'sales_cancel_order',
      description:
        'Cancela um pedido em qualquer estágio (exceto já concluído ou cancelado)',
      parameters: {
        type: 'object',
        properties: {
          orderId: {
            type: 'string',
            description: 'ID do pedido a cancelar',
          },
          reason: {
            type: 'string',
            description: 'Motivo do cancelamento',
          },
        },
        required: ['orderId'],
      },
      module: 'sales',
      permission: 'sales.orders.cancel',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'sales_create_reservation',
      description:
        'Cria uma reserva de item de estoque para um cliente ou pedido',
      parameters: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string',
            description: 'ID do item de estoque a reservar',
          },
          quantity: {
            type: 'number',
            description: 'Quantidade a reservar',
          },
          reason: {
            type: 'string',
            description: 'Motivo da reserva (ex: pedido, separação)',
          },
          reference: {
            type: 'string',
            description: 'Referência externa (ex: número do pedido)',
          },
          expiresInHours: {
            type: 'number',
            description: 'Duração da reserva em horas (padrão: 24)',
          },
        },
        required: ['itemId', 'quantity'],
      },
      module: 'sales',
      permission: 'sales.orders.register',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'sales_release_reservation',
      description:
        'Libera (cancela) uma reserva de item de estoque, devolvendo a quantidade ao estoque disponível',
      parameters: {
        type: 'object',
        properties: {
          reservationId: {
            type: 'string',
            description: 'ID da reserva a liberar',
          },
        },
        required: ['reservationId'],
      },
      module: 'sales',
      permission: 'sales.orders.cancel',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'sales_create_promotion',
      description:
        'Cria uma nova promoção de desconto para uma variante de produto',
      parameters: {
        type: 'object',
        properties: {
          variantId: {
            type: 'string',
            description: 'ID da variante que receberá a promoção',
          },
          name: {
            type: 'string',
            description: 'Nome da promoção',
          },
          discountType: {
            type: 'string',
            enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
            description: 'Tipo de desconto: percentual ou valor fixo',
          },
          discountValue: {
            type: 'number',
            description: 'Valor do desconto (% ou R$)',
          },
          startDate: {
            type: 'string',
            description: 'Data de início (ISO 8601)',
          },
          endDate: {
            type: 'string',
            description: 'Data de término (ISO 8601)',
          },
          notes: {
            type: 'string',
            description: 'Observações sobre a promoção',
          },
        },
        required: [
          'variantId',
          'name',
          'discountType',
          'discountValue',
          'startDate',
          'endDate',
        ],
      },
      module: 'sales',
      permission: 'sales.promotions.register',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'sales_create_coupon',
      description: 'Cria um novo cupom de desconto com código e regras de uso',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Código do cupom (será convertido em maiúsculas)',
          },
          description: {
            type: 'string',
            description: 'Descrição do cupom',
          },
          discountType: {
            type: 'string',
            enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'],
            description: 'Tipo de desconto',
          },
          discountValue: {
            type: 'number',
            description: 'Valor do desconto (% ou R$)',
          },
          applicableTo: {
            type: 'string',
            enum: [
              'ALL',
              'SPECIFIC_PRODUCTS',
              'SPECIFIC_CATEGORIES',
              'SPECIFIC_CUSTOMERS',
            ],
            description: 'Aplicabilidade do cupom',
          },
          minOrderValue: {
            type: 'number',
            description: 'Valor mínimo do pedido para aplicar o cupom',
          },
          maxDiscountAmount: {
            type: 'number',
            description: 'Valor máximo de desconto (para cupons percentuais)',
          },
          maxUsageTotal: {
            type: 'number',
            description: 'Limite total de usos do cupom',
          },
          maxUsagePerCustomer: {
            type: 'number',
            description: 'Limite de usos por cliente',
          },
          startDate: {
            type: 'string',
            description: 'Data de início da validade (ISO 8601)',
          },
          endDate: {
            type: 'string',
            description: 'Data de término da validade (ISO 8601)',
          },
        },
        required: ['code', 'discountType', 'discountValue', 'applicableTo'],
      },
      module: 'sales',
      permission: 'sales.promotions.register',
      requiresConfirmation: false,
      category: 'action',
    },

    // =========================================================
    // ANALYSIS TOOLS (1)
    // =========================================================
    {
      name: 'sales_analyze_bid_competition',
      description:
        'Analisa uma licitacao/edital e sugere estrategia de precos com base nos itens do estoque e historico de pedidos',
      parameters: {
        type: 'object',
        properties: {
          orderId: {
            type: 'string',
            description: 'ID do pedido de licitacao (canal BID) para analisar',
          },
        },
        required: ['orderId'],
      },
      module: 'sales',
      permission: 'sales.orders.access',
      requiresConfirmation: false,
      category: 'query',
    },

    // =========================================================
    // REPORT TOOLS (4)
    // =========================================================
    {
      name: 'sales_summary',
      description:
        'Gera um resumo geral de vendas com totais de clientes, pedidos, receita e promoções ativas',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['QUOTE', 'ORDER'],
            description: 'Filtrar por tipo de pedido',
          },
        },
      },
      module: 'sales',
      permission: 'sales.orders.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'sales_top_customers',
      description: 'Relatório dos clientes com maior volume de pedidos',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Número de clientes a listar (padrão 10)',
          },
        },
      },
      module: 'sales',
      permission: 'sales.orders.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'sales_revenue_report',
      description:
        'Relatório de receita por período com totais de pedidos, valores e ticket médio',
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
          channel: {
            type: 'string',
            enum: [
              'PDV',
              'WEB',
              'WHATSAPP',
              'MARKETPLACE',
              'BID',
              'MANUAL',
              'API',
            ],
            description: 'Filtrar por canal de venda',
          },
        },
        required: ['startDate', 'endDate'],
      },
      module: 'sales',
      permission: 'sales.orders.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'sales_active_promotions',
      description:
        'Relatório de promoções e cupons ativos com detalhes de descontos e validade',
      parameters: {
        type: 'object',
        properties: {},
      },
      module: 'sales',
      permission: 'sales.promotions.access',
      requiresConfirmation: false,
      category: 'report',
    },
  ];
}

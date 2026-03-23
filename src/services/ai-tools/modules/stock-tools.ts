import type { ToolDefinition } from '@/services/ai-tools/tool-types';

export function getStockTools(): ToolDefinition[] {
  return [
    // =========================================================
    // QUERY TOOLS (16)
    // =========================================================
    {
      name: 'stock_list_products',
      description:
        'Lista produtos cadastrados com filtros opcionais por nome, status ou categoria',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Busca por nome do produto' },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'],
            description: 'Filtrar por status',
          },
          categoryId: {
            type: 'string',
            description: 'Filtrar por categoria (ID)',
          },
          manufacturerId: {
            type: 'string',
            description: 'Filtrar por fabricante (ID)',
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
      module: 'stock',
      permission: 'stock.products.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_get_product',
      description:
        'Obtém os detalhes completos de um produto específico pelo ID ou nome',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'ID do produto' },
          name: {
            type: 'string',
            description: 'Nome do produto (busca exata ou parcial)',
          },
        },
      },
      module: 'stock',
      permission: 'stock.products.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_count_products',
      description:
        'Conta o total de produtos cadastrados, opcionalmente filtrado por status ou categoria',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'],
            description: 'Filtrar por status',
          },
          categoryId: {
            type: 'string',
            description: 'Filtrar por categoria (ID)',
          },
        },
      },
      module: 'stock',
      permission: 'stock.products.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_list_variants',
      description:
        'Lista variantes de produtos com filtros opcionais por produto ou atributos',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'Filtrar por produto (ID)',
          },
          search: {
            type: 'string',
            description: 'Busca por nome ou SKU da variante',
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
      module: 'stock',
      permission: 'stock.variants.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_list_items',
      description:
        'Lista itens de estoque com filtros opcionais por produto, variante, armazém ou status',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'Filtrar por produto (ID)',
          },
          variantId: {
            type: 'string',
            description: 'Filtrar por variante (ID)',
          },
          warehouseId: {
            type: 'string',
            description: 'Filtrar por armazém (ID)',
          },
          status: {
            type: 'string',
            enum: ['AVAILABLE', 'RESERVED', 'QUARANTINE', 'DAMAGED', 'SOLD'],
            description: 'Filtrar por status do item',
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
      module: 'stock',
      permission: 'stock.items.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_list_categories',
      description: 'Lista categorias de produtos cadastradas',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Busca por nome da categoria',
          },
          parentId: {
            type: 'string',
            description: 'Filtrar por categoria pai (ID)',
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
      module: 'stock',
      permission: 'stock.categories.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_list_templates',
      description: 'Lista templates de produtos cadastrados',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Busca por nome do template' },
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
      module: 'stock',
      permission: 'stock.templates.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_list_suppliers',
      description:
        'Lista fornecedores cadastrados com filtros opcionais por nome ou status',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Busca por nome ou CNPJ do fornecedor',
          },
          active: {
            type: 'boolean',
            description: 'Filtrar por fornecedores ativos ou inativos',
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
      module: 'stock',
      permission: 'stock.products.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_list_manufacturers',
      description:
        'Lista fabricantes cadastrados com filtros opcionais por nome',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Busca por nome do fabricante',
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
      module: 'stock',
      permission: 'stock.manufacturers.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_list_tags',
      description: 'Lista tags de produtos cadastradas',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Busca por nome da tag' },
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
      module: 'stock',
      permission: 'stock.products.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_list_warehouses',
      description: 'Lista armazéns cadastrados com suas zonas e capacidades',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Busca por nome do armazém' },
          active: {
            type: 'boolean',
            description: 'Filtrar por armazéns ativos ou inativos',
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
      module: 'stock',
      permission: 'stock.warehouses.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_list_zones',
      description: 'Lista zonas de armazém com filtro opcional por armazém',
      parameters: {
        type: 'object',
        properties: {
          warehouseId: {
            type: 'string',
            description: 'Filtrar por armazém (ID)',
          },
          search: { type: 'string', description: 'Busca por nome da zona' },
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
      module: 'stock',
      permission: 'stock.warehouses.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_list_bins',
      description:
        'Lista posições (bins) de armazenamento com filtros por zona ou armazém',
      parameters: {
        type: 'object',
        properties: {
          warehouseId: {
            type: 'string',
            description: 'Filtrar por armazém (ID)',
          },
          zoneId: { type: 'string', description: 'Filtrar por zona (ID)' },
          search: {
            type: 'string',
            description: 'Busca por código ou nome do bin',
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
      module: 'stock',
      permission: 'stock.warehouses.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_list_movements',
      description:
        'Lista movimentações de estoque com filtros por tipo, produto, armazém ou período',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['ENTRY', 'EXIT', 'TRANSFER', 'ADJUSTMENT', 'RETURN'],
            description: 'Tipo de movimentação',
          },
          productId: {
            type: 'string',
            description: 'Filtrar por produto (ID)',
          },
          warehouseId: {
            type: 'string',
            description: 'Filtrar por armazém (ID)',
          },
          startDate: {
            type: 'string',
            description: 'Data inicial (ISO 8601, ex: 2026-01-01)',
          },
          endDate: {
            type: 'string',
            description: 'Data final (ISO 8601, ex: 2026-12-31)',
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
      module: 'stock',
      permission: 'stock.items.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_list_purchase_orders',
      description:
        'Lista ordens de compra com filtros por status, fornecedor ou período',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: [
              'DRAFT',
              'PENDING',
              'APPROVED',
              'ORDERED',
              'PARTIAL',
              'RECEIVED',
              'CANCELLED',
            ],
            description: 'Filtrar por status da ordem de compra',
          },
          supplierId: {
            type: 'string',
            description: 'Filtrar por fornecedor (ID)',
          },
          startDate: { type: 'string', description: 'Data inicial (ISO 8601)' },
          endDate: { type: 'string', description: 'Data final (ISO 8601)' },
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
      module: 'stock',
      permission: 'stock.purchase-orders.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'stock_get_item_location',
      description:
        'Obtém a localização atual de um item de estoque específico no armazém',
      parameters: {
        type: 'object',
        properties: {
          itemId: { type: 'string', description: 'ID do item de estoque' },
          sku: { type: 'string', description: 'SKU do item ou variante' },
        },
      },
      module: 'stock',
      permission: 'stock.items.access',
      requiresConfirmation: false,
      category: 'query',
    },

    // =========================================================
    // ACTION TOOLS (13)
    // =========================================================
    {
      name: 'stock_create_product',
      description: 'Cria um novo produto no catálogo de estoque',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome do produto' },
          description: { type: 'string', description: 'Descrição do produto' },
          categoryId: { type: 'string', description: 'ID da categoria' },
          manufacturerId: { type: 'string', description: 'ID do fabricante' },
          templateId: {
            type: 'string',
            description: 'ID do template de produto',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'],
            description: 'Status inicial do produto (padrão: ACTIVE)',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Lista de IDs de tags a associar',
          },
        },
        required: ['name'],
      },
      module: 'stock',
      permission: 'stock.products.register',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'stock_update_product',
      description: 'Atualiza os dados de um produto existente',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'ID do produto a atualizar',
          },
          name: { type: 'string', description: 'Novo nome do produto' },
          description: {
            type: 'string',
            description: 'Nova descrição do produto',
          },
          categoryId: { type: 'string', description: 'Novo ID de categoria' },
          manufacturerId: {
            type: 'string',
            description: 'Novo ID de fabricante',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'],
            description: 'Novo status do produto',
          },
        },
        required: ['productId'],
      },
      module: 'stock',
      permission: 'stock.products.modify',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'stock_create_variant',
      description: 'Cria uma nova variante para um produto existente',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'ID do produto pai' },
          name: { type: 'string', description: 'Nome da variante' },
          sku: { type: 'string', description: 'SKU único da variante' },
          price: { type: 'number', description: 'Preço de venda da variante' },
          costPrice: {
            type: 'number',
            description: 'Preço de custo da variante',
          },
          weight: { type: 'number', description: 'Peso em gramas' },
          attributes: {
            type: 'object',
            description:
              'Atributos da variante (ex: {"cor": "azul", "tamanho": "M"})',
          },
        },
        required: ['productId', 'name'],
      },
      module: 'stock',
      permission: 'stock.variants.register',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'stock_update_variant',
      description: 'Atualiza os dados de uma variante existente',
      parameters: {
        type: 'object',
        properties: {
          variantId: {
            type: 'string',
            description: 'ID da variante a atualizar',
          },
          name: { type: 'string', description: 'Novo nome da variante' },
          sku: { type: 'string', description: 'Novo SKU da variante' },
          price: { type: 'number', description: 'Novo preço de venda' },
          costPrice: { type: 'number', description: 'Novo preço de custo' },
          weight: { type: 'number', description: 'Novo peso em gramas' },
        },
        required: ['variantId'],
      },
      module: 'stock',
      permission: 'stock.variants.modify',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'stock_register_entry',
      description:
        'Registra uma entrada de estoque (recebimento de mercadoria)',
      parameters: {
        type: 'object',
        properties: {
          variantId: {
            type: 'string',
            description: 'ID da variante do produto',
          },
          warehouseId: {
            type: 'string',
            description: 'ID do armazém de destino',
          },
          quantity: {
            type: 'number',
            description: 'Quantidade a ser recebida',
          },
          unitCost: {
            type: 'number',
            description: 'Custo unitário da entrada',
          },
          supplierId: {
            type: 'string',
            description: 'ID do fornecedor (opcional)',
          },
          purchaseOrderId: {
            type: 'string',
            description: 'ID da ordem de compra relacionada (opcional)',
          },
          notes: { type: 'string', description: 'Observações sobre a entrada' },
          binId: {
            type: 'string',
            description: 'ID do bin de destino (opcional)',
          },
        },
        required: ['variantId', 'warehouseId', 'quantity'],
      },
      module: 'stock',
      permission: 'stock.items.admin',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'stock_register_exit',
      description:
        'Registra uma saída de estoque (consumo, descarte ou venda manual)',
      parameters: {
        type: 'object',
        properties: {
          variantId: {
            type: 'string',
            description: 'ID da variante do produto',
          },
          warehouseId: {
            type: 'string',
            description: 'ID do armazém de origem',
          },
          quantity: {
            type: 'number',
            description: 'Quantidade a ser retirada',
          },
          reason: {
            type: 'string',
            enum: [
              'SALE',
              'LOSS',
              'DAMAGE',
              'CONSUMPTION',
              'RETURN_TO_SUPPLIER',
              'OTHER',
            ],
            description: 'Motivo da saída',
          },
          notes: { type: 'string', description: 'Observações sobre a saída' },
        },
        required: ['variantId', 'warehouseId', 'quantity', 'reason'],
      },
      module: 'stock',
      permission: 'stock.items.admin',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'stock_transfer_item',
      description: 'Transfere um ou mais itens de um armazém ou bin para outro',
      parameters: {
        type: 'object',
        properties: {
          variantId: {
            type: 'string',
            description: 'ID da variante a transferir',
          },
          fromWarehouseId: {
            type: 'string',
            description: 'ID do armazém de origem',
          },
          toWarehouseId: {
            type: 'string',
            description: 'ID do armazém de destino',
          },
          fromBinId: {
            type: 'string',
            description: 'ID do bin de origem (opcional)',
          },
          toBinId: {
            type: 'string',
            description: 'ID do bin de destino (opcional)',
          },
          quantity: { type: 'number', description: 'Quantidade a transferir' },
          notes: {
            type: 'string',
            description: 'Observações sobre a transferência',
          },
        },
        required: ['variantId', 'fromWarehouseId', 'toWarehouseId', 'quantity'],
      },
      module: 'stock',
      permission: 'stock.items.admin',
      requiresConfirmation: true,
      category: 'action',
    },
    {
      name: 'stock_create_category',
      description: 'Cria uma nova categoria de produtos',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome da categoria' },
          description: {
            type: 'string',
            description: 'Descrição da categoria',
          },
          parentId: {
            type: 'string',
            description: 'ID da categoria pai (para subcategorias)',
          },
          color: {
            type: 'string',
            description: 'Cor da categoria em hexadecimal (ex: #3B82F6)',
          },
        },
        required: ['name'],
      },
      module: 'stock',
      permission: 'stock.categories.register',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'stock_create_template',
      description: 'Cria um novo template de produto para padronizar atributos',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome do template' },
          description: { type: 'string', description: 'Descrição do template' },
          attributes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Nome do atributo' },
                type: {
                  type: 'string',
                  enum: ['TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTISELECT'],
                  description: 'Tipo do atributo',
                },
                required: {
                  type: 'boolean',
                  description: 'Se o atributo é obrigatório',
                },
                options: {
                  type: 'array',
                  items: { type: 'string' },
                  description:
                    'Opções para atributos do tipo SELECT ou MULTISELECT',
                },
              },
            },
            description: 'Lista de atributos do template',
          },
        },
        required: ['name'],
      },
      module: 'stock',
      permission: 'stock.templates.register',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'stock_create_supplier',
      description: 'Cadastra um novo fornecedor',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Razão social ou nome do fornecedor',
          },
          tradeName: {
            type: 'string',
            description: 'Nome fantasia do fornecedor',
          },
          cnpj: {
            type: 'string',
            description: 'CNPJ do fornecedor (apenas dígitos)',
          },
          email: {
            type: 'string',
            description: 'E-mail de contato do fornecedor',
          },
          phone: {
            type: 'string',
            description: 'Telefone de contato do fornecedor',
          },
          notes: {
            type: 'string',
            description: 'Observações sobre o fornecedor',
          },
        },
        required: ['name'],
      },
      module: 'stock',
      permission: 'stock.products.admin',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'stock_create_manufacturer',
      description: 'Cadastra um novo fabricante de produtos',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome do fabricante' },
          country: {
            type: 'string',
            description: 'País de origem do fabricante',
          },
          website: { type: 'string', description: 'Site do fabricante' },
          notes: {
            type: 'string',
            description: 'Observações sobre o fabricante',
          },
        },
        required: ['name'],
      },
      module: 'stock',
      permission: 'stock.manufacturers.register',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'stock_create_purchase_order',
      description: 'Cria uma nova ordem de compra para reposição de estoque',
      parameters: {
        type: 'object',
        properties: {
          supplierId: { type: 'string', description: 'ID do fornecedor' },
          expectedDate: {
            type: 'string',
            description: 'Data prevista de entrega (ISO 8601)',
          },
          notes: {
            type: 'string',
            description: 'Observações sobre a ordem de compra',
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                variantId: { type: 'string', description: 'ID da variante' },
                quantity: {
                  type: 'number',
                  description: 'Quantidade a comprar',
                },
                unitCost: {
                  type: 'number',
                  description: 'Custo unitário negociado',
                },
              },
              required: ['variantId', 'quantity'],
            },
            description: 'Itens da ordem de compra',
          },
        },
        required: ['supplierId', 'items'],
      },
      module: 'stock',
      permission: 'stock.purchase-orders.register',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'stock_create_tag',
      description: 'Cria uma nova tag para classificação de produtos',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome da tag' },
          color: {
            type: 'string',
            description: 'Cor da tag em hexadecimal (ex: #10B981)',
          },
        },
        required: ['name'],
      },
      module: 'stock',
      permission: 'stock.products.admin',
      requiresConfirmation: false,
      category: 'action',
    },

    // =========================================================
    // REPORT TOOLS (4)
    // =========================================================
    {
      name: 'stock_summary',
      description:
        'Gera um resumo geral do estoque com totais por armazém, valor total e alertas de estoque',
      parameters: {
        type: 'object',
        properties: {
          warehouseId: {
            type: 'string',
            description: 'Filtrar por armazém específico (ID)',
          },
          categoryId: {
            type: 'string',
            description: 'Filtrar por categoria específica (ID)',
          },
        },
      },
      module: 'stock',
      permission: 'stock.items.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'stock_low_stock_report',
      description:
        'Relatório de produtos com estoque abaixo do mínimo configurado ou com risco de ruptura',
      parameters: {
        type: 'object',
        properties: {
          warehouseId: {
            type: 'string',
            description: 'Filtrar por armazém (ID)',
          },
          categoryId: {
            type: 'string',
            description: 'Filtrar por categoria (ID)',
          },
          threshold: {
            type: 'number',
            description:
              'Quantidade mínima para alertar (padrão: usar mínimo do produto)',
          },
          limit: {
            type: 'number',
            description: 'Máximo de resultados (padrão 20)',
          },
        },
      },
      module: 'stock',
      permission: 'stock.items.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'stock_movement_report',
      description:
        'Relatório de movimentações de estoque em um período, com totais por tipo e produto',
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
          warehouseId: {
            type: 'string',
            description: 'Filtrar por armazém (ID)',
          },
          productId: {
            type: 'string',
            description: 'Filtrar por produto (ID)',
          },
          type: {
            type: 'string',
            enum: ['ENTRY', 'EXIT', 'TRANSFER', 'ADJUSTMENT', 'RETURN'],
            description: 'Filtrar por tipo de movimentação',
          },
        },
        required: ['startDate', 'endDate'],
      },
      module: 'stock',
      permission: 'stock.items.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'stock_valuation_report',
      description:
        'Relatório de valorização do estoque com custo médio ponderado e valor total por produto',
      parameters: {
        type: 'object',
        properties: {
          warehouseId: {
            type: 'string',
            description: 'Filtrar por armazém (ID)',
          },
          categoryId: {
            type: 'string',
            description: 'Filtrar por categoria (ID)',
          },
          referenceDate: {
            type: 'string',
            description:
              'Data de referência para o cálculo (ISO 8601, padrão: hoje)',
          },
        },
      },
      module: 'stock',
      permission: 'stock.items.access',
      requiresConfirmation: false,
      category: 'report',
    },

    // =========================================================
    // SYSTEM TOOLS (3)
    // =========================================================
    {
      name: 'confirm_pending_action',
      description:
        'Confirma uma ação pendente que aguarda aprovação do usuário antes de ser executada',
      parameters: {
        type: 'object',
        properties: {
          actionId: {
            type: 'string',
            description: 'ID da ação pendente a confirmar',
          },
        },
        required: ['actionId'],
      },
      module: 'system',
      permission: '',
      requiresConfirmation: false,
      category: 'system',
    },
    {
      name: 'cancel_pending_action',
      description:
        'Cancela uma ação pendente que aguarda aprovação, descartando a operação',
      parameters: {
        type: 'object',
        properties: {
          actionId: {
            type: 'string',
            description: 'ID da ação pendente a cancelar',
          },
        },
        required: ['actionId'],
      },
      module: 'system',
      permission: '',
      requiresConfirmation: false,
      category: 'system',
    },
    {
      name: 'undo_last_action',
      description:
        'Desfaz a última ação executada na sessão atual, se possível',
      parameters: {
        type: 'object',
        properties: {
          conversationId: {
            type: 'string',
            description: 'ID da conversa (preenchido automaticamente)',
          },
        },
      },
      module: 'system',
      permission: '',
      requiresConfirmation: false,
      category: 'system',
    },
  ];
}

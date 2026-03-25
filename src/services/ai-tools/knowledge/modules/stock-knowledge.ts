import type { ModuleKnowledge } from '../module-knowledge.interface';

export const stockKnowledge: ModuleKnowledge = {
  module: 'stock',
  displayName: 'Estoque',
  description:
    'Gerencia produtos, variantes, itens fisicos, armazens, fornecedores, fabricantes, categorias, templates de atributos, tags, ordens de compra e volumes de envio.',
  version: '1.0.0',

  // ================================================================
  // ENTITIES
  // ================================================================
  entities: [
    {
      name: 'Template',
      displayName: 'Template',
      description:
        'Define a estrutura de atributos customizados para produtos, variantes e itens. Possui codigo de 3 digitos e unidade de medida padrao.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome do template',
          example: 'Camiseta',
        },
        {
          name: 'unitOfMeasure',
          displayName: 'Unidade de Medida',
          type: 'enum',
          required: false,
          description: 'Unidade de medida padrao',
          enumValues: [
            'UNITS',
            'METERS',
            'KILOGRAMS',
            'GRAMS',
            'LITERS',
            'MILLILITERS',
            'SQUARE_METERS',
            'PAIRS',
            'BOXES',
            'PACKS',
          ],
          defaultValue: 'UNITS',
        },
        {
          name: 'code',
          displayName: 'Codigo',
          type: 'string',
          required: false,
          description: 'Codigo de 3 digitos gerado automaticamente',
          example: '001',
        },
        {
          name: 'attributes',
          displayName: 'Atributos',
          type: 'array',
          required: false,
          description:
            'Lista de atributos customizados (tipo: TEXT, NUMBER, BOOLEAN, SELECT, MULTISELECT)',
        },
      ],
      relationships: [
        {
          entity: 'Product',
          type: 'has_many',
          description: 'Um template define a estrutura de muitos produtos',
          required: false,
        },
      ],
      validations: [
        'Nome e obrigatorio',
        'Codigo de 3 digitos e gerado automaticamente e imutavel',
        'Unidade de medida padrao: UNITS',
      ],
    },
    {
      name: 'Product',
      displayName: 'Produto',
      description:
        'Produto no catalogo. Vinculado a um Template obrigatorio, e opcionalmente a Manufacturer, Supplier e Organization.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome do produto',
          example: 'Camiseta Basica',
        },
        {
          name: 'templateId',
          displayName: 'Template',
          type: 'relation',
          required: true,
          description: 'Template que define os atributos do produto',
        },
        {
          name: 'status',
          displayName: 'Status',
          type: 'enum',
          required: false,
          description: 'Status do produto',
          enumValues: [
            'DRAFT',
            'ACTIVE',
            'INACTIVE',
            'OUT_OF_STOCK',
            'DISCONTINUED',
          ],
          defaultValue: 'DRAFT',
        },
        {
          name: 'description',
          displayName: 'Descricao',
          type: 'string',
          required: false,
          description: 'Descricao do produto',
        },
        {
          name: 'categoryId',
          displayName: 'Categoria',
          type: 'relation',
          required: false,
          description: 'Categoria do produto',
        },
        {
          name: 'manufacturerId',
          displayName: 'Fabricante',
          type: 'relation',
          required: false,
          description: 'Fabricante do produto',
        },
        {
          name: 'fullCode',
          displayName: 'Codigo Completo',
          type: 'string',
          required: false,
          description:
            'Codigo hierarquico TEMPLATE.MANUFACTURER.PRODUTO (gerado automaticamente)',
          example: '001.001.0001',
        },
      ],
      statusFlow: {
        statuses: [
          'DRAFT',
          'ACTIVE',
          'INACTIVE',
          'OUT_OF_STOCK',
          'DISCONTINUED',
        ],
        transitions: {
          DRAFT: ['ACTIVE', 'DISCONTINUED'],
          ACTIVE: ['INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'],
          INACTIVE: ['ACTIVE', 'DISCONTINUED'],
          OUT_OF_STOCK: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
        },
        initialStatus: 'DRAFT',
        terminalStatuses: ['DISCONTINUED'],
      },
      relationships: [
        {
          entity: 'Template',
          type: 'belongs_to',
          description: 'Todo produto pertence a um template',
          required: true,
        },
        {
          entity: 'Variant',
          type: 'has_many',
          description: 'Um produto possui varias variantes',
          required: false,
        },
        {
          entity: 'Category',
          type: 'many_to_many',
          description: 'Produtos sao organizados em categorias',
          required: false,
        },
        {
          entity: 'Tag',
          type: 'many_to_many',
          description: 'Produtos podem ter tags',
          required: false,
        },
        {
          entity: 'Manufacturer',
          type: 'belongs_to',
          description: 'Produto pode ter um fabricante',
          required: false,
        },
        {
          entity: 'Supplier',
          type: 'belongs_to',
          description: 'Produto pode ter um fornecedor',
          required: false,
        },
      ],
      validations: [
        'Nome e obrigatorio',
        'TemplateId e obrigatorio',
        'Somente produtos ACTIVE podem ser vendidos ou publicados',
        'Codigo hierarquico e gerado automaticamente e imutavel',
      ],
    },
    {
      name: 'Variant',
      displayName: 'Variante',
      description:
        'Variacao de um Product (ex: cor, tamanho). Contem preco, custo, margem, estoque minimo/maximo e ponto de reposicao.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome da variante',
          example: 'Azul - M',
        },
        {
          name: 'productId',
          displayName: 'Produto',
          type: 'relation',
          required: true,
          description: 'Produto pai da variante',
        },
        {
          name: 'price',
          displayName: 'Preco',
          type: 'number',
          required: false,
          description: 'Preco de venda',
          defaultValue: '0',
        },
        {
          name: 'costPrice',
          displayName: 'Preco de Custo',
          type: 'number',
          required: false,
          description: 'Preco de custo',
        },
        {
          name: 'sku',
          displayName: 'SKU',
          type: 'string',
          required: false,
          description: 'SKU unico da variante',
        },
        {
          name: 'minStock',
          displayName: 'Estoque Minimo',
          type: 'number',
          required: false,
          description: 'Estoque minimo para alerta',
        },
        {
          name: 'maxStock',
          displayName: 'Estoque Maximo',
          type: 'number',
          required: false,
          description: 'Estoque maximo',
        },
      ],
      relationships: [
        {
          entity: 'Product',
          type: 'belongs_to',
          description: 'Toda variante pertence a um produto',
          required: true,
        },
        {
          entity: 'Item',
          type: 'has_many',
          description: 'Uma variante possui varias unidades fisicas',
          required: false,
        },
      ],
      validations: [
        'Nome e obrigatorio',
        'ProductId e obrigatorio',
        'Preco padrao: 0',
      ],
    },
    {
      name: 'Item',
      displayName: 'Item',
      description:
        'Unidade fisica real em estoque. Possui quantidade atual, lote, datas de fabricacao/validade e localizacao fisica (Bin).',
      fields: [
        {
          name: 'variantId',
          displayName: 'Variante',
          type: 'relation',
          required: true,
          description: 'Variante a que o item pertence',
        },
        {
          name: 'quantity',
          displayName: 'Quantidade',
          type: 'number',
          required: true,
          description: 'Quantidade atual do item',
        },
        {
          name: 'status',
          displayName: 'Status',
          type: 'enum',
          required: false,
          description: 'Status do item',
          enumValues: [
            'AVAILABLE',
            'RESERVED',
            'IN_TRANSIT',
            'DAMAGED',
            'EXPIRED',
            'DISPOSED',
          ],
          defaultValue: 'AVAILABLE',
        },
        {
          name: 'batch',
          displayName: 'Lote',
          type: 'string',
          required: false,
          description: 'Numero do lote',
        },
        {
          name: 'binId',
          displayName: 'Posicao (Bin)',
          type: 'relation',
          required: false,
          description: 'Posicao fisica no armazem',
        },
      ],
      statusFlow: {
        statuses: [
          'AVAILABLE',
          'RESERVED',
          'IN_TRANSIT',
          'DAMAGED',
          'EXPIRED',
          'DISPOSED',
        ],
        transitions: {
          AVAILABLE: ['RESERVED', 'IN_TRANSIT', 'DAMAGED', 'EXPIRED'],
          RESERVED: ['AVAILABLE', 'IN_TRANSIT'],
          IN_TRANSIT: ['AVAILABLE', 'DAMAGED'],
          DAMAGED: ['AVAILABLE', 'DISPOSED'],
          EXPIRED: ['DISPOSED'],
        },
        initialStatus: 'AVAILABLE',
        terminalStatuses: ['DISPOSED'],
      },
      relationships: [
        {
          entity: 'Variant',
          type: 'belongs_to',
          description: 'Todo item pertence a uma variante',
          required: true,
        },
        {
          entity: 'Bin',
          type: 'belongs_to',
          description: 'Item esta alocado em uma posicao',
          required: false,
        },
      ],
      validations: [
        'Somente items AVAILABLE podem ser vendidos ou reservados',
        'Items EXPIRED so podem ir para DISPOSED',
        'DISPOSED e terminal',
      ],
    },
    {
      name: 'Warehouse',
      displayName: 'Armazem',
      description: 'Armazem fisico que contem zonas e bins.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome do armazem',
        },
        {
          name: 'active',
          displayName: 'Ativo',
          type: 'boolean',
          required: false,
          description: 'Se o armazem esta ativo',
          defaultValue: 'true',
        },
      ],
      relationships: [
        {
          entity: 'Zone',
          type: 'has_many',
          description: 'Armazem contem zonas',
          required: false,
        },
      ],
      validations: ['Nome e obrigatorio'],
    },
    {
      name: 'Zone',
      displayName: 'Zona',
      description: 'Zona dentro de um armazem que contem bins.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome da zona',
        },
        {
          name: 'warehouseId',
          displayName: 'Armazem',
          type: 'relation',
          required: true,
          description: 'Armazem que contem esta zona',
        },
      ],
      relationships: [
        {
          entity: 'Warehouse',
          type: 'belongs_to',
          description: 'Zona pertence a um armazem',
          required: true,
        },
        {
          entity: 'Bin',
          type: 'has_many',
          description: 'Zona contem posicoes (bins)',
          required: false,
        },
      ],
      validations: ['Nome e obrigatorio', 'WarehouseId e obrigatorio'],
    },
    {
      name: 'Bin',
      displayName: 'Posicao (Bin)',
      description: 'Posicao fisica dentro de uma zona para alocacao de itens.',
      fields: [
        {
          name: 'code',
          displayName: 'Codigo',
          type: 'string',
          required: true,
          description: 'Codigo da posicao',
        },
        {
          name: 'zoneId',
          displayName: 'Zona',
          type: 'relation',
          required: true,
          description: 'Zona que contem esta posicao',
        },
      ],
      relationships: [
        {
          entity: 'Zone',
          type: 'belongs_to',
          description: 'Bin pertence a uma zona',
          required: true,
        },
        {
          entity: 'Item',
          type: 'has_many',
          description: 'Bin contem itens',
          required: false,
        },
      ],
      validations: ['Codigo e obrigatorio', 'ZoneId e obrigatorio'],
    },
    {
      name: 'Category',
      displayName: 'Categoria',
      description: 'Organiza produtos de forma hierarquica (N:N com Product).',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome da categoria',
        },
        {
          name: 'parentId',
          displayName: 'Categoria Pai',
          type: 'relation',
          required: false,
          description: 'Categoria pai para subcategorias',
        },
      ],
      relationships: [
        {
          entity: 'Product',
          type: 'many_to_many',
          description: 'Categorias organizam produtos',
          required: false,
        },
        {
          entity: 'Category',
          type: 'belongs_to',
          description: 'Subcategoria pertence a uma pai',
          required: false,
        },
      ],
      validations: ['Nome e obrigatorio'],
    },
    {
      name: 'Tag',
      displayName: 'Tag',
      description: 'Rotula produtos livremente (N:N com Product).',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome da tag',
        },
        {
          name: 'color',
          displayName: 'Cor',
          type: 'string',
          required: false,
          description: 'Cor em hexadecimal',
          example: '#10B981',
        },
      ],
      relationships: [
        {
          entity: 'Product',
          type: 'many_to_many',
          description: 'Tags rotulam produtos',
          required: false,
        },
      ],
      validations: ['Nome e obrigatorio'],
    },
    {
      name: 'Supplier',
      displayName: 'Fornecedor',
      description: 'Fornecedor de produtos e origem de ordens de compra.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Razao social ou nome do fornecedor',
        },
        {
          name: 'cnpj',
          displayName: 'CNPJ',
          type: 'string',
          required: false,
          description: 'CNPJ do fornecedor',
        },
        {
          name: 'email',
          displayName: 'E-mail',
          type: 'string',
          required: false,
          description: 'E-mail de contato',
        },
      ],
      relationships: [
        {
          entity: 'Product',
          type: 'has_many',
          description: 'Fornecedor fornece produtos',
          required: false,
        },
        {
          entity: 'PurchaseOrder',
          type: 'has_many',
          description: 'Fornecedor recebe ordens de compra',
          required: false,
        },
      ],
      validations: ['Nome e obrigatorio'],
    },
    {
      name: 'Manufacturer',
      displayName: 'Fabricante',
      description:
        'Fabricante de produtos. Codigo de 3 digitos gerado automaticamente.',
      fields: [
        {
          name: 'name',
          displayName: 'Nome',
          type: 'string',
          required: true,
          description: 'Nome do fabricante',
        },
        {
          name: 'code',
          displayName: 'Codigo',
          type: 'string',
          required: false,
          description: 'Codigo de 3 digitos (gerado automaticamente)',
          example: '001',
        },
      ],
      relationships: [
        {
          entity: 'Product',
          type: 'has_many',
          description: 'Fabricante produz produtos',
          required: false,
        },
      ],
      validations: [
        'Nome e obrigatorio',
        'Codigo de 3 digitos e gerado automaticamente',
      ],
    },
    {
      name: 'PurchaseOrder',
      displayName: 'Ordem de Compra',
      description:
        'Ordem de compra para reposicao de estoque junto a um fornecedor.',
      fields: [
        {
          name: 'supplierId',
          displayName: 'Fornecedor',
          type: 'relation',
          required: true,
          description: 'Fornecedor da ordem',
        },
        {
          name: 'status',
          displayName: 'Status',
          type: 'enum',
          required: false,
          description: 'Status da ordem',
          enumValues: [
            'DRAFT',
            'PENDING',
            'CONFIRMED',
            'IN_TRANSIT',
            'DELIVERED',
            'CANCELLED',
          ],
          defaultValue: 'DRAFT',
        },
        {
          name: 'items',
          displayName: 'Itens',
          type: 'array',
          required: true,
          description: 'Lista de variantes e quantidades',
        },
      ],
      statusFlow: {
        statuses: [
          'DRAFT',
          'PENDING',
          'CONFIRMED',
          'IN_TRANSIT',
          'DELIVERED',
          'CANCELLED',
        ],
        transitions: {
          DRAFT: ['PENDING', 'CANCELLED'],
          PENDING: ['CONFIRMED', 'CANCELLED'],
          CONFIRMED: ['IN_TRANSIT', 'CANCELLED'],
          IN_TRANSIT: ['DELIVERED'],
        },
        initialStatus: 'DRAFT',
        terminalStatuses: ['DELIVERED', 'CANCELLED'],
      },
      relationships: [
        {
          entity: 'Supplier',
          type: 'belongs_to',
          description: 'Ordem pertence a um fornecedor',
          required: true,
        },
      ],
      validations: ['SupplierId e obrigatorio', 'Deve ter pelo menos um item'],
    },
  ],

  // ================================================================
  // WORKFLOWS
  // ================================================================
  workflows: [
    {
      name: 'create_full_product',
      displayName: 'Criar Produto Completo',
      description:
        'Fluxo completo para criar um produto com template, variantes e itens em estoque.',
      triggers: [
        'Usuario pede para criar um produto',
        'Usuario pede para cadastrar mercadoria',
      ],
      outcomes: [
        'Produto criado com variantes e itens em estoque',
        'Produto criado parcialmente (sem variantes ou sem itens)',
      ],
      steps: [
        {
          order: 1,
          name: 'Verificar/Criar Template',
          description:
            'Verificar se existe template adequado. Se nao, criar usando preset correspondente.',
          requiredData: ['nome do tipo de produto'],
          autoActions: ['stock_list_templates', 'stock_create_template'],
          confirmActions: [],
          nextSteps: ['Verificar/Criar Entidades Auxiliares'],
          errorHandling:
            'Se nao existir preset, criar com atributos minimos razoaveis',
        },
        {
          order: 2,
          name: 'Verificar/Criar Entidades Auxiliares',
          description:
            'Verificar se fabricante e fornecedor existem. Criar se necessario.',
          requiredData: [],
          autoActions: [
            'stock_list_manufacturers',
            'stock_list_suppliers',
            'stock_create_manufacturer',
            'stock_create_supplier',
          ],
          confirmActions: [],
          nextSteps: ['Criar Produto'],
          errorHandling:
            'Entidades auxiliares sao opcionais, pular se nao necessarias',
        },
        {
          order: 3,
          name: 'Criar Produto',
          description: 'Criar o produto vinculado ao template.',
          requiredData: ['name', 'templateId'],
          autoActions: ['stock_create_product'],
          confirmActions: [],
          nextSteps: ['Criar Variantes'],
          errorHandling: 'Informar erro e pedir dados faltantes',
        },
        {
          order: 4,
          name: 'Criar Variantes',
          description: 'Criar variantes com preco e atributos.',
          requiredData: ['productId', 'name'],
          autoActions: ['stock_create_variant'],
          confirmActions: [],
          nextSteps: ['Registrar Itens em Estoque'],
          errorHandling: 'Variantes sao opcionais, pular se nao solicitadas',
        },
        {
          order: 5,
          name: 'Registrar Itens em Estoque',
          description: 'Registrar entrada de itens com localizacao no armazem.',
          requiredData: ['variantId', 'warehouseId', 'quantity'],
          autoActions: [],
          confirmActions: ['stock_register_entry'],
          nextSteps: [],
          errorHandling: 'Entrada e opcional, pular se nao solicitada',
        },
      ],
    },
    {
      name: 'receive_purchase',
      displayName: 'Recebimento de Compra',
      description:
        'Fluxo para receber mercadorias de uma ordem de compra existente.',
      triggers: [
        'Usuario informa que recebeu mercadoria',
        'Ordem de compra mudou para DELIVERED',
      ],
      outcomes: ['Itens recebidos e alocados em estoque'],
      steps: [
        {
          order: 1,
          name: 'Localizar Ordem de Compra',
          description: 'Identificar a PurchaseOrder correspondente.',
          requiredData: ['purchaseOrderId ou supplierId'],
          autoActions: ['stock_list_purchase_orders'],
          confirmActions: [],
          nextSteps: ['Registrar Recebimento'],
          errorHandling: 'Se nao encontrar, perguntar detalhes do recebimento',
        },
        {
          order: 2,
          name: 'Registrar Recebimento',
          description:
            'Registrar movimentacao PURCHASE para cada item recebido.',
          requiredData: ['variantId', 'warehouseId', 'quantity'],
          autoActions: [],
          confirmActions: ['stock_register_entry'],
          nextSteps: [],
          errorHandling: 'Informar erro e tentar itens restantes',
        },
      ],
    },
    {
      name: 'stock_inquiry',
      displayName: 'Consulta de Estoque',
      description: 'Consultar disponibilidade e localizacao de itens.',
      triggers: [
        'Usuario pergunta sobre estoque',
        'Usuario quer saber quantidade disponivel',
      ],
      outcomes: ['Informacoes de estoque apresentadas'],
      steps: [
        {
          order: 1,
          name: 'Identificar Produto',
          description: 'Buscar o produto ou variante mencionados.',
          requiredData: ['nome ou id do produto'],
          autoActions: ['stock_list_products', 'stock_get_product'],
          confirmActions: [],
          nextSteps: ['Consultar Itens'],
          errorHandling: 'Se ambiguo, listar opcoes e perguntar',
        },
        {
          order: 2,
          name: 'Consultar Itens',
          description: 'Buscar itens com status AVAILABLE e localização.',
          requiredData: ['productId ou variantId'],
          autoActions: ['stock_list_items', 'stock_get_item_location'],
          confirmActions: [],
          nextSteps: [],
          errorHandling: 'Se sem itens, informar que nao ha estoque',
        },
      ],
    },
  ],

  // ================================================================
  // BUSINESS RULES
  // ================================================================
  rules: [
    {
      id: 'stock_001',
      description: 'Somente produtos com status ACTIVE podem ser vendidos',
      severity: 'BLOCK',
      appliesTo: ['Product', 'sale'],
      condition: 'Produto nao tem status ACTIVE',
      action: 'Informar que o produto precisa ser ativado antes de ser vendido',
    },
    {
      id: 'stock_002',
      description: 'Somente items AVAILABLE podem ser vendidos ou reservados',
      severity: 'BLOCK',
      appliesTo: ['Item', 'sale', 'reserve'],
      condition: 'Item nao tem status AVAILABLE',
      action: 'Informar status atual do item e que nao pode ser vendido',
    },
    {
      id: 'stock_003',
      description:
        'Codigos hierarquicos sao gerados automaticamente e imutaveis',
      severity: 'INFO',
      appliesTo: ['Product', 'Variant', 'Item', 'Template', 'Manufacturer'],
      condition: 'Sempre',
      action: 'Nao tentar definir ou alterar codigos — sao automaticos',
    },
    {
      id: 'stock_004',
      description:
        'Movimentacoes de LOSS e INVENTORY_ADJUSTMENT requerem aprovacao',
      severity: 'WARN',
      appliesTo: ['Movement'],
      condition: 'Tipo e LOSS ou INVENTORY_ADJUSTMENT',
      action: 'Alertar que a acao requer aprovacao e pedir confirmacao',
    },
    {
      id: 'stock_005',
      description: 'Todo produto precisa de um template',
      severity: 'BLOCK',
      appliesTo: ['Product', 'create'],
      condition: 'Nao ha templateId',
      action:
        'Buscar templates existentes ou criar um adequado antes de criar o produto',
    },
    {
      id: 'stock_006',
      description:
        'Usar preset de template quando disponivel — nao perguntar atributos',
      severity: 'INFO',
      appliesTo: ['Template', 'create'],
      condition: 'Existe preset para o tipo solicitado',
      action:
        'Usar atributos do preset automaticamente sem perguntar ao usuario',
    },
    {
      id: 'stock_007',
      description: 'Campos opcionais devem usar valores padrao — nao perguntar',
      severity: 'INFO',
      appliesTo: ['all'],
      condition: 'Campo e opcional',
      action: 'Usar valor padrao ou deixar vazio — nao perguntar ao usuario',
    },
  ],

  // ================================================================
  // DECISION TREES
  // ================================================================
  decisionTrees: [
    {
      question: 'O usuario quer criar, consultar ou movimentar estoque?',
      context: 'Quando o usuario faz um pedido generico relacionado a estoque',
      branches: [
        {
          condition: 'Menciona criar, cadastrar, adicionar produto',
          action: 'Iniciar workflow create_full_product',
          followUp: {
            question: 'Que tipo de produto?',
            context: 'Determinar template adequado',
            branches: [
              {
                condition: 'Menciona tipo especifico (camiseta, tecido, etc.)',
                action: 'Buscar preset correspondente',
                toolToUse: 'stock_list_templates',
              },
              {
                condition: 'Tipo generico ou nao especificado',
                action: 'Perguntar tipo ou usar template generico',
              },
            ],
          },
        },
        {
          condition: 'Menciona consultar, verificar, quanto tem, disponivel',
          action: 'Iniciar workflow stock_inquiry',
          toolToUse: 'stock_list_products',
        },
        {
          condition: 'Menciona entrada, recebimento, compra chegou',
          action: 'Iniciar workflow receive_purchase',
          toolToUse: 'stock_list_purchase_orders',
        },
        {
          condition: 'Menciona saida, venda, baixa, descarte',
          action: 'Registrar saida de estoque',
          toolToUse: 'stock_register_exit',
        },
        {
          condition: 'Menciona transferir, mover, realocar',
          action: 'Transferir itens entre armazens/bins',
          toolToUse: 'stock_transfer_item',
        },
        {
          condition: 'Menciona relatorio, resumo, visao geral',
          action: 'Gerar relatorio adequado',
          toolToUse: 'stock_summary',
        },
      ],
    },
  ],

  // ================================================================
  // DATA REQUIREMENTS
  // ================================================================
  dataRequirements: [
    {
      action: 'create_product',
      required: [
        {
          field: 'name',
          description: 'Nome do produto',
          howToObtain: 'ask_user',
        },
        {
          field: 'templateId',
          description: 'Template que define atributos',
          howToObtain: 'lookup_entity',
        },
      ],
      optional: [
        {
          field: 'description',
          description: 'Descricao do produto',
          howToObtain: 'ask_user',
        },
        {
          field: 'categoryId',
          description: 'Categoria do produto',
          howToObtain: 'lookup_entity',
        },
        {
          field: 'manufacturerId',
          description: 'Fabricante do produto',
          howToObtain: 'lookup_entity',
        },
        {
          field: 'status',
          description: 'Status inicial',
          howToObtain: 'use_default',
        },
      ],
      derivable: [
        {
          field: 'templateId',
          description: 'Template adequado',
          derivationStrategy:
            'Buscar por nome do tipo de produto nos templates existentes. Se nao existir, criar usando preset.',
        },
        {
          field: 'categoryId',
          description: 'Categoria adequada',
          derivationStrategy:
            'Buscar por nome de categoria mencionada. Se nao existir, criar.',
        },
      ],
    },
    {
      action: 'create_template',
      required: [
        {
          field: 'name',
          description: 'Nome do template',
          howToObtain: 'ask_user',
        },
      ],
      optional: [
        {
          field: 'unitOfMeasure',
          description: 'Unidade de medida',
          howToObtain: 'use_default',
        },
        {
          field: 'attributes',
          description: 'Lista de atributos customizados',
          howToObtain: 'use_default',
        },
      ],
      derivable: [
        {
          field: 'attributes',
          description: 'Atributos do template',
          derivationStrategy:
            'Usar preset correspondente ao tipo (Camiseta, Tecido, etc.). Se nao houver preset, usar atributos minimos razoaveis.',
        },
        {
          field: 'unitOfMeasure',
          description: 'Unidade de medida',
          derivationStrategy:
            'Derivar do tipo: Calcados=PAIRS, Tecido=METERS, etc. Padrao: UNITS',
        },
      ],
    },
    {
      action: 'create_variant',
      required: [
        {
          field: 'productId',
          description: 'Produto pai',
          howToObtain: 'lookup_entity',
        },
        {
          field: 'name',
          description: 'Nome da variante',
          howToObtain: 'ask_user',
        },
      ],
      optional: [
        {
          field: 'price',
          description: 'Preco de venda',
          howToObtain: 'ask_user',
        },
        {
          field: 'costPrice',
          description: 'Preco de custo',
          howToObtain: 'ask_user',
        },
      ],
      derivable: [
        {
          field: 'price',
          description: 'Preco padrao',
          derivationStrategy: 'Usar 0 como padrao se nao informado',
        },
      ],
    },
    {
      action: 'register_entry',
      required: [
        {
          field: 'variantId',
          description: 'Variante do produto',
          howToObtain: 'lookup_entity',
        },
        {
          field: 'warehouseId',
          description: 'Armazem de destino',
          howToObtain: 'lookup_entity',
        },
        {
          field: 'quantity',
          description: 'Quantidade a receber',
          howToObtain: 'ask_user',
        },
      ],
      optional: [
        {
          field: 'unitCost',
          description: 'Custo unitario',
          howToObtain: 'ask_user',
        },
        {
          field: 'supplierId',
          description: 'Fornecedor',
          howToObtain: 'lookup_entity',
        },
        {
          field: 'binId',
          description: 'Posicao de destino',
          howToObtain: 'lookup_entity',
        },
      ],
      derivable: [
        {
          field: 'warehouseId',
          description: 'Armazem',
          derivationStrategy:
            'Se so existe um armazem, usar esse. Se varios, perguntar.',
        },
      ],
    },
  ],

  // ================================================================
  // DEPENDENCIES
  // ================================================================
  dependencies: [
    {
      module: 'sales',
      relationship:
        'Vendas consomem estoque — pedidos confirmados reservam e depois retiram itens',
      sharedEntities: ['Product', 'Variant', 'Item'],
    },
    {
      module: 'finance',
      relationship:
        'Compras geram lancamentos a pagar — vendas geram lancamentos a receber',
      sharedEntities: ['PurchaseOrder', 'Supplier'],
    },
  ],

  // ================================================================
  // COMMON QUERIES
  // ================================================================
  commonQueries: [
    {
      intent: 'check_stock_level',
      examples: [
        'Quanto tem em estoque?',
        'Qual o estoque da camiseta azul?',
        'Tem produto X disponivel?',
      ],
      strategy:
        'Buscar produto por nome, listar variantes, contar itens AVAILABLE por variante',
      toolsNeeded: [
        'stock_list_products',
        'stock_list_variants',
        'stock_list_items',
      ],
    },
    {
      intent: 'low_stock_alert',
      examples: [
        'Quais produtos estao em falta?',
        'Relatorio de estoque baixo',
        'O que precisa repor?',
      ],
      strategy: 'Usar relatorio de estoque baixo',
      toolsNeeded: ['stock_low_stock_report'],
    },
    {
      intent: 'stock_value',
      examples: [
        'Qual o valor total do estoque?',
        'Quanto vale meu estoque?',
        'Valorizacao do estoque',
      ],
      strategy: 'Usar relatorio de valorizacao',
      toolsNeeded: ['stock_valuation_report'],
    },
    {
      intent: 'product_catalog',
      examples: [
        'Lista de produtos',
        'Quais produtos tenho cadastrados?',
        'Mostra o catalogo',
      ],
      strategy: 'Listar produtos com filtros adequados e apresentar em tabela',
      toolsNeeded: ['stock_list_products', 'stock_count_products'],
    },
    {
      intent: 'movement_history',
      examples: [
        'Movimentacoes do mes',
        'O que entrou e saiu?',
        'Historico de estoque',
      ],
      strategy: 'Usar relatorio de movimentacoes com periodo adequado',
      toolsNeeded: ['stock_movement_report'],
    },
    {
      intent: 'locate_item',
      examples: [
        'Onde esta o produto X?',
        'Em qual armazem esta?',
        'Localizar item',
      ],
      strategy: 'Buscar item e retornar localizacao (armazem > zona > bin)',
      toolsNeeded: ['stock_list_items', 'stock_get_item_location'],
    },
  ],
};

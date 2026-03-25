import type { ToolDefinition } from '@/services/ai-tools/tool-types';

export function getContentTools(): ToolDefinition[] {
  return [
    {
      name: 'content_generate_social_post',
      description:
        'Gera um post para redes sociais (Instagram, Facebook, WhatsApp) sobre produtos ou promoções da loja',
      parameters: {
        type: 'object',
        properties: {
          productIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs dos produtos a destacar no post',
          },
          promotionId: {
            type: 'string',
            description: 'ID da promoção a divulgar',
          },
          platform: {
            type: 'string',
            enum: ['instagram', 'facebook', 'whatsapp'],
            description: 'Plataforma alvo (padrão: instagram)',
          },
          tone: {
            type: 'string',
            enum: ['formal', 'casual', 'urgente', 'luxo'],
            description: 'Tom do conteúdo (padrão: casual)',
          },
          theme: {
            type: 'string',
            description:
              'Tema ou ocasião especial: lancamento, liquidacao, natal, blackfriday, etc.',
          },
          maxLength: {
            type: 'number',
            description: 'Limite máximo de caracteres (padrão: 2200)',
          },
        },
      },
      module: 'sales',
      permission: 'sales.orders.access',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'content_generate_product_desc',
      description:
        'Gera uma descrição comercial persuasiva para um produto, destacando benefícios e diferenciais',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'ID do produto para gerar a descrição',
          },
          tone: {
            type: 'string',
            enum: ['formal', 'casual', 'urgente', 'luxo'],
            description: 'Tom da descrição (padrão: formal)',
          },
          maxLength: {
            type: 'number',
            description: 'Limite máximo de caracteres (padrão: 1000)',
          },
        },
        required: ['productId'],
      },
      module: 'stock',
      permission: 'stock.products.access',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'content_generate_email_campaign',
      description:
        'Gera conteúdo para email marketing com assunto, corpo e CTA, destacando produtos ou promoções',
      parameters: {
        type: 'object',
        properties: {
          productIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs dos produtos a destacar no email',
          },
          promotionId: {
            type: 'string',
            description: 'ID da promoção a divulgar',
          },
          theme: {
            type: 'string',
            description:
              'Tema da campanha: lancamento, liquidacao, natal, blackfriday, etc.',
          },
          tone: {
            type: 'string',
            enum: ['formal', 'casual', 'urgente', 'luxo'],
            description: 'Tom do email (padrão: formal)',
          },
          maxLength: {
            type: 'number',
            description: 'Limite máximo de caracteres do corpo (padrão: 3000)',
          },
        },
      },
      module: 'sales',
      permission: 'sales.orders.access',
      requiresConfirmation: false,
      category: 'action',
    },
    {
      name: 'content_generate_promotion_text',
      description:
        'Gera texto para banner ou material promocional de uma promoção ativa ou futura',
      parameters: {
        type: 'object',
        properties: {
          promotionId: {
            type: 'string',
            description: 'ID da promoção para gerar o texto',
          },
          productIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs dos produtos participantes da promoção',
          },
          tone: {
            type: 'string',
            enum: ['formal', 'casual', 'urgente', 'luxo'],
            description: 'Tom do material (padrão: urgente)',
          },
          theme: {
            type: 'string',
            description: 'Tema ou ocasião especial',
          },
          maxLength: {
            type: 'number',
            description: 'Limite máximo de caracteres (padrão: 500)',
          },
        },
      },
      module: 'sales',
      permission: 'sales.orders.access',
      requiresConfirmation: false,
      category: 'action',
    },
  ];
}

import type { PrismaClient } from '../generated/prisma/client.js';

const PRECONFIGURED_INTEGRATIONS = [
  {
    name: 'Nuvemshop',
    slug: 'nuvemshop',
    description:
      'Plataforma de e-commerce líder na América Latina. Sincronize produtos, pedidos e estoque.',
    logoUrl: 'https://cdn.nuvemshop.com.br/logo.svg',
    category: 'ECOMMERCE',
    configSchema: {
      type: 'object',
      properties: {
        storeId: { type: 'string', description: 'ID da loja Nuvemshop' },
        accessToken: {
          type: 'string',
          description: 'Token de acesso da API',
        },
      },
      required: ['storeId', 'accessToken'],
    },
  },
  {
    name: 'Shopify',
    slug: 'shopify',
    description:
      'Plataforma global de e-commerce. Integre produtos, pedidos e inventário.',
    logoUrl: 'https://cdn.shopify.com/logo.svg',
    category: 'ECOMMERCE',
    configSchema: {
      type: 'object',
      properties: {
        shopDomain: {
          type: 'string',
          description: 'Domínio da loja (ex: loja.myshopify.com)',
        },
        apiKey: { type: 'string', description: 'Chave da API Shopify' },
        apiSecretKey: {
          type: 'string',
          description: 'Chave secreta da API',
        },
        accessToken: { type: 'string', description: 'Token de acesso' },
      },
      required: ['shopDomain', 'accessToken'],
    },
  },
  {
    name: 'Tray',
    slug: 'tray',
    description:
      'Plataforma de e-commerce brasileira. Sincronize catálogo e pedidos.',
    logoUrl: 'https://www.tray.com.br/logo.svg',
    category: 'ECOMMERCE',
    configSchema: {
      type: 'object',
      properties: {
        apiUrl: { type: 'string', description: 'URL da API Tray' },
        accessToken: { type: 'string', description: 'Token de acesso' },
      },
      required: ['apiUrl', 'accessToken'],
    },
  },
  {
    name: 'Conta Azul',
    slug: 'conta-azul',
    description:
      'Sistema de gestão contábil. Sincronize lançamentos financeiros e notas fiscais.',
    logoUrl: 'https://contaazul.com/logo.svg',
    category: 'ACCOUNTING',
    configSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Client ID OAuth' },
        clientSecret: { type: 'string', description: 'Client Secret OAuth' },
        refreshToken: { type: 'string', description: 'Refresh Token' },
      },
      required: ['clientId', 'clientSecret'],
    },
  },
  {
    name: 'Asaas',
    slug: 'asaas',
    description:
      'Plataforma de cobranças e pagamentos. Gere boletos, PIX e cartão de crédito.',
    logoUrl: 'https://www.asaas.com/logo.svg',
    category: 'PAYMENT',
    configSchema: {
      type: 'object',
      properties: {
        apiKey: { type: 'string', description: 'Chave de API Asaas' },
        environment: {
          type: 'string',
          enum: ['sandbox', 'production'],
          description: 'Ambiente (sandbox ou produção)',
        },
      },
      required: ['apiKey'],
    },
  },
  {
    name: 'PagSeguro',
    slug: 'pagseguro',
    description:
      'Gateway de pagamento. Processe pagamentos com cartão, boleto e PIX.',
    logoUrl: 'https://pagseguro.uol.com.br/logo.svg',
    category: 'PAYMENT',
    configSchema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'Token da conta PagSeguro' },
        email: { type: 'string', description: 'E-mail da conta PagSeguro' },
        environment: {
          type: 'string',
          enum: ['sandbox', 'production'],
          description: 'Ambiente (sandbox ou produção)',
        },
      },
      required: ['token', 'email'],
    },
  },
];

export async function seedIntegrations(prisma: PrismaClient): Promise<void> {
  console.log('   📦 Seeding integrations...');

  for (const integration of PRECONFIGURED_INTEGRATIONS) {
    await prisma.integration.upsert({
      where: { slug: integration.slug },
      update: {
        name: integration.name,
        description: integration.description,
        logoUrl: integration.logoUrl,
        category: integration.category,
        configSchema: integration.configSchema,
      },
      create: {
        name: integration.name,
        slug: integration.slug,
        description: integration.description,
        logoUrl: integration.logoUrl,
        category: integration.category,
        configSchema: integration.configSchema,
        isAvailable: true,
      },
    });
  }

  console.log(`   ✅ ${PRECONFIGURED_INTEGRATIONS.length} integrations seeded`);
}

import type { PrismaClient } from '../generated/prisma/client.js';

interface SkillDefinitionInput {
  code: string;
  name: string;
  module: 'STOCK' | 'SALES' | 'HR' | 'FINANCE' | null;
  parentSkillCode: string | null;
  category: 'MODULE' | 'CHANNEL' | 'AI' | 'INTEGRATION' | 'FEATURE';
  isCore?: boolean;
}

const SKILL_DEFINITIONS: SkillDefinitionInput[] = [
  // ---------------------------------------------------------------------------
  // STOCK
  // ---------------------------------------------------------------------------
  {
    code: 'stock.warehouses',
    name: 'Multi-depósito',
    module: 'STOCK',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: false,
  },
  {
    code: 'stock.labels',
    name: 'Etiquetas',
    module: 'STOCK',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: false,
  },
  {
    code: 'stock.movements',
    name: 'Movimentações',
    module: 'STOCK',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: true,
  },

  // ---------------------------------------------------------------------------
  // SALES
  // ---------------------------------------------------------------------------
  {
    code: 'sales.crm',
    name: 'CRM',
    module: 'SALES',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: true,
  },
  {
    code: 'sales.inbox',
    name: 'Inbox',
    module: 'SALES',
    parentSkillCode: 'sales.crm',
    category: 'CHANNEL',
  },
  {
    code: 'sales.inbox.whatsapp',
    name: 'WhatsApp Business',
    module: 'SALES',
    parentSkillCode: 'sales.inbox',
    category: 'CHANNEL',
  },
  {
    code: 'sales.inbox.instagram',
    name: 'Instagram DM',
    module: 'SALES',
    parentSkillCode: 'sales.inbox',
    category: 'CHANNEL',
  },
  {
    code: 'sales.inbox.telegram',
    name: 'Telegram',
    module: 'SALES',
    parentSkillCode: 'sales.inbox',
    category: 'CHANNEL',
  },
  {
    code: 'sales.inbox.sms',
    name: 'SMS',
    module: 'SALES',
    parentSkillCode: 'sales.inbox',
    category: 'CHANNEL',
  },
  {
    code: 'sales.inbox.email',
    name: 'E-mail',
    module: 'SALES',
    parentSkillCode: 'sales.inbox',
    category: 'CHANNEL',
  },
  {
    code: 'sales.inbox.webchat',
    name: 'Webchat',
    module: 'SALES',
    parentSkillCode: 'sales.inbox',
    category: 'CHANNEL',
  },
  {
    code: 'sales.automations',
    name: 'Automações',
    module: 'SALES',
    parentSkillCode: 'sales.crm',
    category: 'FEATURE',
  },
  {
    code: 'sales.automations.ai',
    name: 'Automações com IA',
    module: 'SALES',
    parentSkillCode: 'sales.automations',
    category: 'AI',
  },
  {
    code: 'sales.ai',
    name: 'Assistente IA',
    module: 'SALES',
    parentSkillCode: 'sales.crm',
    category: 'AI',
  },
  {
    code: 'sales.ai.semi',
    name: 'IA Semi-autônoma',
    module: 'SALES',
    parentSkillCode: 'sales.ai',
    category: 'AI',
  },
  {
    code: 'sales.ai.autonomous',
    name: 'IA Autônoma',
    module: 'SALES',
    parentSkillCode: 'sales.ai.semi',
    category: 'AI',
  },
  {
    code: 'sales.analytics',
    name: 'Analytics',
    module: 'SALES',
    parentSkillCode: 'sales.crm',
    category: 'FEATURE',
  },
  {
    code: 'sales.proposals',
    name: 'Propostas',
    module: 'SALES',
    parentSkillCode: 'sales.crm',
    category: 'FEATURE',
  },
  {
    code: 'sales.forms',
    name: 'Formulários',
    module: 'SALES',
    parentSkillCode: 'sales.crm',
    category: 'FEATURE',
  },
  {
    code: 'sales.hooks',
    name: 'Webhooks',
    module: 'SALES',
    parentSkillCode: 'sales.crm',
    category: 'INTEGRATION',
  },
  {
    code: 'sales.pricing',
    name: 'Precificação',
    module: 'SALES',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: false,
  },
  {
    code: 'sales.pricing.campaigns',
    name: 'Campanhas',
    module: 'SALES',
    parentSkillCode: 'sales.pricing',
    category: 'FEATURE',
  },
  {
    code: 'sales.pricing.coupons',
    name: 'Cupons',
    module: 'SALES',
    parentSkillCode: 'sales.pricing',
    category: 'FEATURE',
  },
  {
    code: 'sales.pricing.combos',
    name: 'Combos',
    module: 'SALES',
    parentSkillCode: 'sales.pricing',
    category: 'FEATURE',
  },
  {
    code: 'sales.pricing.tax',
    name: 'Impostos',
    module: 'SALES',
    parentSkillCode: 'sales.pricing',
    category: 'FEATURE',
  },
  {
    code: 'sales.orders',
    name: 'Pedidos',
    module: 'SALES',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: false,
  },
  {
    code: 'sales.orders.quotes',
    name: 'Orçamentos',
    module: 'SALES',
    parentSkillCode: 'sales.orders',
    category: 'FEATURE',
  },
  {
    code: 'sales.orders.returns',
    name: 'Devoluções',
    module: 'SALES',
    parentSkillCode: 'sales.orders',
    category: 'FEATURE',
  },
  {
    code: 'sales.orders.commissions',
    name: 'Comissões',
    module: 'SALES',
    parentSkillCode: 'sales.orders',
    category: 'FEATURE',
  },
  {
    code: 'sales.pos',
    name: 'PDV',
    module: 'SALES',
    parentSkillCode: 'sales.orders',
    category: 'FEATURE',
  },
  {
    code: 'sales.pos.offline',
    name: 'PDV Offline',
    module: 'SALES',
    parentSkillCode: 'sales.pos',
    category: 'FEATURE',
  },
  {
    code: 'sales.pos.tef',
    name: 'TEF',
    module: 'SALES',
    parentSkillCode: 'sales.pos',
    category: 'INTEGRATION',
  },
  {
    code: 'sales.cashier',
    name: 'Caixa',
    module: 'SALES',
    parentSkillCode: 'sales.pos',
    category: 'FEATURE',
  },
  {
    code: 'sales.bids',
    name: 'Licitações',
    module: 'SALES',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: false,
  },
  {
    code: 'sales.bids.bot',
    name: 'Bot Licitações',
    module: 'SALES',
    parentSkillCode: 'sales.bids',
    category: 'AI',
  },
  {
    code: 'sales.bids.ai',
    name: 'IA Licitações',
    module: 'SALES',
    parentSkillCode: 'sales.bids',
    category: 'AI',
  },
  {
    code: 'sales.bids.contracts',
    name: 'Contratos Licitações',
    module: 'SALES',
    parentSkillCode: 'sales.bids',
    category: 'FEATURE',
  },
  {
    code: 'sales.marketplaces',
    name: 'Marketplaces',
    module: 'SALES',
    parentSkillCode: null,
    category: 'INTEGRATION',
    isCore: false,
  },
  {
    code: 'sales.marketplaces.ads',
    name: 'Anúncios Marketplace',
    module: 'SALES',
    parentSkillCode: 'sales.marketplaces',
    category: 'FEATURE',
  },
  {
    code: 'sales.catalogs',
    name: 'Catálogos',
    module: 'SALES',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: false,
  },
  {
    code: 'sales.catalogs.content-ai',
    name: 'Conteúdo IA',
    module: 'SALES',
    parentSkillCode: 'sales.catalogs',
    category: 'AI',
  },
  {
    code: 'sales.catalogs.mockups',
    name: 'Mockups',
    module: 'SALES',
    parentSkillCode: 'sales.catalogs',
    category: 'FEATURE',
  },
  {
    code: 'sales.catalogs.email-mkt',
    name: 'Email Marketing',
    module: 'SALES',
    parentSkillCode: 'sales.catalogs',
    category: 'CHANNEL',
  },

  // ---------------------------------------------------------------------------
  // HR
  // ---------------------------------------------------------------------------
  {
    code: 'hr.payroll',
    name: 'Folha de Pagamento',
    module: 'HR',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: false,
  },
  {
    code: 'hr.attendance',
    name: 'Ponto Eletrônico',
    module: 'HR',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: false,
  },
  {
    code: 'hr.absences',
    name: 'Férias e Faltas',
    module: 'HR',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: false,
  },
  {
    code: 'hr.schedules',
    name: 'Escalas de Trabalho',
    module: 'HR',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: false,
  },

  // ---------------------------------------------------------------------------
  // FINANCE
  // ---------------------------------------------------------------------------
  {
    code: 'finance.receivable',
    name: 'Contas a Receber',
    module: 'FINANCE',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: true,
  },
  {
    code: 'finance.payable',
    name: 'Contas a Pagar',
    module: 'FINANCE',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: true,
  },
  {
    code: 'finance.reports',
    name: 'Relatórios Financeiros',
    module: 'FINANCE',
    parentSkillCode: null,
    category: 'FEATURE',
    isCore: false,
  },

  // ---------------------------------------------------------------------------
  // TOOLS (module = null)
  // ---------------------------------------------------------------------------
  {
    code: 'tools.email',
    name: 'E-mail',
    module: null,
    parentSkillCode: null,
    category: 'MODULE',
    isCore: false,
  },
  {
    code: 'tools.tasks',
    name: 'Tarefas',
    module: null,
    parentSkillCode: null,
    category: 'MODULE',
    isCore: false,
  },
  {
    code: 'tools.calendar',
    name: 'Calendário',
    module: null,
    parentSkillCode: null,
    category: 'MODULE',
    isCore: false,
  },
  {
    code: 'tools.storage',
    name: 'Armazenamento',
    module: null,
    parentSkillCode: null,
    category: 'MODULE',
    isCore: false,
  },
  {
    code: 'tools.signature',
    name: 'Assinatura Digital',
    module: null,
    parentSkillCode: null,
    category: 'MODULE',
    isCore: false,
  },
  {
    code: 'tools.ai',
    name: 'Assistente IA',
    module: null,
    parentSkillCode: null,
    category: 'AI',
    isCore: false,
  },
] satisfies SkillDefinitionInput[];

export async function seedSkillDefinitions(prisma: PrismaClient) {
  console.log('\n🧩 Sincronizando definições de skills...');

  // Parent skills must be seeded before children, so we process in order.
  // The array is already sorted topologically (parents before children).
  let createdCount = 0;
  let updatedCount = 0;

  for (const skillDef of SKILL_DEFINITIONS) {
    const existing = await prisma.systemSkillDefinition.findUnique({
      where: { code: skillDef.code },
    });

    if (existing) {
      await prisma.systemSkillDefinition.update({
        where: { code: skillDef.code },
        data: {
          name: skillDef.name,
          module: skillDef.module,
          parentSkillCode: skillDef.parentSkillCode,
          category: skillDef.category,
          isCore: skillDef.isCore ?? false,
        },
      });
      updatedCount++;
    } else {
      await prisma.systemSkillDefinition.create({
        data: {
          code: skillDef.code,
          name: skillDef.name,
          module: skillDef.module,
          parentSkillCode: skillDef.parentSkillCode,
          category: skillDef.category,
          isCore: skillDef.isCore ?? false,
        },
      });
      createdCount++;
    }
  }

  console.log(
    `   ✅ ${createdCount} skills criadas, ${updatedCount} atualizadas (${SKILL_DEFINITIONS.length} total)`,
  );
}

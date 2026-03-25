import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Extended Sales seed: Price Tables, Payment Conditions, Campaigns, Coupons, Orders.
 *
 * Must run AFTER sales-pipelines and sales-demo-data so that customers,
 * CRM pipelines/stages already exist.
 */
export async function seedSalesExtendedData(
  prisma: PrismaClient,
  tenantId: string,
) {
  console.log(
    '\n💰 Criando dados estendidos de vendas para o tenant demo...',
  );

  // -----------------------------------------------------------------------
  // 0. Lookup admin user
  // -----------------------------------------------------------------------
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@teste.com', deletedAt: null },
  });

  if (!adminUser) {
    console.log('   ⚠️ Usuário admin não encontrado, pulando seed estendido');
    return;
  }

  // -----------------------------------------------------------------------
  // 1. Payment Conditions
  // -----------------------------------------------------------------------
  console.log('   📋 Criando condições de pagamento...');

  const paymentConditionDefs = [
    {
      name: 'À Vista',
      description: 'Pagamento à vista com desconto de 5%',
      type: 'CASH' as const,
      installments: 1,
      firstDueDays: 0,
      intervalDays: 0,
      discountCash: 5.0,
      isDefault: true,
    },
    {
      name: '30 Dias',
      description: 'Pagamento em 30 dias',
      type: 'INSTALLMENT' as const,
      installments: 1,
      firstDueDays: 30,
      intervalDays: 30,
      isDefault: false,
    },
    {
      name: '30/60 Dias',
      description: 'Pagamento em 2 parcelas: 30 e 60 dias',
      type: 'INSTALLMENT' as const,
      installments: 2,
      firstDueDays: 30,
      intervalDays: 30,
      isDefault: false,
    },
    {
      name: '30/60/90 Dias',
      description: 'Pagamento em 3 parcelas: 30, 60 e 90 dias',
      type: 'INSTALLMENT' as const,
      installments: 3,
      firstDueDays: 30,
      intervalDays: 30,
      isDefault: false,
    },
  ];

  const paymentConditions: Record<string, string> = {};
  let createdPaymentConditions = 0;

  for (const def of paymentConditionDefs) {
    const existing = await prisma.paymentCondition.findFirst({
      where: { tenantId, name: def.name, deletedAt: null },
    });

    if (existing) {
      paymentConditions[def.name] = existing.id;
      continue;
    }

    const condition = await prisma.paymentCondition.create({
      data: {
        tenantId,
        name: def.name,
        description: def.description,
        type: def.type,
        installments: def.installments,
        firstDueDays: def.firstDueDays,
        intervalDays: def.intervalDays,
        discountCash: def.discountCash ?? null,
        isDefault: def.isDefault,
        isActive: true,
        applicableTo: 'ALL',
        interestType: 'SIMPLE',
      },
    });

    paymentConditions[def.name] = condition.id;
    createdPaymentConditions++;
  }

  console.log(
    createdPaymentConditions > 0
      ? `   ✅ ${createdPaymentConditions} condições de pagamento criadas`
      : '   ✅ Condições de pagamento já existiam',
  );

  // -----------------------------------------------------------------------
  // 2. Price Tables
  // -----------------------------------------------------------------------
  console.log('   📋 Criando tabelas de preço...');

  const priceTableDefs = [
    {
      name: 'Tabela Padrão',
      description:
        'Tabela de preços padrão para vendas no varejo. Aplicada automaticamente quando nenhuma outra tabela é especificada.',
      type: 'DEFAULT' as const,
      isDefault: true,
      priority: 0,
    },
    {
      name: 'Tabela Atacado',
      description:
        'Tabela de preços para vendas no atacado com desconto de 10% a 20% sobre a tabela padrão.',
      type: 'WHOLESALE' as const,
      isDefault: false,
      priority: 10,
    },
  ];

  const priceTables: Record<string, string> = {};
  let createdPriceTables = 0;

  for (const def of priceTableDefs) {
    const existing = await prisma.priceTable.findFirst({
      where: { tenantId, name: def.name, deletedAt: null },
    });

    if (existing) {
      priceTables[def.name] = existing.id;
      continue;
    }

    const table = await prisma.priceTable.create({
      data: {
        tenantId,
        name: def.name,
        description: def.description,
        type: def.type,
        currency: 'BRL',
        priceIncludesTax: true,
        isDefault: def.isDefault,
        priority: def.priority,
        isActive: true,
      },
    });

    priceTables[def.name] = table.id;
    createdPriceTables++;
  }

  console.log(
    createdPriceTables > 0
      ? `   ✅ ${createdPriceTables} tabelas de preço criadas`
      : '   ✅ Tabelas de preço já existiam',
  );

  // -----------------------------------------------------------------------
  // 3. Campaigns
  // -----------------------------------------------------------------------
  console.log('   📋 Criando campanhas promocionais...');

  const now = new Date();
  const futureDays = (d: number) => new Date(now.getTime() + d * 86400000);
  const pastDays = (d: number) => new Date(now.getTime() - d * 86400000);

  const campaignDefs = [
    {
      name: 'Black Friday 2026',
      description:
        'Descontos progressivos de 10% a 30% em todas as categorias durante a Black Friday.',
      type: 'PERCENTAGE' as const,
      status: 'SCHEDULED' as const,
      startDate: new Date('2026-11-27T00:00:00Z'),
      endDate: new Date('2026-11-30T23:59:59Z'),
      channels: ['WEB', 'PDV', 'WHATSAPP'],
      priority: 100,
      stackable: false,
      maxUsageTotal: 500,
    },
    {
      name: 'Natal 2026',
      description:
        'Desconto fixo de R$ 50 em compras acima de R$ 300 durante o período natalino.',
      type: 'FIXED_VALUE' as const,
      status: 'SCHEDULED' as const,
      startDate: new Date('2026-12-15T00:00:00Z'),
      endDate: new Date('2026-12-26T23:59:59Z'),
      channels: ['WEB', 'PDV'],
      priority: 90,
      stackable: false,
      maxUsageTotal: 200,
    },
    {
      name: 'Verão 2026',
      description:
        'Frete grátis em todos os pedidos acima de R$ 150 durante a temporada de verão.',
      type: 'FREE_SHIPPING' as const,
      status: 'ACTIVE' as const,
      startDate: pastDays(15),
      endDate: futureDays(45),
      channels: ['WEB', 'MARKETPLACE'],
      priority: 50,
      stackable: true,
      maxUsageTotal: 1000,
    },
  ];

  const campaigns: Record<string, string> = {};
  let createdCampaigns = 0;

  for (const def of campaignDefs) {
    const existing = await prisma.campaign.findFirst({
      where: { tenantId, name: def.name, deletedAt: null },
    });

    if (existing) {
      campaigns[def.name] = existing.id;
      continue;
    }

    const campaign = await prisma.campaign.create({
      data: {
        tenantId,
        name: def.name,
        description: def.description,
        type: def.type,
        status: def.status,
        startDate: def.startDate,
        endDate: def.endDate,
        channels: def.channels,
        priority: def.priority,
        stackable: def.stackable,
        maxUsageTotal: def.maxUsageTotal,
        createdByUserId: adminUser.id,
      },
    });

    campaigns[def.name] = campaign.id;
    createdCampaigns++;
  }

  // Campaign rules for Black Friday
  if (campaigns['Black Friday 2026'] && createdCampaigns > 0) {
    const blackFridayRuleExists = await prisma.campaignRule.findFirst({
      where: { campaignId: campaigns['Black Friday 2026'], tenantId },
    });

    if (!blackFridayRuleExists) {
      await prisma.campaignRule.create({
        data: {
          campaignId: campaigns['Black Friday 2026'],
          tenantId,
          ruleType: 'MIN_VALUE',
          operator: 'GREATER_THAN',
          value: '100',
        },
      });
    }
  }

  // Campaign rules for Natal
  if (campaigns['Natal 2026'] && createdCampaigns > 0) {
    const natalRuleExists = await prisma.campaignRule.findFirst({
      where: { campaignId: campaigns['Natal 2026'], tenantId },
    });

    if (!natalRuleExists) {
      await prisma.campaignRule.create({
        data: {
          campaignId: campaigns['Natal 2026'],
          tenantId,
          ruleType: 'MIN_VALUE',
          operator: 'GREATER_THAN',
          value: '300',
        },
      });
    }
  }

  console.log(
    createdCampaigns > 0
      ? `   ✅ ${createdCampaigns} campanhas criadas`
      : '   ✅ Campanhas já existiam',
  );

  // -----------------------------------------------------------------------
  // 4. Coupons
  // -----------------------------------------------------------------------
  console.log('   📋 Criando cupons...');

  const couponDefs = [
    {
      code: 'BEMVINDO10',
      type: 'PERCENTAGE' as const,
      value: 10.0,
      minOrderValue: 100.0,
      maxDiscount: 50.0,
      maxUsageTotal: 100,
      maxUsagePerCustomer: 1,
      validFrom: pastDays(30),
      validUntil: futureDays(180),
      isActive: true,
      applicableTo: 'ALL' as const,
      campaignName: null as string | null,
    },
    {
      code: 'FRETE0',
      type: 'FREE_SHIPPING' as const,
      value: 0.0,
      minOrderValue: 200.0,
      maxDiscount: null as number | null,
      maxUsageTotal: 50,
      maxUsagePerCustomer: 3,
      validFrom: pastDays(10),
      validUntil: futureDays(60),
      isActive: true,
      applicableTo: 'ALL' as const,
      campaignName: 'Verão 2026',
    },
    {
      code: 'NATAL50',
      type: 'FIXED_VALUE' as const,
      value: 50.0,
      minOrderValue: 300.0,
      maxDiscount: null as number | null,
      maxUsageTotal: 200,
      maxUsagePerCustomer: 1,
      validFrom: new Date('2026-12-15T00:00:00Z'),
      validUntil: new Date('2026-12-26T23:59:59Z'),
      isActive: true,
      applicableTo: 'ALL' as const,
      campaignName: 'Natal 2026',
    },
    {
      code: 'BLACKFRI30',
      type: 'PERCENTAGE' as const,
      value: 30.0,
      minOrderValue: 500.0,
      maxDiscount: 200.0,
      maxUsageTotal: 100,
      maxUsagePerCustomer: 1,
      validFrom: new Date('2026-11-27T00:00:00Z'),
      validUntil: new Date('2026-11-30T23:59:59Z'),
      isActive: true,
      applicableTo: 'ALL' as const,
      campaignName: 'Black Friday 2026',
    },
    {
      code: 'EXPIRADO20',
      type: 'PERCENTAGE' as const,
      value: 20.0,
      minOrderValue: 50.0,
      maxDiscount: 100.0,
      maxUsageTotal: 10,
      maxUsagePerCustomer: 1,
      validFrom: pastDays(90),
      validUntil: pastDays(30),
      isActive: false,
      applicableTo: 'ALL' as const,
      campaignName: null,
    },
  ];

  let createdCoupons = 0;

  for (const def of couponDefs) {
    const existing = await prisma.coupon.findFirst({
      where: { tenantId, code: def.code },
    });

    if (existing) continue;

    await prisma.coupon.create({
      data: {
        tenantId,
        code: def.code,
        type: def.type,
        value: def.value,
        minOrderValue: def.minOrderValue ?? null,
        maxDiscount: def.maxDiscount ?? null,
        maxUsageTotal: def.maxUsageTotal,
        maxUsagePerCustomer: def.maxUsagePerCustomer,
        validFrom: def.validFrom,
        validUntil: def.validUntil,
        isActive: def.isActive,
        applicableTo: def.applicableTo,
        campaignId: def.campaignName
          ? (campaigns[def.campaignName] ?? null)
          : null,
      },
    });

    createdCoupons++;
  }

  console.log(
    createdCoupons > 0
      ? `   ✅ ${createdCoupons} cupons criados`
      : '   ✅ Cupons já existiam',
  );

  // -----------------------------------------------------------------------
  // 5. Pipelines (legacy Pipeline model for Orders)
  // -----------------------------------------------------------------------
  console.log('   📋 Criando pipelines de pedidos...');

  interface LegacyStageTemplate {
    name: string;
    type:
      | 'DRAFT'
      | 'OPEN'
      | 'PENDING_APPROVAL'
      | 'APPROVED'
      | 'PROCESSING'
      | 'INVOICED'
      | 'SHIPPED'
      | 'DELIVERED'
      | 'COMPLETED'
      | 'CANCELLED'
      | 'WON'
      | 'LOST';
    position: number;
    color: string;
  }

  const orderPipelineDefs: {
    name: string;
    description: string;
    type: 'SALES' | 'ORDER_B2C' | 'ORDER_B2B';
    isDefault: boolean;
    position: number;
    stages: LegacyStageTemplate[];
  }[] = [
    {
      name: 'Pipeline Comercial',
      description:
        'Pipeline padrão para acompanhamento de pedidos de venda',
      type: 'ORDER_B2C',
      isDefault: true,
      position: 0,
      stages: [
        {
          name: 'Rascunho',
          type: 'DRAFT',
          position: 0,
          color: '#94a3b8',
        },
        {
          name: 'Confirmado',
          type: 'APPROVED',
          position: 1,
          color: '#3b82f6',
        },
        {
          name: 'Em Processamento',
          type: 'PROCESSING',
          position: 2,
          color: '#f59e0b',
        },
        {
          name: 'Faturado',
          type: 'INVOICED',
          position: 3,
          color: '#8b5cf6',
        },
        {
          name: 'Enviado',
          type: 'SHIPPED',
          position: 4,
          color: '#0ea5e9',
        },
        {
          name: 'Entregue',
          type: 'DELIVERED',
          position: 5,
          color: '#22c55e',
        },
        {
          name: 'Cancelado',
          type: 'CANCELLED',
          position: 6,
          color: '#ef4444',
        },
      ],
    },
    {
      name: 'Pipeline Pós-Venda',
      description:
        'Pipeline para acompanhamento de onboarding, suporte e renovações',
      type: 'SALES',
      isDefault: false,
      position: 1,
      stages: [
        {
          name: 'Onboarding',
          type: 'OPEN',
          position: 0,
          color: '#6366f1',
        },
        {
          name: 'Suporte',
          type: 'PROCESSING',
          position: 1,
          color: '#0ea5e9',
        },
        {
          name: 'Renovação',
          type: 'COMPLETED',
          position: 2,
          color: '#22c55e',
        },
      ],
    },
  ];

  // We need both legacy Pipeline and CrmPipeline for Orders.
  // Orders reference CrmPipeline, so we create CRM pipelines for orders.
  const orderPipelines: Record<string, string> = {};
  const orderStages: Record<string, string> = {};
  let createdOrderPipelines = 0;

  for (const def of orderPipelineDefs) {
    const existing = await prisma.crmPipeline.findFirst({
      where: { tenantId, name: def.name, deletedAt: null },
    });

    if (existing) {
      orderPipelines[def.name] = existing.id;
      const existingStages = await prisma.crmPipelineStage.findMany({
        where: { pipelineId: existing.id },
      });
      for (const stage of existingStages) {
        orderStages[`${def.name}:${stage.name}`] = stage.id;
      }
      continue;
    }

    const pipeline = await prisma.crmPipeline.create({
      data: {
        tenantId,
        name: def.name,
        description: def.description,
        type: def.type,
        isDefault: def.isDefault,
        position: def.position + 10, // offset to avoid conflict with existing pipelines
        isActive: true,
      },
    });

    orderPipelines[def.name] = pipeline.id;
    createdOrderPipelines++;

    for (const stageDef of def.stages) {
      const stage = await prisma.crmPipelineStage.create({
        data: {
          pipelineId: pipeline.id,
          name: stageDef.name,
          type: stageDef.type,
          position: stageDef.position,
          color: stageDef.color,
        },
      });
      orderStages[`${def.name}:${stageDef.name}`] = stage.id;
    }
  }

  console.log(
    createdOrderPipelines > 0
      ? `   ✅ ${createdOrderPipelines} pipelines de pedidos criados`
      : '   ✅ Pipelines de pedidos já existiam',
  );

  // -----------------------------------------------------------------------
  // 6. Orders
  // -----------------------------------------------------------------------
  console.log('   📋 Criando pedidos de demonstração...');

  // Find customers
  const allCustomers = await prisma.customer.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, name: true },
  });
  const customerMap = new Map(allCustomers.map((c) => [c.name, c.id]));

  const commercialPipelineId = orderPipelines['Pipeline Comercial'];
  if (!commercialPipelineId) {
    console.log(
      '   ⚠️ Pipeline Comercial não encontrado, pulando pedidos',
    );
    return;
  }

  // Lookup stage IDs
  const draftStageId =
    orderStages['Pipeline Comercial:Rascunho'];
  const confirmedStageId =
    orderStages['Pipeline Comercial:Confirmado'];
  const processingStageId =
    orderStages['Pipeline Comercial:Em Processamento'];
  const invoicedStageId =
    orderStages['Pipeline Comercial:Faturado'];
  const shippedStageId =
    orderStages['Pipeline Comercial:Enviado'];
  const deliveredStageId =
    orderStages['Pipeline Comercial:Entregue'];
  const cancelledStageId =
    orderStages['Pipeline Comercial:Cancelado'];

  if (
    !draftStageId ||
    !confirmedStageId ||
    !processingStageId ||
    !invoicedStageId ||
    !shippedStageId ||
    !deliveredStageId ||
    !cancelledStageId
  ) {
    console.log(
      '   ⚠️ Estágios do pipeline comercial incompletos, pulando pedidos',
    );
    return;
  }

  const defaultPaymentConditionId =
    paymentConditions['À Vista'] ?? null;

  interface OrderDef {
    orderNumber: string;
    customerName: string;
    stageId: string;
    channel: 'PDV' | 'WEB' | 'WHATSAPP' | 'MANUAL';
    subtotal: number;
    discountTotal: number;
    shippingTotal: number;
    grandTotal: number;
    paymentConditionName: string | null;
    notes: string | null;
    confirmedAt: Date | null;
    cancelledAt: Date | null;
    cancelReason: string | null;
    items: {
      name: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      discountPercent: number;
      subtotal: number;
    }[];
    payments: {
      method:
        | 'CASH'
        | 'CREDIT_CARD'
        | 'DEBIT_CARD'
        | 'PIX'
        | 'BOLETO'
        | 'BANK_TRANSFER';
      amount: number;
      status: 'PENDING' | 'PAID' | 'CANCELLED';
      installmentNumber: number | null;
      dueDate: Date | null;
      paidAt: Date | null;
    }[];
  }

  const orderDefs: OrderDef[] = [
    // 1. Delivered order (complete cycle)
    {
      orderNumber: 'PED-2026-0001',
      customerName: 'Tech Corp Ltda',
      stageId: deliveredStageId,
      channel: 'WEB',
      subtotal: 12500.0,
      discountTotal: 625.0,
      shippingTotal: 150.0,
      grandTotal: 12025.0,
      paymentConditionName: '30/60 Dias',
      notes: 'Entrega realizada com sucesso na sede da TechCorp.',
      confirmedAt: pastDays(30),
      cancelledAt: null,
      cancelReason: null,
      items: [
        {
          name: 'Licença ERP Anual',
          sku: 'LIC-ERP-ANO',
          quantity: 5,
          unitPrice: 2000.0,
          discountPercent: 5,
          subtotal: 9500.0,
        },
        {
          name: 'Treinamento Presencial',
          sku: 'SRV-TREIN-01',
          quantity: 1,
          unitPrice: 3000.0,
          discountPercent: 0,
          subtotal: 3000.0,
        },
      ],
      payments: [
        {
          method: 'BOLETO',
          amount: 6012.5,
          status: 'PAID',
          installmentNumber: 1,
          dueDate: pastDays(0),
          paidAt: pastDays(2),
        },
        {
          method: 'BOLETO',
          amount: 6012.5,
          status: 'PAID',
          installmentNumber: 2,
          dueDate: futureDays(30),
          paidAt: null,
        },
      ],
    },
    // 2. Confirmed and processing
    {
      orderNumber: 'PED-2026-0002',
      customerName: 'Loja ABC',
      stageId: processingStageId,
      channel: 'WHATSAPP',
      subtotal: 4500.0,
      discountTotal: 0,
      shippingTotal: 85.0,
      grandTotal: 4585.0,
      paymentConditionName: '30 Dias',
      notes: 'Cliente solicitou envio expresso.',
      confirmedAt: pastDays(5),
      cancelledAt: null,
      cancelReason: null,
      items: [
        {
          name: 'Módulo Estoque',
          sku: 'MOD-STK-01',
          quantity: 3,
          unitPrice: 1500.0,
          discountPercent: 0,
          subtotal: 4500.0,
        },
      ],
      payments: [
        {
          method: 'PIX',
          amount: 4585.0,
          status: 'PENDING',
          installmentNumber: null,
          dueDate: futureDays(25),
          paidAt: null,
        },
      ],
    },
    // 3. Draft order
    {
      orderNumber: 'PED-2026-0003',
      customerName: 'João Silva',
      stageId: draftStageId,
      channel: 'PDV',
      subtotal: 850.0,
      discountTotal: 85.0,
      shippingTotal: 0,
      grandTotal: 765.0,
      paymentConditionName: 'À Vista',
      notes: null,
      confirmedAt: null,
      cancelledAt: null,
      cancelReason: null,
      items: [
        {
          name: 'Consultoria Inicial',
          sku: 'SRV-CONS-01',
          quantity: 1,
          unitPrice: 850.0,
          discountPercent: 10,
          subtotal: 765.0,
        },
      ],
      payments: [],
    },
    // 4. Invoiced order
    {
      orderNumber: 'PED-2026-0004',
      customerName: 'Indústria XYZ S.A.',
      stageId: invoicedStageId,
      channel: 'MANUAL',
      subtotal: 32000.0,
      discountTotal: 3200.0,
      shippingTotal: 250.0,
      grandTotal: 29050.0,
      paymentConditionName: '30/60/90 Dias',
      notes:
        'Nota fiscal emitida. Aguardando liberação financeira do cliente.',
      confirmedAt: pastDays(15),
      cancelledAt: null,
      cancelReason: null,
      items: [
        {
          name: 'Licença ERP Enterprise',
          sku: 'LIC-ERP-ENT',
          quantity: 10,
          unitPrice: 2500.0,
          discountPercent: 10,
          subtotal: 22500.0,
        },
        {
          name: 'Implantação Personalizada',
          sku: 'SRV-IMPL-01',
          quantity: 1,
          unitPrice: 7000.0,
          discountPercent: 0,
          subtotal: 7000.0,
        },
      ],
      payments: [
        {
          method: 'BOLETO',
          amount: 9683.33,
          status: 'PAID',
          installmentNumber: 1,
          dueDate: pastDays(5),
          paidAt: pastDays(4),
        },
        {
          method: 'BOLETO',
          amount: 9683.33,
          status: 'PENDING',
          installmentNumber: 2,
          dueDate: futureDays(25),
          paidAt: null,
        },
        {
          method: 'BOLETO',
          amount: 9683.34,
          status: 'PENDING',
          installmentNumber: 3,
          dueDate: futureDays(55),
          paidAt: null,
        },
      ],
    },
    // 5. Cancelled order
    {
      orderNumber: 'PED-2026-0005',
      customerName: 'Maria Santos',
      stageId: cancelledStageId,
      channel: 'WEB',
      subtotal: 1800.0,
      discountTotal: 0,
      shippingTotal: 45.0,
      grandTotal: 1845.0,
      paymentConditionName: 'À Vista',
      notes: 'Pedido cancelado a pedido da cliente.',
      confirmedAt: pastDays(20),
      cancelledAt: pastDays(18),
      cancelReason:
        'Cliente desistiu da compra por motivos pessoais.',
      items: [
        {
          name: 'Módulo Financeiro',
          sku: 'MOD-FIN-01',
          quantity: 1,
          unitPrice: 1800.0,
          discountPercent: 0,
          subtotal: 1800.0,
        },
      ],
      payments: [
        {
          method: 'CREDIT_CARD',
          amount: 1845.0,
          status: 'CANCELLED',
          installmentNumber: null,
          dueDate: null,
          paidAt: null,
        },
      ],
    },
    // 6. Shipped order
    {
      orderNumber: 'PED-2026-0006',
      customerName: 'Tech Corp Ltda',
      stageId: shippedStageId,
      channel: 'WEB',
      subtotal: 7200.0,
      discountTotal: 720.0,
      shippingTotal: 120.0,
      grandTotal: 6600.0,
      paymentConditionName: '30 Dias',
      notes: 'Pedido enviado via transportadora. Previsão de entrega em 3 dias.',
      confirmedAt: pastDays(10),
      cancelledAt: null,
      cancelReason: null,
      items: [
        {
          name: 'Módulo RH Completo',
          sku: 'MOD-RH-01',
          quantity: 2,
          unitPrice: 2400.0,
          discountPercent: 10,
          subtotal: 4320.0,
        },
        {
          name: 'Suporte Premium Anual',
          sku: 'SRV-SUP-ANO',
          quantity: 2,
          unitPrice: 1200.0,
          discountPercent: 0,
          subtotal: 2400.0,
        },
      ],
      payments: [
        {
          method: 'BANK_TRANSFER',
          amount: 6600.0,
          status: 'PAID',
          installmentNumber: null,
          dueDate: pastDays(5),
          paidAt: pastDays(6),
        },
      ],
    },
    // 7. Confirmed order (just confirmed, waiting for processing)
    {
      orderNumber: 'PED-2026-0007',
      customerName: 'Loja ABC',
      stageId: confirmedStageId,
      channel: 'PDV',
      subtotal: 2100.0,
      discountTotal: 0,
      shippingTotal: 0,
      grandTotal: 2100.0,
      paymentConditionName: 'À Vista',
      notes: 'Retirada na loja confirmada.',
      confirmedAt: pastDays(1),
      cancelledAt: null,
      cancelReason: null,
      items: [
        {
          name: 'Módulo Vendas',
          sku: 'MOD-VND-01',
          quantity: 1,
          unitPrice: 2100.0,
          discountPercent: 0,
          subtotal: 2100.0,
        },
      ],
      payments: [
        {
          method: 'DEBIT_CARD',
          amount: 2100.0,
          status: 'PAID',
          installmentNumber: null,
          dueDate: null,
          paidAt: pastDays(1),
        },
      ],
    },
    // 8. Large draft (quote)
    {
      orderNumber: 'ORC-2026-0001',
      customerName: 'Indústria XYZ S.A.',
      stageId: draftStageId,
      channel: 'MANUAL',
      subtotal: 48500.0,
      discountTotal: 4850.0,
      shippingTotal: 0,
      grandTotal: 43650.0,
      paymentConditionName: '30/60/90 Dias',
      notes:
        'Orçamento solicitado pelo Roberto. Aguardando aprovação da diretoria.',
      confirmedAt: null,
      cancelledAt: null,
      cancelReason: null,
      items: [
        {
          name: 'Licença ERP Enterprise',
          sku: 'LIC-ERP-ENT',
          quantity: 15,
          unitPrice: 2500.0,
          discountPercent: 10,
          subtotal: 33750.0,
        },
        {
          name: 'Implantação Personalizada',
          sku: 'SRV-IMPL-01',
          quantity: 1,
          unitPrice: 10000.0,
          discountPercent: 0,
          subtotal: 10000.0,
        },
        {
          name: 'Treinamento Online',
          sku: 'SRV-TREIN-ON',
          quantity: 3,
          unitPrice: 1500.0,
          discountPercent: 5,
          subtotal: 4275.0,
        },
      ],
      payments: [],
    },
  ];

  let createdOrders = 0;

  for (const def of orderDefs) {
    const customerId = customerMap.get(def.customerName);
    if (!customerId) continue;

    const existing = await prisma.order.findFirst({
      where: { tenantId, orderNumber: def.orderNumber },
    });

    if (existing) continue;

    const paymentConditionId = def.paymentConditionName
      ? (paymentConditions[def.paymentConditionName] ?? null)
      : null;

    const paidAmount = def.payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const remainingAmount = def.grandTotal - paidAmount;

    const order = await prisma.order.create({
      data: {
        tenantId,
        orderNumber: def.orderNumber,
        type: def.orderNumber.startsWith('ORC') ? 'QUOTE' : 'ORDER',
        customerId,
        pipelineId: commercialPipelineId,
        stageId: def.stageId,
        channel: def.channel,
        subtotal: def.subtotal,
        discountTotal: def.discountTotal,
        taxTotal: 0,
        shippingTotal: def.shippingTotal,
        grandTotal: def.grandTotal,
        currency: 'BRL',
        paymentConditionId,
        paidAmount,
        remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
        creditUsed: 0,
        notes: def.notes,
        stageEnteredAt: now,
        confirmedAt: def.confirmedAt,
        cancelledAt: def.cancelledAt,
        cancelReason: def.cancelReason,
        assignedToUserId: adminUser.id,
        priceTableId: priceTables['Tabela Padrão'] ?? null,
      },
    });

    // Create order items
    for (const [itemIdx, itemDef] of def.items.entries()) {
      const discountValue =
        (itemDef.unitPrice * itemDef.quantity * itemDef.discountPercent) /
        100;

      await prisma.orderItem.create({
        data: {
          tenantId,
          orderId: order.id,
          name: itemDef.name,
          sku: itemDef.sku,
          quantity: itemDef.quantity,
          unitPrice: itemDef.unitPrice,
          discountPercent: itemDef.discountPercent,
          discountValue,
          subtotal: itemDef.subtotal,
          position: itemIdx,
          priceSource: 'DEFAULT',
        },
      });
    }

    // Create payments
    for (const paymentDef of def.payments) {
      await prisma.orderPayment.create({
        data: {
          tenantId,
          orderId: order.id,
          method: paymentDef.method,
          amount: paymentDef.amount,
          status: paymentDef.status,
          installmentNumber: paymentDef.installmentNumber,
          dueDate: paymentDef.dueDate,
          paidAt: paymentDef.paidAt,
        },
      });
    }

    // Create initial order history entry
    await prisma.orderHistory.create({
      data: {
        tenantId,
        orderId: order.id,
        action: 'CREATED',
        description: `Pedido ${def.orderNumber} criado`,
        performedByUserId: adminUser.id,
      },
    });

    createdOrders++;
  }

  console.log(
    createdOrders > 0
      ? `   ✅ ${createdOrders} pedidos criados (com itens e pagamentos)`
      : '   ✅ Pedidos já existiam',
  );

  // -----------------------------------------------------------------------
  // 7. Additional Customers (to reach 8 total)
  // -----------------------------------------------------------------------
  console.log('   📋 Criando clientes adicionais...');

  const additionalCustomerDefs = [
    {
      name: 'Distribuidora Sul Ltda',
      type: 'BUSINESS' as const,
      document: '55.666.777/0001-88',
      email: 'comercial@distribuidorasul.com.br',
      phone: '(51) 3200-4000',
      city: 'Porto Alegre',
      state: 'RS',
      tradeName: 'Dist. Sul',
      tags: ['atacado', 'região-sul'],
    },
    {
      name: 'Carolina Oliveira',
      type: 'INDIVIDUAL' as const,
      document: '456.789.123-00',
      email: 'carolina.oliveira@gmail.com',
      phone: '(41) 99800-3333',
      city: 'Curitiba',
      state: 'PR',
      tradeName: null as string | null,
      tags: ['varejo'],
    },
    {
      name: 'Construtora Horizonte S.A.',
      type: 'BUSINESS' as const,
      document: '33.444.555/0001-66',
      email: 'projetos@horizonteconstrutora.com.br',
      phone: '(71) 3100-5000',
      city: 'Salvador',
      state: 'BA',
      tradeName: 'Horizonte',
      tags: ['construção', 'grande-porte'],
    },
  ];

  let createdAdditionalCustomers = 0;

  for (const def of additionalCustomerDefs) {
    const existing = await prisma.customer.findFirst({
      where: { tenantId, name: def.name, deletedAt: null },
    });

    if (existing) continue;

    await prisma.customer.create({
      data: {
        tenantId,
        name: def.name,
        type: def.type,
        document: def.document,
        email: def.email,
        phone: def.phone,
        city: def.city,
        state: def.state,
        tradeName: def.tradeName,
        tags: def.tags,
        isActive: true,
        source: 'MANUAL',
      },
    });

    createdAdditionalCustomers++;
  }

  console.log(
    createdAdditionalCustomers > 0
      ? `   ✅ ${createdAdditionalCustomers} clientes adicionais criados`
      : '   ✅ Clientes adicionais já existiam',
  );

  // -----------------------------------------------------------------------
  // 8. Additional Contacts for new customers
  // -----------------------------------------------------------------------
  console.log('   📋 Criando contatos adicionais...');

  // Refresh customer list
  const updatedCustomers = await prisma.customer.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, name: true },
  });
  const updatedCustomerMap = new Map(
    updatedCustomers.map((c) => [c.name, c.id]),
  );

  const additionalContactDefs = [
    {
      customerName: 'Distribuidora Sul Ltda',
      firstName: 'Marcos',
      lastName: 'Pereira',
      email: 'marcos.pereira@distribuidorasul.com.br',
      phone: '(51) 99100-4001',
      role: 'DECISION_MAKER' as const,
      lifecycle: 'OPPORTUNITY' as const,
      jobTitle: 'Diretor Comercial',
      isMain: true,
    },
    {
      customerName: 'Carolina Oliveira',
      firstName: 'Carolina',
      lastName: 'Oliveira',
      email: 'carolina.oliveira@gmail.com',
      phone: '(41) 99800-3333',
      role: 'OTHER' as const,
      lifecycle: 'LEAD' as const,
      jobTitle: '',
      isMain: true,
    },
    {
      customerName: 'Construtora Horizonte S.A.',
      firstName: 'Renata',
      lastName: 'Souza',
      email: 'renata.souza@horizonteconstrutora.com.br',
      phone: '(71) 99200-5001',
      role: 'DECISION_MAKER' as const,
      lifecycle: 'QUALIFIED' as const,
      jobTitle: 'Gerente de Projetos',
      isMain: true,
    },
    {
      customerName: 'Construtora Horizonte S.A.',
      firstName: 'Thiago',
      lastName: 'Martins',
      email: 'thiago.martins@horizonteconstrutora.com.br',
      phone: '(71) 99200-5002',
      role: 'GATEKEEPER' as const,
      lifecycle: 'SUBSCRIBER' as const,
      jobTitle: 'Coordenador de Compras',
      isMain: false,
    },
  ];

  let createdAdditionalContacts = 0;

  for (const def of additionalContactDefs) {
    const customerId = updatedCustomerMap.get(def.customerName);
    if (!customerId) continue;

    const existing = await prisma.crmContact.findFirst({
      where: {
        tenantId,
        customerId,
        firstName: def.firstName,
        lastName: def.lastName,
        deletedAt: null,
      },
    });

    if (existing) continue;

    await prisma.crmContact.create({
      data: {
        tenantId,
        customerId,
        firstName: def.firstName,
        lastName: def.lastName,
        fullName: `${def.firstName} ${def.lastName}`,
        email: def.email,
        phone: def.phone,
        role: def.role,
        lifecycleStage: def.lifecycle,
        jobTitle: def.jobTitle || null,
        isMainContact: def.isMain,
        source: 'MANUAL',
        tags: [],
      },
    });

    createdAdditionalContacts++;
  }

  console.log(
    createdAdditionalContacts > 0
      ? `   ✅ ${createdAdditionalContacts} contatos adicionais criados`
      : '   ✅ Contatos adicionais já existiam',
  );

  // -----------------------------------------------------------------------
  // 9. Additional Deals for new customers
  // -----------------------------------------------------------------------
  console.log('   📋 Criando negociações adicionais...');

  // Find sales pipeline for deals
  const salesPipeline = await prisma.crmPipeline.findFirst({
    where: { tenantId, name: 'Venda Simples', deletedAt: null },
    include: { stages: true },
  });

  if (salesPipeline) {
    const salesStageMap = new Map(
      salesPipeline.stages.map((s) => [s.name, s.id]),
    );

    const additionalDealDefs = [
      {
        title: 'Contrato Distribuidora Sul',
        customerName: 'Distribuidora Sul Ltda',
        stageId: salesStageMap.get('Proposta'),
        status: 'OPEN' as const,
        value: 28000,
        priority: 'HIGH' as const,
      },
      {
        title: 'Licença Carolina',
        customerName: 'Carolina Oliveira',
        stageId: salesStageMap.get('Qualificacao'),
        status: 'OPEN' as const,
        value: 3500,
        priority: 'LOW' as const,
      },
      {
        title: 'Projeto Horizonte',
        customerName: 'Construtora Horizonte S.A.',
        stageId: salesStageMap.get('Negociacao'),
        status: 'OPEN' as const,
        value: 45000,
        priority: 'URGENT' as const,
      },
    ];

    let createdAdditionalDeals = 0;

    for (const [idx, def] of additionalDealDefs.entries()) {
      if (!def.stageId) continue;
      const customerId = updatedCustomerMap.get(def.customerName);
      if (!customerId) continue;

      const existing = await prisma.crmDeal.findFirst({
        where: { tenantId, title: def.title, deletedAt: null },
      });

      if (existing) continue;

      await prisma.crmDeal.create({
        data: {
          tenantId,
          title: def.title,
          customerId,
          pipelineId: salesPipeline.id,
          stageId: def.stageId,
          status: def.status,
          priority: def.priority,
          value: def.value,
          currency: 'BRL',
          position: 10 + idx,
          assignedToUserId: adminUser.id,
          source: 'MANUAL',
        },
      });

      createdAdditionalDeals++;
    }

    console.log(
      createdAdditionalDeals > 0
        ? `   ✅ ${createdAdditionalDeals} negociações adicionais criadas`
        : '   ✅ Negociações adicionais já existiam',
    );
  }

  console.log('   ✅ Dados estendidos de vendas criados com sucesso!');
}

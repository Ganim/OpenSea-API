import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Seed de dados do módulo de Produção.
 *
 * Cria dados realistas de manufatura (workstations, ordens, job cards, qualidade, etc.)
 * para o tenant demo. Idempotente: verifica existência antes de inserir.
 */
export async function seedProductionData(
  prisma: PrismaClient,
  tenantId: string,
) {
  console.log('🏭 Criando dados do módulo de Produção...');

  // ── Resolve admin user (createdById) ──────────────────────────────────
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@teste.com', deletedAt: null },
  });

  if (!adminUser) {
    console.log(
      '   ⚠️ admin@teste.com não encontrado, pulando seed de produção',
    );
    return;
  }

  const createdById = adminUser.id;

  // ── Guard: skip if already seeded ─────────────────────────────────────
  const existingType = await prisma.productionWorkstationType.findFirst({
    where: { tenantId, name: 'CNC' },
  });
  if (existingType) {
    console.log('   ✅ Dados de produção já existem, pulando.');
    return;
  }

  // =====================================================================
  // 1. WorkstationTypes (3)
  // =====================================================================
  const typeCnc = await prisma.productionWorkstationType.create({
    data: {
      tenantId,
      name: 'CNC',
      description: 'Máquinas de controle numérico computadorizado',
      icon: 'cog',
      color: '#3b82f6',
    },
  });

  const typeMontagem = await prisma.productionWorkstationType.create({
    data: {
      tenantId,
      name: 'Montagem Manual',
      description: 'Estações de montagem manual e bancada',
      icon: 'wrench',
      color: '#10b981',
    },
  });

  const typeImp3d = await prisma.productionWorkstationType.create({
    data: {
      tenantId,
      name: 'Impressão 3D',
      description: 'Impressoras 3D FDM e SLA',
      icon: 'printer',
      color: '#8b5cf6',
    },
  });

  console.log('   ✅ 3 tipos de estação criados');

  // =====================================================================
  // 2. WorkCenters (2)
  // =====================================================================
  const wcUsinagem = await prisma.productionWorkCenter.create({
    data: {
      tenantId,
      code: 'WC-USI',
      name: 'Usinagem',
      description: 'Centro de usinagem CNC e torneamento',
    },
  });

  const wcMontagem = await prisma.productionWorkCenter.create({
    data: {
      tenantId,
      code: 'WC-MONT',
      name: 'Montagem',
      description: 'Centro de montagem manual e prototipagem 3D',
    },
  });

  console.log('   ✅ 2 centros de trabalho criados');

  // =====================================================================
  // 3. Workstations (6 — 2 per type)
  // =====================================================================
  const wsCnc01 = await prisma.productionWorkstation.create({
    data: {
      tenantId,
      workstationTypeId: typeCnc.id,
      workCenterId: wcUsinagem.id,
      code: 'CNC-01',
      name: 'CNC Haas VF-2',
      description: 'Centro de usinagem vertical 3 eixos',
      capacityPerDay: 8,
      costPerHour: 120,
      setupTimeDefault: 30,
    },
  });

  const wsCnc02 = await prisma.productionWorkstation.create({
    data: {
      tenantId,
      workstationTypeId: typeCnc.id,
      workCenterId: wcUsinagem.id,
      code: 'CNC-02',
      name: 'CNC Romi D800',
      description: 'Centro de usinagem vertical 4 eixos',
      capacityPerDay: 8,
      costPerHour: 150,
      setupTimeDefault: 45,
    },
  });

  const wsMont01 = await prisma.productionWorkstation.create({
    data: {
      tenantId,
      workstationTypeId: typeMontagem.id,
      workCenterId: wcMontagem.id,
      code: 'MONT-01',
      name: 'Bancada de Montagem A',
      description: 'Bancada com ferramental pneumático',
      capacityPerDay: 8,
      costPerHour: 45,
      setupTimeDefault: 10,
    },
  });

  const wsMont02 = await prisma.productionWorkstation.create({
    data: {
      tenantId,
      workstationTypeId: typeMontagem.id,
      workCenterId: wcMontagem.id,
      code: 'MONT-02',
      name: 'Bancada de Montagem B',
      description: 'Bancada com ferramental elétrico',
      capacityPerDay: 8,
      costPerHour: 45,
      setupTimeDefault: 10,
    },
  });

  const wsImp01 = await prisma.productionWorkstation.create({
    data: {
      tenantId,
      workstationTypeId: typeImp3d.id,
      workCenterId: wcMontagem.id,
      code: 'IMP3D-01',
      name: 'Impressora Prusa MK4',
      description: 'Impressora FDM para prototipagem rápida',
      capacityPerDay: 16,
      costPerHour: 15,
      setupTimeDefault: 15,
    },
  });

  await prisma.productionWorkstation.create({
    data: {
      tenantId,
      workstationTypeId: typeImp3d.id,
      workCenterId: wcMontagem.id,
      code: 'IMP3D-02',
      name: 'Impressora Bambu Lab X1C',
      description: 'Impressora FDM multi-material de alta velocidade',
      capacityPerDay: 20,
      costPerHour: 18,
      setupTimeDefault: 5,
    },
  });

  console.log('   ✅ 6 estações de trabalho criadas');

  // =====================================================================
  // 4. DowntimeReasons (3)
  // =====================================================================
  await prisma.productionDowntimeReason.createMany({
    data: [
      {
        tenantId,
        code: 'DT-PREV',
        name: 'Manutenção Preventiva',
        category: 'MAINTENANCE',
      },
      {
        tenantId,
        code: 'DT-MAT',
        name: 'Falta de Material',
        category: 'MATERIAL',
      },
      {
        tenantId,
        code: 'DT-SETUP',
        name: 'Setup de Máquina',
        category: 'SETUP',
      },
    ],
  });

  console.log('   ✅ 3 motivos de parada criados');

  // =====================================================================
  // 5. DefectTypes (3)
  // =====================================================================
  await prisma.productionDefectType.createMany({
    data: [
      {
        tenantId,
        code: 'DEF-DIM',
        name: 'Dimensional',
        description: 'Medida fora da tolerância especificada',
        severity: 'MAJOR',
      },
      {
        tenantId,
        code: 'DEF-SUP',
        name: 'Superficial',
        description: 'Acabamento superficial com riscos, marcas ou rebarbas',
        severity: 'MINOR',
      },
      {
        tenantId,
        code: 'DEF-FUNC',
        name: 'Funcional',
        description: 'Peça não atende requisito funcional de montagem ou uso',
        severity: 'CRITICAL',
      },
    ],
  });

  console.log('   ✅ 3 tipos de defeito criados');

  // =====================================================================
  // 6. Ensure products exist for BOMs
  // =====================================================================
  // Try to find existing products from stock seed data.
  const existingProducts = await prisma.product.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    take: 2,
  });

  const productA = existingProducts[0];
  const productB = existingProducts[1] ?? existingProducts[0];

  if (!productA) {
    console.log(
      '   ⚠️ Nenhum produto encontrado. Execute o seed de stock primeiro.',
    );
    return;
  }

  // =====================================================================
  // 7. BOMs (2 — one per product)
  // =====================================================================
  const bomA = await prisma.productionBom.create({
    data: {
      tenantId,
      productId: productA.id,
      version: 1,
      name: 'BOM Suporte Metálico v1',
      description: 'Lista de materiais do suporte metálico M-100',
      isDefault: true,
      status: 'ACTIVE',
      baseQuantity: 1,
      createdById: createdById,
      items: {
        create: [
          {
            materialId: productA.id,
            sequence: 1,
            quantity: 2,
            unit: 'un',
            wastagePercent: 5,
            notes: 'Chapa de aço 3mm cortada',
          },
          {
            materialId: productA.id,
            sequence: 2,
            quantity: 4,
            unit: 'un',
            wastagePercent: 0,
            notes: 'Parafuso M6x20',
          },
        ],
      },
    },
  });

  const isSameProduct = productA.id === productB.id;
  const bomB = await prisma.productionBom.create({
    data: {
      tenantId,
      productId: productB.id,
      version: isSameProduct ? 2 : 1,
      name: isSameProduct ? 'BOM Alternativa v2' : 'BOM Caixa PLA v1',
      description: 'Lista de materiais da caixa de proteção impressa em PLA',
      isDefault: true,
      status: 'ACTIVE',
      baseQuantity: 1,
      createdById: createdById,
      items: {
        create: [
          {
            materialId: productB.id,
            sequence: 1,
            quantity: 0.15,
            unit: 'kg',
            wastagePercent: 10,
            notes: 'Filamento PLA 1.75mm',
          },
        ],
      },
    },
  });

  console.log('   ✅ 2 BOMs criadas');

  // =====================================================================
  // 8. Operation Routings (needed for JobCards and InspectionPlans)
  // =====================================================================
  const routingA1 = await prisma.productionOperationRouting.create({
    data: {
      tenantId,
      bomId: bomA.id,
      workstationId: wsCnc01.id,
      sequence: 1,
      operationName: 'Corte CNC',
      description: 'Corte das chapas de aço na CNC',
      setupTime: 30,
      executionTime: 45,
      waitTime: 5,
      isQualityCheck: false,
    },
  });

  const routingA2 = await prisma.productionOperationRouting.create({
    data: {
      tenantId,
      bomId: bomA.id,
      workstationId: wsMont01.id,
      sequence: 2,
      operationName: 'Montagem Final',
      description: 'Montagem do suporte com parafusos',
      setupTime: 10,
      executionTime: 20,
      isQualityCheck: true,
    },
  });

  const routingB1 = await prisma.productionOperationRouting.create({
    data: {
      tenantId,
      bomId: bomB.id,
      workstationId: wsImp01.id,
      sequence: 1,
      operationName: 'Impressão 3D',
      description: 'Impressão da caixa em PLA',
      setupTime: 15,
      executionTime: 180,
      isQualityCheck: false,
    },
  });

  const routingB2 = await prisma.productionOperationRouting.create({
    data: {
      tenantId,
      bomId: bomB.id,
      workstationId: wsMont02.id,
      sequence: 2,
      operationName: 'Acabamento e Inspeção',
      description: 'Remoção de suportes e inspeção visual',
      setupTime: 5,
      executionTime: 15,
      isQualityCheck: true,
    },
  });

  console.log('   ✅ 4 roteiros de operação criados');

  // =====================================================================
  // 9. ProductionOrders (3 — different statuses)
  // =====================================================================
  const orderDraft = await prisma.productionOrder.create({
    data: {
      tenantId,
      orderNumber: 'OP-2026-001',
      bomId: bomA.id,
      productId: productA.id,
      status: 'DRAFT',
      priority: 30,
      quantityPlanned: 50,
      plannedStartDate: new Date('2026-04-14T08:00:00Z'),
      plannedEndDate: new Date('2026-04-18T17:00:00Z'),
      createdById: createdById,
      notes: 'Ordem de produção rascunho para lote de suportes metálicos',
    },
  });

  const orderReleased = await prisma.productionOrder.create({
    data: {
      tenantId,
      orderNumber: 'OP-2026-002',
      bomId: bomA.id,
      productId: productA.id,
      status: 'RELEASED',
      priority: 70,
      quantityPlanned: 100,
      quantityStarted: 40,
      plannedStartDate: new Date('2026-04-07T08:00:00Z'),
      plannedEndDate: new Date('2026-04-25T17:00:00Z'),
      actualStartDate: new Date('2026-04-07T08:30:00Z'),
      releasedAt: new Date('2026-04-06T15:00:00Z'),
      releasedById: createdById,
      createdById: createdById,
      notes: 'Lote urgente de 100 suportes para cliente ABC',
    },
  });

  const orderInProcess = await prisma.productionOrder.create({
    data: {
      tenantId,
      orderNumber: 'OP-2026-003',
      bomId: bomB.id,
      productId: productB.id,
      status: 'IN_PROCESS',
      priority: 50,
      quantityPlanned: 20,
      quantityStarted: 20,
      quantityCompleted: 12,
      quantityScrapped: 1,
      plannedStartDate: new Date('2026-04-01T08:00:00Z'),
      plannedEndDate: new Date('2026-04-15T17:00:00Z'),
      actualStartDate: new Date('2026-04-02T07:45:00Z'),
      releasedAt: new Date('2026-04-01T10:00:00Z'),
      releasedById: createdById,
      createdById: createdById,
      notes: 'Produção de caixas de proteção PLA — em andamento',
    },
  });

  console.log('   ✅ 3 ordens de produção criadas');

  // =====================================================================
  // 10. JobCards (4 — different statuses)
  // =====================================================================
  await prisma.productionJobCard.create({
    data: {
      productionOrderId: orderReleased.id,
      operationRoutingId: routingA1.id,
      workstationId: wsCnc01.id,
      status: 'COMPLETED',
      quantityPlanned: 100,
      quantityCompleted: 98,
      quantityScrapped: 2,
      scheduledStart: new Date('2026-04-07T08:00:00Z'),
      scheduledEnd: new Date('2026-04-10T17:00:00Z'),
      actualStart: new Date('2026-04-07T08:30:00Z'),
      actualEnd: new Date('2026-04-10T14:20:00Z'),
      barcode: 'JC-2026-002-01',
    },
  });

  await prisma.productionJobCard.create({
    data: {
      productionOrderId: orderReleased.id,
      operationRoutingId: routingA2.id,
      workstationId: wsMont01.id,
      status: 'IN_PROGRESS',
      quantityPlanned: 98,
      quantityCompleted: 40,
      scheduledStart: new Date('2026-04-11T08:00:00Z'),
      scheduledEnd: new Date('2026-04-14T17:00:00Z'),
      actualStart: new Date('2026-04-11T08:15:00Z'),
      barcode: 'JC-2026-002-02',
    },
  });

  await prisma.productionJobCard.create({
    data: {
      productionOrderId: orderInProcess.id,
      operationRoutingId: routingB1.id,
      workstationId: wsImp01.id,
      status: 'ON_HOLD',
      quantityPlanned: 20,
      quantityCompleted: 12,
      quantityScrapped: 1,
      scheduledStart: new Date('2026-04-02T08:00:00Z'),
      scheduledEnd: new Date('2026-04-08T17:00:00Z'),
      actualStart: new Date('2026-04-02T08:00:00Z'),
      barcode: 'JC-2026-003-01',
    },
  });

  await prisma.productionJobCard.create({
    data: {
      productionOrderId: orderDraft.id,
      operationRoutingId: routingA1.id,
      workstationId: wsCnc02.id,
      status: 'PENDING',
      quantityPlanned: 50,
      scheduledStart: new Date('2026-04-14T08:00:00Z'),
      scheduledEnd: new Date('2026-04-16T17:00:00Z'),
      barcode: 'JC-2026-001-01',
    },
  });

  console.log('   ✅ 4 job cards criados');

  // =====================================================================
  // 11. ProductionSchedules (2) with ScheduleEntries (4+ each)
  // =====================================================================
  const scheduleSemanal = await prisma.productionSchedule.create({
    data: {
      tenantId,
      name: 'Programação Semanal',
      description: 'Programação da semana 15 — 07 a 11 de abril de 2026',
      startDate: new Date('2026-04-07T00:00:00Z'),
      endDate: new Date('2026-04-11T23:59:59Z'),
      entries: {
        create: [
          {
            title: 'Corte CNC — OP-2026-002',
            startDate: new Date('2026-04-07T08:00:00Z'),
            endDate: new Date('2026-04-08T17:00:00Z'),
            status: 'COMPLETED',
            workstationId: wsCnc01.id,
            color: '#10b981',
            notes: 'Lote urgente — prioridade alta',
          },
          {
            title: 'Montagem — OP-2026-002',
            startDate: new Date('2026-04-09T08:00:00Z'),
            endDate: new Date('2026-04-10T17:00:00Z'),
            status: 'IN_PROGRESS',
            workstationId: wsMont01.id,
            color: '#f59e0b',
          },
          {
            title: 'Impressão 3D — OP-2026-003',
            startDate: new Date('2026-04-07T08:00:00Z'),
            endDate: new Date('2026-04-09T17:00:00Z'),
            status: 'CONFIRMED',
            workstationId: wsImp01.id,
            color: '#8b5cf6',
          },
          {
            title: 'Manutenção preventiva CNC-02',
            startDate: new Date('2026-04-11T08:00:00Z'),
            endDate: new Date('2026-04-11T12:00:00Z'),
            status: 'PLANNED',
            workstationId: wsCnc02.id,
            color: '#ef4444',
            notes: 'Revisão programada do eixo Y',
          },
          {
            title: 'Acabamento PLA — OP-2026-003',
            startDate: new Date('2026-04-10T08:00:00Z'),
            endDate: new Date('2026-04-11T17:00:00Z'),
            status: 'PLANNED',
            workstationId: wsMont02.id,
            color: '#06b6d4',
          },
        ],
      },
    },
  });

  await prisma.productionSchedule.create({
    data: {
      tenantId,
      name: 'Programação Mensal',
      description: 'Visão geral da produção de abril de 2026',
      startDate: new Date('2026-04-01T00:00:00Z'),
      endDate: new Date('2026-04-30T23:59:59Z'),
      entries: {
        create: [
          {
            title: 'Lote OP-2026-002 — Suportes Metálicos',
            startDate: new Date('2026-04-07T00:00:00Z'),
            endDate: new Date('2026-04-18T23:59:59Z'),
            status: 'IN_PROGRESS',
            color: '#3b82f6',
          },
          {
            title: 'Lote OP-2026-003 — Caixas PLA',
            startDate: new Date('2026-04-01T00:00:00Z'),
            endDate: new Date('2026-04-15T23:59:59Z'),
            status: 'CONFIRMED',
            color: '#8b5cf6',
          },
          {
            title: 'OP-2026-001 — Suportes (Planejamento)',
            startDate: new Date('2026-04-14T00:00:00Z'),
            endDate: new Date('2026-04-25T23:59:59Z'),
            status: 'PLANNED',
            color: '#6b7280',
          },
          {
            title: 'Parada programada — Semana Santa',
            startDate: new Date('2026-04-20T00:00:00Z'),
            endDate: new Date('2026-04-21T23:59:59Z'),
            status: 'CONFIRMED',
            color: '#ef4444',
            notes: 'Feriado — fábrica fechada',
          },
        ],
      },
    },
  });

  console.log('   ✅ 2 programações com entradas criadas');

  // =====================================================================
  // 12. InspectionPlans (2)
  // =====================================================================
  await prisma.productionInspectionPlan.create({
    data: {
      operationRoutingId: routingA2.id,
      inspectionType: 'DIMENSIONAL',
      description:
        'Inspeção dimensional das peças montadas — paquímetro e micrômetro',
      sampleSize: 5,
      aqlLevel: '1.0',
      instructions:
        'Verificar cotas críticas conforme desenho técnico DT-M100-R3. ' +
        'Tolerância geral: ±0.1mm. Cotas de encaixe: ±0.05mm. ' +
        'Registrar medidas no formulário QC-001.',
    },
  });

  await prisma.productionInspectionPlan.create({
    data: {
      operationRoutingId: routingB2.id,
      inspectionType: 'VISUAL',
      description:
        'Inspeção visual das peças impressas em 3D — acabamento e integridade',
      sampleSize: 10,
      aqlLevel: '2.5',
      instructions:
        'Verificar: ausência de warping, layer adhesion uniforme, ' +
        'sem strings ou blobs visíveis, encaixes dimensionalmente corretos. ' +
        'Peças com delaminação devem ser rejeitadas.',
    },
  });

  console.log('   ✅ 2 planos de inspeção criados');

  // =====================================================================
  // 13. QualityHolds (2 — ACTIVE + RELEASED)
  // =====================================================================
  await prisma.productionQualityHold.create({
    data: {
      productionOrderId: orderInProcess.id,
      reason:
        'Lote de filamento PLA com variação de diâmetro detectada. ' +
        'Aguardando análise do fornecedor e testes de aderência entre camadas.',
      status: 'ACTIVE',
      holdById: createdById,
      holdAt: new Date('2026-04-10T14:30:00Z'),
    },
  });

  await prisma.productionQualityHold.create({
    data: {
      productionOrderId: orderReleased.id,
      reason:
        'Duas peças do primeiro lote de corte CNC apresentaram medida fora ' +
        'da tolerância na cota de encaixe (7.82mm vs 8.00±0.05mm).',
      status: 'RELEASED',
      holdById: createdById,
      holdAt: new Date('2026-04-08T10:00:00Z'),
      releasedById: createdById,
      releasedAt: new Date('2026-04-08T16:45:00Z'),
      resolution:
        'Causa identificada: desgaste da ferramenta de corte. ' +
        'Ferramenta substituída, peças refugadas e lote reanalisado com aprovação.',
    },
  });

  console.log('   ✅ 2 quality holds criados');

  console.log('   🏭 Seed de produção concluído!');
}

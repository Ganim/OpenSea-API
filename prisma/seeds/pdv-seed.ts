import type { PrismaClient } from '../generated/prisma/client.js';

export async function seedPdvData(prisma: PrismaClient) {
  console.log('🏪 Criando dados do PDV...');

  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true },
  });

  for (const tenant of tenants) {
    // Pipeline PDV (isSystem = true)
    const existingPipeline = await prisma.crmPipeline.findFirst({
      where: {
        tenantId: tenant.id,
        name: 'PDV',
        isSystem: true,
        deletedAt: null,
      },
    });

    if (!existingPipeline) {
      const pipeline = await prisma.crmPipeline.create({
        data: {
          tenantId: tenant.id,
          name: 'PDV',
          description: 'Pipeline do Ponto de Venda',
          type: 'SALES',
          isDefault: false,
          isSystem: true,
          isActive: true,
        },
      });

      await prisma.crmPipelineStage.createMany({
        data: [
          {
            pipelineId: pipeline.id,
            name: 'Balcão',
            type: 'OPEN',
            position: 0,
            color: '#7c3aed',
          },
          {
            pipelineId: pipeline.id,
            name: 'Concluído',
            type: 'WON',
            position: 1,
            color: '#059669',
          },
          {
            pipelineId: pipeline.id,
            name: 'Cancelado',
            type: 'LOST',
            position: 2,
            color: '#e11d48',
          },
        ],
      });

      console.log(`   ✅ Pipeline PDV criada para tenant "${tenant.name}"`);
    }

    // Cliente "Consumidor Final" (isSystem = true)
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        name: 'Consumidor Final',
        isSystem: true,
        deletedAt: null,
      },
    });

    if (!existingCustomer) {
      await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: 'Consumidor Final',
          type: 'INDIVIDUAL',
          isSystem: true,
          isActive: true,
        },
      });

      console.log(
        `   ✅ Cliente "Consumidor Final" criado para tenant "${tenant.name}"`,
      );
    }
  }

  console.log('🏪 Dados do PDV criados com sucesso!');
}

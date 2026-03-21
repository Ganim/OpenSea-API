import type { PrismaClient } from '../generated/prisma/client.js';

interface StageTemplate {
  name: string;
  type: 'OPEN' | 'WON' | 'LOST';
  position: number;
  probability?: number;
  color?: string;
}

interface PipelineTemplate {
  name: string;
  description: string;
  type: 'SALES';
  isDefault: boolean;
  position: number;
  stages: StageTemplate[];
}

const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    name: 'Venda Simples',
    description: 'Pipeline padrão para vendas diretas e de ciclo curto',
    type: 'SALES',
    isDefault: true,
    position: 0,
    stages: [
      { name: 'Qualificacao', type: 'OPEN', position: 0, probability: 20, color: '#3b82f6' },
      { name: 'Proposta', type: 'OPEN', position: 1, probability: 50, color: '#f59e0b' },
      { name: 'Negociacao', type: 'OPEN', position: 2, probability: 75, color: '#8b5cf6' },
      { name: 'Fechado/Ganho', type: 'WON', position: 3, probability: 100, color: '#22c55e' },
      { name: 'Perdido', type: 'LOST', position: 4, probability: 0, color: '#ef4444' },
    ],
  },
  {
    name: 'Venda B2B',
    description: 'Pipeline completo para vendas corporativas de ciclo longo',
    type: 'SALES',
    isDefault: false,
    position: 1,
    stages: [
      { name: 'Prospeccao', type: 'OPEN', position: 0, probability: 10, color: '#6366f1' },
      { name: 'Qualificacao', type: 'OPEN', position: 1, probability: 25, color: '#3b82f6' },
      { name: 'Apresentacao', type: 'OPEN', position: 2, probability: 40, color: '#0ea5e9' },
      { name: 'Proposta', type: 'OPEN', position: 3, probability: 60, color: '#f59e0b' },
      { name: 'Negociacao', type: 'OPEN', position: 4, probability: 80, color: '#8b5cf6' },
      { name: 'Fechado/Ganho', type: 'WON', position: 5, probability: 100, color: '#22c55e' },
      { name: 'Perdido', type: 'LOST', position: 6, probability: 0, color: '#ef4444' },
    ],
  },
];

export async function seedSalesPipelines(
  prisma: PrismaClient,
  tenantId: string,
) {
  console.log('\n🏷️  Criando pipelines de vendas para o tenant demo...');

  let createdPipelines = 0;
  let createdStages = 0;

  for (const template of PIPELINE_TEMPLATES) {
    // Check if pipeline already exists for this tenant
    const existing = await prisma.crmPipeline.findFirst({
      where: {
        tenantId,
        name: template.name,
        deletedAt: null,
      },
    });

    if (existing) {
      console.log(`   ✅ Pipeline "${template.name}" ja existe`);
      continue;
    }

    const pipeline = await prisma.crmPipeline.create({
      data: {
        tenantId,
        name: template.name,
        description: template.description,
        type: template.type,
        isDefault: template.isDefault,
        position: template.position,
        isActive: true,
      },
    });

    createdPipelines++;

    // Create stages for this pipeline
    for (const stage of template.stages) {
      await prisma.crmPipelineStage.create({
        data: {
          pipelineId: pipeline.id,
          name: stage.name,
          type: stage.type,
          position: stage.position,
          probability: stage.probability ?? null,
          color: stage.color ?? null,
        },
      });
      createdStages++;
    }

    console.log(
      `   ✅ Pipeline "${template.name}" criado com ${template.stages.length} estagios`,
    );
  }

  if (createdPipelines === 0) {
    console.log('   ✅ Todos os pipelines ja existiam');
  } else {
    console.log(
      `   ✅ ${createdPipelines} pipelines e ${createdStages} estagios criados`,
    );
  }
}

import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Workflow, type WorkflowTriggerType, type WorkflowStepTypeValue } from '@/entities/sales/workflow';
import { prisma } from '@/lib/prisma';
import type { WorkflowTrigger, WorkflowStepType } from '@prisma/generated/client.js';
import type {
  CreateWorkflowSchema,
  WorkflowsRepository,
} from '../workflows-repository';

function mapToDomain(data: Record<string, unknown>): Workflow {
  const stepsRaw = (data.steps as Record<string, unknown>[]) ?? [];

  return Workflow.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      name: data.name as string,
      description: (data.description as string) ?? undefined,
      trigger: data.trigger as WorkflowTriggerType,
      isActive: data.isActive as boolean,
      executionCount: data.executionCount as number,
      lastExecutedAt: (data.lastExecutedAt as Date) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      deletedAt: (data.deletedAt as Date) ?? undefined,
      steps: stepsRaw.map((step) => ({
        id: new EntityID(step.id as string),
        workflowId: new EntityID(step.workflowId as string),
        order: step.order as number,
        type: step.type as WorkflowStepTypeValue,
        config: (step.config as Record<string, unknown>) ?? {},
        createdAt: step.createdAt as Date,
        updatedAt: (step.updatedAt as Date) ?? undefined,
      })),
    },
    new EntityID(data.id as string),
  );
}

export class PrismaWorkflowsRepository implements WorkflowsRepository {
  async create(data: CreateWorkflowSchema): Promise<Workflow> {
    const workflowData = await prisma.workflow.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        trigger: data.trigger as WorkflowTrigger,
        isActive: data.isActive ?? false,
        steps: data.steps
          ? {
              create: data.steps.map((step) => ({
                order: step.order,
                type: step.type as WorkflowStepType,
                config: step.config,
              })),
            }
          : undefined,
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    return mapToDomain(workflowData as unknown as Record<string, unknown>);
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Workflow | null> {
    const workflowData = await prisma.workflow.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!workflowData) return null;
    return mapToDomain(workflowData as unknown as Record<string, unknown>);
  }

  async findByTrigger(trigger: WorkflowTriggerType, tenantId: string): Promise<Workflow[]> {
    const workflowsData = await prisma.workflow.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
        trigger: trigger as WorkflowTrigger,
      },
      include: { steps: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });

    return workflowsData.map((data) =>
      mapToDomain(data as unknown as Record<string, unknown>),
    );
  }

  async findMany(page: number, perPage: number, tenantId: string): Promise<Workflow[]> {
    const workflowsData = await prisma.workflow.findMany({
      where: { tenantId, deletedAt: null },
      include: { steps: { orderBy: { order: 'asc' } } },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return workflowsData.map((data) =>
      mapToDomain(data as unknown as Record<string, unknown>),
    );
  }

  async countByTenant(tenantId: string): Promise<number> {
    return prisma.workflow.count({
      where: { tenantId, deletedAt: null },
    });
  }

  async save(workflow: Workflow): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.workflow.update({
        where: { id: workflow.id.toString() },
        data: {
          name: workflow.name,
          description: workflow.description,
          trigger: workflow.trigger as WorkflowTrigger,
          isActive: workflow.isActive,
          executionCount: workflow.executionCount,
          lastExecutedAt: workflow.lastExecutedAt,
          deletedAt: workflow.deletedAt,
        },
      });

      // Rebuild steps: delete all and recreate
      await tx.workflowStep.deleteMany({
        where: { workflowId: workflow.id.toString() },
      });

      if (workflow.steps.length > 0) {
        await tx.workflowStep.createMany({
          data: workflow.steps.map((step) => ({
            id: step.id.toString(),
            workflowId: workflow.id.toString(),
            order: step.order,
            type: step.type as WorkflowStepType,
            config: step.config,
          })),
        });
      }
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.workflow.update({
      where: { id: id.toString(), tenantId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}

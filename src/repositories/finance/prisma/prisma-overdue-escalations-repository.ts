import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { overdueEscalationPrismaToDomain } from '@/mappers/finance/overdue-escalation/overdue-escalation-prisma-to-domain';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OverdueEscalation } from '@/entities/finance/overdue-escalation';
import type {
  OverdueEscalationsRepository,
  CreateOverdueEscalationSchema,
  UpdateOverdueEscalationSchema,
  FindManyEscalationsOptions,
  FindManyEscalationsResult,
} from '../overdue-escalations-repository';

export class PrismaOverdueEscalationsRepository
  implements OverdueEscalationsRepository
{
  private getClient(tx?: TransactionClient) {
    return tx ?? prisma;
  }

  async create(
    data: CreateOverdueEscalationSchema,
    tx?: TransactionClient,
  ): Promise<OverdueEscalation> {
    const client = this.getClient(tx);

    const raw = await client.overdueEscalation.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        isDefault: data.isDefault ?? false,
        isActive: data.isActive ?? true,
        steps: {
          create: data.steps.map((step) => ({
            daysOverdue: step.daysOverdue,
            channel: step.channel,
            templateType: step.templateType,
            subject: step.subject,
            message: step.message,
            isActive: step.isActive ?? true,
            order: step.order,
          })),
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    return overdueEscalationPrismaToDomain(raw);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OverdueEscalation | null> {
    const raw = await prisma.overdueEscalation.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!raw) return null;
    return overdueEscalationPrismaToDomain(raw);
  }

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<OverdueEscalation | null> {
    const raw = await prisma.overdueEscalation.findFirst({
      where: { name, tenantId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!raw) return null;
    return overdueEscalationPrismaToDomain(raw);
  }

  async findDefault(tenantId: string): Promise<OverdueEscalation | null> {
    const raw = await prisma.overdueEscalation.findFirst({
      where: { tenantId, isDefault: true, isActive: true },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!raw) return null;
    return overdueEscalationPrismaToDomain(raw);
  }

  async findMany(
    options: FindManyEscalationsOptions,
  ): Promise<FindManyEscalationsResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId: options.tenantId };
    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const [rawList, total] = await Promise.all([
      prisma.overdueEscalation.findMany({
        where,
        include: { steps: { orderBy: { order: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.overdueEscalation.count({ where }),
    ]);

    const escalations = rawList.map(overdueEscalationPrismaToDomain);
    return { escalations, total };
  }

  async update(
    data: UpdateOverdueEscalationSchema,
    tx?: TransactionClient,
  ): Promise<OverdueEscalation | null> {
    const client = this.getClient(tx);

    // Multi-tenant guard: verify ownership before any write.
    const owned = await client.overdueEscalation.findFirst({
      where: { id: data.id.toString(), tenantId: data.tenantId },
      select: { id: true },
    });
    if (!owned) return null;

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.steps !== undefined) {
      await client.overdueEscalationStep.deleteMany({
        where: { escalationId: data.id.toString() },
      });

      updateData.steps = {
        create: data.steps.map((step) => ({
          daysOverdue: step.daysOverdue,
          channel: step.channel,
          templateType: step.templateType,
          subject: step.subject,
          message: step.message,
          isActive: step.isActive ?? true,
          order: step.order,
        })),
      };
    }

    const raw = await client.overdueEscalation.update({
      where: { id: data.id.toString() },
      data: updateData,
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    return overdueEscalationPrismaToDomain(raw);
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.overdueEscalation.updateMany({
      where: { id: id.toString(), tenantId },
      data: { isActive: false },
    });
  }

  async clearDefault(
    tenantId: string,
    excludeId?: string,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = this.getClient(tx);
    const where: Record<string, unknown> = {
      tenantId,
      isDefault: true,
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    await client.overdueEscalation.updateMany({
      where,
      data: { isDefault: false },
    });
  }
}

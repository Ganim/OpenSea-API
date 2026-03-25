import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { overdueActionPrismaToDomain } from '@/mappers/finance/overdue-action/overdue-action-prisma-to-domain';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OverdueAction } from '@/entities/finance/overdue-action';
import type { EscalationActionStatus } from '@/entities/finance/overdue-escalation-types';
import type {
  OverdueActionsRepository,
  CreateOverdueActionSchema,
  FindManyOverdueActionsOptions,
  FindManyOverdueActionsResult,
} from '../overdue-actions-repository';

export class PrismaOverdueActionsRepository
  implements OverdueActionsRepository
{
  private getClient(tx?: TransactionClient) {
    return tx ?? prisma;
  }

  async create(
    data: CreateOverdueActionSchema,
    tx?: TransactionClient,
  ): Promise<OverdueAction> {
    const client = this.getClient(tx);

    const raw = await client.overdueAction.create({
      data: {
        tenantId: data.tenantId,
        entryId: data.entryId,
        stepId: data.stepId,
        channel: data.channel,
        status: data.status ?? 'PENDING',
      },
    });

    return overdueActionPrismaToDomain(raw);
  }

  async createMany(
    data: CreateOverdueActionSchema[],
    tx?: TransactionClient,
  ): Promise<OverdueAction[]> {
    const actions: OverdueAction[] = [];
    for (const actionData of data) {
      const action = await this.create(actionData, tx);
      actions.push(action);
    }
    return actions;
  }

  async findByEntryAndStep(
    entryId: string,
    stepId: string,
    tenantId: string,
  ): Promise<OverdueAction | null> {
    const raw = await prisma.overdueAction.findFirst({
      where: { entryId, stepId, tenantId },
    });

    if (!raw) return null;
    return overdueActionPrismaToDomain(raw);
  }

  async findMany(
    options: FindManyOverdueActionsOptions,
  ): Promise<FindManyOverdueActionsResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId: options.tenantId };
    if (options.entryId) where.entryId = options.entryId;
    if (options.stepId) where.stepId = options.stepId;
    if (options.status) where.status = options.status;

    const [rawList, total] = await Promise.all([
      prisma.overdueAction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.overdueAction.count({ where }),
    ]);

    const actions = rawList.map(overdueActionPrismaToDomain);
    return { actions, total };
  }

  async findByEntryId(
    entryId: string,
    tenantId: string,
  ): Promise<OverdueAction[]> {
    const rawList = await prisma.overdueAction.findMany({
      where: { entryId, tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return rawList.map(overdueActionPrismaToDomain);
  }

  async updateStatus(
    id: UniqueEntityID,
    status: EscalationActionStatus,
    error?: string,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = this.getClient(tx);

    const updateData: Record<string, unknown> = { status };
    if (error) updateData.error = error;
    if (status === 'SENT') updateData.sentAt = new Date();

    await client.overdueAction.update({
      where: { id: id.toString() },
      data: updateData,
    });
  }
}

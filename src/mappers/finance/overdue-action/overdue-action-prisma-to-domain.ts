import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OverdueAction } from '@/entities/finance/overdue-action';
import type { OverdueAction as PrismaOverdueAction } from '@prisma/generated/client.js';

export function overdueActionPrismaToDomain(
  raw: PrismaOverdueAction,
): OverdueAction {
  return OverdueAction.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      entryId: new UniqueEntityID(raw.entryId),
      stepId: raw.stepId ? new UniqueEntityID(raw.stepId) : undefined,
      channel: raw.channel,
      status: raw.status,
      sentAt: raw.sentAt ?? undefined,
      error: raw.error ?? undefined,
      createdAt: raw.createdAt,
    },
    new UniqueEntityID(raw.id),
  );
}

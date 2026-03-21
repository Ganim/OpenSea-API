import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Deal } from '@/entities/sales/deal';

export function dealPrismaToDomain(data: Record<string, unknown>): Deal {
  return Deal.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      title: data.title as string,
      customerId: new UniqueEntityID(data.customerId as string),
      contactId: data.contactId
        ? new UniqueEntityID(data.contactId as string)
        : undefined,
      pipelineId: new UniqueEntityID(data.pipelineId as string),
      stageId: new UniqueEntityID(data.stageId as string),
      status: data.status as string,
      priority: data.priority as string,
      value: data.value != null ? Number(data.value) : undefined,
      currency: data.currency as string,
      expectedCloseDate: (data.expectedCloseDate as Date) ?? undefined,
      closedAt: (data.closedAt as Date) ?? undefined,
      lostReason: (data.lostReason as string) ?? undefined,
      source: (data.source as string) ?? undefined,
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      customFields: (data.customFields as Record<string, unknown>) ?? undefined,
      position: data.position as number,
      assignedToUserId: data.assignedToUserId
        ? new UniqueEntityID(data.assignedToUserId as string)
        : undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

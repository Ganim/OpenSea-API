import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Activity } from '@/entities/sales/activity';

export function activityPrismaToDomain(
  data: Record<string, unknown>,
): Activity {
  return Activity.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      dealId: data.dealId
        ? new UniqueEntityID(data.dealId as string)
        : undefined,
      contactId: data.contactId
        ? new UniqueEntityID(data.contactId as string)
        : undefined,
      type: data.type as string,
      title: data.title as string,
      description: (data.description as string) ?? undefined,
      status: data.status as string,
      dueDate: (data.dueDate as Date) ?? undefined,
      completedAt: (data.completedAt as Date) ?? undefined,
      duration: (data.duration as number) ?? undefined,
      userId: new UniqueEntityID(data.userId as string),
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

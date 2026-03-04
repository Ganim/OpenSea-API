import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Calendar } from '@/entities/calendar/calendar';
import type { Calendar as PrismaCalendar } from '@prisma/generated/client.js';

export function calendarPrismaToDomain(raw: PrismaCalendar): Calendar {
  return Calendar.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      name: raw.name,
      description: raw.description ?? null,
      color: raw.color ?? null,
      type: raw.type,
      ownerId: raw.ownerId ?? null,
      systemModule: raw.systemModule ?? null,
      isDefault: raw.isDefault,
      settings: (raw.settings as Record<string, unknown>) ?? {},
      createdBy: new UniqueEntityID(raw.createdBy),
      deletedAt: raw.deletedAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? null,
    },
    new UniqueEntityID(raw.id),
  );
}

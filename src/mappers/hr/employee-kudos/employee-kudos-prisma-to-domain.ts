import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { KudosCategory } from '@/entities/hr/employee-kudos';

export function mapEmployeeKudosPrismaToDomain(raw: Record<string, unknown>) {
  return {
    tenantId: new UniqueEntityID(raw.tenantId as string),
    fromEmployeeId: new UniqueEntityID(raw.fromEmployeeId as string),
    toEmployeeId: new UniqueEntityID(raw.toEmployeeId as string),
    message: raw.message as string,
    category: raw.category as KudosCategory,
    isPublic: raw.isPublic as boolean,
    isPinned: (raw.isPinned as boolean) ?? false,
    pinnedAt: (raw.pinnedAt as Date | null) ?? null,
    pinnedBy: raw.pinnedBy ? new UniqueEntityID(raw.pinnedBy as string) : null,
    createdAt: raw.createdAt as Date,
  };
}

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OffboardingChecklistItem } from '@/entities/hr/offboarding-checklist';

export function mapOffboardingChecklistPrismaToDomain(
  raw: Record<string, unknown>,
) {
  return {
    tenantId: new UniqueEntityID(raw.tenantId as string),
    employeeId: new UniqueEntityID(raw.employeeId as string),
    terminationId: raw.terminationId
      ? new UniqueEntityID(raw.terminationId as string)
      : null,
    title: (raw.title as string) ?? 'Checklist de Desligamento',
    items: (raw.items as OffboardingChecklistItem[]) ?? [],
    progress: raw.progress as number,
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
    deletedAt: (raw.deletedAt as Date | null) ?? null,
  };
}

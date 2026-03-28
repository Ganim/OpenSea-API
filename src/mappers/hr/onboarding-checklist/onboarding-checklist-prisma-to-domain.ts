import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OnboardingChecklistItem } from '@/entities/hr/onboarding-checklist';

export function mapOnboardingChecklistPrismaToDomain(
  raw: Record<string, unknown>,
) {
  return {
    tenantId: new UniqueEntityID(raw.tenantId as string),
    employeeId: new UniqueEntityID(raw.employeeId as string),
    title: (raw.title as string) ?? 'Onboarding',
    items: (raw.items as OnboardingChecklistItem[]) ?? [],
    progress: raw.progress as number,
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
    deletedAt: (raw.deletedAt as Date | null) ?? null,
  };
}

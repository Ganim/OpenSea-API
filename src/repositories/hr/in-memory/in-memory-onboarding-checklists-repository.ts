import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import type { OnboardingChecklistsRepository } from '../onboarding-checklists-repository';

export class InMemoryOnboardingChecklistsRepository
  implements OnboardingChecklistsRepository
{
  public items: OnboardingChecklist[] = [];

  async create(checklist: OnboardingChecklist): Promise<void> {
    this.items.push(checklist);
  }

  async findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<OnboardingChecklist | null> {
    return (
      this.items.find(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async save(checklist: OnboardingChecklist): Promise<void> {
    const index = this.items.findIndex((item) =>
      item.id.equals(checklist.id),
    );
    if (index >= 0) {
      this.items[index] = checklist;
    }
  }
}

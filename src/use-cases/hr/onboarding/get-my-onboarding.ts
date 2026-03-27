import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import type { OnboardingChecklistsRepository } from '@/repositories/hr/onboarding-checklists-repository';

export interface GetMyOnboardingInput {
  tenantId: string;
  employeeId: string;
}

export interface GetMyOnboardingOutput {
  checklist: OnboardingChecklist;
}

export class GetMyOnboardingUseCase {
  constructor(
    private onboardingChecklistsRepository: OnboardingChecklistsRepository,
  ) {}

  async execute(input: GetMyOnboardingInput): Promise<GetMyOnboardingOutput> {
    const { tenantId, employeeId } = input;

    const checklist =
      await this.onboardingChecklistsRepository.findByEmployeeId(
        new UniqueEntityID(employeeId),
        tenantId,
      );

    if (!checklist) {
      throw new ResourceNotFoundError('Onboarding checklist not found');
    }

    return { checklist };
  }
}

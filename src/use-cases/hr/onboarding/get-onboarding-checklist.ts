import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import type { OnboardingChecklistsRepository } from '@/repositories/hr/onboarding-checklists-repository';

export interface GetOnboardingChecklistInput {
  tenantId: string;
  id: string;
}

export interface GetOnboardingChecklistOutput {
  checklist: OnboardingChecklist;
}

export class GetOnboardingChecklistUseCase {
  constructor(
    private onboardingChecklistsRepository: OnboardingChecklistsRepository,
  ) {}

  async execute(
    input: GetOnboardingChecklistInput,
  ): Promise<GetOnboardingChecklistOutput> {
    const { tenantId, id } = input;

    const checklist = await this.onboardingChecklistsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!checklist) {
      throw new ResourceNotFoundError('Onboarding checklist not found');
    }

    return { checklist };
  }
}

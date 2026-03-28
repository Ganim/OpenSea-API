import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OnboardingChecklistsRepository } from '@/repositories/hr/onboarding-checklists-repository';

export interface DeleteOnboardingChecklistInput {
  tenantId: string;
  id: string;
}

export interface DeleteOnboardingChecklistOutput {
  success: boolean;
}

export class DeleteOnboardingChecklistUseCase {
  constructor(
    private onboardingChecklistsRepository: OnboardingChecklistsRepository,
  ) {}

  async execute(
    input: DeleteOnboardingChecklistInput,
  ): Promise<DeleteOnboardingChecklistOutput> {
    const { tenantId, id } = input;
    const checklistId = new UniqueEntityID(id);

    const checklist = await this.onboardingChecklistsRepository.findById(
      checklistId,
      tenantId,
    );

    if (!checklist) {
      throw new ResourceNotFoundError('Onboarding checklist not found');
    }

    await this.onboardingChecklistsRepository.delete(checklistId);

    return { success: true };
  }
}

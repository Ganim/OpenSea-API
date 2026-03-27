import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import type { OnboardingChecklistsRepository } from '@/repositories/hr/onboarding-checklists-repository';

export interface CompleteOnboardingItemInput {
  tenantId: string;
  employeeId: string;
  itemId: string;
}

export interface CompleteOnboardingItemOutput {
  checklist: OnboardingChecklist;
}

export class CompleteOnboardingItemUseCase {
  constructor(
    private onboardingChecklistsRepository: OnboardingChecklistsRepository,
  ) {}

  async execute(
    input: CompleteOnboardingItemInput,
  ): Promise<CompleteOnboardingItemOutput> {
    const { tenantId, employeeId, itemId } = input;

    const checklist =
      await this.onboardingChecklistsRepository.findByEmployeeId(
        new UniqueEntityID(employeeId),
        tenantId,
      );

    if (!checklist) {
      throw new ResourceNotFoundError('Onboarding checklist not found');
    }

    try {
      checklist.completeItem(itemId);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }

    await this.onboardingChecklistsRepository.save(checklist);

    return { checklist };
  }
}

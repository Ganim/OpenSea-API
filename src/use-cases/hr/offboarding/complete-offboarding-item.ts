import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';
import type { OffboardingChecklistsRepository } from '@/repositories/hr/offboarding-checklists-repository';

export interface CompleteOffboardingItemInput {
  tenantId: string;
  checklistId: string;
  itemId: string;
}

export interface CompleteOffboardingItemOutput {
  checklist: OffboardingChecklist;
}

export class CompleteOffboardingItemUseCase {
  constructor(
    private offboardingChecklistsRepository: OffboardingChecklistsRepository,
  ) {}

  async execute(
    input: CompleteOffboardingItemInput,
  ): Promise<CompleteOffboardingItemOutput> {
    const { tenantId, checklistId, itemId } = input;

    const checklist = await this.offboardingChecklistsRepository.findById(
      new UniqueEntityID(checklistId),
      tenantId,
    );

    if (!checklist) {
      throw new ResourceNotFoundError('Offboarding checklist not found');
    }

    try {
      checklist.completeItem(itemId);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }

    await this.offboardingChecklistsRepository.save(checklist);

    return { checklist };
  }
}

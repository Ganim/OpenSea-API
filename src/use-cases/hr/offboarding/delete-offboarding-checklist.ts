import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OffboardingChecklistsRepository } from '@/repositories/hr/offboarding-checklists-repository';

export interface DeleteOffboardingChecklistInput {
  tenantId: string;
  id: string;
}

export interface DeleteOffboardingChecklistOutput {
  success: boolean;
}

export class DeleteOffboardingChecklistUseCase {
  constructor(
    private offboardingChecklistsRepository: OffboardingChecklistsRepository,
  ) {}

  async execute(
    input: DeleteOffboardingChecklistInput,
  ): Promise<DeleteOffboardingChecklistOutput> {
    const { tenantId, id } = input;
    const checklistId = new UniqueEntityID(id);

    const checklist = await this.offboardingChecklistsRepository.findById(
      checklistId,
      tenantId,
    );

    if (!checklist) {
      throw new ResourceNotFoundError('Offboarding checklist not found');
    }

    await this.offboardingChecklistsRepository.delete(checklistId);

    return { success: true };
  }
}

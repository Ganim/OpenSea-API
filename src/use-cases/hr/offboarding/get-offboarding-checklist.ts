import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';
import type { OffboardingChecklistsRepository } from '@/repositories/hr/offboarding-checklists-repository';

export interface GetOffboardingChecklistInput {
  tenantId: string;
  id: string;
}

export interface GetOffboardingChecklistOutput {
  checklist: OffboardingChecklist;
}

export class GetOffboardingChecklistUseCase {
  constructor(
    private offboardingChecklistsRepository: OffboardingChecklistsRepository,
  ) {}

  async execute(
    input: GetOffboardingChecklistInput,
  ): Promise<GetOffboardingChecklistOutput> {
    const { tenantId, id } = input;

    const checklist = await this.offboardingChecklistsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!checklist) {
      throw new ResourceNotFoundError('Offboarding checklist not found');
    }

    return { checklist };
  }
}

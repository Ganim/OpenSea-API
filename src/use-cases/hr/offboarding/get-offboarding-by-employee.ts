import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';
import type { OffboardingChecklistsRepository } from '@/repositories/hr/offboarding-checklists-repository';

export interface GetOffboardingByEmployeeInput {
  tenantId: string;
  employeeId: string;
}

export interface GetOffboardingByEmployeeOutput {
  checklist: OffboardingChecklist;
}

export class GetOffboardingByEmployeeUseCase {
  constructor(
    private offboardingChecklistsRepository: OffboardingChecklistsRepository,
  ) {}

  async execute(
    input: GetOffboardingByEmployeeInput,
  ): Promise<GetOffboardingByEmployeeOutput> {
    const { tenantId, employeeId } = input;

    const checklist =
      await this.offboardingChecklistsRepository.findByEmployeeId(
        new UniqueEntityID(employeeId),
        tenantId,
      );

    if (!checklist) {
      throw new ResourceNotFoundError('Offboarding checklist not found');
    }

    return { checklist };
  }
}

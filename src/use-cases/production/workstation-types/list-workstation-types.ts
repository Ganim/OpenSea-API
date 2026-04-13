import { WorkstationTypesRepository } from '@/repositories/production/workstation-types-repository';

interface ListWorkstationTypesUseCaseRequest {
  tenantId: string;
}

interface ListWorkstationTypesUseCaseResponse {
  workstationTypes: import('@/entities/production/workstation-type').ProductionWorkstationType[];
}

export class ListWorkstationTypesUseCase {
  constructor(
    private workstationTypesRepository: WorkstationTypesRepository,
  ) {}

  async execute({
    tenantId,
  }: ListWorkstationTypesUseCaseRequest): Promise<ListWorkstationTypesUseCaseResponse> {
    const workstationTypes =
      await this.workstationTypesRepository.findMany(tenantId);

    return {
      workstationTypes,
    };
  }
}

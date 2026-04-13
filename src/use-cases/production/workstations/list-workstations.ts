import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkstationsRepository } from '@/repositories/production/workstations-repository';

interface ListWorkstationsUseCaseRequest {
  tenantId: string;
  workCenterId?: string;
  workstationTypeId?: string;
}

interface ListWorkstationsUseCaseResponse {
  workstations: import('@/entities/production/workstation').ProductionWorkstation[];
}

export class ListWorkstationsUseCase {
  constructor(private workstationsRepository: WorkstationsRepository) {}

  async execute({
    tenantId,
    workCenterId,
    workstationTypeId,
  }: ListWorkstationsUseCaseRequest): Promise<ListWorkstationsUseCaseResponse> {
    let workstations;

    if (workCenterId) {
      workstations = await this.workstationsRepository.findManyByWorkCenter(
        new UniqueEntityID(workCenterId),
        tenantId,
      );
    } else {
      workstations = await this.workstationsRepository.findMany(tenantId);
    }

    // Filter by workstationTypeId if provided
    if (workstationTypeId) {
      workstations = workstations.filter(
        (ws) => ws.workstationTypeId.toString() === workstationTypeId,
      );
    }

    return {
      workstations,
    };
  }
}

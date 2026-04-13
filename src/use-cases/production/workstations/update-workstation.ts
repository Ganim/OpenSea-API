import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkstationsRepository } from '@/repositories/production/workstations-repository';
import { WorkstationTypesRepository } from '@/repositories/production/workstation-types-repository';
import { WorkCentersRepository } from '@/repositories/production/work-centers-repository';

interface UpdateWorkstationUseCaseRequest {
  tenantId: string;
  id: string;
  workstationTypeId?: string;
  workCenterId?: string | null;
  code?: string;
  name?: string;
  description?: string | null;
  capacityPerDay?: number;
  costPerHour?: number | null;
  setupTimeDefault?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}

interface UpdateWorkstationUseCaseResponse {
  workstation: import('@/entities/production/workstation').ProductionWorkstation;
}

export class UpdateWorkstationUseCase {
  constructor(
    private workstationsRepository: WorkstationsRepository,
    private workstationTypesRepository: WorkstationTypesRepository,
    private workCentersRepository: WorkCentersRepository,
  ) {}

  async execute({
    tenantId,
    id,
    workstationTypeId,
    workCenterId,
    code,
    name,
    description,
    capacityPerDay,
    costPerHour,
    setupTimeDefault,
    isActive,
    metadata,
  }: UpdateWorkstationUseCaseRequest): Promise<UpdateWorkstationUseCaseResponse> {
    const workstation = await this.workstationsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!workstation) {
      throw new ResourceNotFoundError('Workstation not found.');
    }

    // Validate unique code if changed
    if (code && code !== workstation.code) {
      const existingWorkstation = await this.workstationsRepository.findByCode(
        code,
        tenantId,
      );

      if (
        existingWorkstation &&
        !existingWorkstation.id.equals(workstation.id)
      ) {
        throw new BadRequestError(
          'A workstation with this code already exists.',
        );
      }
    }

    // Validate workstation type exists if changed
    if (workstationTypeId) {
      const workstationType = await this.workstationTypesRepository.findById(
        new UniqueEntityID(workstationTypeId),
        tenantId,
      );

      if (!workstationType) {
        throw new ResourceNotFoundError('Workstation type not found.');
      }
    }

    // Validate work center exists if changed (null means remove)
    if (workCenterId !== undefined && workCenterId !== null) {
      const workCenter = await this.workCentersRepository.findById(
        new UniqueEntityID(workCenterId),
        tenantId,
      );

      if (!workCenter) {
        throw new ResourceNotFoundError('Work center not found.');
      }
    }

    const updatedWorkstation = await this.workstationsRepository.update({
      id: new UniqueEntityID(id),
      workstationTypeId,
      workCenterId,
      code,
      name,
      description,
      capacityPerDay,
      costPerHour,
      setupTimeDefault,
      isActive,
      metadata,
    });

    if (!updatedWorkstation) {
      throw new ResourceNotFoundError('Workstation not found.');
    }

    return {
      workstation: updatedWorkstation,
    };
  }
}

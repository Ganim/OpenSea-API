import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkstationsRepository } from '@/repositories/production/workstations-repository';
import { WorkstationTypesRepository } from '@/repositories/production/workstation-types-repository';
import { WorkCentersRepository } from '@/repositories/production/work-centers-repository';

interface CreateWorkstationUseCaseRequest {
  tenantId: string;
  workstationTypeId: string;
  workCenterId?: string;
  code: string;
  name: string;
  description?: string;
  capacityPerDay: number;
  costPerHour?: number;
  setupTimeDefault: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

interface CreateWorkstationUseCaseResponse {
  workstation: import('@/entities/production/workstation').ProductionWorkstation;
}

export class CreateWorkstationUseCase {
  constructor(
    private workstationsRepository: WorkstationsRepository,
    private workstationTypesRepository: WorkstationTypesRepository,
    private workCentersRepository: WorkCentersRepository,
  ) {}

  async execute({
    tenantId,
    workstationTypeId,
    workCenterId,
    code,
    name,
    description,
    capacityPerDay,
    costPerHour,
    setupTimeDefault,
    isActive = true,
    metadata,
  }: CreateWorkstationUseCaseRequest): Promise<CreateWorkstationUseCaseResponse> {
    // Validate unique code per tenant
    const existingWorkstation = await this.workstationsRepository.findByCode(
      code,
      tenantId,
    );

    if (existingWorkstation) {
      throw new BadRequestError('A workstation with this code already exists.');
    }

    // Validate workstation type exists
    const workstationType = await this.workstationTypesRepository.findById(
      new UniqueEntityID(workstationTypeId),
      tenantId,
    );

    if (!workstationType) {
      throw new ResourceNotFoundError('Workstation type not found.');
    }

    // Validate work center exists if provided
    if (workCenterId) {
      const workCenter = await this.workCentersRepository.findById(
        new UniqueEntityID(workCenterId),
        tenantId,
      );

      if (!workCenter) {
        throw new ResourceNotFoundError('Work center not found.');
      }
    }

    const workstation = await this.workstationsRepository.create({
      tenantId,
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

    return {
      workstation,
    };
  }
}

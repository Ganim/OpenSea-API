import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionDefectTypeSeverity } from '@/entities/production/defect-type';
import { DefectTypesRepository } from '@/repositories/production/defect-types-repository';

interface UpdateDefectTypeUseCaseRequest {
  tenantId: string;
  id: string;
  code?: string;
  name?: string;
  description?: string | null;
  severity?: ProductionDefectTypeSeverity;
  isActive?: boolean;
}

interface UpdateDefectTypeUseCaseResponse {
  defectType: import('@/entities/production/defect-type').ProductionDefectType;
}

export class UpdateDefectTypeUseCase {
  constructor(
    private defectTypesRepository: DefectTypesRepository,
  ) {}

  async execute({
    tenantId,
    id,
    code,
    name,
    description,
    severity,
    isActive,
  }: UpdateDefectTypeUseCaseRequest): Promise<UpdateDefectTypeUseCaseResponse> {
    const existing = await this.defectTypesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Defect type not found.');
    }

    // Validate unique code if being changed
    if (code && code !== existing.code) {
      const existingByCode = await this.defectTypesRepository.findByCode(
        code,
        tenantId,
      );

      if (existingByCode && !existingByCode.id.equals(existing.id)) {
        throw new BadRequestError(
          'A defect type with this code already exists.',
        );
      }
    }

    const updated = await this.defectTypesRepository.update({
      id: new UniqueEntityID(id),
      code,
      name,
      description,
      severity,
      isActive,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Defect type not found.');
    }

    return { defectType: updated };
  }
}

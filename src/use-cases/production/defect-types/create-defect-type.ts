import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { ProductionDefectTypeSeverity } from '@/entities/production/defect-type';
import { DefectTypesRepository } from '@/repositories/production/defect-types-repository';

interface CreateDefectTypeUseCaseRequest {
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  severity: ProductionDefectTypeSeverity;
  isActive?: boolean;
}

interface CreateDefectTypeUseCaseResponse {
  defectType: import('@/entities/production/defect-type').ProductionDefectType;
}

export class CreateDefectTypeUseCase {
  constructor(
    private defectTypesRepository: DefectTypesRepository,
  ) {}

  async execute({
    tenantId,
    code,
    name,
    description,
    severity,
    isActive,
  }: CreateDefectTypeUseCaseRequest): Promise<CreateDefectTypeUseCaseResponse> {
    // Validate unique code per tenant
    const existingByCode = await this.defectTypesRepository.findByCode(
      code,
      tenantId,
    );

    if (existingByCode) {
      throw new BadRequestError(
        'A defect type with this code already exists.',
      );
    }

    const defectType = await this.defectTypesRepository.create({
      tenantId,
      code,
      name,
      description,
      severity,
      isActive,
    });

    return { defectType };
  }
}

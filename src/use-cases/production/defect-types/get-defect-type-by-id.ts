import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DefectTypesRepository } from '@/repositories/production/defect-types-repository';

interface GetDefectTypeByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetDefectTypeByIdUseCaseResponse {
  defectType: import('@/entities/production/defect-type').ProductionDefectType;
}

export class GetDefectTypeByIdUseCase {
  constructor(
    private defectTypesRepository: DefectTypesRepository,
  ) {}

  async execute({
    tenantId,
    id,
  }: GetDefectTypeByIdUseCaseRequest): Promise<GetDefectTypeByIdUseCaseResponse> {
    const defectType = await this.defectTypesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!defectType) {
      throw new ResourceNotFoundError('Defect type not found.');
    }

    return { defectType };
  }
}

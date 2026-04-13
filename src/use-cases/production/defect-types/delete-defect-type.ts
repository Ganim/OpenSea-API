import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DefectTypesRepository } from '@/repositories/production/defect-types-repository';

interface DeleteDefectTypeUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteDefectTypeUseCaseResponse {
  message: string;
}

export class DeleteDefectTypeUseCase {
  constructor(private defectTypesRepository: DefectTypesRepository) {}

  async execute({
    tenantId,
    id,
  }: DeleteDefectTypeUseCaseRequest): Promise<DeleteDefectTypeUseCaseResponse> {
    const existing = await this.defectTypesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Defect type not found.');
    }

    await this.defectTypesRepository.delete(new UniqueEntityID(id));

    return { message: 'Defect type deleted successfully.' };
  }
}

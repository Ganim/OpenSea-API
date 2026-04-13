import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BomsRepository } from '@/repositories/production/boms-repository';

interface GetBomByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetBomByIdUseCaseResponse {
  bom: import('@/entities/production/bill-of-materials').ProductionBom;
}

export class GetBomByIdUseCase {
  constructor(private bomsRepository: BomsRepository) {}

  async execute({
    tenantId,
    id,
  }: GetBomByIdUseCaseRequest): Promise<GetBomByIdUseCaseResponse> {
    const bom = await this.bomsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!bom) {
      throw new ResourceNotFoundError('BOM not found.');
    }

    return { bom };
  }
}

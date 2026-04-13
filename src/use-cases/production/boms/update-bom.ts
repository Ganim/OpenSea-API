import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BomsRepository } from '@/repositories/production/boms-repository';

interface UpdateBomUseCaseRequest {
  tenantId: string;
  id: string;
  productId?: string;
  version?: string;
  name?: string;
  description?: string | null;
  isDefault?: boolean;
  validFrom?: Date;
  validUntil?: Date | null;
  baseQuantity?: number;
}

interface UpdateBomUseCaseResponse {
  bom: import('@/entities/production/bill-of-materials').ProductionBom;
}

export class UpdateBomUseCase {
  constructor(private bomsRepository: BomsRepository) {}

  async execute({
    tenantId,
    id,
    productId,
    version,
    name,
    description,
    isDefault,
    validFrom,
    validUntil,
    baseQuantity,
  }: UpdateBomUseCaseRequest): Promise<UpdateBomUseCaseResponse> {
    const bom = await this.bomsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!bom) {
      throw new ResourceNotFoundError('BOM not found.');
    }

    const updatedBom = await this.bomsRepository.update({
      id: new UniqueEntityID(id),
      productId,
      version,
      name,
      description,
      isDefault,
      validFrom,
      validUntil,
      baseQuantity,
    });

    if (!updatedBom) {
      throw new ResourceNotFoundError('BOM not found.');
    }

    return { bom: updatedBom };
  }
}

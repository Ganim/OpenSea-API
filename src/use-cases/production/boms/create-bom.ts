import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { BomsRepository } from '@/repositories/production/boms-repository';

interface CreateBomUseCaseRequest {
  tenantId: string;
  productId: string;
  version: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  validFrom: Date;
  validUntil?: Date;
  baseQuantity: number;
  createdById: string;
}

interface CreateBomUseCaseResponse {
  bom: import('@/entities/production/bill-of-materials').ProductionBom;
}

export class CreateBomUseCase {
  constructor(private bomsRepository: BomsRepository) {}

  async execute({
    tenantId,
    productId,
    version,
    name,
    description,
    isDefault,
    validFrom,
    validUntil,
    baseQuantity,
    createdById,
  }: CreateBomUseCaseRequest): Promise<CreateBomUseCaseResponse> {
    // Validate unique [productId, version] per tenant
    const existingBoms = await this.bomsRepository.findByProductId(
      productId,
      tenantId,
    );

    const duplicate = existingBoms.find((b) => b.version === version);
    if (duplicate) {
      throw new BadRequestError(
        'A BOM with this product and version already exists.',
      );
    }

    const bom = await this.bomsRepository.create({
      tenantId,
      productId,
      version,
      name,
      description,
      isDefault,
      validFrom,
      validUntil,
      baseQuantity,
      createdById,
    });

    return { bom };
  }
}

import { BomsRepository } from '@/repositories/production/boms-repository';

interface ListBomsUseCaseRequest {
  tenantId: string;
  productId?: string;
}

interface ListBomsUseCaseResponse {
  boms: import('@/entities/production/bill-of-materials').ProductionBom[];
}

export class ListBomsUseCase {
  constructor(private bomsRepository: BomsRepository) {}

  async execute({
    tenantId,
    productId,
  }: ListBomsUseCaseRequest): Promise<ListBomsUseCaseResponse> {
    const boms = productId
      ? await this.bomsRepository.findByProductId(productId, tenantId)
      : await this.bomsRepository.findMany(tenantId);

    return { boms };
  }
}

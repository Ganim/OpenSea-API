import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ProductCareInstructionsRepository } from '@/repositories/stock/product-care-instructions-repository';

interface DeleteProductCareInstructionUseCaseRequest {
  id: string;
  tenantId: string;
}

export class DeleteProductCareInstructionUseCase {
  constructor(
    private productCareInstructionsRepository: ProductCareInstructionsRepository,
  ) {}

  async execute(
    request: DeleteProductCareInstructionUseCaseRequest,
  ): Promise<void> {
    const { id, tenantId } = request;

    const record = await this.productCareInstructionsRepository.findById(id);

    if (!record) {
      throw new ResourceNotFoundError('Product care instruction not found');
    }

    if (record.tenantId !== tenantId) {
      throw new ResourceNotFoundError('Product care instruction not found');
    }

    await this.productCareInstructionsRepository.delete(id);
  }
}

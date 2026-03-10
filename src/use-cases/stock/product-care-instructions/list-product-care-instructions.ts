import type { ProductCareInstructionRecord } from '@/repositories/stock/product-care-instructions-repository';
import { ProductCareInstructionsRepository } from '@/repositories/stock/product-care-instructions-repository';

interface ListProductCareInstructionsUseCaseRequest {
  productId: string;
  tenantId: string;
}

interface ListProductCareInstructionsUseCaseResponse {
  productCareInstructions: ProductCareInstructionRecord[];
}

export class ListProductCareInstructionsUseCase {
  constructor(
    private productCareInstructionsRepository: ProductCareInstructionsRepository,
  ) {}

  async execute(
    request: ListProductCareInstructionsUseCaseRequest,
  ): Promise<ListProductCareInstructionsUseCaseResponse> {
    const { productId } = request;

    const productCareInstructions =
      await this.productCareInstructionsRepository.findByProductId(productId);

    return { productCareInstructions };
  }
}

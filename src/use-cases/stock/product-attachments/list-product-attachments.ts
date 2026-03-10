import type { ProductAttachmentRecord } from '@/repositories/stock/product-attachments-repository';
import { ProductAttachmentsRepository } from '@/repositories/stock/product-attachments-repository';

interface ListProductAttachmentsUseCaseRequest {
  productId: string;
  tenantId: string;
}

interface ListProductAttachmentsUseCaseResponse {
  productAttachments: ProductAttachmentRecord[];
}

export class ListProductAttachmentsUseCase {
  constructor(
    private productAttachmentsRepository: ProductAttachmentsRepository,
  ) {}

  async execute(
    request: ListProductAttachmentsUseCaseRequest,
  ): Promise<ListProductAttachmentsUseCaseResponse> {
    const { productId } = request;

    const productAttachments =
      await this.productAttachmentsRepository.findByProductId(productId);

    return { productAttachments };
  }
}
